// ********************************************************
// Imports
// ********************************************************

import DicomSlice from './dicomslice';

// ********************************************************
// Const
// ********************************************************

/** Maximum possible slices in volume */
const MAX_SLICES_IN_VOLUME = 1024;
const FLOAT_TOO_STANGE_VALUE = -5555555.5;


// ********************************************************
// Class
// ********************************************************

/**
* Class DicomSlicesVolume Collected volume (from slices)
*/
class DicomSlicesVolume {
  /** Create empty volume */
  constructor() {
    this.m_numSlices = 0;
    this.m_slices = [];
    for (let i = 0; i < MAX_SLICES_IN_VOLUME; i++) {
      const slice = new DicomSlice();
      slice.m_sliceNumber = -1;
      slice.m_sliceLocation = FLOAT_TOO_STANGE_VALUE;
      slice.m_image = null;
      this.m_slices.push(slice);
    }
    // eslint-disable-next-line
    this.m_minSlice = +1000000;
    this.m_maxSlice = -1;
  }
  /** Destroy volume and initialize values */
  destroy() {
    for (let i = 0; i < this.m_numSlices; i++) {
      this.m_slices[i].m_sliceNumber = -1;
      this.m_slices[i].m_sliceLocation = FLOAT_TOO_STANGE_VALUE;
      this.m_slices[i].m_image = null;
    }
    this.m_numSlices = 0;
    // eslint-disable-next-line
    this.m_minSlice = +1000000;
    this.m_maxSlice = -1;
  }
  getNewSlice() {
    if (this.m_numSlices >= MAX_SLICES_IN_VOLUME) {
      return null;
    }
    const slice = this.m_slices[this.m_numSlices];
    this.m_numSlices += 1;
    return slice;
  }
  updateSliceNumber(sliceNumber) {
    this.m_minSlice = (sliceNumber < this.m_minSlice) ? sliceNumber : this.m_minSlice;
    this.m_maxSlice = (sliceNumber > this.m_maxSlice) ? sliceNumber : this.m_maxSlice;
  }
}

export default DicomSlicesVolume;
