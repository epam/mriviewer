
// ********************************************************
// Imports
// ********************************************************

// import Volume from './Volume';
// import LoadResult from './LoadResult';

// ********************************************************
// Tests
// ********************************************************

describe('VolumeTests', () => {
  //
  const _writeInt = (arrBuf, offs, valInt) => {
    let offsNew = offs;
    let val = valInt;
    for(let i = 0; i < 4; i++) {
      const bt = val & 0xff;
      val >>= 8;
      arrBuf[offsNew++] = bt;
    }
    return offsNew;
  };
  //
  it('testWriteInt', () => {
    const SIZE_BUF = 4;
    const bufBytes = new Uint8Array(SIZE_BUF);
    const VAL_0 = 0x67;
    const VAL_1 = 0x58;
    const VAL_2 = 0x13;
    const VAL_3 = 0x2e;

    const SHIFT_8 = 8;
    const SHIFT_16 = 16;
    const SHIFT_24 = 24;

    const VAL_DWORD = ((VAL_0) | (VAL_1 << SHIFT_8) | (VAL_2 << SHIFT_16) | (VAL_3 << SHIFT_24));
    // console.log(`test. dword = ${VAL_DWORD.toString(16)}`);
    _writeInt(bufBytes, 0, VAL_DWORD);
    // console.log(`test. array0 = ${bufBytes[0].toString(16)}`);
    // console.log(`test. array1 = ${bufBytes[1].toString(16)}`);
    // console.log(`test. array2 = ${bufBytes[2].toString(16)}`);
    // console.log(`test. array3 = ${bufBytes[3].toString(16)}`);
    const isOk0 = (bufBytes[0] === VAL_0);
    const isOk1 = (bufBytes[1] === VAL_1);
    const isOk2 = (bufBytes[2] === VAL_2);
    const isOk3 = (bufBytes[3] === VAL_3);
    expect(isOk0).toBeTruthy();
    expect(isOk1).toBeTruthy();
    expect(isOk2).toBeTruthy();
    expect(isOk3).toBeTruthy();
  });

});
