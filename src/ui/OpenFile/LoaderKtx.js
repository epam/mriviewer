/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

export class LoaderKtx {
  constructor() {
    this.m_boxSize = {
      x: 0.0,
      y: 0.0,
      z: 0.0
    };
  }
  
  static readInt(bufBytes, bufOff) {
    let iVal = 0;
    for (let i = 0; i < 4; i++) {
      const iShifted = iVal << 8;
      iVal = iShifted + bufBytes[bufOff + 3 - i];
    }
    return iVal;
  }
  
  static readFloat(buf, off) {
    const arBuf = new ArrayBuffer(4);
    const dataArray = new DataView(arBuf);
    const OFF_0 = 0; const OFF_1 = 1;
    const OFF_2 = 2; const OFF_3 = 3;
    dataArray.setUint8(OFF_0, buf[off + OFF_0]);
    dataArray.setUint8(OFF_1, buf[off + OFF_1]);
    dataArray.setUint8(OFF_2, buf[off + OFF_2]);
    dataArray.setUint8(OFF_3, buf[off + OFF_3]);
    return dataArray.getFloat32(0, true);
  }
}
