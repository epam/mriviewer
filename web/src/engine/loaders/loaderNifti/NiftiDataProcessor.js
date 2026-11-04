import HistogramUtils from '../../../ui/Histogram/HistogramUtils';
import {
  NIFTI_DATA_TYPE_FLOAT32,
  NIFTI_DATA_TYPE_INT16,
  NIFTI_DATA_TYPE_INT8,
  NIFTI_DATA_TYPE_UINT16,
  NIFTI_DATA_TYPE_UINT8,
} from './constants';

/**
 * Class to process NIFTI volume data
 */
export class NiftiDataProcessor {
  constructor(headerReader) {
    this.headerReader = headerReader;
  }

  computeProgressMask(numVoxels) {
    let pwr2 = 29;
    while (pwr2 >= 0 && 1 << pwr2 >= numVoxels) pwr2--;
    pwr2 = Math.max(pwr2 - 2, 1);
    return (1 << pwr2) - 1;
  }

  findMaxValue(buf, type, offset, count, mask, progress) {
    let valMax = 0,
      j = 0;
    for (let i = 0; i < count; i++) {
      let val = 0;
      if (type === NIFTI_DATA_TYPE_INT16 || type === NIFTI_DATA_TYPE_UINT16) {
        val = this.headerReader.readShortFromBuffer(buf, offset + j);
        j += 2;
      } else if (type === NIFTI_DATA_TYPE_FLOAT32) {
        val = Math.floor(this.headerReader.readFloatFromBuffer(buf, offset + j)) + 1;
        j += 4;
      } else {
        val = buf[offset + j];
        j++;
      }
      if (val > valMax) valMax = val;
      if (progress && (i & mask) === 0 && i > 0) progress((0.5 * i) / count);
    }
    return valMax;
  }

  buildHistogram(buf, dataType, offset, count, valMax) {
    const hist = new Float32Array(valMax + 1).fill(0);
    let j = 0;

    for (let i = 0; i < count; i++) {
      let val;
      switch (dataType) {
        case NIFTI_DATA_TYPE_INT16:
        case NIFTI_DATA_TYPE_UINT16:
          val = this.headerReader.readShortFromBuffer(buf, offset + j);
          j += 2;
          break;
        case NIFTI_DATA_TYPE_FLOAT32:
          val = Math.floor(this.headerReader.readFloatFromBuffer(buf, offset + j));
          j += 4;
          break;
        case NIFTI_DATA_TYPE_INT8:
        case NIFTI_DATA_TYPE_UINT8:
          val = buf[offset + j];
          j += 1;
          break;
      }
      if (val >= 0 && val <= valMax) {
        hist[val]++;
      }
    }
    return hist;
  }

  createAndProcessHistogram(histArray, valMax) {
    const HIST_SMOOTH_SIGMA = 0.8;
    const NORMALIZATION_APPLY = false;
    const histogram = new HistogramUtils();
    histogram.assignArray(valMax, histArray);
    histogram.smoothHistogram(HIST_SMOOTH_SIGMA, NORMALIZATION_APPLY);
    return histogram;
  }

  fillDataArray(dataArray, bufBytes, dataType, dataOff, numVoxels, scale, ACC_DEGREE, MAX_BYTE, progressMask, callbackProgress) {
    let j = 0;
    for (let i = 0; i < numVoxels; i++) {
      let val;
      switch (dataType) {
        case NIFTI_DATA_TYPE_INT16:
        case NIFTI_DATA_TYPE_UINT16:
          val = this.headerReader.readShortFromBuffer(bufBytes, dataOff + j);
          j += 2;
          break;
        case NIFTI_DATA_TYPE_INT8:
        case NIFTI_DATA_TYPE_UINT8:
          val = bufBytes[dataOff + j];
          j++;
          break;
        case NIFTI_DATA_TYPE_FLOAT32:
          val = Math.floor(this.headerReader.readFloatFromBuffer(bufBytes, dataOff + j));
          j += 4;
          break;
        default:
          continue;
      }
      val = (val * scale) >> ACC_DEGREE;
      dataArray[i] = val <= MAX_BYTE ? val : MAX_BYTE;
      if (callbackProgress && (i & progressMask) === 0 && i > 0) {
        const ratio = 0.5 + 0.5 * (i / numVoxels);
        callbackProgress(ratio);
      }
    }
  }

  clearVolumeBorders(dataArray, xDim, yDim, zDim) {
    const xyDim = xDim * yDim;
    // Clear Z borders
    for (let y = 0; y < yDim; y++) {
      const yOff = y * xDim;
      for (let x = 0; x < xDim; x++) {
        dataArray[0 * xyDim + yOff + x] = 0;
        dataArray[(zDim - 1) * xyDim + yOff + x] = 0;
      }
    }
    // Clear X borders
    for (let z = 0; z < zDim; z++) {
      const zOff = z * xyDim;
      for (let y = 0; y < yDim; y++) {
        dataArray[zOff + y * xDim + 0] = 0;
        dataArray[zOff + y * xDim + (xDim - 1)] = 0;
      }
    }
    // Clear Y borders
    for (let z = 0; z < zDim; z++) {
      const zOff = z * xyDim;
      for (let x = 0; x < xDim; x++) {
        dataArray[zOff + 0 + x] = 0;
        dataArray[zOff + (yDim - 1) * xDim + x] = 0;
      }
    }
  }
}
