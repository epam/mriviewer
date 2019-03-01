// ********************************************************
// Imports
// ********************************************************

import FileTools from '../engine/loaders/FileTools';


// ********************************************************
// Tests
// ********************************************************

describe('UiOpenMenu', () => {

  it('testValidUrl', () => {
    const fileTools = new FileTools();
    const URL_1 = 'http://www.bkk.kepa/some/ktx/ogo23863.ktx';
    const URL_2 = 'www.bams.kepa/xxx/yyy/fdss.ktx';
    const URL_3 = 'bams.kepa/xxx/yyy/fdss.ktx';
    const URL_4 = 'bams/xxx/yyy/fdss.ktx';
    const URL_5 = 'bams.banya';
    const VALID_1 = fileTools.isValidUrl(URL_1);
    const VALID_2 = fileTools.isValidUrl(URL_2);
    const VALID_3 = fileTools.isValidUrl(URL_3);
    const VALID_4 = fileTools.isValidUrl(URL_4);
    const VALID_5 = fileTools.isValidUrl(URL_5);
    expect(VALID_1).toBeTruthy();
    expect(VALID_2).toBeTruthy();
    expect(VALID_3).toBeTruthy();
    expect(VALID_4).toBeFalsy();
    expect(VALID_5).toBeFalsy();
  }); // indi test
  it('testExistsdUrl', () => {
    const fileTools = new FileTools();
    const URL_1 = 'www.google.com';
    const URL_2 = 'www.fdhsjaksdf.nu/fdsad/gfdsfg/bgdgb/rethtr/kjhdf.ktx';
    const EXIST_1 = fileTools.isUrlExists(URL_1);
    const EXIST_2 = fileTools.isUrlExists(URL_2);
    expect(EXIST_1).toBeTruthy();
    expect(EXIST_2).toBeTruthy();
  }); // indi test

  it('testEncodeDecode', () => {
    const fileTools = new FileTools();
    const URL_ORIG = 'www.makaka.da/some/kind/of/path/khs7652019/ko.ktx';
    const URL_ENCODED = fileTools.encodeUrl(URL_ORIG);
    const URL_RESTORED = fileTools.decodeUrl(URL_ENCODED);
    expect(URL_ORIG === URL_RESTORED).toBeTruthy();
  }); // indi test

}); // all tests
