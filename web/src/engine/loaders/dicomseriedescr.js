/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

class DicomSerieDescr {
  constructor() {
    this.m_numSlices = 0;
    this.m_hash = 0;
    this.m_bodyPartExamined = '';
    this.m_patientName = '';
    this.m_seriesDescr = '';
    this.m_seriesTime = '';
    this.m_studyDate = '';
    this.m_studyDescr = '';
  }
}
export default DicomSerieDescr;
