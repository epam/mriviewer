/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

// ********************************************************
// Imports
// ********************************************************

import VolumeSet from './VolumeSet';
import Volume from './Volume';

// ********************************************************
// Tests
// ********************************************************

describe('VolumeSetTests', () => {
  //
  it('testCreateSingleVolume', () => {
    const volumeSet = new VolumeSet();
    const volume = new Volume();
    volume.createEmptyBytesVolume(16, 16, 16);
    volumeSet.addVolume(volume);
    const numVols = volumeSet.getNumVolumes();
    expect(numVols == 1).toBeTruthy();
    const volNeg = volumeSet.getVolume(-1);
    expect(volNeg == null).toBeTruthy();
    const volBadRange = volumeSet.getVolume(1);
    expect(volBadRange == null).toBeTruthy();
    const volFrom = volumeSet.getVolume(0);
    expect(volFrom == volume).toBeTruthy();
  });
  //
  it('testCreateTwoVolumes', () => {});
});
