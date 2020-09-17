
// ********************************************************
// Imports
// ********************************************************

import Hash from '../utils/Hash';


// ********************************************************
// Class
// ********************************************************

/**
* Class DicomSlice Single slice with info, used to detect series
*/

class DicomSlice {
  constructor() {
    this.m_image = null;
    this.m_sliceNumber = 0;
    this.m_sliceLocation = 0.0;
    // 10, 10
    this.m_patientName = '';
    // 8, 1030
    this.m_studyDescr = '';
    // 8, 20
    this.m_studyDate = '';
    // 8, 31
    this.m_seriesTime = '';
    // 8, 103E
    this.m_seriesDescr = '';
    // 18, 15
    this.m_bodyPartExamined = '';
    //
    this.m_hash = 0;
    this.m_xDim = 0;
    this.m_yDim = 0;
  }
  buildHash() {
    const strMix = this.m_patientName + this.m_studyDescr +
    this.m_studyDate + this.m_seriesTime + 
    this.m_seriesDescr + this.m_bodyPartExamined;
    this.m_hash = Hash.getHash(strMix);
  } // end build hash
} // end class DicomSlice

export default DicomSlice;
