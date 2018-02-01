/**
* Loaders. KtxLoader
*/

import { expect, assert } from 'chai';
import KtxLoader from '../../lib/scripts/loaders/ktxloader';

describe('Test: KtxLoader', () => {
  describe('check KtxLoader class', () => {
    it('non empty constructor', () => {
      const loader = new KtxLoader(true);
      expect(loader.m_isLoadedSuccessfull).to.be.false;
    });
    it('readInt check', () => {
      const INT_VALUE = 25;
      const buf = [INT_VALUE, 0, 0, 0];
      const ret = KtxLoader.readInt(buf, 0);
      assert.equal(ret, INT_VALUE);
    });
    it('readBufer wrong header', () => {
      // eslint-disable-next-line
      const buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const loader = new KtxLoader(true);
      const ret = loader.readBuffer(buf, null, null);
      assert.equal(ret, false);
    });
    it('readBufer wrong ednianness', () => {
      // eslint-disable-next-line
      const header = [0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A];
      // eslint-disable-next-line
      const endn = [23, 0, 0, 0];
      const buf = header.concat(endn);
      const loader = new KtxLoader(true);
      const ret = loader.readBuffer(buf, null, null);
      assert.equal(ret, false);
    });
  });
});
