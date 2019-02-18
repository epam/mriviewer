/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
'License'); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

/**
/**
* File load from local disk or URL with promise to complete
* @module lib/scripts/loaders/loadpromise
*/

// ******************************************************************
// class LoadFilePromise
// ******************************************************************

/** Class LoadFilePromise implements local and remote (via URL) file reading functionality via Promises */
export default class LoadFilePromise {
  constructor() {
    this.m_file = null;
    this.m_reader = null;
    this.m_request = null;
  }
  /**
  * Read local file. If success, invoke resolve callback for created promise
  *
  * @param {object} file - file to read
  * @return {object} Promise, working after file will be read
  */
  readLocal(file) {
    return new Promise((resolve) => {
      this.m_file = file;
      this.m_reader = new FileReader();
      this.m_reader.addEventListener('load', (evt) => {
        const arrBuf = evt.target.result;
        if (resolve) {
          resolve(arrBuf);
        }
      });
      this.m_reader.readAsArrayBuffer(this.m_file);
    });
  }

  /**
  * Read remote file (via promise). If success, invoke resolve callback for created promise
  *
  * @param {string} url - file to read
  * @return {object} Promise, working after file will be read
  */
  readFromUrl(url) {
    return new Promise((resolve, reject) => {
      this.m_url = url;
      this.m_request = null;
      const METHOD = 'GET';
      this.m_request = new XMLHttpRequest();
      if ('withCredentials' in this.m_request) {
        // this.m_request.withCredentials = true;
        const NEED_ASYNC = true;
        this.m_request.open(METHOD, this.m_url, NEED_ASYNC);
      } else if (typeof XDomainRequest !== 'undefined') {
        console.log('HttpRequest: XDomainRequest will be used');
        this.m_request = new XDomainRequest();
        this.m_request.open(METHOD, this.m_url);
      } else {
        this.m_request = null;
        console.log('This browser cant support CORS requests');
        return;
      }
      this.m_request.responseType = 'arraybuffer';  // "blob"
      this.m_request.addEventListener('load', (event) => {
        const arrBuf = event.target.response;
        if (arrBuf === null) {
          console.log('Bad response type. Expect object type in response.');
        } else {
          resolve(arrBuf);
        }
      }, false);

      this.m_request.addEventListener('error', (event) => {
        const strError = `Error event happend for XMLHttpRequest: loaded = ${event.loaded}, total = ${event.total}`;
        console.log(strError);
        reject(strError);
      }, false);
      this.m_request.send();
    });
  }
}
