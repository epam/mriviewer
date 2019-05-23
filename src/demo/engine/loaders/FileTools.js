
// **********************************************
// Imports
// **********************************************

// **********************************************
// Class
// **********************************************

class FileTools {
  isValidUrl(strUrl) {
    const regA = /^((ftp|http|https):\/\/)?(([\S]+)\.)?([\S]+)\.([A-z]{2,})(:\d{1,6})?\/[\S]+/;
    const regB = /(ftp|http|https):\/\/([\d]+)\.([\d]+)\.([\d]+)\.([\d]+)(:([\d]+))?\/([\S]+)/;
    const isValidA = strUrl.match(regA);
    const isValidB = strUrl.match(regB);
    if ((isValidA === null) && (isValidB === null)) {
      return false;
    }
    return true;
  } // end isValidUrl
  getFileNameFromUrl(strUrl) {
    const reg = /(\w+\.+\w+)$/g;
    const arrGroups = reg.exec(strUrl);
    const numGrps = arrGroups.length;
    if (numGrps >= 1) {
      return arrGroups[0];
    }
    return '';
  }
  isUrlExists(strUrl) {
    let request = null;
    if (window.XMLHttpRequest) {
      request = new XMLHttpRequest();
    } else {
      // request = new ActiveXObject("Microsoft.XMLHTTP");
    }
    // request.open('HEAD', strUrl, false);
    const NEED_ASYNC = true;
    request.open('GET', strUrl, NEED_ASYNC);
    request.send();
    const RES_FAIL_404 = 404;
    const isValid = (request.status !== RES_FAIL_404);
    return isValid;
  } // isUrlkExist
  encodeUrl(strIn) {
    let strOut = '';
    let dotFound = false;
    const len = strIn.length;
    for (let i = 0; i < len; i++) {
      const sym = strIn[i];
      const isDelim = (sym === '/') || (sym === '.') || (sym === '-')  || (sym === '_');
      if (dotFound && (!isDelim)) {
        const c = strIn.charCodeAt(i);
        const symModi = String.fromCharCode(c + 1);
        strOut += symModi;
      } else {
        strOut += sym;
      }
      dotFound = (sym === '.') ? true : dotFound;
    } // for (i)
    return strOut;
  } // encodeUrl
  decodeUrl(strIn) {
    let strOut = '';
    let dotFound = false;
    const len = strIn.length;
    for (let i = 0; i < len; i++) {
      const sym = strIn[i];
      const isDelim = (sym === '/') || (sym === '.') || (sym === '-')  || (sym === '_');
      if (dotFound && (!isDelim)) {
        const c = strIn.charCodeAt(i);
        const symModi = String.fromCharCode(c - 1);
        strOut += symModi;
      } else {
        strOut += sym;
      }
      dotFound = (sym === '.') ? true : dotFound;
    } // for (i)
    return strOut;
  } // encodeUrl

} // class FileTools
export default FileTools;  
