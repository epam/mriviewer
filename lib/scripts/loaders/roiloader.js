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
* Roi files loader
* @module lib/scripts/loaders/roiloader
*/

// ******************************************************************
// ROI volume set loader from local disk
// ******************************************************************

class LoadFile {
  constructor() {
    this.m_file = null;
    this.m_reader = null;
  }
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
          // console.log(`FileFromServer response received. url = ${this.m_url}`);
          resolve(arrBuf);
        }
      }, false);

      this.m_request.addEventListener('error', (event) => {
        // const arrBuf = event.target.response;
        const strError = `Error event happend for XMLHttpRequest: loaded = ${event.loaded}, total = ${event.total}`;
        console.log(strError);
        reject(strError);
      }, false);
      this.m_request.send();
    });
  }
}

export default class RoiLoader {
  /** Constructor */
  constructor() {
    this.m_completed = false;
  }
  /** Load file set */
  readLocalFiles(files) {
    const numFiles = files.length;
    console.log('readLocalFiles :');
    console.log(files);
    console.log('readLocalFiles with', numFiles, 'files');
    const NUM_FILES_IN_SET = 2;
    if (numFiles === NUM_FILES_IN_SET) {
      const fileA = files[0];
      const fileB = files[1];
      const loaderA = new LoadFile();
      const loaderB = new LoadFile();

      loaderA.readLocal(fileA).then((responceA) => {
        const strA = String.fromCharCode.apply(null, new Uint8Array(responceA));
        console.log('File A loaded with:', strA);
        loaderB.readLocal(fileB).then((responceB) => {
          const strB = String.fromCharCode.apply(null, new Uint8Array(responceB));
          console.log('File B loaded with:', strB);
        });
      }, (error) => {
        console.log('File A read error', error);
      });
    }
  }
  /** Load URL set */
  readFromUrls(urls) {
    const numUrls = urls.length;
    console.log('readFromUrls :');
    console.log(urls);
    console.log('readFromUrls with', numUrls, 'urls');
    const NUM_URLS_IN_SET = 2;
    if (numUrls === NUM_URLS_IN_SET) {
      const urlA = urls[0];
      const urlB = urls[1];
      const loaderA = new LoadFile();
      const loaderB = new LoadFile();

      loaderA.readFromUrl(urlA).then((responceA) => {
        const strA = String.fromCharCode.apply(null, new Uint8Array(responceA));
        console.log('File A loaded with:', strA);
        loaderB.readFromUrl(urlB).then((responceB) => {
          const strB = String.fromCharCode.apply(null, new Uint8Array(responceB));
          console.log('File B loaded with:', strB);
        });
      }, (error) => {
        console.log('File A read error', error);
      });
    }
  } // read from Urls
}
