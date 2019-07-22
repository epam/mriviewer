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
* Get string hash
* @module demo/engine/utils/hash
*/
// absolute imports
/**
* Class Hash to calc string hash
* @class Hash
*/
class Hash {

  static getHash(strInp) {
    const ROT = 27;
    const len = strInp.length;
    let hash = len * 53;
    for (let i = 0; i < len; i++) {
      const val = strInp.charCodeAt(i);
      hash = hash * (val ^ 137211941);
      // bit rotate
      hash = (hash << ROT) | (hash >> (32 - ROT));
      // mask
      hash &= 0x3fffffff;
    }
    return hash;
  }
}

export default Hash;
