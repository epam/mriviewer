/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

/**
* Loading result codes
* @module lib/scripts/loaders/loadresult
*/

// ******************************************************************
// imports
// ******************************************************************

/** Class LoadResult to report loading status of binary files  (Ktx, Dicom, Nifti)*/
export default class LoadResult {
  static getResultString(errorCode) {
    switch (errorCode) {
      case LoadResult.SUCCESS:
        return 'Success';
      case LoadResult.BAD_HEADER:
        return 'Bad header';
      case LoadResult.UNSUPPORTED_ENDIANNESS:
        return 'Unsupported endianness';
      case LoadResult.UNSUPPORTED_COLOR_FORMAT:
        return 'Unsupported color format';
      case LoadResult.WRONG_HEADER_DATA_SIZE:
        return 'Wrong header data size';
      case LoadResult.WRONG_HEADER_DIMENSIONS:
        return 'Wrong header dimensions';
      case LoadResult.WRONG_HEADER_DATA_TYPE:
        return 'Wrong header data type';
      case LoadResult.WRONG_HEADER_BITS_PER_PIXEL:
        return 'Wrong header bits per pixel';
      case LoadResult.WRONG_HEADER_MAGIC:
        return 'Wrong header magic';
      case LoadResult.ERROR_PROCESS_HISTOGRAM:
        return 'Wrong histogram';
      case LoadResult.WRONG_IMAGE_DIM_X:
        return 'Wrong image dim x';
      case LoadResult.WRONG_IMAGE_DIM_Y:
        return 'Wrong image dim y';
      case LoadResult.ERROR_PIXELS_TAG_NOT_FOUND:
        return 'Pixels tag is not found';
      case LoadResult.ERROR_NO_MEMORY:
        return 'No memory during loading';
      case LoadResult.ERROR_CANT_OPEN_URL:
        return 'Cant open file via url';
      case LoadResult.ERROR_WRONG_NUM_SLICES:
        return 'Wrong number of slices';
      case LoadResult.ERROR_HISTOGRAM_DETECT_RIDGES:
        return 'Error detect histogram ridges';
      case LoadResult.ERROR_SCALING:
        return 'Error scaling 16 bit data into 8 bit';
      case LoadResult.ERROR_INVALID_SLICE_INDEX:
        return 'Invalid slice index. Possible reason: incomplete dicom folder';
      default:
        return 'Unknown error code';
    } // switch
  }  // getResultString
} // class LoadResult

LoadResult.SUCCESS = 1;
LoadResult.BAD_HEADER = 2;
LoadResult.UNSUPPORTED_ENDIANNESS = 3;
LoadResult.UNSUPPORTED_COLOR_FORMAT = 4;
LoadResult.WRONG_HEADER_DATA_SIZE = 5;
LoadResult.WRONG_HEADER_DIMENSIONS = 6;
LoadResult.WRONG_HEADER_DATA_TYPE = 7;
LoadResult.WRONG_HEADER_BITS_PER_PIXEL = 8;
LoadResult.WRONG_HEADER_MAGIC = 9;
LoadResult.ERROR_PROCESS_HISTOGRAM = 10;
LoadResult.WRONG_IMAGE_DIM_X = 11;
LoadResult.WRONG_IMAGE_DIM_Y = 12;
LoadResult.ERROR_PIXELS_TAG_NOT_FOUND = 13;
LoadResult.ERROR_NO_MEMORY = 14;
LoadResult.ERROR_CANT_OPEN_URL = 15;
LoadResult.ERROR_WRONG_NUM_SLICES = 16;
LoadResult.ERROR_HISTOGRAM_DETECT_RIDGES = 17;
LoadResult.ERROR_SCALING = 18;
LoadResult.ERROR_INVALID_SLICE_INDEX = 19;
