/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

// ********************************************************
// Imports
// ********************************************************

import LoaderDcmDaikon from './LoaderDcmDaikon';
import LoaderDicom from './LoaderDicom';
import LoadResult from '../LoadResult';

// ********************************************************
// Helpers
// ********************************************************

const TRANSFER_SYNTAX_EXPLICIT_LITTLE = '1.2.840.10008.1.2.1';

const concatBytes = (arrays) => {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(total);
  let offs = 0;
  for (const a of arrays) {
    out.set(a, offs);
    offs += a.length;
  }
  return out;
};

const asciiEven = (str, pad) => {
  const raw = [];
  for (let i = 0; i < str.length; i++) {
    raw.push(str.charCodeAt(i) & 0xff);
  }
  if (raw.length % 2 !== 0) {
    raw.push(pad);
  }
  return new Uint8Array(raw);
};

const uiBytes = (str) => asciiEven(str, 0x00);
const csBytes = (str) => asciiEven(str, 0x20);

const usBytes = (val) => {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, val & 0xffff, true);
  return b;
};

const ulBytes = (val) => {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, val >>> 0, true);
  return b;
};

// explicit-VR short form: group,element,VR,length(u16),value
const elementShort = (group, element, vr, valueBytes) => {
  const head = new Uint8Array(8);
  const dv = new DataView(head.buffer);
  dv.setUint16(0, group, true);
  dv.setUint16(2, element, true);
  head[4] = vr.charCodeAt(0);
  head[5] = vr.charCodeAt(1);
  dv.setUint16(6, valueBytes.length, true);
  return concatBytes([head, valueBytes]);
};

// explicit-VR long form (OB/OW/...): group,element,VR,reserved(2),length(u32),value
const elementLong = (group, element, vr, valueBytes) => {
  const head = new Uint8Array(12);
  const dv = new DataView(head.buffer);
  dv.setUint16(0, group, true);
  dv.setUint16(2, element, true);
  head[4] = vr.charCodeAt(0);
  head[5] = vr.charCodeAt(1);
  // reserved 2 bytes stay 0
  dv.setUint32(8, valueBytes.length >>> 0, true);
  return concatBytes([head, valueBytes]);
};

const pixelBytes = (pixels, bitsAllocated) => {
  if (bitsAllocated === 8) {
    return Uint8Array.from(pixels, (v) => v & 0xff);
  }
  const b = new Uint8Array(pixels.length * 2);
  const dv = new DataView(b.buffer);
  for (let i = 0; i < pixels.length; i++) {
    dv.setUint16(i * 2, pixels[i] & 0xffff, true);
  }
  return b;
};

//
// Synthesize a minimal explicit-VR little-endian DICOM buffer.
// pixels: flat array of sample values (rows*cols for grayscale,
// rows*cols*3 interleaved for RGB).
//
const buildDicomBuffer = ({
  rows,
  cols,
  bitsAllocated = 16,
  samplesPerPixel = 1,
  pixelRepresentation = 0,
  photometric = samplesPerPixel === 3 ? 'RGB' : 'MONOCHROME2',
  transferSyntax = TRANSFER_SYNTAX_EXPLICIT_LITTLE,
  pixels,
}) => {
  const preamble = new Uint8Array(128);
  const dicm = new Uint8Array([0x44, 0x49, 0x43, 0x4d]);

  const tsBytes = uiBytes(transferSyntax);
  const metaTs = elementShort(0x0002, 0x0010, 'UI', tsBytes);
  const metaLenTag = elementShort(0x0002, 0x0000, 'UL', ulBytes(metaTs.length));

  const highBit = bitsAllocated - 1;
  const dataset = [
    elementShort(0x0028, 0x0002, 'US', usBytes(samplesPerPixel)),
    elementShort(0x0028, 0x0004, 'CS', csBytes(photometric)),
    elementShort(0x0028, 0x0010, 'US', usBytes(rows)),
    elementShort(0x0028, 0x0011, 'US', usBytes(cols)),
    elementShort(0x0028, 0x0100, 'US', usBytes(bitsAllocated)),
    elementShort(0x0028, 0x0101, 'US', usBytes(bitsAllocated)),
    elementShort(0x0028, 0x0102, 'US', usBytes(highBit)),
    elementShort(0x0028, 0x0103, 'US', usBytes(pixelRepresentation)),
  ];

  const pxVr = bitsAllocated === 8 ? 'OB' : 'OW';
  const pixelData = elementLong(0x7fe0, 0x0010, pxVr, pixelBytes(pixels, bitsAllocated));

  const all = concatBytes([preamble, dicm, metaLenTag, metaTs, ...dataset, pixelData]);
  return all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength);
};

// ********************************************************
// Tests
// ********************************************************

describe('LoaderDcmDaikon uncompressed baseline', () => {
  it('loads a minimal uncompressed 16-bit grayscale DICOM slice', () => {
    const COLS = 4;
    const ROWS = 3;
    const pixels = [];
    for (let i = 0; i < ROWS * COLS; i++) {
      pixels.push((i * 111) & 0x0fff);
    }
    const arrBuf = buildDicomBuffer({ rows: ROWS, cols: COLS, pixels });

    const loader = new LoaderDicom(1);
    const daikonLoader = new LoaderDcmDaikon();
    const ret = daikonLoader.readSlice(loader, 0, 'x.dcm', arrBuf);

    expect(ret).toBe(LoadResult.SUCCESS);
    expect(loader.m_xDim).toBe(COLS);
    expect(loader.m_yDim).toBe(ROWS);

    const series = loader.m_slicesVolume.getSeries();
    expect(series.length).toBe(1);
    const slices = series[0].m_slices;
    expect(slices.length).toBe(1);
    const slice = slices[0];
    expect(slice.m_xDim).toBe(COLS);
    expect(slice.m_yDim).toBe(ROWS);
    expect(slice.m_image).not.toBeNull();
    expect(slice.m_image.length).toBe(ROWS * COLS);
    for (let i = 0; i < ROWS * COLS; i++) {
      expect(slice.m_image[i]).toBe(pixels[i]);
    }
  });
});

export { buildDicomBuffer };
