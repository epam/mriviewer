/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

const UiDemoMenu = props => {
  const iconsSet = [
    {
      title: 'Lungs 20101108 from ktx',
      image: 'images/thumb_lungs.png',
      alt: 'lungs',
    },
    {
      title: 'Brain set from ktx',
      image: 'images/thumb_brain.png',
      alt: 'lungs',
    },
    {
      title: 'Grandmother (gm3) from nifti',
      image: 'images/thumb_gm3_512_512_165.png',
      alt: 'gm3',
    },
    {
      title: 'Woman pelvis from dicom',
      image: 'images/thumb_woman_pelvis.png',
      alt: 'woman_pelvis',
    },
    {
      title: 'Lungs 00cba...957e from dicom',
      image: 'images/thumb_ocb.png',
      alt: 'lungs_ocb',
    },
    {
      title: 'CT 256^3 from ktx',
      image: 'images/thumb_ct_256.png',
      alt: 'ct_256',
    },
    {
      title: 'Lungs 256^3 from ktx',
      image: 'images/thumb_lungs_256.png',
      alt: 'lungs_256',
    },
    {
      title: 'Brain with ROI (colored) from Hdr+Img',
      image: 'images/thumb_set.png',
      alt: 'hdr_set_roi',
    },
  ];
  
  return <dialog open>
    <h3>Load demo data</h3>
    {iconsSet.map(({ title, image, alt }) => {
      
      return <div onClick={props.onDemo}>
        <h3>{title}</h3>
        <img src={image} alt={alt} title={title}/>
      </div>
    })}
  </dialog>;
}

export default UiDemoMenu;
