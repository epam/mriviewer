/**
 * @fileOverview LoaderDicom
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

// import LoadResult from '../LoadResult';
// import UiHistogram from '../../ui/UiHistogram';

// ********************************************************
// Const
// ********************************************************

// const NEED_EVEN_TEXTURE_SIZE = false;

// ********************************************************
// Class
// ********************************************************

/**
 * Class LoaderDicom some text later...
 */
class LoaderDicom{
  /**
   * @param {object} props - props from up level object
   */
  constructor() {
    this.m_xDim = 0;
    this.m_yDim = 0;
    this.m_zDim = 0;
  }
  /**
  * Read from local file buffer
  * @param {object} volDst - Destination volume object to be fiiied
  * @param {object} arrBuf - source byte buffer
  * @param {func} callbackProgress - function invoked during read
  * @param {func} callbackComplete - function invoked after reading
  * @return true, if success
  */
  readFromBuffer(volDst, arrBuf, callbackProgress, callbackComplete) {
    console.log(`Dicom read OK. Volume pixels = ${this.m_xDim} * ${this.m_yDim} * ${this.m_zDim}`);
    return true;
  }
} // end class LoaderDicom

export default LoaderDicom;

 