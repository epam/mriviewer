
// ********************************************************
// Imports
// ********************************************************

import VolumeSet from './VolumeSet';
import Volume from './Volume';
import { KtxHeader } from './loaders/LoaderKtx';
import LoadResult from './LoadResult';

// ********************************************************
// Tests
// ********************************************************

describe('VolumeSetTests', () => {
  // special finction to creatre ktx in memory
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
  it('testLoaderKtxBadHeader', () => {
    const MAX_SIZE_TEST = 64;
    const bufTest = new Uint8Array(MAX_SIZE_TEST);
    for (let i = 0; i < MAX_SIZE_TEST; i++) {
      bufTest[0] = 'a';
    }
    const callbackProgress = undefined;
    const callbackComplete = undefined;
    const volSet = new VolumeSet();
    volSet.addVolume(new Volume() );
    const readOk = volSet.readFromKtx(bufTest, callbackProgress, callbackComplete);
    expect(readOk === true).toBeFalsy();
  });
  it('testLoaderKtxBadEndianness', () => {
    const MAX_SIZE_TEST = 512;
    const bufTest = new Uint8Array(MAX_SIZE_TEST);
    let i;
    let iDst = 0;
    // write header
    const arrayHeaderSign = [0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A];
    const lenHeaderSign = arrayHeaderSign.length;

    for (i = 0; i < lenHeaderSign; i++) {
      bufTest[iDst++] = arrayHeaderSign[i];
    }
    // write endianness
    iDst = _writeInt(bufTest, iDst, 5555);

    const callbackProgress = undefined;
    const callbackComplete = undefined;
    const volSet = new VolumeSet();
    volSet.addVolume(new Volume() );
    const readOk = volSet.readFromKtx(bufTest, callbackProgress, callbackComplete);
    expect(readOk === true).toBeFalsy();
  });
  it('testLoaderKtxBadGlType', () => {
    const MAX_SIZE_TEST = 512;
    const bufTest = new Uint8Array(MAX_SIZE_TEST);
    let i;
    let iDst = 0;
    // write header
    const arrayHeaderSign = [0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A];
    const lenHeaderSign = arrayHeaderSign.length;

    for (i = 0; i < lenHeaderSign; i++) {
      bufTest[iDst++] = arrayHeaderSign[i];
    }
    // write endianness
    const ENDIANNESS_CONST = 0x04030201;
    iDst = _writeInt(bufTest, iDst, ENDIANNESS_CONST);
    const BAD = 44;
    // write type
    iDst = _writeInt(bufTest, iDst, BAD);
    // writ type size
    iDst = _writeInt(bufTest, iDst, BAD);
    // write gl format
    iDst = _writeInt(bufTest, iDst, BAD);

    const callbackProgress = undefined;
    const callbackComplete = undefined;
    const volSet = new VolumeSet();
    volSet.addVolume(new Volume() );
    const readOk = volSet.readFromKtx(bufTest, callbackProgress, callbackComplete);
    expect(readOk === true).toBeFalsy();
  });

  it('testLoaderKtxBadDims', () => {
    const MAX_SIZE_TEST = 512;
    const bufTest = new Uint8Array(MAX_SIZE_TEST);
    let i;
    let iDst = 0;
    // write header
    const arrayHeaderSign = [0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A];
    const lenHeaderSign = arrayHeaderSign.length;

    for (i = 0; i < lenHeaderSign; i++) {
      bufTest[iDst++] = arrayHeaderSign[i];
    }
    // write endianness
    const ENDIANNESS_CONST = 0x04030201;
    iDst = _writeInt(bufTest, iDst, ENDIANNESS_CONST);
    // write gl type
    iDst = _writeInt(bufTest, iDst, KtxHeader.KTX_GL_RED);
    // write gl type size
    iDst = _writeInt(bufTest, iDst, 4);
    // write gl format
    iDst = _writeInt(bufTest, iDst, KtxHeader.KTX_GL_RED);
    // internal format
    iDst = _writeInt(bufTest, iDst, KtxHeader.KTX_GL_RED);
    //  base int format
    iDst = _writeInt(bufTest, iDst, KtxHeader.KTX_GL_RED);
    const TOO_SMALL = 1;
    // write xDim, yDim, zDim
    iDst = _writeInt(bufTest, iDst, TOO_SMALL);
    iDst = _writeInt(bufTest, iDst, TOO_SMALL);
    iDst = _writeInt(bufTest, iDst, TOO_SMALL);

    const callbackProgress = undefined;
    const callbackComplete = undefined;
    const volSet = new VolumeSet();
    volSet.addVolume(new Volume() );
    const readOk = volSet.readFromKtx(bufTest, callbackProgress, callbackComplete);
    // console.log(`Test. Vol dim = ${vol.m_xDim} * ${vol.m_yDim} * ${vol.m_zDim} `);
    expect(readOk === true).toBeFalsy();
  });

  it('testLoaderKtxGood888', () => {
    const MAX_SIZE_TEST = 512;
    const bufTest = new Uint8Array(MAX_SIZE_TEST);
    let i;
    let iDst = 0;
    // write header
    const arrayHeaderSign = [0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A];
    const lenHeaderSign = arrayHeaderSign.length;

    for (i = 0; i < lenHeaderSign; i++) {
      bufTest[iDst++] = arrayHeaderSign[i];
    }
    // write endianness
    const ENDIANNESS_CONST = 0x04030201;
    iDst = _writeInt(bufTest, iDst, ENDIANNESS_CONST);
    // write gl type
    iDst = _writeInt(bufTest, iDst, KtxHeader.KTX_GL_RED);
    // write gl type size
    iDst = _writeInt(bufTest, iDst, 4);
    // write gl format
    iDst = _writeInt(bufTest, iDst, KtxHeader.KTX_GL_RED);
    // internal format
    iDst = _writeInt(bufTest, iDst, KtxHeader.KTX_GL_RED);
    //  base int format
    iDst = _writeInt(bufTest, iDst, KtxHeader.KTX_GL_RED);
    const SIDE = 8;
    // write xDim, yDim, zDim
    iDst = _writeInt(bufTest, iDst, SIDE);
    iDst = _writeInt(bufTest, iDst, SIDE);
    iDst = _writeInt(bufTest, iDst, SIDE);

    const ZERO = 0;
    // num arr elems
    iDst = _writeInt(bufTest, iDst, ZERO);
    // num faces
    iDst = _writeInt(bufTest, iDst, ZERO);
    // num mip maps
    iDst = _writeInt(bufTest, iDst, ZERO);
    // num bytes key value
    iDst = _writeInt(bufTest, iDst, ZERO);

    // data size
    const DTSIZE = SIDE * SIDE * SIDE;
    iDst = _writeInt(bufTest, iDst, DTSIZE);

    // write data
    for (i = 0; i < DTSIZE; i++) {
      bufTest[iDst++] = (i & 0xff);
    }

    const callbackProgress = undefined;
    const callbackComplete = undefined;
    const volSet = new VolumeSet();
    volSet.addVolume(new Volume() );
    const readOk = volSet.readFromKtx(bufTest, callbackProgress, callbackComplete);
    // console.log(`Test. Vol dim = ${vol.m_xDim} * ${vol.m_yDim} * ${vol.m_zDim} `);
    expect(readOk === LoadResult.SUCCESS).toBeTruthy();
  });


  //
  it('testCreateSingleVolume', () => {
    const volumeSet = new VolumeSet();
    const volume = new Volume();
    volume.createEmptyBytesVolume(16, 16, 16);
    volumeSet.addVolume(volume);
    const numVols = volumeSet.getNumVolumes();
    expect(numVols == 1).toBeTruthy();
    const volNeg = volumeSet.getVolume(-1);
    expect(volNeg == null).toBeTruthy();
    const volBadRange = volumeSet.getVolume(1);
    expect(volBadRange == null).toBeTruthy();
    const volFrom = volumeSet.getVolume(0);
    expect(volFrom == volume).toBeTruthy();
  });
  //
  it('testCreateTwoVolumes', () => {
  });
});
