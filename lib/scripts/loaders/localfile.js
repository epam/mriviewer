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
* @module lib/scripts/loaders/localfile
*/

// ******************************************************************
// Local file loader
// ******************************************************************

/** Instance handle for loader */
let GInstanceFileLoader = null;

/** Class LocalFileLoader for load binary files */
export default class LocalFileLoader {
  /** Create empty loader
  * @param {object} file - File, returned by open file dialog
  */
  constructor(file) {
    if (!GInstanceFileLoader) {
      GInstanceFileLoader = this;
    }
    /** @property {object} m_file - File to read */
    this.m_file = file;
    this.m_reader = null;
  }

  /** Read file
  * @param {object} doneCallback - invoked callback
  */
  readFile(doneCallback, rejectCallback) {
    this.m_reader = new FileReader();
    this.m_reader.addEventListener('load', (evt) => {
      const arrBuf = evt.target.result;
      // const arrBuf = this.m_reader.result;
      if (doneCallback) {
        doneCallback(arrBuf);
      }
    });
    this.m_reader.addEventListener('error', () => {
      const errMsg = `Error accessing local file ${this.m_file}`;
      rejectCallback(errMsg);
    }, false);
    this.m_reader.readAsArrayBuffer(this.m_file);
  }
} // end class LocalFileLoader
