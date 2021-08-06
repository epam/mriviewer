/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

class FileTools {
  isValidUrl(string) {
    let url;
  
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
  
    return url.protocol === "http:" || url.protocol === "https:";
  }

  getFileNameFromUrl(strUrl) {
    let idx = strUrl.lastIndexOf('/');
    if (idx < 0) {
      idx = strUrl.lastIndexOf('\\');
    }
    if (idx < 0) {
      console.log('getFileNameFromUrl: wrong URL!');
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
      console.log('getFolderNameFromUrl: wrong URL!');
      return '';
    }
    return strUrl.substring(0, idx);
  }
}
export default FileTools;  
