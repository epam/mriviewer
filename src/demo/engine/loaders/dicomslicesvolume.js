// ********************************************************
// Imports
// ********************************************************

import DicomSlice from './dicomslice';
import DicomSerieDescr from './dicomseriedescr'

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
    this.m_maxSlice = -1000000;

    this.m_series = [];
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
  buildSeriesInfo() {
    this.m_series = [];
    for (let i = 0; i < this.m_numSlices; i++) {
      const slice = this.m_slices[i];
      this.addSerie(slice);
    } // for i all slices

  } // end of bild series info
  addSerie(slice) {
    const numSeries = this.m_series.length;
    for (let i = 0; i < numSeries; i++) {
      if (this.m_series[i].m_hash === slice.m_hash) {
        this.m_series[i].m_numSlices++;
        return;
      }
    } // for
    const serie = new DicomSerieDescr();
    serie.m_numSlices = 1;
    serie.m_hash = slice.m_hash;
    serie.m_bodyPartExamined = slice.m_bodyPartExamined;
    serie.m_patientName = slice.m_patientName;
    serie.m_seriesDescr = slice.m_seriesDescr;
    serie.m_seriesTime = slice.m_seriesTime;
    serie.m_studyDate = slice.m_studyDate;
    serie.m_studyDescr = slice.m_studyDescr;
    this.m_series.push(serie);
  } // end add series
  // access to series
  getNumSeries() {
    return this.m_series.length;
  }
  getSeries() {
    return this.m_series;
  }
} // class DicomSlicesVolume


export default DicomSlicesVolume;
