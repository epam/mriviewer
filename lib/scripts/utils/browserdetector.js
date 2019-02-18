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
* Detect browser type (Chrome, Firefox, ...) and detect is this mobile device
* @module lib/scripts/utils/browserdetector
*/

// absolute imports
import swal from 'sweetalert';


/**
* Class BrowserDetector preform initial loading browser type detection
* @class BrowserDetector
*/
export default class BrowserDetector {
  /**
  * Start simple detection
  * @constructs BrowserDetector
  */
  constructor() {
    this.m_strUserAgent = '';
    this.m_strVendor = '';
    this.m_isOpera = false;
    this.m_isFirefox = false;
    this.m_isSafari = false;
    this.m_isIE = false;
    this.m_isChrome = false;
    this.m_isMobileBrowser = false;
  }

  /**
  * Check is this browser valid
  * @return {boolean} true, if valid for 3d vizualization
  */
  checkValidBrowser() {
    /** @property {string} m_strUserAgent - User agent */
    this.m_strUserAgent = navigator.userAgent.toLowerCase();
    /** @property {string} m_strVendor - Browser vendor, typically 'Google' */
    this.m_strVendor = navigator.vendor;
    /** @property {boolean} m_isOpera - Is this opera browser */
    this.m_isOpera = /opr\/|opios/i.test(this.m_strUserAgent);
    /** @property {boolean} m_isFirefox - Is this firefox browser */
    this.m_isFirefox = (typeof InstallTrigger !== 'undefined');
    /** @property {boolean} m_isSafari - Is this safari browser */
    // this.m_isSafari = /safari|applewebkit/i.test(this.m_strUserAgent);
    this.m_isSafari = (this.m_strUserAgent.search('safari') >= 0) && (this.m_strUserAgent.search('chrome') < 0);
    /** @property {boolean} m_isIE - IE ver 6-11 */
    this.m_isIE = false || !!document.documentMode;
    /** @property {boolean} m_isChrome - Chrome browser */
    this.m_isChrome = !!window.chrome;
    this.m_isEdge = (navigator.appVersion.indexOf('Edge') > -1);
    const strTitle1 = 'Med3web is designed for Chrome/Firefox/Safari browsers.';
    const strTitle2 = 'The application can be slow or unstable in this web browser.';
    const strTitleFinal = `${strTitle1} ${strTitle2}`;
    const isValidBrowserType = this.m_isChrome || this.m_isFirefox || this.m_isSafari || this.m_isOpera;
    if (!isValidBrowserType) {
      const strMsg = 'App is specially designed for Chrome/Firefox/Opera/Safari browsers';
      // console.log();
      swal({
        title: strTitleFinal,
        text: strMsg,
        icon: 'warning',
        button: 'continue',
      });
    }
    // Mobile or not
    const mobileArr = ['iphone', 'ipad', 'android', 'blackberry',
      'nokia', 'opera mini', 'windows mobile', 'windows phone', 'iemobile'];
    this.m_isMobileBrowser = false;
    for (let i = 0; i < mobileArr.length; i++) {
      if (this.m_strUserAgent.indexOf(mobileArr[i].toLowerCase()) > 0) {
        // console.log(`Detected mobile browser in string ${this.m_strUserAgent}`);
        this.m_isMobileBrowser = true;
      }
    } // for
    if (this.m_isMobileBrowser) {
      // console.log('Mobile browser detected! App can be slow');
      swal({
        title: strTitleFinal,
        text: 'App can be slow due to detected mobile browser',
        icon: 'warning',
        button: 'continue',
      });
    }
    return ((!this.m_isMobileBrowser) && isValidBrowserType);
  } // check
} // class BrowserDetector
