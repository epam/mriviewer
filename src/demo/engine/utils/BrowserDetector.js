
/**
* Detect browser type (Chrome, Firefox, ...) and detect is this mobile device
* @module src/demo/engine/utils/BrowserDetector
*/

// absolute imports
// import swal from 'sweetalert';

import { createCanvas } from 'canvas';


/**
* Class BrowserDetector preform initial loading browser type detection
* @class BrowserDetector
*/
class BrowserDetector {
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
   * Check support WebGL 2.0
   * 
   * * @return {boolean} true, if WebGL 2.0 supported
   */
  checkWebGlSupported() {
    // let canvas = document.createElement('canvas');
    let canvas = createCanvas(640, 480);
    let gl = null;
    try { 
      gl = canvas.getContext("webgl2"); 
    } catch (x) { 
      gl = null; 
    }
    const glFound = (gl !== null);
    // console.log(`checkWebGlSupported. GL 2.0 = ${glFound}`);
    canvas = undefined;
    return glFound;
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
    this.m_isChrome = /chrome/i.test(navigator.userAgent);
    this.m_isEdge = (navigator.appVersion.indexOf('Edge') > -1);
    if (this.m_isEdge) {
      this.m_isChrome = false;
    }
    // console.log(`Is Edge browser = ${this.m_isEdge}`);
    // console.log(`Is Chrome browser = ${this.m_isChrome}`);
    // console.log(`Is Firefox browser = ${this.m_isFirefox}`);
    // console.log(`Is Safari browser = ${this.m_isSafari}`);
    // console.log(`Is Opera browser = ${this.m_isOpera}`);

    const strTitle1 = 'Med3web is designed for Chrome/Firefox/Safari browsers.';
    const strTitle2 = 'The application can be slow or unstable in this web browser.';
    const strTitleFinal = `${strTitle1} ${strTitle2}`;
    const isValidBrowserType = this.m_isChrome || this.m_isFirefox || this.m_isSafari || this.m_isOpera;
    if (!isValidBrowserType) {
      const strMsg = 'App is specially designed for Chrome/Firefox/Opera/Safari browsers';
      console.log(`BrowserDetector. ${strTitleFinal}. ${strMsg}`);
      /*
      swal({
        title: strTitleFinal,
        text: strMsg,
        icon: 'warning',
        button: 'continue',
      });
      */
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
    // detect mobiu browser by window size
    const MIN_W = 800;
    const MIN_H = 600;
    if ((window.innerWidth <= MIN_W) || (window.innerHeight <= MIN_H) ) {
      this.m_isMobileBrowser = true;
    }
    if (this.m_isMobileBrowser) {
      // console.log('Mobile browser detected! App can be slow');
      console.log(`MobileBrowserDetector. ${strTitleFinal}. App can be slow due to detected mobile browser`);
      /*
      swal({
        title: strTitleFinal,
        text: 'App can be slow due to detected mobile browser',
        icon: 'warning',
        button: 'continue',
      });
      */
    }
    if (!this.m_isMobileBrowser) {
      return isValidBrowserType;
    }
    return true;
  } // check
} // class BrowserDetector

export default BrowserDetector;
