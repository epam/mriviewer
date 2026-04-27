/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Dicom slice info
 * @module lib/scripts/loaders/dicomsliceinfo
 */

/**
 * Class @class DicomSliceInfo slice information
 */
class DicomSliceInfo {
  constructor() {
    this.m_sliceName = '';
    this.m_fileName = '';
    // tags info for each slice. Each entry is DicomTagInfo
    this.m_tags = [];
  }
}

export default DicomSliceInfo;
