/**
* Loaders. DicomLoader
*/

import { expect, assert } from 'chai';
import DicomFolderLoader from '../../lib/scripts/loaders/dicomloader';

describe('Test: DicomFolderLoader', () => {
  describe('check DicomFolderLoader class', () => {
    /*
    it('non empty constructor', () => {
      const loader = new DicomFolderLoader(true);
      expect(loader.m_needScaleDownTexture).to.be.true;
    });
    it('get box', () => {
      const loader = new DicomFolderLoader(true);
      const box = loader.getBoxSize();
      expect(box.x === 1.0).to.be.true;
      expect(box.y === 1.0).to.be.true;
      expect(box.z === 1.0).to.be.true;
    });
    it('get dicominfo', () => {
      const loader = new DicomFolderLoader(true);
      const info = loader.getDicomInfo();
      expect(info !== null).to.be.true;
    });
    it('get non empty box min', () => {
      const loader = new DicomFolderLoader(true);
      const box = loader.getNonEmptyBoxMin();
      expect(box.x === 0.0).to.be.true;
      expect(box.y === 0.0).to.be.true;
      expect(box.z === 0.0).to.be.true;
    });
    it('get non empty box max', () => {
      const loader = new DicomFolderLoader(true);
      const box = loader.getNonEmptyBoxMax();
      expect(box.x === 1.0).to.be.true;
      expect(box.y === 1.0).to.be.true;
      expect(box.z === 1.0).to.be.true;
    });
    it('getNextTag', () => {
      const loader = new DicomFolderLoader(true);
      const arrayBuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const dataView = new DataView(arrayBuf);
      const tagNext = loader.getNextTag(dataView, 0);
      assert.equal(tagNext, null);
    });
    */
    it('getVrsStringIndex check', () => {
      const STR_CORRECT = 'CS';
      const INDEX = 3;
      const ind = DicomFolderLoader.getVrsStringIndex(STR_CORRECT);
      assert.equal(ind, INDEX);
    });
    it('getVrsStringIndex check fail', () => {
      const STR_WRONG = 'ZZZ';
      const INDEX = -1;
      const ind = DicomFolderLoader.getVrsStringIndex(STR_WRONG);
      expect(ind).to.equal(INDEX);
      // assert.equal(ind, INDEX);
    });
    it('getDataVrsStringIndex check correct', () => {
      const STR_GOOD = 'UT';
      const INDEX = 4;
      const ind = DicomFolderLoader.getDataVrsStringIndex(STR_GOOD);
      expect(ind).to.equal(INDEX);
      // assert.equal(ind, INDEX);
    });
  });
});
