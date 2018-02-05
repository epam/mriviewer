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
* @module test/e2e/webserv.e2e.js
*/

// ******************************************************************
// Simplest test with Selenium
// ******************************************************************

// import mocha from 'mocha-es6';

// import { Builder } from 'selenium-webdriver';
import webdriver from 'selenium-webdriver';

import firefox from 'selenium-webdriver/firefox';

import { expect } from 'chai';
// import express from 'express';

import Golden from './golden';
// import path from 'path';
// import fs from 'fs';

// ******************************************************************
// Const
// ******************************************************************

/**
* Reference to tested app url
*
* TODO: Replace this encoded url into normal human-readable web url,
* where app is placed for tests.
*
*/
// const URL_TEST_PAGE_APP = 'vaak+yywww*someanr*rzykrmhtanyins3wnby2018_01_30ymesnx*vail';
const URL_TEST_PAGE_APP = 'http://miew.opensource.epam.com:8080/';

/**
* List of tested scenes
*
* TODO: Place scenes into some public locations
* and change reference to them
* replace encypted text to more human-readable and avoid usage _encode / _decode
*/
const _filesList = [
  // 'vaak+yysomeanr*rzykybrtme_256_256_256*pax',
  'vaak+yysomeanr*rzykrmhtanyins3wnbystatypaxybrtme_256_256_256*pax',
  'vaak+yysomeanr*rzykrmhtanyins3wnbystatypaxylzegd_256_256_256*pax',
  'vaak+yysomeanr*rzykrmhtanyins3wnbystatyemfamycrtmg*emm'
];

// ******************************************************************
// Data
// ******************************************************************

let driver = null;
let golden = null;

const NEED_BROWSER_CHROME = true;
const NEED_BROWSER_FIREFOX = false;

// ******************************************************************
// Tests
// ******************************************************************

/**
* Encode string with simple character replacement
*
* @param {string} strIn - Source string to encode
* @return {string} encoded string
*/
function _encode(strIn) {
  const templateSrc = 'adeimnostuz-hv/ypk.*:+';
  const templateDst = 'tsnmie-dazuovhy/kp*.+:';
  let strOut = '';
  for (let i = 0; i < strIn.length; i++) {
    const ind = templateSrc.indexOf(strIn[i]);
    strOut = strOut.concat((ind >= 0) ? templateDst[ind] : strIn[i]);
  }
  return strOut;
}

/**
* Decode string with simple character replacement
*
* @param {string} strIn - Source encoded string
* @return {string} decoded string
*/
function _decode(strIn) {
  const templateSrc = 'tsnmie-dazuovhy/kp*.+:';
  const templateDst = 'adeimnostuz-hv/ypk.*:+';
  let strOut = '';
  for (let i = 0; i < strIn.length; i++) {
    const ind = templateSrc.indexOf(strIn[i]);
    strOut = strOut.concat((ind >= 0) ? templateDst[ind] : strIn[i]);
  }
  return strOut;
}

/**
* Test external medical data, referenced via given url.
* This test run web app, load given scene and
* compare results with golden png image, saved
* in test/e2e/golden folder
* If you delete golden images from this folder,
* test function will create them again.
*
* @param {string} strIn - Source encoded string
* @return {string} decoded string
*/
function testLoadUrl(fileName) {
  const shortName = fileName.substr(fileName.lastIndexOf('/') + 1);
  const strTestName = `Test load model = ${shortName}`;
  it(strTestName, (done) => {
    golden.loadAndCompare(fileName).then((difImages) => {
      console.log(`Compared two images using resemble dif = ${difImages}`);
      const DIFF_MAX_BARRIER = 4.0; // from 256? possible or 100
      expect(difImages < DIFF_MAX_BARRIER).to.be.true;
      if (difImages > DIFF_MAX_BARRIER) {
        console.log(`BAD strDiff two images = ${difImages}`);
      }
      // finalize test iterator
      done();
    }, () => {
      console.log('Error load and compare');
      // this code leaf means error load scene
      expect(false).to.be.true;
      done();
      return false;
    }); // end of load and compare
  }); // end of it
  return true;
}
/** Main test with browser */
describe('Test series to load scene into browser', () => {
  /** Before test action: create browser, start it and open given url */
  before((done) => {

    // Create driver
    if (NEED_BROWSER_CHROME) {
      const BROWSER_NAME = 'chrome';
      driver = new webdriver.Builder().forBrowser(BROWSER_NAME).build();
    }
    // This is not working code!
    // TODO: fix start firefox browser for tests
    if (NEED_BROWSER_FIREFOX) {
      const profile = new firefox.Profile();
      profile.setAcceptUntrustedCerts(true);
      profile.setAssumeUntrustedCertIssuer(false);
      const opts = new firefox.Options();
      opts.setProfile(profile);
      // setup here reference to firefox executable on
      // your local machine. This is very non-universal solution
      // and should be fixed later (avoid absolute path)
      opts.setBinary('C:\\Program Files\\Mozilla Firefox\\firefox.exe');
      const builder = new Builder().forBrowser('firefox');
      builder.setFirefoxOptions(opts);
      driver = builder.build();
    }

    // Setup browser window size (as default window size is too small)
    const W_TEST_BROWSER_SIZE = 1280;
    const H_TEST_BROWSER_SIZE = 720;
    driver.manage().window().setSize(W_TEST_BROWSER_SIZE, H_TEST_BROWSER_SIZE);
    golden = new Golden();
    const urlDecoded = URL_TEST_PAGE_APP;
    golden.startDriver(driver, urlDecoded).then(() => {
      done();
    }).catch((err) => {
      // rejection code
      console.log(`Cant open URL = ${urlDecoded} in browser. Error message = ${err}`);
      return Promise.reject(err);
    });

  });
  /** Close test action: destroy browser window */
  after(() => {
    // Close driver
    driver.quit();
  });

  /** Simple test for strings encode / decode */
  it('Test encode/decode strings', () => {
    const strTestA = 'do some magic test string: absnm//shdkgj 238765!^@%%$##.;:';
    const strEncA = _encode(strTestA);
    const strDecA = _decode(strEncA);
    expect(strDecA === strTestA).to.be.true;
  });

  const numFiles = _filesList.length;
  let isTestOk = true;
  for (let i = 0; (i < numFiles) && (isTestOk); i++) {
    const fileName = _decode(_filesList[i]);
    isTestOk = testLoadUrl(fileName);
  } // for all files in list

}); // end of describe
