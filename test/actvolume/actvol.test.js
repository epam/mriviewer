/**
* ActiveVolume. Tests
*/

import { expect, assert } from 'chai';
import ActiveVolume from '../../lib/scripts/actvolume/actvol';

describe('Test: ActiveVolume', () => {
  describe('Setup funcs', () => {
    it('set center', () => {
      const activeVolume = new ActiveVolume();
      const X_CENTER = 89;
      const Y_CENTER = 91;
      const Z_CENTER = 110;
      activeVolume.setSphereCenter(X_CENTER, Y_CENTER, Z_CENTER);
      const vCenter = activeVolume.getSphereCenter();
      expect(vCenter.x === X_CENTER).to.be.true;
      expect(vCenter.y === Y_CENTER).to.be.true;
      expect(vCenter.z === Z_CENTER).to.be.true;
      assert.equal(vCenter.z, Z_CENTER);
    }); // it
  }); // describe
}); // describe
