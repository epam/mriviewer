/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

const config = {
  // special demo dialog file locations

  demoUrls: [
    'https://daentjnvnffrh.cloudfront.net/demo/01_lungs/20101108.ktx',
    'https://daentjnvnffrh.cloudfront.net/demo/02_brain_set/brain256.ktx',
    'https://daentjnvnffrh.cloudfront.net/demo/03_grandmother_gm3/gm3_512_512_165.nii',
    'https://daentjnvnffrh.cloudfront.net/demo/04_woman_pelvis/file_list.txt',
    'https://daentjnvnffrh.cloudfront.net/demo/05_lungs_00cba/file_list.txt',
    'https://daentjnvnffrh.cloudfront.net/demo/06_ct_256/ct_256_256_256.ktx',
    'https://daentjnvnffrh.cloudfront.net/demo/07_lungs_256/lungs_256_256_256.ktx',
    'https://daentjnvnffrh.cloudfront.net/demo/08_brain_with_roi/set_intn.hdr',
  ],

  googleCloudDemoActivce: false,
  arrMenuGoogle: [
    {
      text: 'Demo lungs AA',
      tooltip: 'Load some lungs model',
    },
    {
      text: 'Demo head BB',
      tooltip: 'Load some strange head',
    },
    {
      text: 'Demo alien CC',
      tooltip: 'Write here smth please',
    },
  ],
  demoWomanPelvisPrefix: '',
  demoWomanPelvisUrls: [],
  demoLungsPrefix: '',
  demoLungsUrls: [],
};

export default config;
