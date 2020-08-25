// ********************************************************
// Imports
// ********************************************************
 
import Volume from '../engine/Volume';
import SobelEdgeDetector from '../engine/imgproc/Sobel';
import GaussSmoother from '../engine/imgproc/Gauss';

// ********************************************************
// Tests
// ********************************************************

describe('UiFilterMenuTests', () => {

  it('testGaussOnSmallVolume', () => {
    // create simple small volume
    const SZ = 16;
    const HALF_SZ = SZ / 2;
    const volume = new Volume();
    volume.createEmptyBytesVolume(SZ, SZ, SZ);
    let offDst = 0;
    const pixelsSrc = volume.m_dataArray;
    for (let z = 0; z < SZ; z++) {
      for (let y = 0; y < SZ; y++) {
        for (let x = 0; x < SZ; x++) {
          pixelsSrc[offDst++] = (z < HALF_SZ) ? 0 : 255;
        }
      }
    }
    // apply gauss
    const NEED_HW = false;
    const gauss = new GaussSmoother(NEED_HW);
    const kernelSize = 2;
    const sigma = kernelSize / 6.0;
    gauss.start(volume, kernelSize, sigma);
    while (!gauss.isFinished()) {
      gauss.update();
    }
    // gauss.normalizeDstImage();
    const pixelsDst = gauss.getPixelsDst();
    // check some pixels
    const xOff = HALF_SZ;
    const yOff = HALF_SZ * SZ;
    const xyDim = SZ * SZ;
    let valPrev = -1;
    for (let z = 0; z < SZ; z++) {
      // const srcVal = pixelsSrc[xOff + yOff + z * xyDim];
      const val = pixelsDst[xOff + yOff + z * xyDim];
      // console.log('src val / gauss val = ' + srcVal.toString() + ' / ' + val.toString());
      expect(val >= valPrev).toBeTruthy();
      valPrev = val;
      if (z <= 2) {
        expect(val === 0).toBeTruthy();
      }
      if (z >= SZ - 2) {
        expect(val === 255).toBeTruthy();
      }
    } // for z
    gauss.stop();
    // console.log('gauss test completed on a small volume');
  });

  it('testSobelOnSmallVolume', () => {
    const SZ = 16;
    const HALF_SZ = SZ / 2;
    const volume = new Volume();
    volume.createEmptyBytesVolume(SZ, SZ, SZ);
    let offDst = 0;
    const pixelsSrc = volume.m_dataArray;
    for (let z = 0; z < SZ; z++) {
      for (let y = 0; y < SZ; y++) {
        for (let x = 0; x < SZ; x++) {
          pixelsSrc[offDst++] = (z < HALF_SZ) ? 0 : 255;
        }
      }
    }

    const sobel = new SobelEdgeDetector();
    sobel.start(volume);
    while (!sobel.isFinished()) {
      sobel.update();
    }
    sobel.normalizeDstImage();
    const pixelsDst = sobel.getPixelsDst();
    // check some pixels
    let off = 0;
    for (let z = 0; z < SZ; z++) {
      for (let y = 0; y < SZ; y++) {
        for (let x = 0; x < SZ; x++) {
          const val = pixelsDst[off++];
          if ((z == HALF_SZ) || (z == HALF_SZ - 1)) {
            expect(val > 240).toBeTruthy();
          } else {
            expect(val < 10).toBeTruthy();
          }
        }
      }
    }
    sobel.stop();
    // console.log('Sobel test completed');
  });
});
