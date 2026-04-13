/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview VolumeSet
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';

import Volume from './Volume';

// ********************************************************
// Const
// ********************************************************

/**
 * Class representing a volume set
 * Typically set contains only 1 volume, but for some Dicom folders it can be more then 1
 * See Volume class as an element of volume set
 */
class VolumeSet extends React.Component {
  constructor() {
    super();
    /** nuber of volumes in set */
    this.m_numVolumes = 0;
    /** volumes array. see more details in class Volume */
    this.m_volumes = [];
    /** patient name (etracted from dicom tags or empty for non-dicom files) */
    this.m_patientName = '';
    /** date of patient birth */
    this.m_patientBirth = '';
    /** text description of serie */
    this.m_seriesDescr = '';
    /** text description of study */
    this.m_studyDescr = '';
    /** text with date of study */
    this.m_studyDate = '';
    /** text with time series taken */
    this.m_seriesTime = '';
    /** text with body part */
    this.m_bodyPartExamined = '';
    /** text institution like clinic, university, etc. */
    this.m_institutionName = '';
    /** text with operator name */
    this.m_operatorsName = '';
    /** text with physican name */
    this.m_physicansName = '';
  }

  /**
   * Add volume to set
   *
   * @param {Volume} vol - added volume
   */
  addVolume(vol) {
    console.assert(vol instanceof Volume, 'VolumeSet.addVolume: arg must be Volume');
    // this.m_volumes[this.m_numVolumes] = vol;
    this.m_volumes.push(vol);
    this.m_numVolumes++;
  }

  /**
   * Get number of volumes in st
   *
   * @return {number} Amount of volumes on set
   */
  getNumVolumes() {
    return this.m_numVolumes;
  }

  /**
   * Get volume by its index
   * @param {number} idx - index of volume in set
   * @return {Volume} volume is set or null
   */
  getVolume(idx) {
    console.assert(Number.isInteger(idx), 'VolumeSet.getVolume: arg must be number');
    console.assert(idx < this.m_numVolumes, 'index of volume should be in range');
    console.assert(idx >= 0, 'index of volume should be non negative');
    if (idx < 0 || idx >= this.m_numVolumes) {
      return null;
    }
    return this.m_volumes[idx];
  }

  // do nothing. But we need to implement render() to run Volume tests
  render() {
    return <p></p>;
  }
} // end VolumeSet

export default VolumeSet;
