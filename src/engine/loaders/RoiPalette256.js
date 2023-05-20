/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import { getPalette } from './RoiPaletteItems';

export const getPalette256 = () => {
  const palette = getPalette();

  const PAL_SIZE = 256;
  const MAX_PAL_COLOR = 255.0;
  const BYTES_PER_COLOR = 4;
  const OFFS_0 = 0;
  const OFFS_1 = 1;
  const OFFS_2 = 2;
  const OFFS_3 = 3;
  let palette256 = new Uint8Array(PAL_SIZE * BYTES_PER_COLOR);
  let i;
  // init palette with black colors
  for (i = 0; i < PAL_SIZE * BYTES_PER_COLOR; i++) {
    palette256[i] = 0;
  }
  // load colors
  const numPalColors = palette.length;
  for (i = 0; i < numPalColors; i++) {
    const strIndexPalette = palette[i].roiId;
    const strColor = palette[i].roiColor;
    const arrColor = strColor.split(' ');
    const rCol = Math.floor(parseFloat(arrColor[OFFS_0]) * MAX_PAL_COLOR);
    const gCol = Math.floor(parseFloat(arrColor[OFFS_1]) * MAX_PAL_COLOR);
    const bCol = Math.floor(parseFloat(arrColor[OFFS_2]) * MAX_PAL_COLOR);
    const aCol = 255;
    const ind = parseInt(strIndexPalette, 10) * BYTES_PER_COLOR;
    palette256[ind + OFFS_0] = rCol;
    palette256[ind + OFFS_1] = gCol;
    palette256[ind + OFFS_2] = bCol;
    palette256[ind + OFFS_3] = aCol;
  }
  return palette256;
};
