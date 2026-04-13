import LoadResult from '../../LoadResult';
import { NIFTI_HEADER_SIZE } from './constants';

/**
 * Class to validate NIFTI data
 */
export class NiftiValidator {
  validateBufferSize(bufLen, callbackComplete) {
    const MIN_BUF_SIZE = 8;
    const MAX_BUF_SIZE = 1024 * 1024 * 230;
    if (bufLen < MIN_BUF_SIZE) {
      return this.reportError(LoadResult.ERROR_TOO_SMALL_DATA_SIZE, callbackComplete);
    }
    if (bufLen >= MAX_BUF_SIZE) {
      return this.reportError(LoadResult.ERROR_TOO_LARGE_DATA_SIZE, callbackComplete);
    }
    return true;
  }

  validateHeaderSize(bufLen, callbackComplete) {
    if (bufLen < NIFTI_HEADER_SIZE) {
      return this.reportError(LoadResult.BAD_HEADER, callbackComplete, 'Nifti header too small');
    }
    return true;
  }

  validateDataType(dataType, callbackComplete) {
    const allowed = [2, 4, 16, 256, 512];
    if (!allowed.includes(dataType)) {
      return this.reportError(LoadResult.WRONG_HEADER_DATA_TYPE, callbackComplete, `Unsupported data type: ${dataType}`);
    }
    return true;
  }

  validateBitPix(bitPix, callbackComplete) {
    if (![8, 16, 32].includes(bitPix)) {
      return this.reportError(LoadResult.WRONG_HEADER_BITS_PER_PIXEL, callbackComplete, `Wrong bitPix: ${bitPix}`);
    }
    return true;
  }

  validateMagic(bufBytes, callbackComplete) {
    const MAGIC_OFFSET = 348 - 4;
    const MAGIC = [110, 43, 49]; // 'n+1'
    const isValid = MAGIC.every((val, i) => bufBytes[MAGIC_OFFSET + i] === val);
    if (!isValid) {
      return this.reportError(
        LoadResult.WRONG_HEADER_MAGIC,
        callbackComplete,
        `Bad magic: ${bufBytes.slice(MAGIC_OFFSET, MAGIC_OFFSET + 3).join(', ')}`
      );
    }
    return true;
  }

  reportError(type, callback, message) {
    console.log(`Nifti error: ${message}`);
    if (callback) callback(LoadResult[type], null, 0, null);
    return false;
  }
}
