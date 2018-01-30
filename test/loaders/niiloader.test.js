/**
* Loaders. NiiLoader
*/

import { expect, assert } from 'chai';
import NiftiLoader from '../../lib/scripts/loaders/niiloader';

describe('Test: NiftiLoader', () => {
  describe('check NiftiLoader class', () => {
    it('non empty constructor', () => {
      const loader = new NiftiLoader(true);
      expect(loader.m_needScaleDownTexture).to.be.true;
    });
    it('get box', () => {
      const loader = new NiftiLoader(true);
      const box = loader.getBoxSize();
      expect(box.x === 0.0).to.be.true;
      expect(box.y === 0.0).to.be.true;
      expect(box.z === 0.0).to.be.true;
    });
    it('get dicominfo', () => {
      const loader = new NiftiLoader(true);
      const info = loader.getDicomInfo();
      expect(info === null).to.be.true;
    });
    it('readIntFromBuffer check', () => {
      const INT_VALUE = 25;
      const buf = [INT_VALUE, 0, 0, 0];
      const ret = NiftiLoader.readIntFromBuffer(buf, 0);
      assert.equal(ret, INT_VALUE);
    });
    it('readShortFromBuffer check', () => {
      // eslint-disable-next-line
      const buf = [12, 3, 0, 0];
      const ret = NiftiLoader.readShortFromBuffer(buf, 0);
      // eslint-disable-next-line
      const ACTUAL_VALUE = 3 * 256 + 12;
      assert.equal(ret, ACTUAL_VALUE);
    });
    it('readFloatFromBuffer check', () => {
      // eslint-disable-next-line
      const buf = [0x85, 0xeb, 0x0b, 0x42];
      const ret = NiftiLoader.readFloatFromBuffer(buf, 0);
      const ACTUAL_VALUE = 34.98;
      const dif = Math.abs(ret - ACTUAL_VALUE);
      // console.log(`ret = ${ret}`);
      // assert.isAbove(ret, 0.0);
      const TOO_SMALL = 0.001;
      assert.isBelow(dif, TOO_SMALL);
    });
    it('readBufer header too small', () => {
      // eslint-disable-next-line
      const buf = [0x85, 0xeb, 0x0b, 0x42];
      const loader = new NiftiLoader(true);
      const ret = loader.readBuffer(buf, null, null);
      assert.equal(ret, false);
    });
    it('readBufer header wrong sign', () => {
      const SOME_SIZE = 1024;
      const buf = new Uint8Array(SOME_SIZE);
      buf[0] = 0;
      buf[1] = 0;
      const loader = new NiftiLoader(true);
      const ret = loader.readBuffer(buf, null, null);
      assert.equal(ret, false);
    });
  });
});
