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

import LoaderKtx from './loaders/LoaderKtx';
import LoaderNifti from './loaders/LoaderNifti';
import LoaderDicom from './loaders/LoaderDicom';
import LoaderHdr from './loaders/LoaderHdr';

// ********************************************************
// Const
// ********************************************************

/** 
 * Class representing a volume set 
 * Typically set contains only 1 volume, but for some Dicom folders it can be more then 1 
 * See Volume class as an element of volume set
 */
class VolumeSet extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
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
    console.assert(vol instanceof Volume, "VolumeSet.addVolume: arg must be Volume");
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
    console.assert(Number.isInteger(idx), "VolumeSet.getVolume: arg must be number");
    console.assert(idx < this.m_numVolumes, "index of volume should be in range");
    console.assert(idx >= 0, "index of volume should be non negative");
    if ((idx < 0) || (idx >= this.m_numVolumes)) {
      return null;
    }
    return this.m_volumes[idx];
  }
  // do nothing. But we need to implement render() to run Volume tests
  render() {
    return <p>></p>;
  }
  // ********************************************
  // Read metyhods. From Ktx, Dicom, ..
  // ********************************************
  /**
   * Read KTX from local file buffer
   * 
   * @param {char array} arrBuf 
   * @param {func} callbackProgress 
   * @param {func} callbackComplete 
   */
  readFromKtx(arrBuf, callbackProgress, callbackComplete) {
    console.assert(arrBuf != null);
    console.assert(arrBuf.constructor.name === "ArrayBuffer", "Should be ArrayBuf in arrBuf");
    const loader = new LoaderKtx();
    const vol = this.getVolume(0);
    const ret = loader.readFromBuffer(vol, arrBuf, callbackProgress, callbackComplete);
    return ret;
  }  
  readFromKtxUrl(strUrl, callbackProgress, callbackComplete) {
    const loader = new LoaderKtx();
    const vol = this.getVolume(0);
    loader.readFromUrl(vol, strUrl, callbackProgress, callbackComplete);
  }
  readFromNiiUrl(strUrl, callbackProgress, callbackComplete) {
    const loader = new LoaderNifti();
    const vol = this.getVolume(0);
    const ret = loader.readFromUrl(vol, strUrl, callbackProgress, callbackComplete);
    return ret;
  }
  readFromDicomUrl(strUrl, callbackProgress, callbackComplete) {
    const NUM_FILES = 0; // will be filled later
    const loader = new LoaderDicom(NUM_FILES);
    const ret = loader.readFromUrl(this, strUrl, callbackProgress, callbackComplete);
    return ret;
  }
  readFromHdrUrl(strUrl, callbackProgress, callbackComplete) {
    const loader = new LoaderHdr();
    const ret = loader.readFromUrl(this, strUrl, callbackProgress, callbackComplete);
    return ret;
  }
  readFromNifti(arrBuf, callbackProgress, callbackComplete) {
    const loader = new LoaderNifti();
    const vol = this.getVolume(0);
    const ret = loader.readFromBuffer(vol, arrBuf, callbackProgress, callbackComplete);
    return ret;
  }
  readFromDicom(loader, arrBuf, callbackProgress, callbackComplete) {
    const indexFile = 0;
    const fileName = 'file???';
    const ratio = 0.0;

    const ret = loader.readFromBuffer(indexFile, fileName, ratio, arrBuf, callbackProgress, callbackComplete);
    return ret;
  }
  readSingleSliceFromDicom(loader, indexFile, fileName, ratioLoaded, arrBuf, callbackProgress, callbackComplete) {
    const ret = loader.readFromBuffer(indexFile, fileName, ratioLoaded, arrBuf, callbackProgress, callbackComplete);
    return ret;
  }

} // end VolumeSet

export default VolumeSet;
