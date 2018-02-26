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
* Common binary file loader
* @module lib/scripts/loaders/fileloader
*/

// ******************************************************************
// File loader
// ******************************************************************

/** Instance habdle for loader */
let GInstanceFileLoader = null;

/** Class FileLoader for load binary files */
export default class FileLoader {
  /** Create empty loader
  * @param {string} strUrl - URL for loaded file
  */
  constructor(strUrl) {
    if (!GInstanceFileLoader) {
      GInstanceFileLoader = this;
    }
    /** @property {string} m_url - Urlf ror file being read */
    this.m_url = strUrl;
    /** @property {object} m_request - XMLHttpRequest object, used for acees to resource */
    this.m_request = null;
  }

  /** Read file
  * @param {object} doneCallback - invoked callback
  */
  readFile(doneCallback, rejectCallback) {
    const METHOD = 'GET';
    this.m_request = new XMLHttpRequest();
    if (!this.m_request) {
      console.log('Cant create object request');
    }
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
      } else if (doneCallback) {
        // console.log(`FileFromServer response received. url = ${this.m_url}`);
        doneCallback(arrBuf);
      }
    }, false);

    this.m_request.addEventListener('error', () => {
      // console.log(`Error event happend for XMLHttpRequest: loaded = ${event.loaded}, total = ${event.total}`);
      const errMsg = `Error accessing file ${this.m_url}`;
      rejectCallback(errMsg);
    }, false);

    this.m_request.send();
  }
} // end class FileLoader
