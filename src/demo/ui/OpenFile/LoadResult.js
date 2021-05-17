/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

export default class LoadResult {
  static getResultString(errorCode) {
    switch (errorCode) {
    case LoadResult.SUCCESS:
      return 'Success';
    default:
      return 'Unknown error code';
    }
  }
}

LoadResult.SUCCESS = 0;
