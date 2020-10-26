// ********************************************************
// Imports
// ********************************************************
 
import UiHistogram from './UiHistogram';
import Volume from '../engine/Volume';

// ********************************************************
// Tests
// ********************************************************

describe('UiHistogramTests', () => {

  it('testHistogramFromEmptyVolume', () => {
    const hist = new UiHistogram();
    const vol = new Volume();
    const XDIM = 32;
    const YDIM = 32;
    const ZDIM = 32;
    vol.createEmptyBytesVolume(XDIM, YDIM, ZDIM);
    hist.getVolumeHistogram(vol);

    // first entry should be maximum
    expect(hist.m_histogram[0] === 1.0).toBeTruthy();
    // next entries showd drop down to 0
    expect(hist.m_histogram[1] < hist.m_histogram[0]).toBeTruthy();
    expect(hist.m_histogram[2] < hist.m_histogram[1]).toBeTruthy();
    // non first entries shoud be 0
    const NUM_COLORS = 256;
    const NUM_START = 6;
    // for (let i = 0; i < NUM_START; i++) {
    //  console.log(`hist[${i}] = ${hist.m_histogram[i]} `);
    // }
    for (let i = NUM_START; i < NUM_COLORS; i++) {
      expect(hist.m_histogram[i] === 0).toBeTruthy();
    }
    // peak cannot be defined
    // console.log(`peak hist = ${hist.m_peakIndex} `);
    expect(hist.m_peakIndex === -1).toBeTruthy();
  });

  it('testHistogramFromArtVolSphere', () => {
    const vol = new Volume();
    const XDIM = 32;
    const YDIM = 32;
    const ZDIM = 32;
    vol.createEmptyBytesVolume(XDIM, YDIM, ZDIM);
    const pixels = vol.m_dataArray;
    expect(pixels !== null).toBeTruthy();
    const DHALF = Math.floor(XDIM / 2);
    const RAD = 3;
    const NUM_COLORS = 256;
    for (let dz = -RAD; dz <= +RAD; dz++) {
      const z = DHALF + dz;
      const zOff = z * XDIM * YDIM;
      const tz = 1.0 - dz / RAD;
      for (let dy = -RAD; dy <= +RAD; dy++) {
        const y = DHALF + dy;
        const yOff = y * XDIM;
        const ty = 1.0 - dy / RAD;
        for (let dx = -RAD; dx <= +RAD; dx++) {
          const x = DHALF + dx;
          const tx = 1.0 - dx / RAD;
          const dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
          const val = Math.floor( (NUM_COLORS - 1 ) * dist);
          pixels[x + yOff + zOff] = val;
        } // for (dx)
      } // for (dy)
    }  // for (dz)

    // create hist from volume
    const hist = new UiHistogram();
    hist.getVolumeHistogram(vol);

    const peakInd = hist.m_peakIndex;
    console.log(`peakInd = ${peakInd}`);
    expect(peakInd < 32).toBeTruthy();

    const INDEX_START = 6;
    const VAL_BAR = 0.001;
    for (let i = INDEX_START; i < NUM_COLORS; i++) {
      expect(hist.m_histogram[i] >= 0.0).toBeTruthy();
      expect(hist.m_histogram[i] < VAL_BAR).toBeTruthy();
    }
  }); // indi test

  it('testHistogramGetPeak', () => {
    const vol = new Volume();
    const XDIM = 32;
    const YDIM = 32;
    const ZDIM = 32;
    vol.createEmptyBytesVolume(XDIM, YDIM, ZDIM);

    // create hist from volume
    const hist = new UiHistogram();
    hist.getVolumeHistogram(vol);
    const histArray = hist.m_histogram;
    const NUM_COLORS = 256;

    // setup histogram
    const INDEX_PEAK = 157;
    const VAL_RANGE = 96;
    for (let i = 0; i < NUM_COLORS; i++) {
      let iDif = i - INDEX_PEAK;
      iDif = (iDif >= 0) ? iDif : (-iDif);
      const r = 1.0 - iDif / VAL_RANGE;
      histArray[i] = r;
    }
    // detect peak
    hist.getMaxPeak();
    expect(hist.m_peakIndex === INDEX_PEAK).toBeTruthy();
  }); // indi test

  it('testHistogramSelectPeakFromThree', () => {
    const vol = new Volume();
    const XDIM = 32;
    const YDIM = 32;
    const ZDIM = 32;
    vol.createEmptyBytesVolume(XDIM, YDIM, ZDIM);

    // create hist from volume
    const hist = new UiHistogram();
    hist.getVolumeHistogram(vol);
    const histArray = hist.m_histogram;
    const NUM_COLORS = 256;

    // setup histogram
    const INDEX_PEAK_1 = 96;
    const INDEX_PEAK_2 = 158;
    const INDEX_PEAK_3 = 221;
    const VAL_RANGE = 32;
    const ARTIF_SUB = 0.3;
    for (let i = 0; i < NUM_COLORS; i++) {
      let iDif;
      iDif = i - INDEX_PEAK_1;
      iDif = (iDif >= 0) ? iDif : (-iDif);
      const r1 = 1.0 - iDif / VAL_RANGE - ARTIF_SUB;

      iDif = i - INDEX_PEAK_2;
      iDif = (iDif >= 0) ? iDif : (-iDif);
      const r2 = 1.0 - iDif / VAL_RANGE;

      iDif = i - INDEX_PEAK_3;
      iDif = (iDif >= 0) ? iDif : (-iDif);
      const r3 = 1.0 - iDif / VAL_RANGE - ARTIF_SUB;

      const rMax12 = (r1 > r2 ) ?  r1 : r2;
      const rMax = (rMax12 > r3) ? rMax12 : r3;

      histArray[i] = rMax;
    }
    // detect peak
    hist.getMaxPeak();
    expect(hist.m_peakIndex === INDEX_PEAK_2).toBeTruthy();
  }); // indi test

  it('testHistogramGetLastMaxIndex', () => {
    const NUM_COLORS = 386;
    const histArr = new Array(NUM_COLORS);
    let i;
    for (i = 0; i < NUM_COLORS; i++) {
      histArr[i] = 1;
    }
    const hist = new UiHistogram();
    hist.assignArray(NUM_COLORS, histArr);
    const indMax = hist.getLastMaxIndex();
    expect(indMax === -1).toBeTruthy();

    const IND_MAX = Math.floor(NUM_COLORS * 0.21);
    histArr[IND_MAX] += 1;
    hist.assignArray(NUM_COLORS, histArr);
    const indFoundMax = hist.getLastMaxIndex();
    expect(indFoundMax === IND_MAX).toBeTruthy();
  });



}); // all tests
