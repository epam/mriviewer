/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
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
