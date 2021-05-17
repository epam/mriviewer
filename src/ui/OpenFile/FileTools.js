/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

export default class FileTools {
  isValidUrl(strUrl) {
    const regA = /^((ftp|http|https):\/\/)?(([\S]+)\.)?([\S]+)\.([A-z]{2,})(:\d{1,6})?\/[\S]+/;
    const regB = /(ftp|http|https):\/\/([\d]+)\.([\d]+)\.([\d]+)\.([\d]+)(:([\d]+))?\/([\S]+)/;
    const isValidA = strUrl.match(regA);
    const isValidB = strUrl.match(regB);
    return !((isValidA === null) && (isValidB === null));
  }

 // end isValidUrl
  getFileNameFromUrl(strUrl) {
    let idx = strUrl.lastIndexOf('/');
    if (idx < 0) {
      idx = strUrl.lastIndexOf('\\');
    }
    if (idx < 0) {
      return '';
    }
    let strFileName = strUrl.substring(idx + 1);
    const MAX_LEN = 40;
    strFileName = (strFileName.length <= MAX_LEN) ? strFileName : strFileName.substring(0, MAX_LEN);
    return strFileName;
  }

  getFolderNameFromUrl(strUrl) {
    let idx = strUrl.lastIndexOf('/');
    if (idx < 0) {
      idx = strUrl.lastIndexOf('\\');
    }
    if (idx < 0) {
      return '';
    }
    return strUrl.substring(0, idx);
  }
}
