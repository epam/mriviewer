
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

  }
}

export default DicomSlice;
