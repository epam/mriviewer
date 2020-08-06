// ********************************************************
// Imports
// ********************************************************
 
import Volume from '../engine/Volume';
import SobelEdgeDetector from '../engine/imgproc/Sobel';

// ********************************************************
// Tests
// ********************************************************

describe('UiFilterMenuTests', () => {

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
