/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Dicom info
 * @module lib/scripts/loaders/dicominfo
 */

/**
 * Class @class DicomInfo for volume some important text data render
 */
class DicomInfo {
  constructor() {
    this.m_patientName = '';
    this.m_patientDateOfBirth = '';
    this.m_studyDescr = '';
    this.m_studyDate = '';
    this.m_seriesTime = '';
    this.m_seriesDescr = '';
    this.m_bodyPartExamined = '';
    this.m_institutionName = '';
    this.m_operatorsName = '';
    this.m_physicansName = '';

    this.m_patientId = '';
    this.m_patientGender = '';
    this.m_acquisionTime = '';
    this.m_manufacturerName = '';
    // tags info for each slice. Each entry is DicomSliceInfo
    this.m_sliceInfo = [];
  }
}

export default DicomInfo;
