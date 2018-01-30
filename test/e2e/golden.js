/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

/**
* Local binary file loader
* @module test/e2e/golden.js
*/

import { By, until } from 'selenium-webdriver';
import path from 'path';
import fs from 'fs';
import resemble from 'node-resemble-js';


// ******************************************************************
// Data
// ******************************************************************

/** Define next line to see step-by-step test actions */
const USE_AGRESSIVE_LOGGING = false;

// ******************************************************************
// Methods
// ******************************************************************

/** Class Golden for image compare */
export default class Golden {
  /** Constructor */
  constructor() {
    this.m_driver = null;
    this.m_appUrl = '';
  }

  /**
  * Start driver
  *
  * @param {object} webDriver - Selenium driver to manage process
  * @param {string} urlToOpen - url for tested page (app)
  * @return {Promise} Promise for page open
  */
  startDriver(webDriver, urlToOpen) {
    this.m_driver = webDriver;
    this.m_appUrl = urlToOpen;
    return new Promise((resolve, reject) => {
      this.m_driver.get(urlToOpen).then(() => {
        if (USE_AGRESSIVE_LOGGING) {
          console.log(`resolved url (in promise) = ${urlToOpen}`);
        }
        // check is page loaded correctly
        this.m_driver.findElement(By.id('med3web-input-url-open')).then(() => {
          resolve();
        }).catch((err) => {
          // console.log(`Open element is NOT found with err = ${err}`);
          reject(err);
        }); // end catch reject after findElement on page
      }); // then after get url
    }); // return promise
  }

  /**
  * Load scene
  *
  * @param {string} urlSceneToLoad - Scene url to be loaded into viewer
  * @return {Promise} Promise for load scene, take screen shot and compare
  * with golden image. Difference with golden image is transferred into
  * promise resolve callback.
  */
  loadAndCompare(urlSceneToLoad) {
    return new Promise((resolve, reject) => {
      // locate and press button 'Open'
      const elemDropdn = this.m_driver.findElement(By.linkText('Open'));
      if (elemDropdn && USE_AGRESSIVE_LOGGING) {
        console.log('Error locate button Open');
      }
      if (USE_AGRESSIVE_LOGGING) {
        console.log('Clicking Open button...');
      }
      if (elemDropdn === null) {
        reject();
        return;
      }
      elemDropdn.click();

      // give some small time to browser to ensure that element is visible
      const SHORT_TIME_MS = 500;
      this.m_driver.sleep(SHORT_TIME_MS);

      // locate and press button 'URL'
      const elemListButtonUrlOpen = this.m_driver.findElement(By.linkText('URL'));
      if (!elemListButtonUrlOpen && USE_AGRESSIVE_LOGGING) {
        console.log('Error locate button URL');
      }
      if (USE_AGRESSIVE_LOGGING) {
        console.log('Clicking UTL button...');
      }
      elemListButtonUrlOpen.click();

      // give some small time to browser to ensure that element is visible
      this.m_driver.sleep(SHORT_TIME_MS);

      // locate url text and fill it
      const ID_URL_TEXT = 'med3web-input-url-open';
      const elemTextUrl = this.m_driver.findElement({ id: ID_URL_TEXT });
      if (!elemTextUrl && USE_AGRESSIVE_LOGGING) {
        console.log('Error locate text element with url string');
      }
      if (USE_AGRESSIVE_LOGGING) {
        console.log(`Printing url text = ${urlSceneToLoad}`);
      }
      elemTextUrl.sendKeys(urlSceneToLoad);

      // locate and press button Load
      const ID_BUTTON_LOAD = 'med3web-btn-load-url';
      const elemUrlButtonLoad = this.m_driver.findElement({ id: ID_BUTTON_LOAD });
      if (!elemUrlButtonLoad && USE_AGRESSIVE_LOGGING) {
        console.log('Error locate button Load');
      }
      if (USE_AGRESSIVE_LOGGING) {
        console.log('Clicking Load button...');
      }
      elemUrlButtonLoad.click();

      const WAIT_MANY_SECONDS = 25000;

      const ID_TITLE = 'med3web-menu-scene-title';
      const titleElem = this.m_driver.findElement({ id: ID_TITLE });
      if (!titleElem) {
        console.log('Error locate title element');
      }
      this.m_driver.wait(until.elementTextContains(titleElem, urlSceneToLoad), WAIT_MANY_SECONDS).then(() => {
        const SOME_TIME = 800;
        setTimeout(() => {
          this.m_driver.executeScript('return window.med3web.getScreenshot(128, 128);').then((strShot) => {
            if (USE_AGRESSIVE_LOGGING) {
              const STRING_START_LETTERS = 32;
              console.log(`Just received screen shot as a string = ${strShot.substring(0, STRING_START_LETTERS)}`);
            }
            // in returned string will be prefix, should be removed
            const prefix = 'data:image/png;base64,';
            const prefixLength = prefix.length;
            const dataShot = strShot.slice(prefixLength); // without starting 'data:image...'
            // get clean file name trimming full path
            const fileName = urlSceneToLoad.substring(urlSceneToLoad.lastIndexOf('/') + 1);
            if (USE_AGRESSIVE_LOGGING) {
              console.log(`fileName = ${fileName}`);
            }
            const modelName = fileName.substring(0, fileName.lastIndexOf('.'));
            // get golden image full path
            const fileNameGold = path.join(path.resolve(__dirname, 'golden/'), `${modelName}.png`);
            if (USE_AGRESSIVE_LOGGING) {
              console.log(`fileNameGold = ${fileNameGold}`);
            }

            // check golden image exists
            if (USE_AGRESSIVE_LOGGING) {
              console.log(`Checking existing golden image = ${fileNameGold}`);
            }
            const isGoldenImageExist = fs.existsSync(fileNameGold);
            if (!isGoldenImageExist) {
              // save golden image
              if (USE_AGRESSIVE_LOGGING) {
                console.log(`Saving golden image = ${fileNameGold}`);
              }
              fs.writeFile(fileNameGold, dataShot, 'base64', (err) => {
                if (err) {
                  console.log(err);
                }
              });
            } // if golden is not exists
            const bufShot = Buffer.from(dataShot, 'base64');
            if (USE_AGRESSIVE_LOGGING) {
              console.log(`bufShot for image compare = ${bufShot[0]}${bufShot[1]}${bufShot[2]}${bufShot[3]}`);
            }
            resemble(bufShot).compareTo(fileNameGold).ignoreNothing().onComplete((strDiff) => {
              const difImage = strDiff.misMatchPercentage;
              if (USE_AGRESSIVE_LOGGING) {
                console.log(`received dif images = ${difImage}`);
              }
              resolve(difImage);
            });
          }); // end then receive screen shot as a string
        }, SOME_TIME);
      }).catch((err) => {
        reject(err);
      }); // end of wait correct title in app

    }); // end of promise
  } // end loadAnd Compare
} // class Golden
