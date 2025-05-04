import LoadResult from '../../LoadResult';
import { NIFTI_HEADER_SIZE } from './constants';

/**
 * Class to read and parse NIFTI header data
 */
export class NiftiHeaderReader {
  constructor(littleEndian = true) {
    this.m_littleEndian = littleEndian;
  }

  readIntFromBuffer(buf, off) {
    let res = 0;
    if (this.m_littleEndian) {
      res = buf[off + 0] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24);
    } else {
      res = buf[off + 3] | (buf[off + 2] << 8) | (buf[off + 1] << 16) | (buf[off + 0] << 24);
    }
    return res;
  }

  readShortFromBuffer(buf, off) {
    let res = 0;
    if (this.m_littleEndian) {
      res = buf[off + 0] | (buf[off + 1] << 8);
    } else {
      res = buf[off + 1] | (buf[off + 0] << 8);
    }
    return res;
  }

  readFloatFromBuffer(buf, off) {
    const BYTES_IN_FLOAT = 4;
    const arBuf = new ArrayBuffer(BYTES_IN_FLOAT);
    const dataArray = new DataView(arBuf);
    dataArray.setUint8(0, buf[off + 0]);
    dataArray.setUint8(1, buf[off + 1]);
    dataArray.setUint8(2, buf[off + 2]);
    dataArray.setUint8(3, buf[off + 3]);
    return dataArray.getFloat32(0, this.m_littleEndian);
  }

  parseHeader(bufBytes) {
    const SIZE_SHORT = 2;
    let bufOff = 0;
    let headSize = this.readIntFromBuffer(bufBytes, bufOff);
    if (headSize > 2 << 24) {
      this.m_littleEndian = false;
      headSize = this.readIntFromBuffer(bufBytes, bufOff);
    }

    if (headSize !== NIFTI_HEADER_SIZE) {
      return {
        hasError: true,
        errorCode: LoadResult.BAD_HEADER,
        errorMessage: `Nifti first int wrong: ${headSize}, but should be ${NIFTI_HEADER_SIZE}`,
      };
    }

    // Skip unneeded header fields :
    // Skip sizeof_hdr (0), data_type (4), db_name (14), extents (32), session_error (36), regular (38), dim_info (39); now at dim[8] (40)
    bufOff += 40;
    const MIN_NUM_DIMS = 3;
    const numDimensions = this.readShortFromBuffer(bufBytes, bufOff);
    if (numDimensions < MIN_NUM_DIMS) {
      return {
        hasError: true,
        errorCode: LoadResult.WRONG_HEADER_DIMENSIONS,
        errorMessage: `Nifti header wrong num dimensions: ${numDimensions}, but should be at least 3`,
      };
    }

    bufOff += SIZE_SHORT;
    const xDim = this.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const yDim = this.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const zDim = this.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT + 8 + 12 + 2;

    const dataType = this.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const bitPix = this.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;

    bufOff += SIZE_SHORT + 4; // Skip slice_start, pixdim[0]
    const pixdim1 = this.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += 4;
    const pixdim2 = this.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += 4;
    const pixdim3 = this.readFloatFromBuffer(bufBytes, bufOff);

    return { numDimensions, xDim, yDim, zDim, dataType, bitPix, pixdim1, pixdim2, pixdim3 };
  }

  readDescription(bufBytes) {
    const OFF_DESC = 148;
    const MAX_STR_DECS = 80;
    const arrDesc = bufBytes.slice(OFF_DESC, OFF_DESC + MAX_STR_DECS);
    let strDescr = '';
    let isGoodSym = true;
    const CODE_MIN = 20;
    const CODE_MAX = 255;
    for (let i = 0; i < MAX_STR_DECS && isGoodSym; i++) {
      isGoodSym = arrDesc[i] >= CODE_MIN && arrDesc[i] < CODE_MAX;
      if (isGoodSym) {
        strDescr = strDescr.concat(String.fromCharCode(arrDesc[i]));
      }
    }
    return strDescr;
  }
}
