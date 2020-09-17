// ********************************************************
// Imports
// ********************************************************

import DicomSlice from './dicomslice';
import DicomSerie from './dicomserie';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
* Class DicomSlicesVolume Collected volume (from slices)
*/
class DicomSlicesVolume {
  constructor() {
    //
    // series[i]:
    //  m_minSlice
    //  m_maxSlice
    //  m_slices[]
    //
    this.m_series = [];
  }
  destroy() {
    this.m_series = [];
  }
  getSeries() {
    return this.m_series;
  }
  //
  // slice: DicomSlice
  addSlice(slice) {
    console.assert(slice !== undefined);
    console.assert(slice instanceof DicomSlice, "should be DicomSlice object");
    console.assert(slice.m_hash !== undefined);
    console.assert(slice.m_hash !== 0);
    let indSerie = this.getSerieIndex(slice);
    if (indSerie < 0) {
      // create new serie
      const serieNew = new DicomSerie(slice.m_hash);
      this.m_series.push(serieNew);
      indSerie = this.m_series.length - 1;
    }
    // add slice to serie
    const ser = this.m_series[indSerie];
    ser.addSlice(slice);
  } // end add slice
  getSerieIndex(slice) {
    const numSeries = this.m_series.length;
    for (let i = 0; i < numSeries; i++) {
      const serie = this.m_series[i];
      if (serie.m_hash === slice.m_hash) {
        return i;
      }
    } // end for
    return -1;
  } // end get serie index

} // end class DicomSlicesVolume

export default DicomSlicesVolume;
