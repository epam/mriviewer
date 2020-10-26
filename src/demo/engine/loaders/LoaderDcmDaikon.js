//
//
//

// **********************************************
// Imports
// **********************************************

// 31.08.2020. Daikon reader
import daikon from  'daikon';
import DicomSliceInfo from './dicomsliceinfo';
import LoadResult from '../LoadResult';
import LoaderDicom from './LoaderDicom';
import DicomTagInfo from './LoaderDicom';

import StoreActionType from '../../store/ActionTypes';
import DicomSlice from './dicomslice';

// **********************************************
// Const
// **********************************************

// read dicom via daikon: print every tag readed
const NEED_DEBUG_PRINT_TAGS = false;

// future possible development:
// deep debug: develop read dicomdir file
const READ_DICOMDIR = false;

// **********************************************
// Class
// **********************************************

class LoaderDcmDaikon {
  constructor(){ 
    this.m_loaderDicom = null;
  }
  //
  // see example read
  // https://github.com/mbarnig/dumpDICOMDIRarchive/blob/master/dumpDICOMDIR.js
  //
  loadDicomfir(fileName, strContent) {
    const dataFile = new DataView(strContent);
    let image = null;
    try {
      image = daikon.Series.parseImage(dataFile);
    } catch (err) {
      console.log("error parse dcm file buffer");
      return LoadResult.BAD_DICOM;
    }
    if ((image === undefined) || (image === null)) {
      return LoadResult.BAD_DICOM;
    }
    const TAG_DIRECTORY_REC = [0x0004, 0x1220];
    let ind;
    // slice location detect (to correct slices order on z)
    ind = daikon.Utils.dec2hex(TAG_DIRECTORY_REC[0]) + daikon.Utils.dec2hex(TAG_DIRECTORY_REC[1]);
    const tagDirRec = image.tags[ind];
    if (tagDirRec !== undefined) {
      const numEntries = tagDirRec.value.length;
      for (let k = 0; k < numEntries; k++) {
        let dirEntry = tagDirRec.value[k];
        if ((dirEntry.element === 57344) && (dirEntry.group === 65534)) {
          const numSub = dirEntry.value.length;
          for (let s = 0; s < numSub; s++) {
            let elemSub = dirEntry.value[s];
            if ((elemSub.element === 5168) && (elemSub.group === 4)) {
              //const str = elemSub.value[0];
              //console.log(`elem sub val = ${str}`);
            }
            if ((elemSub.element === 5376) && (elemSub.group === 4)) {
              const fold = elemSub.value[0];
              const fname = elemSub.value[1];
              console.log(`image nm = ${fold} / ${fname}`);
            }
          } // for s, all sub elemenst 
        } // if entry with patient and image information
      } // for k all entries in dir
    } // if dir rec found
    return LoadResult.SUCCESS;
  }
  // load single slice, using file index
  loadSingleSlice(fileIndex, fileName, strContent) {
    // console.log("loadSingleSlice [" + fileIndex.toString() + "]");
    const dataFile = new DataView(strContent);
    let image = null;
    try {
      image = daikon.Series.parseImage(dataFile);
    } catch (err) {
      console.log("error parse dcm file buffer");
      return LoadResult.BAD_DICOM;
    }
    if ((image === undefined) || (image === null)) {
      return LoadResult.BAD_DICOM;
    }
    // console.log("dcm parse completed");
    const yDim = image.getRows();
    const xDim = image.getCols();
    const bits = image.getBitsAllocated();
    if ((bits !== 8) && (bits !== 16)) {
      console.log('Parse Dicom data. Strange bits per pixel = ' + bits.toString());
    }
    // data for hash code evaluate
    const patientName = image.getPatientName();
    const studyDescr = image.getImageDescription();
    const studyDate = image.getStudyDate();
    const seriesTime = image.getStudyTime();
    const seriesDescr = image.getSeriesDescription();
    const bodyPartExamined = 'NonExistInDiakonReader';
    //const hasPixels = image.hasPixelData();
    //const isComp = image.isCompressed();


    const dicomInfo = this.m_loaderDicom.m_dicomInfo;
    //const volSlice = this.m_loaderDicom.m_slicesVolume.getNewSlice();
    const volSlice = new DicomSlice();
    volSlice.m_sliceNumber = fileIndex;
    volSlice.m_sliceLocation = -1;
    volSlice.m_patientName = patientName;
    volSlice.m_studyDescr = studyDescr;
    volSlice.m_studyDate = studyDate;
    volSlice.m_seriesTime = seriesTime;
    volSlice.m_seriesDescr  = seriesDescr;
    volSlice.m_bodyPartExamined = bodyPartExamined;
    volSlice.buildHash();

    this.m_loaderDicom.m_minSlice = 0;
    this.m_loaderDicom.m_maxSlice = 0;
    this.m_loaderDicom.m_pixelSpacing.x = 0.0;
    this.m_loaderDicom.m_pixelSpacing.y = 0.0;
    this.m_loaderDicom.m_pixelSpacing.z = 0.0;
    this.m_loaderDicom.m_xDim = xDim;
    this.m_loaderDicom.m_yDim = yDim;
    if (fileIndex < this.m_loaderDicom.m_slicesVolume.m_minSlice) {
      this.m_loaderDicom.m_slicesVolume.m_minSlice = fileIndex;
    }
    if (fileIndex > this.m_loaderDicom.m_slicesVolume.m_maxSlice) {
      this.m_loaderDicom.m_slicesVolume.m_maxSlice = fileIndex;
    }
    this.m_loaderDicom.m_newTagEvent.detail.fileName = fileName;

    const sliceInfo = new DicomSliceInfo();
    const strSlice = 'Slice ' + fileIndex.toString();
    sliceInfo.m_sliceName = strSlice;
    sliceInfo.m_fileName = fileName;
    sliceInfo.m_tags = [];
    dicomInfo.m_sliceInfo.push(sliceInfo);

    const TAG_PADDING_VALUE = [0x0028, 0x0120];
    const knownTags = [
      // image dims
      daikon.Tag.TAG_ROWS, daikon.Tag.TAG_COLS, daikon.Tag.TAG_ACQUISITION_MATRIX, 
      daikon.Tag.TAG_NUMBER_OF_FRAMES, daikon.Tag.TAG_NUMBER_TEMPORAL_POSITIONS,
      // voxel dims
      daikon.Tag.TAG_PIXEL_SPACING, daikon.Tag.TAG_SLICE_THICKNESS, daikon.Tag.TAG_SLICE_GAP,
      daikon.Tag.TAG_TR, daikon.Tag.TAG_FRAME_TIME, 
      // datatype
      daikon.Tag.TAG_BITS_ALLOCATED, daikon.Tag.TAG_BITS_STORED,
      daikon.Tag.TAG_PIXEL_REPRESENTATION, daikon.Tag.TAG_HIGH_BIT, 
      daikon.Tag.TAG_PHOTOMETRIC_INTERPRETATION, daikon.Tag.TAG_SAMPLES_PER_PIXEL,
      daikon.Tag.TAG_PLANAR_CONFIG, daikon.Tag.TAG_PALETTE_RED, daikon.Tag.TAG_PALETTE_GREEN,
      daikon.Tag.TAG_PALETTE_BLUE,

      // data scale
      daikon.Tag.TAG_DATA_SCALE_SLOPE, daikon.Tag.TAG_DATA_SCALE_INTERCEPT,
      daikon.Tag.TAG_DATA_SCALE_ELSCINT, daikon.Tag.TAG_PIXEL_BANDWIDTH,

      // range
      daikon.Tag.TAG_IMAGE_MIN, daikon.Tag.TAG_IMAGE_MAX,
      daikon.Tag.TAG_WINDOW_CENTER, daikon.Tag.TAG_WINDOW_WIDTH,

      // description
      daikon.Tag.TAG_PATIENT_NAME, daikon.Tag.TAG_PATIENT_ID,
      daikon.Tag.TAG_STUDY_DATE, daikon.Tag.TAG_STUDY_TIME,
      daikon.Tag.TAG_STUDY_DES, daikon.Tag.TAG_IMAGE_TYPE,
      daikon.Tag.TAG_IMAGE_COMMENTS, daikon.Tag.TAG_SEQUENCE_NAME,
      daikon.Tag.TAG_MODALITY,

      daikon.Tag.TAG_FRAME_OF_REF_UID,
      daikon.Tag.TAG_STUDY_UID,

      // volume id
      daikon.Tag.TAG_SERIES_DESCRIPTION, daikon.Tag.TAG_SERIES_INSTANCE_UID,
      daikon.Tag.TAG_SERIES_NUMBER, daikon.Tag.TAG_ECHO_NUMBER,
      daikon.Tag.TAG_TEMPORAL_POSITION,

      // slice id
      daikon.Tag.TAG_IMAGE_NUM, daikon.Tag.TAG_SLICE_LOCATION,

      // orientation
      daikon.Tag.TAG_IMAGE_ORIENTATION, daikon.Tag.TAG_IMAGE_POSITION,
      daikon.Tag.TAG_SLICE_LOCATION_VECTOR,
      // lut shape
      daikon.Tag.TAG_LUT_SHAPE,
      // pixel padding value
      TAG_PADDING_VALUE,
    ];

    // some default values
    const TAG_PATIENT_BIRTH_DATE = [0x0010, 0x0030];
    const TAG_BODY_PART_EXAMINED = [0x0018, 0x0015];
    const TAG_INSTITUTION_NAME = [0x0008, 0x0080];
    const TAG_OPERATORS_NAME = [0x0008, 0x1070];
    const TAG_PHYSICANS_NAME = [0x0008, 0x0090];

    dicomInfo.m_patientName = image.getPatientName();
    dicomInfo.m_patientDateOfBirth = daikon.Image.getSingleValueSafely(image.getTag(TAG_PATIENT_BIRTH_DATE[0], 
      TAG_PATIENT_BIRTH_DATE[1]), 0);
    dicomInfo.m_seriesDescr = seriesDescr;

    dicomInfo.m_studyDescr = studyDescr;
    dicomInfo.m_studyDate = studyDate;
    dicomInfo.m_seriesTime = seriesTime;
    dicomInfo.m_bodyPartExamined = daikon.Image.getSingleValueSafely(image.getTag(TAG_BODY_PART_EXAMINED[0], 
      TAG_BODY_PART_EXAMINED[1]), 0);
    dicomInfo.m_institutionName = daikon.Image.getSingleValueSafely(image.getTag(TAG_INSTITUTION_NAME[0], 
      TAG_INSTITUTION_NAME[1]), 0);
    dicomInfo.m_operatorsName = daikon.Image.getSingleValueSafely(image.getTag(TAG_OPERATORS_NAME[0], 
      TAG_OPERATORS_NAME[1]), 0);
    dicomInfo.m_physicansName = daikon.Image.getSingleValueSafely(image.getTag(TAG_PHYSICANS_NAME[0], 
      TAG_PHYSICANS_NAME[1]), 0);

    // save all known tags to info array (can be displayed in app UI)
    const numKnownTags = knownTags.length;
    for (let k = 0; k < numKnownTags; k++) {
      const ind = daikon.Utils.dec2hex(knownTags[k][0]) + daikon.Utils.dec2hex(knownTags[k][1]);
      const tag = image.tags[ind];
      if (tag !== undefined) {
        const val = tag.value;
        const group = tag.group;
        const element = tag.element;

        // const sliceInfo = dicomInfo.m_sliceInfo[0];
        const tagInfo = new DicomTagInfo();
        tagInfo.m_tag = '(' + 
          LoaderDicom.numberToHexString(group) + ',' + 
          LoaderDicom.numberToHexString(element) + ')';
        const strTagName = this.m_loaderDicom.m_dictionary.getTextDesc(group, element);
        tagInfo.m_attrName = (strTagName.length > 1) ? strTagName : '';
  
        // let strVal = LoaderDicom.getAttrValueAsString(tag);
        let strVal = '';
        if (val !== null) {
          strVal = val.toString();
        }
  
        tagInfo.m_attrValue = strVal;
        sliceInfo.m_tags.push(tagInfo);
        if (NEED_DEBUG_PRINT_TAGS) {
          console.log('tag readed = ' + group.toString() + ', ' + element.toString() + ', v = ' + strVal);
        }
      } // if non null tag
    } // for k all known tags

    let ind;
    // slice location detect (to correct slices order on z)
    ind = daikon.Utils.dec2hex(daikon.Tag.TAG_SLICE_LOCATION[0]) + daikon.Utils.dec2hex(daikon.Tag.TAG_SLICE_LOCATION[1]);
    const tagSLoc = image.tags[ind];
    if (tagSLoc !== undefined) {
      let sliceLoc = tagSLoc.value[0];
      volSlice.m_sliceLocation = sliceLoc;
      this.m_sliceLocMin = (sliceLoc < this.m_sliceLocMin) ? sliceLoc : this.m_sliceLocMin;
      this.m_sliceLocMax = (sliceLoc > this.m_sliceLocMax) ? sliceLoc : this.m_sliceLocMax;
    }
    // slice number
    ind = daikon.Utils.dec2hex(daikon.Tag.TAG_IMAGE_NUM[0]) + daikon.Utils.dec2hex(daikon.Tag.TAG_IMAGE_NUM[1]);
    const tagSlNum = image.tags[ind];
    if (tagSlNum !== undefined) {
      if (tagSlNum.value !== null) {
        let sliceNumber = tagSlNum.value[0];
        volSlice.m_sliceNumber = sliceNumber;
      }
    }
    // samples per pixel
    ind = daikon.Utils.dec2hex(daikon.Tag.TAG_SAMPLES_PER_PIXEL[0]) + daikon.Utils.dec2hex(daikon.Tag.TAG_SAMPLES_PER_PIXEL[1]);
    const tagSamPerPix = image.tags[ind];
    if (tagSamPerPix !== undefined) {
      let samPerPixel = tagSamPerPix.value[0];
      this.m_loaderDicom.m_samplesPerPixel = samPerPixel;
    }

    // read pixel padding value
    ind = daikon.Utils.dec2hex(0x0028) + daikon.Utils.dec2hex(0x0120);
    const tagPPV = image.tags[ind];
    if (tagPPV !== undefined) {
      let valPad = tagPPV.value[0];
      if (valPad < 0) {
        valPad = -(valPad ^ 0xffff) - 1;
      }
      // console.log('val pad = ' + valPad);
      this.m_loaderDicom.m_padValue = valPad;
    }
    // read window center
    ind = daikon.Utils.dec2hex(daikon.Tag.TAG_WINDOW_CENTER[0]) + daikon.Utils.dec2hex(daikon.Tag.TAG_WINDOW_CENTER[1]);
    const tagWinCen = image.tags[ind];
    if (tagWinCen !== undefined) {
      this.m_loaderDicom.m_windowCenter = tagWinCen.value[0];
    }
    // read window width
    ind = daikon.Utils.dec2hex(daikon.Tag.TAG_WINDOW_WIDTH[0]) + daikon.Utils.dec2hex(daikon.Tag.TAG_WINDOW_WIDTH[1]);
    const tagWinWid = image.tags[ind];
    if (tagWinWid !== undefined) {
      this.m_loaderDicom.m_windowWidth = tagWinWid.value[0];
    }
    // read rescale intercept
    ind = daikon.Utils.dec2hex(daikon.Tag.TAG_DATA_SCALE_INTERCEPT[0]) + daikon.Utils.dec2hex(daikon.Tag.TAG_DATA_SCALE_INTERCEPT[1]);
    const tagResInt = image.tags[ind];
    if (tagResInt !== undefined) {
      this.m_loaderDicom.m_rescaleIntercept = tagResInt.value[0];
    }
    // read rescale slope
    ind = daikon.Utils.dec2hex(daikon.Tag.TAG_DATA_SCALE_SLOPE[0]) + daikon.Utils.dec2hex(daikon.Tag.TAG_DATA_SCALE_SLOPE[1]);
    const tagResSlo = image.tags[ind];
    if (tagResSlo !== undefined) {
      this.m_loaderDicom.m_rescaleSlope = tagResSlo.value[0];
    }
    // read rescale type
    const TAG_RESCALE_TYPE = [0x0028, 0x1054];
    ind = daikon.Utils.dec2hex(TAG_RESCALE_TYPE[0]) + daikon.Utils.dec2hex(TAG_RESCALE_TYPE[1]);
    const tagResTyp = image.tags[ind];
    if (tagResTyp !== undefined) {
      if ((tagResTyp.value !== null) && (tagResTyp.value[0] === 'HU')) {
        this.m_loaderDicom.m_rescaleHounsfield = true;
      }
    }

    // read pixel representation
    ind = daikon.Utils.dec2hex(daikon.Tag.TAG_PIXEL_REPRESENTATION[0]) + daikon.Utils.dec2hex(daikon.Tag.TAG_PIXEL_REPRESENTATION[1]);
    const tagPixRep = image.tags[ind];
    if (tagPixRep !== undefined) {
      if (tagPixRep.value[0] === 1) {
        this.m_loaderDicom.m_pixelRepresentaionSigned = true;
      }
    }


    // read pixel spacing on xy (physical dimensions)
    ind = daikon.Utils.dec2hex(daikon.Tag.TAG_PIXEL_SPACING[0]) + daikon.Utils.dec2hex(daikon.Tag.TAG_PIXEL_SPACING[1]);
    const tagPS = image.tags[ind];
    if (tagPS !== undefined) {
      let arrSpa = tagPS.value;
      const VAL_2 = 2;
      if (arrSpa.length === VAL_2) {
        this.m_loaderDicom.m_pixelSpacing.x = parseFloat(arrSpa[0]);
        this.m_loaderDicom.m_pixelSpacing.y = parseFloat(arrSpa[1]);
      }
    }
    // read pixel spacing on z (physical dimensions)
    ind = daikon.Utils.dec2hex(daikon.Tag.TAG_SLICE_THICKNESS[0]) + daikon.Utils.dec2hex(daikon.Tag.TAG_SLICE_THICKNESS[1]);
    const tagSLT = image.tags[ind];
    if (tagSLT !== undefined) {
      let arrThick = tagSLT.value;
      if (arrThick.length === 1) {
        this.m_loaderDicom.m_pixelSpacing.z = parseFloat(arrThick[0]);
      }
      // console.log('val pad = ' + valPad);
    }

    // get image position (x,y,z), help to detect volume physical size
    ind = daikon.Utils.dec2hex(daikon.Tag.TAG_IMAGE_POSITION[0]) + daikon.Utils.dec2hex(daikon.Tag.TAG_IMAGE_POSITION[1]);
    const tagImPos = image.tags[ind];
    if (tagImPos !== undefined) {
      const NUM_COMPONENTS_3 = 3;
      if (tagImPos.value.length === NUM_COMPONENTS_3) {
        // eslint-disable-next-line
        const xPos = tagImPos.value[0];
        // eslint-disable-next-line
        const yPos = tagImPos.value[1];
        // eslint-disable-next-line
        const zPos = tagImPos.value[2];
        this.m_loaderDicom.m_imagePosMin.x = (xPos < this.m_loaderDicom.m_imagePosMin.x) ? xPos : this.m_loaderDicom.m_imagePosMin.x;
        this.m_loaderDicom.m_imagePosMin.y = (yPos < this.m_loaderDicom.m_imagePosMin.y) ? yPos : this.m_loaderDicom.m_imagePosMin.y;
        this.m_loaderDicom.m_imagePosMin.z = (zPos < this.m_loaderDicom.m_imagePosMin.z) ? zPos : this.m_loaderDicom.m_imagePosMin.z;
        this.m_loaderDicom.m_imagePosMax.x = (xPos > this.m_loaderDicom.m_imagePosMax.x) ? xPos : this.m_loaderDicom.m_imagePosMax.x;
        this.m_loaderDicom.m_imagePosMax.y = (yPos > this.m_loaderDicom.m_imagePosMax.y) ? yPos : this.m_loaderDicom.m_imagePosMax.y;
        this.m_loaderDicom.m_imagePosMax.z = (zPos > this.m_loaderDicom.m_imagePosMax.z) ? zPos : this.m_loaderDicom.m_imagePosMax.z;
        if (NEED_DEBUG_PRINT_TAGS) {
          console.log(`TAG. image position x,y,z = ${xPos}, ${yPos}, ${zPos}`);
        } // if print
      } // if 3 components in array
    } // if tag exists

    // read transfer syntax (detect big endian)
    ind = daikon.Utils.dec2hex(daikon.Tag.TAG_TRANSFER_SYNTAX[0]) + daikon.Utils.dec2hex(daikon.Tag.TAG_TRANSFER_SYNTAX[1]);
    const tagTraSyn = image.tags[ind];
    if (tagTraSyn !== undefined) {
      let arrStrTra = tagTraSyn.value;
      if (arrStrTra[0] === "1.2.840.10008.1.2.2") {
        this.m_loaderDicom.m_littleEndian = false;
      }
      // console.log('val pad = ' + valPad);
    }

    // add volume slice to slices volume (and manage series)
    this.m_loaderDicom.m_slicesVolume.addSlice(volSlice);

    // check correct read image
    const pixels = image.getRawData();
    const numBytesPixelsRead = pixels.byteLength;
    const VAL_8 = 8;
    const numBytesPixelsExpected = xDim * yDim * Math.floor(bits / VAL_8) * this.m_loaderDicom.m_samplesPerPixel;
    if (numBytesPixelsRead !== numBytesPixelsExpected) {
      console.log('Error read Dicom via Diakon parser');
      return LoadResult.ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED;
    }

    // create pixels storage in volume
    if (this.m_loaderDicom.m_pixelRepresentaionSigned) {
      volSlice.m_image = new Int16Array(xDim * yDim);
    } else {
      volSlice.m_image = new Uint16Array(xDim * yDim);
    }

    // copy pixels (ArrayBuffer) into volSlice.m_image
    const numPixels = xDim * yDim;
    if (this.m_loaderDicom.m_samplesPerPixel === 1) {
      const pixSrc = new Uint16Array(pixels);
      for (let i = 0; i < numPixels; i++) {
        volSlice.m_image[i] = pixSrc[i];
      } // for i
    } // if 1 sample per pixel
    else if (this.m_loaderDicom.m_samplesPerPixel === 3) {
      const pixSrc = new Uint8Array(pixels);
      let j = 0;
      for (let i = 0; i < numPixels; i++, j += 3) {
        const bVal = pixSrc[j + 0];
        const gVal = pixSrc[j + 1];
        const rVal = pixSrc[j + 2];
        volSlice.m_image[i] = Math.floor( (bVal + gVal + rVal) / 3 );
      } // for i
    } // if samples per pixel is 3
    // store x, y dims
    volSlice.m_xDim = xDim;
    volSlice.m_yDim = yDim;
    return LoadResult.SUCCESS;
  } // end load single slice
  //
  // read 1 slice during reading multiple dcm files
  //
  readSlice(loader, fileIndex, fileName, strContent) {
    this.m_loaderDicom = loader;
    const ret = this.loadSingleSlice(fileIndex, fileName, strContent);
    return ret;
  }
  // read 1 slice
  readSingleSlice(store, loader, fileIndex, fileName, strContent) {
    this.m_loaderDicom = loader;
    let ret;
    if (!READ_DICOMDIR) {
      ret = this.loadSingleSlice(fileIndex, fileName, strContent);
    } else {
      ret = this.loadDicomfir(fileName, strContent);
    }
    if (ret !== LoadResult.SUCCESS) {
      return ret;
    }
    
    // save dicomInfo to store
    const dicomInfo = this.m_loaderDicom.m_dicomInfo;
    store.dispatch({ type: StoreActionType.SET_DICOM_INFO, dicomInfo: dicomInfo });
    // save dicom loader to store
    store.dispatch({ type: StoreActionType.SET_LOADER_DICOM, loaderDicom: this.m_loaderDicom });
    return ret;
  }

}


export default LoaderDcmDaikon;

