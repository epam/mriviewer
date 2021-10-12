/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Dicom tag info
 * @module lib/scripts/loaders/dicomtaginfo
 */

/**
 * Class @class DicomTagInfo tag descr
 */
class DicomTagInfo {
  constructor() {
    this.m_tag = '';
    this.m_attrName = '';
    this.m_attrValue = '';
  }
}

export default DicomTagInfo;
