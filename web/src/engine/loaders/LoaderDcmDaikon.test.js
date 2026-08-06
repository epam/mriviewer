/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

// ********************************************************
// Imports
// ********************************************************

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import LoaderDcmDaikon from './LoaderDcmDaikon';
import LoaderDicom from './LoaderDicom';
import LoadResult from '../LoadResult';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));

// Resolve a precompressed DICOM fixture. Prefer the co-located, git-excluded
// __fixtures__ copy; fall back to daikon's bundled test data (always present
// after `npm install`) so the committed test runs on a fresh checkout.
const readFixtureBuffer = (fileName) => {
  const local = resolve(THIS_DIR, '__fixtures__', fileName);
  const vendored = resolve(THIS_DIR, '../../../node_modules/daikon/tests/data', fileName);
  const path = existsSync(local) ? local : vendored;
  const buf = readFileSync(path);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
};

// ********************************************************
// Helpers
// ********************************************************

const TRANSFER_SYNTAX_EXPLICIT_LITTLE = '1.2.840.10008.1.2.1';
const TRANSFER_SYNTAX_COMPRESSION_RLE = '1.2.840.10008.1.2.5';

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

// Encode a byte array as a DICOM RLE segment using literal runs only.
const rleEncodeLiteralSegment = (bytes) => {
  const out = [];
  let i = 0;
  const MAX_RUN = 128;
  while (i < bytes.length) {
    const n = Math.min(MAX_RUN, bytes.length - i);
    out.push(n - 1);
    for (let k = 0; k < n; k++) {
      out.push(bytes[i + k] & 0xff);
    }
    i += n;
  }
  return out;
};

// Build a single-frame DICOM RLE fragment (64-byte header + segments).
const buildRleFragment = (pixels, bitsAllocated, samplesPerPixel) => {
  const segments = [];
  if (samplesPerPixel === 3) {
    for (let c = 0; c < 3; c++) {
      const plane = [];
      for (let i = 0; i < pixels.length / 3; i++) {
        plane.push(pixels[i * 3 + c] & 0xff);
      }
      segments.push(plane);
    }
  } else if (bitsAllocated === 16) {
    const high = [];
    const low = [];
    for (let i = 0; i < pixels.length; i++) {
      high.push((pixels[i] >> 8) & 0xff);
      low.push(pixels[i] & 0xff);
    }
    segments.push(high);
    segments.push(low);
  } else {
    segments.push(pixels.map((v) => v & 0xff));
  }

  const numSegments = segments.length;
  const HEADER_SIZE = 64;
  const encodedSegments = segments.map((s) => rleEncodeLiteralSegment(s));

  const offsets = [];
  let running = HEADER_SIZE;
  for (let s = 0; s < numSegments; s++) {
    offsets.push(running);
    running += encodedSegments[s].length;
  }

  const header = new Uint8Array(HEADER_SIZE);
  const hv = new DataView(header.buffer);
  hv.setUint32(0, numSegments, true);
  for (let s = 0; s < numSegments; s++) {
    hv.setUint32(4 + s * 4, offsets[s], true);
  }

  const parts = [header];
  for (let s = 0; s < numSegments; s++) {
    parts.push(Uint8Array.from(encodedSegments[s]));
  }
  let fragment = concatBytes(parts);
  if (fragment.length % 2 !== 0) {
    fragment = concatBytes([fragment, new Uint8Array([0])]);
  }
  return fragment;
};

// group,element,length(u32),value — encapsulation item (FFFE,E000 / E0DD)
const encapItem = (group, element, valueBytes) => {
  const head = new Uint8Array(8);
  const dv = new DataView(head.buffer);
  dv.setUint16(0, group, true);
  dv.setUint16(2, element, true);
  dv.setUint32(4, valueBytes ? valueBytes.length >>> 0 : 0, true);
  return valueBytes ? concatBytes([head, valueBytes]) : head;
};

//
// Synthesize a minimal RLE-encapsulated explicit-VR little-endian DICOM buffer.
//
const buildRleDicomBuffer = ({
  rows,
  cols,
  bitsAllocated = 16,
  samplesPerPixel = 1,
  pixelRepresentation = 0,
  photometric = samplesPerPixel === 3 ? 'RGB' : 'MONOCHROME2',
  pixels,
}) => {
  const preamble = new Uint8Array(128);
  const dicm = new Uint8Array([0x44, 0x49, 0x43, 0x4d]);

  const tsBytes = uiBytes(TRANSFER_SYNTAX_COMPRESSION_RLE);
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

  const fragment = buildRleFragment(pixels, bitsAllocated, samplesPerPixel);

  // Pixel Data (7FE0,0010) OB, undefined length (encapsulated)
  const pdHead = new Uint8Array(12);
  const pdv = new DataView(pdHead.buffer);
  pdv.setUint16(0, 0x7fe0, true);
  pdv.setUint16(2, 0x0010, true);
  pdHead[4] = 'O'.charCodeAt(0);
  pdHead[5] = 'B'.charCodeAt(0);
  pdv.setUint32(8, 0xffffffff, true);

  const offsetTableItem = encapItem(0xfffe, 0xe000, null);
  const fragmentItem = encapItem(0xfffe, 0xe000, fragment);
  const seqDelim = encapItem(0xfffe, 0xe0dd, null);

  const all = concatBytes([preamble, dicm, metaLenTag, metaTs, ...dataset, pdHead, offsetTableItem, fragmentItem, seqDelim]);
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

describe('LoaderDcmDaikon RLE-compressed', () => {
  it('loads a minimal RLE-encapsulated 16-bit grayscale DICOM slice', () => {
    const COLS = 4;
    const ROWS = 3;
    const pixels = [];
    for (let i = 0; i < ROWS * COLS; i++) {
      pixels.push((i * 257) & 0x0fff);
    }
    const arrBuf = buildRleDicomBuffer({ rows: ROWS, cols: COLS, pixels });

    const loader = new LoaderDicom(1);
    const daikonLoader = new LoaderDcmDaikon();
    const ret = daikonLoader.readSlice(loader, 0, 'rle.dcm', arrBuf);

    expect(ret).toBe(LoadResult.SUCCESS);
    expect(loader.m_xDim).toBe(COLS);
    expect(loader.m_yDim).toBe(ROWS);

    const series = loader.m_slicesVolume.getSeries();
    expect(series.length).toBe(1);
    const slices = series[0].m_slices;
    expect(slices.length).toBe(1);
    const slice = slices[0];
    expect(slice.m_image).not.toBeNull();
    expect(slice.m_image.length).toBe(ROWS * COLS);
    let nonZero = 0;
    for (let i = 0; i < ROWS * COLS; i++) {
      expect(slice.m_image[i]).toBe(pixels[i]);
      if (slice.m_image[i] !== 0) {
        nonZero++;
      }
    }
    expect(nonZero).toBeGreaterThan(0);
  });

  it('fails gracefully (no crash) on a truncated/garbage compressed buffer', () => {
    const COLS = 4;
    const ROWS = 3;
    const pixels = [];
    for (let i = 0; i < ROWS * COLS; i++) {
      pixels.push((i * 257) & 0x0fff);
    }
    const arrBuf = buildRleDicomBuffer({ rows: ROWS, cols: COLS, pixels });
    // truncate the buffer mid-fragment to corrupt the encapsulated pixel data
    const truncated = arrBuf.slice(0, arrBuf.byteLength - 30);

    const loader = new LoaderDicom(1);
    const daikonLoader = new LoaderDcmDaikon();
    let ret;
    expect(() => {
      ret = daikonLoader.readSlice(loader, 0, 'bad.dcm', truncated);
    }).not.toThrow();
    expect(ret).toBe(LoadResult.ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED);
  });
});

describe('LoaderDcmDaikon size check and sample validation', () => {
  const readSlice = (arrBuf, name) => {
    const loader = new LoaderDicom(1);
    const daikonLoader = new LoaderDcmDaikon();
    const ret = daikonLoader.readSlice(loader, 0, name, arrBuf);
    return { loader, ret };
  };

  it('accepts a decompressed buffer larger than the naive expectation', () => {
    const COLS = 4;
    const ROWS = 3;
    const numPixels = ROWS * COLS;
    const pixels = [];
    for (let i = 0; i < numPixels + 8; i++) {
      pixels.push((i * 17 + 1) & 0xff);
    }
    const arrBuf = buildDicomBuffer({ rows: ROWS, cols: COLS, bitsAllocated: 8, pixels });

    const { loader, ret } = readSlice(arrBuf, 'oversize.dcm');
    expect(ret).toBe(LoadResult.SUCCESS);

    const slice = loader.m_slicesVolume.getSeries()[0].m_slices[0];
    expect(slice.m_image.length).toBe(numPixels);
    for (let i = 0; i < numPixels; i++) {
      expect(slice.m_image[i]).toBe(pixels[i]);
    }
  });

  it('rejects a buffer smaller than one plane with ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED', () => {
    const COLS = 4;
    const ROWS = 3;
    const pixels = [];
    for (let i = 0; i < 4; i++) {
      pixels.push((i * 9 + 1) & 0xff);
    }
    const arrBuf = buildDicomBuffer({ rows: ROWS, cols: COLS, bitsAllocated: 8, pixels });

    const { ret } = readSlice(arrBuf, 'undersize.dcm');
    expect(ret).toBe(LoadResult.ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED);
  });

  it('rejects an unsupported samples-per-pixel count', () => {
    const COLS = 4;
    const ROWS = 3;
    const numPixels = ROWS * COLS;
    const pixels = [];
    for (let i = 0; i < numPixels * 2; i++) {
      pixels.push((i * 7 + 1) & 0xff);
    }
    const arrBuf = buildDicomBuffer({
      rows: ROWS,
      cols: COLS,
      bitsAllocated: 8,
      samplesPerPixel: 2,
      photometric: 'MONOCHROME2',
      pixels,
    });

    const { ret } = readSlice(arrBuf, 'spp2.dcm');
    expect(ret).toBe(LoadResult.ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED);
  });
});

describe('LoaderDcmDaikon pixel copy (bits/samples/planar)', () => {
  const readSlice = (arrBuf, name) => {
    const loader = new LoaderDicom(1);
    const daikonLoader = new LoaderDcmDaikon();
    const ret = daikonLoader.readSlice(loader, 0, name, arrBuf);
    return { loader, ret };
  };

  const firstSlice = (loader) => {
    const series = loader.m_slicesVolume.getSeries();
    return series[0].m_slices[0];
  };

  it('loads a minimal uncompressed 8-bit grayscale DICOM slice', () => {
    const COLS = 4;
    const ROWS = 3;
    const pixels = [];
    for (let i = 0; i < ROWS * COLS; i++) {
      pixels.push((i * 17) & 0xff);
    }
    const arrBuf = buildDicomBuffer({ rows: ROWS, cols: COLS, bitsAllocated: 8, pixels });

    const { loader, ret } = readSlice(arrBuf, 'g8.dcm');
    expect(ret).toBe(LoadResult.SUCCESS);

    const slice = firstSlice(loader);
    expect(slice.m_image.length).toBe(ROWS * COLS);
    for (let i = 0; i < ROWS * COLS; i++) {
      expect(slice.m_image[i]).toBe(pixels[i]);
    }
  });

  it('loads a minimal RLE 8-bit grayscale DICOM slice', () => {
    const COLS = 4;
    const ROWS = 3;
    const pixels = [];
    for (let i = 0; i < ROWS * COLS; i++) {
      pixels.push((i * 23 + 5) & 0xff);
    }
    const arrBuf = buildRleDicomBuffer({ rows: ROWS, cols: COLS, bitsAllocated: 8, pixels });

    const { loader, ret } = readSlice(arrBuf, 'g8rle.dcm');
    expect(ret).toBe(LoadResult.SUCCESS);

    const slice = firstSlice(loader);
    expect(slice.m_image.length).toBe(ROWS * COLS);
    for (let i = 0; i < ROWS * COLS; i++) {
      expect(slice.m_image[i]).toBe(pixels[i]);
    }
  });

  it('loads a minimal uncompressed 8-bit RGB DICOM slice (averaged to grayscale)', () => {
    const COLS = 4;
    const ROWS = 3;
    const numPixels = ROWS * COLS;
    const pixels = [];
    for (let i = 0; i < numPixels; i++) {
      pixels.push((i * 7) & 0xff);
      pixels.push((i * 13 + 3) & 0xff);
      pixels.push((i * 5 + 9) & 0xff);
    }
    const arrBuf = buildDicomBuffer({ rows: ROWS, cols: COLS, bitsAllocated: 8, samplesPerPixel: 3, pixels });

    const { loader, ret } = readSlice(arrBuf, 'rgb8.dcm');
    expect(ret).toBe(LoadResult.SUCCESS);

    const slice = firstSlice(loader);
    expect(slice.m_image.length).toBe(numPixels);
    for (let i = 0; i < numPixels; i++) {
      const r = pixels[i * 3 + 0];
      const g = pixels[i * 3 + 1];
      const b = pixels[i * 3 + 2];
      expect(slice.m_image[i]).toBe(Math.floor((r + g + b) / 3));
    }
  });

  it('loads a minimal RLE 8-bit RGB DICOM slice (averaged to grayscale)', () => {
    const COLS = 4;
    const ROWS = 3;
    const numPixels = ROWS * COLS;
    const pixels = [];
    for (let i = 0; i < numPixels; i++) {
      pixels.push((i * 11) & 0xff);
      pixels.push((i * 3 + 7) & 0xff);
      pixels.push((i * 19 + 1) & 0xff);
    }
    const arrBuf = buildRleDicomBuffer({ rows: ROWS, cols: COLS, bitsAllocated: 8, samplesPerPixel: 3, pixels });

    const { loader, ret } = readSlice(arrBuf, 'rgb8rle.dcm');
    expect(ret).toBe(LoadResult.SUCCESS);

    const slice = firstSlice(loader);
    expect(slice.m_image.length).toBe(numPixels);
    let nonZero = 0;
    for (let i = 0; i < numPixels; i++) {
      const r = pixels[i * 3 + 0];
      const g = pixels[i * 3 + 1];
      const b = pixels[i * 3 + 2];
      expect(slice.m_image[i]).toBe(Math.floor((r + g + b) / 3));
      if (slice.m_image[i] !== 0) {
        nonZero++;
      }
    }
    expect(nonZero).toBeGreaterThan(0);
  });

  it('loads a minimal uncompressed 16-bit RGB DICOM slice (averaged to grayscale)', () => {
    const COLS = 4;
    const ROWS = 3;
    const numPixels = ROWS * COLS;
    const pixels = [];
    for (let i = 0; i < numPixels; i++) {
      pixels.push((i * 257) & 0xffff);
      pixels.push((i * 613 + 3) & 0xffff);
      pixels.push((i * 331 + 9) & 0xffff);
    }
    const arrBuf = buildDicomBuffer({ rows: ROWS, cols: COLS, bitsAllocated: 16, samplesPerPixel: 3, pixels });

    const { loader, ret } = readSlice(arrBuf, 'rgb16.dcm');
    expect(ret).toBe(LoadResult.SUCCESS);

    const slice = firstSlice(loader);
    expect(slice.m_image.length).toBe(numPixels);
    for (let i = 0; i < numPixels; i++) {
      const r = pixels[i * 3 + 0];
      const g = pixels[i * 3 + 1];
      const b = pixels[i * 3 + 2];
      expect(slice.m_image[i]).toBe(Math.floor((r + g + b) / 3));
    }
  });

  it('keeps the uncompressed 16-bit grayscale path byte-for-byte identical', () => {
    const COLS = 5;
    const ROWS = 4;
    const pixels = [];
    for (let i = 0; i < ROWS * COLS; i++) {
      pixels.push((i * 619) & 0xffff);
    }
    const arrBuf = buildDicomBuffer({ rows: ROWS, cols: COLS, bitsAllocated: 16, pixels });

    const { loader, ret } = readSlice(arrBuf, 'g16.dcm');
    expect(ret).toBe(LoadResult.SUCCESS);

    const slice = firstSlice(loader);
    expect(slice.m_image.length).toBe(ROWS * COLS);
    for (let i = 0; i < ROWS * COLS; i++) {
      expect(slice.m_image[i]).toBe(pixels[i]);
    }
  });
});

describe('LoaderDcmDaikon JPEG / JPEG 2000 real fixtures', () => {
  const loadFixture = (fileName) => {
    const arrBuf = readFixtureBuffer(fileName);
    const loader = new LoaderDicom(1);
    const daikonLoader = new LoaderDcmDaikon();
    const ret = daikonLoader.readSlice(loader, 0, fileName, arrBuf);
    return { loader, ret };
  };

  const expectPlausibleSlice = (loader) => {
    const series = loader.m_slicesVolume.getSeries();
    expect(series.length).toBe(1);
    const slice = series[0].m_slices[0];
    expect(slice.m_image).not.toBeNull();
    expect(slice.m_xDim).toBeGreaterThan(0);
    expect(slice.m_yDim).toBeGreaterThan(0);
    expect(slice.m_image.length).toBe(slice.m_xDim * slice.m_yDim);
    let nonZero = 0;
    for (let i = 0; i < slice.m_image.length; i++) {
      if (slice.m_image[i] !== 0) {
        nonZero++;
      }
    }
    expect(nonZero).toBeGreaterThan(0);
  };

  it('loads a JPEG Lossless (SEL1) compressed DICOM slice', () => {
    const { loader, ret } = loadFixture('jpeg_lossless_sel1.dcm');
    expect(ret).toBe(LoadResult.SUCCESS);
    expectPlausibleSlice(loader);
  });

  it('loads a JPEG 2000 compressed DICOM slice', () => {
    const { loader, ret } = loadFixture('jpeg_2000.dcm');
    expect(ret).toBe(LoadResult.SUCCESS);
    expectPlausibleSlice(loader);
  });
});

export { buildDicomBuffer, buildRleDicomBuffer };
