/**
* Loaders. Volume tools
*/

import { expect, assert } from 'chai';
import VolumeTools from '../../lib/scripts/loaders/voltools';

describe('Test: VolumeTools', () => {
  describe('check gaussSmooth()', () => {
    it('invalid radius check', () => {
      const DIM = 16;
      const volBuf = new Uint8Array(DIM * DIM * DIM);
      const gaussSmoother = new VolumeTools();
      const GAUSS_RADIUS_LARGE = 22;
      const GAUSS_SIGMA = 1.1;
      const retL = gaussSmoother.gaussSmooth(volBuf, DIM, DIM, DIM, GAUSS_RADIUS_LARGE, GAUSS_SIGMA);
      expect(retL < 0).to.be.true;
    });
    it('invalid sigma check', () => {
      const DIM = 16;
      const volBuf = new Uint8Array(DIM * DIM * DIM);
      const gaussSmoother = new VolumeTools();
      const GAUSS_RADIUS = 6;
      const GAUSS_SIGMA_NEG = -1.1;
      const retL = gaussSmoother.gaussSmooth(volBuf, DIM, DIM, DIM, GAUSS_RADIUS, GAUSS_SIGMA_NEG);
      expect(retL < 0).to.be.true;
    });
    it('negative volume dimension check', () => {
      const DIM = 16;
      const volBuf = new Uint8Array(DIM * DIM * DIM);
      const gaussSmoother = new VolumeTools();
      const GAUSS_RADIUS = 6;
      const GAUSS_SIGMA = 1.1;
      const retL = gaussSmoother.gaussSmooth(volBuf, -DIM, DIM, DIM, GAUSS_RADIUS, GAUSS_SIGMA);
      expect(retL < 0).to.be.true;
    });
    it('too big volume dimension check', () => {
      const DIM = 16;
      const volBuf = new Uint8Array(DIM * DIM * DIM);
      const gaussSmoother = new VolumeTools();
      const GAUSS_RADIUS = 6;
      const GAUSS_SIGMA = 1.1;
      const SOME_LARGE_MULTIPLIER = 1024;
      const DIM_LARGE = DIM * SOME_LARGE_MULTIPLIER;
      const retL = gaussSmoother.gaussSmooth(volBuf, DIM_LARGE, DIM, DIM, GAUSS_RADIUS, GAUSS_SIGMA);
      expect(retL < 0).to.be.true;
    });
    it('check empty buffer', () => {
      const DIM = 16;
      const gaussSmoother = new VolumeTools();
      const GAUSS_RADIUS = 6;
      const GAUSS_SIGMA = 1.1;
      const retL = gaussSmoother.gaussSmooth(null, DIM, DIM, DIM, GAUSS_RADIUS, GAUSS_SIGMA);
      expect(retL < 0).to.be.true;
    });
    it('check invalid buffer size', () => {
      const DIM = 16;
      const volBuf = new Uint8Array(DIM * DIM * DIM);
      const gaussSmoother = new VolumeTools();
      const GAUSS_RADIUS = 6;
      const GAUSS_SIGMA = 1.1;
      const DIM_TWICE = DIM + DIM;
      const retL = gaussSmoother.gaussSmooth(volBuf, DIM_TWICE, DIM, DIM, GAUSS_RADIUS, GAUSS_SIGMA);
      expect(retL < 0).to.be.true;
    });
    it('check is good smoothing on low sigma', () => {
      const DIM = 9;
      const volBuf = new Uint8Array(DIM * DIM * DIM);
      const gaussSmoother = new VolumeTools();
      const GAUSS_RADIUS = 2;
      const GAUSS_SIGMA = 0.4;
      // init buffer
      let i;
      for (i = 0; i < DIM * DIM * DIM; i++) {
        volBuf[i] = 0;
      }
      const HALF_SIZE = 4;
      const indCenter = HALF_SIZE + HALF_SIZE * DIM + HALF_SIZE * (DIM * DIM);
      volBuf[indCenter] = 255;
      const retL = gaussSmoother.gaussSmooth(volBuf, DIM, DIM, DIM, GAUSS_RADIUS, GAUSS_SIGMA);
      const valCenter = volBuf[indCenter];
      const valNeigh = volBuf[indCenter - 1];
      const BOUND_MAX = 198;
      const BOUND_MIN = 8;
      expect(valCenter <= BOUND_MAX).to.be.true;
      expect(valNeigh >= BOUND_MIN).to.be.true;
      expect(retL === 1).to.be.true;
    });
    it('check is good smoothing on high sigma', () => {
      const DIM = 9;
      const volBuf = new Uint8Array(DIM * DIM * DIM);
      const gaussSmoother = new VolumeTools();
      const GAUSS_RADIUS = 2;
      const GAUSS_SIGMA = 2.5;
      // init buffer
      let i;
      for (i = 0; i < DIM * DIM * DIM; i++) {
        volBuf[i] = 0;
      }
      const HALF_SIZE = 4;
      const indCenter = HALF_SIZE + HALF_SIZE * DIM + HALF_SIZE * (DIM * DIM);
      volBuf[indCenter] = 255;
      const retL = gaussSmoother.gaussSmooth(volBuf, DIM, DIM, DIM, GAUSS_RADIUS, GAUSS_SIGMA);
      const valCenter = volBuf[indCenter];
      const valNeigh = volBuf[indCenter - 1];
      const valDif = Math.abs(valCenter - valNeigh);
      const DIF_MAX = 4;
      expect(valDif < DIF_MAX).to.be.true;
      expect(retL === 1).to.be.true;
    });
    it('check result array is in range 0..255 ', () => {
      const DIM = 9;
      const volBuf = new Uint16Array(DIM * DIM * DIM);
      const gaussSmoother = new VolumeTools();
      const GAUSS_RADIUS = 2;
      const GAUSS_SIGMA = 2.5;
      // init buffer
      let i;
      for (i = 0; i < DIM * DIM * DIM; i++) {
        volBuf[i] = 0;
      }
      const HALF_SIZE = 4;
      const indCenter = HALF_SIZE + HALF_SIZE * DIM + HALF_SIZE * (DIM * DIM);
      volBuf[indCenter] = 255;
      gaussSmoother.gaussSmooth(volBuf, DIM, DIM, DIM, GAUSS_RADIUS, GAUSS_SIGMA);
      const MAX_VAL = 255;
      for (i = 0; i < DIM * DIM * DIM; i++) {
        expect(volBuf[i] <= MAX_VAL).to.be.true;
      }
    });
    it('check result array is clipped by upper bound 255', () => {
      const DIM = 9;
      const volBuf = new Uint32Array(DIM * DIM * DIM);
      const gaussSmoother = new VolumeTools();
      const GAUSS_RADIUS = 2;
      const GAUSS_SIGMA = 0.3;
      // init buffer
      const SOME_VALUE_ABOVE_256 = 260;
      const MASK_1023 = 1023;
      let i;
      for (i = 0; i < DIM * DIM * DIM; i++) {
        volBuf[i] = SOME_VALUE_ABOVE_256 + (i & MASK_1023);
      }
      const HALF_SIZE = 4;
      const indCenter = HALF_SIZE + HALF_SIZE * DIM + HALF_SIZE * (DIM * DIM);
      volBuf[indCenter] = 300;
      gaussSmoother.gaussSmooth(volBuf, DIM, DIM, DIM, GAUSS_RADIUS, GAUSS_SIGMA);
      const MAX_VAL = 255;
      for (i = 0; i < DIM * DIM * DIM; i++) {
        expect(volBuf[i] <= MAX_VAL).to.be.true;
      }
    });
  });

  describe('check buildSmoothedHistogram()', () => {
    it('check empty src', () => {
      const DIM = 256;
      const hist = new Uint32Array(DIM);
      const GAUSS_SIGMA = 1.1;
      const retL = VolumeTools.buildSmoothedHistogram(null, hist, DIM, GAUSS_SIGMA);
      assert.isBelow(retL, 0);
    });
    it('check empty dst', () => {
      const DIM = 256;
      const hist = new Uint32Array(DIM);
      const GAUSS_SIGMA = 1.1;
      const retL = VolumeTools.buildSmoothedHistogram(hist, null, DIM, GAUSS_SIGMA);
      assert.isBelow(retL, 0);
    });
    it('check both histogram same size', () => {
      const DIM = 256;
      const histSrc = new Uint32Array(DIM);
      const histDst = new Uint32Array(DIM + 1);
      const GAUSS_SIGMA = 1.1;
      const retL = VolumeTools.buildSmoothedHistogram(histSrc, histDst, DIM, GAUSS_SIGMA);
      assert.isBelow(retL, 0);
    });
    it('check both histogram src length match', () => {
      const DIM = 256;
      const histSrc = new Uint32Array(DIM);
      const histDst = new Uint32Array(DIM);
      const GAUSS_SIGMA = 1.1;
      const retL = VolumeTools.buildSmoothedHistogram(histSrc, histDst, DIM + 1, GAUSS_SIGMA);
      assert.isBelow(retL, 0);
    });
    it('check negative sigma', () => {
      const DIM = 256;
      const histSrc = new Uint32Array(DIM);
      const histDst = new Uint32Array(DIM);
      const GAUSS_SIGMA = -1.1;
      const retL = VolumeTools.buildSmoothedHistogram(histSrc, histDst, DIM, GAUSS_SIGMA);
      assert.isBelow(retL, 0);
    });
    it('check too large sigma', () => {
      const DIM = 256;
      const histSrc = new Uint32Array(DIM);
      const histDst = new Uint32Array(DIM);
      const GAUSS_SIGMA = 128.0;
      const retL = VolumeTools.buildSmoothedHistogram(histSrc, histDst, DIM, GAUSS_SIGMA);
      assert.isBelow(retL, 0);
    });
    it('check too large histogram array size', () => {
      const DIM = 2048;
      const histSrc = new Uint32Array(DIM);
      const histDst = new Uint32Array(DIM);
      const GAUSS_SIGMA = 0.4;
      const retL = VolumeTools.buildSmoothedHistogram(histSrc, histDst, DIM, GAUSS_SIGMA);
      assert.equal(retL, 1);
    });
    it('check is really smoothed histogram', () => {
      const DIM = 256;
      const histSrc = new Uint32Array(DIM);
      const histDst = new Uint32Array(DIM);
      const GAUSS_SIGMA = 26.0;
      let i;
      for (i = 0; i < DIM; i++) {
        histSrc[i] = 0;
      }
      histSrc[125] = 128;
      histSrc[126] = 256;
      histSrc[127] = 512;
      histSrc[128] = 1024;
      histSrc[129] = 512;
      histSrc[130] = 256;
      histSrc[131] = 128;
      const retL = VolumeTools.buildSmoothedHistogram(histSrc, histDst, DIM, GAUSS_SIGMA);
      assert.equal(retL, 1);
      assert.isBelow(histDst[127], histDst[128]);
      assert.isBelow(histDst[126], histDst[127]);
      assert.equal(histDst[0], 0);
    });
    it('check do not modify equal distribution', () => {
      const DIM = 256;
      const histSrc = new Uint32Array(DIM);
      const histDst = new Uint32Array(DIM);
      const GAUSS_SIGMA = 26.0;
      const VAL_ENTRY = 512;
      let i;
      for (i = 0; i < DIM; i++) {
        histSrc[i] = VAL_ENTRY;
      }
      const retL = VolumeTools.buildSmoothedHistogram(histSrc, histDst, DIM, GAUSS_SIGMA);
      assert.equal(retL, 1);
      for (i = 0; i < DIM; i++) {
        assert.equal(histDst[i], VAL_ENTRY);
      }
    });
  });

  describe('check scaleDownXYtwice()', () => {
    it('check equal values', () => {
      const DIM = 8;
      const HALF = 2;
      const DIM_DIV_2 = DIM / HALF;
      const VALUE_TEST = 176;
      const volumeSrc = new Uint8Array(DIM * DIM * DIM);
      let i;
      for (i = 0; i < DIM * DIM * DIM; i++) {
        volumeSrc[i] = VALUE_TEST;
      }
      const loader = {
        m_xDim: DIM,
        m_yDim: DIM,
        m_zDim: DIM
      };
      const volumeDst = VolumeTools.scaleDownXYtwice(loader, volumeSrc);
      for (i = 0; i < DIM_DIV_2 * DIM_DIV_2 * DIM; i++) {
        assert.equal(volumeDst[i], VALUE_TEST);
      }
    });
    it('check pixel spacing', () => {
      const DIM = 8;
      const HALF = 2;
      const DIM_DIV_2 = DIM / HALF;
      const VALUE_TEST = 176;
      const volumeSrc = new Uint8Array(DIM * DIM * DIM);
      let i;
      for (i = 0; i < DIM * DIM * DIM; i++) {
        volumeSrc[i] = VALUE_TEST;
      }
      const loader = {
        m_xDim: DIM,
        m_yDim: DIM,
        m_zDim: DIM,
        m_pixelSpacing: {
          x: DIM / HALF,
          y: DIM / HALF
        }
      };
      const volumeDst = VolumeTools.scaleDownXYtwice(loader, volumeSrc);
      for (i = 0; i < DIM_DIV_2 * DIM_DIV_2 * DIM; i++) {
        assert.equal(volumeDst[i], VALUE_TEST);
      }
      assert.equal(loader.m_pixelSpacing.x, DIM);
      assert.equal(loader.m_pixelSpacing.y, DIM);
    });
  }); // scale down tests

  describe('check contrastEnchanceUnsharpMask()', () => {
    it('check undefined arg', () => {
      const err = VolumeTools.contrastEnchanceUnsharpMask();
      assert.equal(err, VolumeTools.VOLTOOLS_ERROR_BAD_NUMBER);

    }); // end of it
    it('check invalid arg', () => {
      const err = VolumeTools.contrastEnchanceUnsharpMask(0, 0, 0, 0, 0, 0, 0, 0);
      assert.equal(err, VolumeTools.VOLTOOLS_ERROR_BAD_ARRAY);

    }); // end of it
    it('check smoothing black volume', () => {
      const DIM = 16;
      const pixelsSrc = new Uint8Array(DIM * DIM * DIM);
      const pixelsDst = new Uint8Array(DIM * DIM * DIM);
      let i;
      for (i = 0; i < DIM * DIM * DIM; i++) {
        pixelsSrc[i] = 0;
      }
      const RAD_SMOOTH = 2;
      const SIGMA_SMOOTH = 1.2;
      const MULT = 32;
      const err = VolumeTools.contrastEnchanceUnsharpMask(pixelsSrc,
        DIM, DIM, DIM,
        pixelsDst,
        RAD_SMOOTH, SIGMA_SMOOTH, MULT);
      assert.equal(err, VolumeTools.VOLTOOLS_ERROR_OK);
      let isZero = 0;
      for (i = 0; i < DIM * DIM * DIM; i++) {
        isZero += pixelsDst[i];
      }
      assert.equal(isZero, 0);
    }); // end of it

    it('check smoothing spot in volume', () => {
      const DIM = 16;
      const pixelsSrc = new Uint8Array(DIM * DIM * DIM);
      const pixelsDst = new Uint8Array(DIM * DIM * DIM);
      let i;
      for (i = 0; i < DIM * DIM * DIM; i++) {
        pixelsSrc[i] = 0;
      }
      // add point into central pixel
      const TWO = 2;
      const offCentral = (DIM / TWO) + (DIM / TWO) * DIM + (DIM / TWO) * DIM * DIM;
      const VAL_SRC = 64;
      pixelsSrc[offCentral] = VAL_SRC;

      const RAD_SMOOTH = 3;
      const SIGMA_SMOOTH = 1.6;
      const MULT = 90;
      const err = VolumeTools.contrastEnchanceUnsharpMask(pixelsSrc,
        DIM, DIM, DIM,
        pixelsDst,
        RAD_SMOOTH, SIGMA_SMOOTH, MULT);
      assert.equal(err, VolumeTools.VOLTOOLS_ERROR_OK);
      // console.log(`dst pixels = ${pixelsDst[offCentral-1]}, ${pixelsDst[offCentral+0]}, ${pixelsDst[offCentral+1]}`);
      const valCenterDst = pixelsDst[offCentral];
      const MAX_COLOR = 255;
      assert.equal(valCenterDst, MAX_COLOR);
    }); // end of it

    it('check smoothing quater in volume', () => {
      const DIM = 16;
      const pixelsSrc = new Uint8Array(DIM * DIM * DIM);
      const pixelsDst = new Uint8Array(DIM * DIM * DIM);
      let i;
      for (i = 0; i < DIM * DIM * DIM; i++) {
        pixelsSrc[i] = 0;
      }
      // add non-zero value into low quater of the volume
      const TWO = 2;
      const VAL_SRC = 64;
      let x, y, z;
      for (z = 0; z <= DIM / TWO; z++) {
        const zOff = z * DIM * DIM;
        for (y = 0; y <= DIM / TWO; y++) {
          const yOff = y * DIM;
          for (x = 0; x <= DIM / TWO; x++) {
            const off = x + yOff + zOff;
            pixelsSrc[off] = VAL_SRC;
          } // for (x)
        } // for (y)
      } // for (z)

      const RAD_SMOOTH = 3;
      const SIGMA_SMOOTH = 1.6;
      const MULT = 30;
      const err = VolumeTools.contrastEnchanceUnsharpMask(pixelsSrc,
        DIM, DIM, DIM,
        pixelsDst,
        RAD_SMOOTH, SIGMA_SMOOTH, MULT);
      assert.equal(err, VolumeTools.VOLTOOLS_ERROR_OK);
      const offCentral = (DIM / TWO) + (DIM / TWO) * DIM + (DIM / TWO) * DIM * DIM;

      // const va = pixelsDst[offCentral - 1];
      // const vb = pixelsDst[offCentral + 0];
      // const vc = pixelsDst[offCentral + 1];
      // console.log(`dst pixels = ${va}, ${vb}, ${vc}`);
      const valCenterDst = pixelsDst[offCentral];
      assert.isAbove(valCenterDst, VAL_SRC);
      const valCenterPre = pixelsDst[offCentral - 1];
      assert.isAbove(valCenterPre, VAL_SRC);
      const valCenterNex = pixelsDst[offCentral + 1];
      assert.equal(valCenterNex, 0);
    }); // end of it
    it('check is power of two', () => {
      const VAL_A = 0;
      const VAL_B = 1;
      const VAL_C = 8;
      const VAL_D = 15;
      const VAL_E = 4096;
      const IS_A = VolumeTools.isPowerOfTwo(VAL_A);
      assert.equal(IS_A, false);
      const IS_B = VolumeTools.isPowerOfTwo(VAL_B);
      assert.equal(IS_B, false);
      const IS_C = VolumeTools.isPowerOfTwo(VAL_C);
      assert.equal(IS_C, true);
      const IS_D = VolumeTools.isPowerOfTwo(VAL_D);
      assert.equal(IS_D, false);
      const IS_E = VolumeTools.isPowerOfTwo(VAL_E);
      assert.equal(IS_E, true);
    }); // end of it
    it('check find GE power of two', () => {
      const VAL_A = 4;
      const VAL_B = 9;
      const VAL_B_PWR = 16;
      const VAL_C = 31;
      const VAL_C_PWR = 32;
      const VAL_D = 500;
      const VAL_D_PWR = 512;
      const VAL_E = 4096;
      const PWR_A = VolumeTools.getGreatOrEqualPowerOfTwo(VAL_A);
      assert.equal(PWR_A, VAL_A);
      const PWR_B = VolumeTools.getGreatOrEqualPowerOfTwo(VAL_B);
      assert.equal(PWR_B, VAL_B_PWR);
      const PWR_C = VolumeTools.getGreatOrEqualPowerOfTwo(VAL_C);
      assert.equal(PWR_C, VAL_C_PWR);
      const PWR_D = VolumeTools.getGreatOrEqualPowerOfTwo(VAL_D);
      assert.equal(PWR_D, VAL_D_PWR);
      const PWR_E = VolumeTools.getGreatOrEqualPowerOfTwo(VAL_E);
      assert.equal(PWR_E, VAL_E);
    }); // end of it


  }); // contrastEnchanceUnsharpMask tests
}); // end of tests volume tools
