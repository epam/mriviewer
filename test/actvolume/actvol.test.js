/**
* ActiveVolume. Tests
*/

import { expect, assert } from 'chai';
import ActiveVolume from '../../lib/scripts/actvolume/actvol';

function volumeAddSphere(xDim, yDim, zDim, pixels,
  xCenterRatio, yCenterRatio, zCenterRatio, radiusRatio) {
  const xc = Math.floor(xDim * xCenterRatio);
  const yc = Math.floor(yDim * yCenterRatio);
  const zc = Math.floor(zDim * zCenterRatio);
  let minDim = (xDim < yDim) ? xDim : yDim;
  minDim = (zDim < minDim) ? zDim : minDim;
  const rad = Math.floor(minDim * radiusRatio);
  const radSquared = rad * rad;
  let off = 0;
  for (let z = 0; z < zDim; z++) {
    for (let y = 0; y < yDim; y++) {
      for (let x = 0; x < xDim; x++) {
        const dz = z - zc;
        const dy = y - yc;
        const dx = x - xc;
        const rad2 = dx * dx + dy * dy + dz * dz;
        if (rad2 <= radSquared) {
          pixels[off] = 255;
        }
        off++;
      } // for (x)
    } // for (y)
  } // for (z)
}

function extractSlice(xDim, yDim, zDim, pixelsSrc, zIndex, pixelsDst) {
  const zOff = zIndex * xDim * yDim;
  const numPixels = xDim * yDim;
  for (let i = 0; i < numPixels; i++) {
    pixelsDst[i] = pixelsSrc[zOff + i];
  }
}

function saveBitmap(pixelsSrc, xDim, yDim) {
  const SIZE_HEADER = 14;
  const SIZE_INFO = 40;
  const COMPS_IN_COLOR = 3;
  const numPixels = xDim * yDim;
  let pixStride = COMPS_IN_COLOR  * xDim;
  pixStride = (pixStride + COMPS_IN_COLOR) & (~COMPS_IN_COLOR);
  const totalBufSize = SIZE_HEADER + SIZE_INFO + (numPixels * COMPS_IN_COLOR);
  const buf = new Uint8Array(totalBufSize);
  for (let j = 0; j < totalBufSize; j++) {
    buf[j] = 0;
  }
  const BYTE_MASK = 255;
  const BITS_IN_BYTE = 8;
  // write header
  const BYTES_IN_DWORD = 4;

  let i = 0;
  // bfType[16]
  buf[i++] = 0x42;
  buf[i++] = 0x4D;
  // bfSize[32]
  let bfSize = SIZE_HEADER + SIZE_INFO + pixStride * yDim;
  buf[i++] = bfSize & BYTE_MASK; bfSize >>= BITS_IN_BYTE;
  buf[i++] = bfSize & BYTE_MASK; bfSize >>= BITS_IN_BYTE;
  buf[i++] = bfSize & BYTE_MASK; bfSize >>= BITS_IN_BYTE;
  buf[i++] = bfSize & BYTE_MASK;
  // bfReserved1 + bfReserved2
  i += BYTES_IN_DWORD;
  // bfOffBits[32]
  let bfOffBits = SIZE_HEADER + SIZE_INFO;
  buf[i++] = bfOffBits & BYTE_MASK; bfOffBits >>= BITS_IN_BYTE;
  buf[i++] = bfOffBits & BYTE_MASK; bfOffBits >>= BITS_IN_BYTE;
  buf[i++] = bfOffBits & BYTE_MASK; bfOffBits >>= BITS_IN_BYTE;
  buf[i++] = bfOffBits & BYTE_MASK;

  // write info

  // biSize[32]
  let biSize = SIZE_INFO;
  buf[i++] = biSize & BYTE_MASK; biSize >>= BITS_IN_BYTE;
  buf[i++] = biSize & BYTE_MASK; biSize >>= BITS_IN_BYTE;
  buf[i++] = biSize & BYTE_MASK; biSize >>= BITS_IN_BYTE;
  buf[i++] = biSize & BYTE_MASK;
  // biWidth[32]
  let biWidth = xDim;
  buf[i++] = biWidth & BYTE_MASK; biWidth >>= BITS_IN_BYTE;
  buf[i++] = biWidth & BYTE_MASK; biWidth >>= BITS_IN_BYTE;
  buf[i++] = biWidth & BYTE_MASK; biWidth >>= BITS_IN_BYTE;
  buf[i++] = biWidth & BYTE_MASK;
  // biHeight[32]
  let biHeight = yDim;
  buf[i++] = biHeight & BYTE_MASK; biHeight >>= BITS_IN_BYTE;
  buf[i++] = biHeight & BYTE_MASK; biHeight >>= BITS_IN_BYTE;
  buf[i++] = biHeight & BYTE_MASK; biHeight >>= BITS_IN_BYTE;
  buf[i++] = biHeight & BYTE_MASK;
  // biPlanes[16]
  buf[i++] = 1;
  buf[i++] = 0;
  // biBitCount[16]
  buf[i++] = 24;
  buf[i++] = 0;
  // biCompression[32]
  i += BYTES_IN_DWORD;
  // biSizeImage[32]
  let biSizeImage = pixStride * yDim;
  buf[i++] = biSizeImage & BYTE_MASK; biSizeImage >>= BITS_IN_BYTE;
  buf[i++] = biSizeImage & BYTE_MASK; biSizeImage >>= BITS_IN_BYTE;
  buf[i++] = biSizeImage & BYTE_MASK; biSizeImage >>= BITS_IN_BYTE;
  buf[i++] = biSizeImage & BYTE_MASK;
  // biXPelsPerMeter[32]
  i += BYTES_IN_DWORD;
  // biYPelsPerMeter[32]
  i += BYTES_IN_DWORD;
  // biClrUsed[32]
  i += BYTES_IN_DWORD;
  // biClrImportant[32]
  i += BYTES_IN_DWORD;

  let j;
  let valMax = 0;
  for (j = 0; j < numPixels; j++) {
    const valGrey = pixelsSrc[j];
    valMax = (valGrey > valMax) ? valGrey : valMax;
  } // for (j)
  // console.log(`saveBitmap. valMax = ${valMax}`);

  // write pixels
  const MAX_COLOR = 255;
  for (j = 0; j < numPixels; j++) {
    const valGrey = Math.floor(pixelsSrc[j] * MAX_COLOR / valMax);
    // write rgb components
    buf[i++] = valGrey;
    buf[i++] = valGrey;
    buf[i++] = valGrey;
  } // for (j)

  // console.log(`TODO: write file ${fileName}`);

  /*
  // write buffer to file
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const linkGen = document.createElement('a');
  linkGen.setAttribute('href', url);
  linkGen.setAttribute('download', fileName);
  const eventGen = document.createEvent('MouseEvents');
  eventGen.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
  linkGen.dispatchEvent(eventGen);
  */
}

describe('Test: ActiveVolume', () => {
  describe('Setup funcs', () => {
    it('set center', () => {
      const activeVolume = new ActiveVolume();
      const X_CENTER = 89;
      const Y_CENTER = 91;
      const Z_CENTER = 110;
      activeVolume.setSphereCenter(X_CENTER, Y_CENTER, Z_CENTER);
      const vCenter = activeVolume.getSphereCenter();
      expect(vCenter.x === X_CENTER).to.be.true;
      expect(vCenter.y === Y_CENTER).to.be.true;
      expect(vCenter.z === Z_CENTER).to.be.true;
    }); // it
    it('set radius', () => {
      const activeVolume = new ActiveVolume();
      const RADIUS = 29;
      activeVolume.setSphereRadius(RADIUS, RADIUS, RADIUS);
      const vRadius = activeVolume.getSphereRadius();
      assert.equal(vRadius.x, RADIUS);
      assert.equal(vRadius.y, RADIUS);
      assert.equal(vRadius.z, RADIUS);
    }); // it
    it('create with volume', () => {
      const activeVolume = new ActiveVolume();
      const XDIM = 64;
      const YDIM = 64;
      const ZDIM = 64;
      const pixelsBad = new Uint8Array(XDIM * YDIM);
      const resBad = activeVolume.create(XDIM, YDIM, ZDIM, pixelsBad);
      expect(resBad === 1).to.be.false;

      const pixelsGood = new Uint8Array(XDIM * YDIM * ZDIM);
      const resGood = activeVolume.create(XDIM, YDIM, ZDIM, pixelsGood);
      expect(resGood === 1).to.be.true;

      const s = activeVolume.m_state;
      const STATE_NOT_STARTED = 0;
      assert.equal(s, STATE_NOT_STARTED);
    }); // it
    it('get slice from volume', () => {
      const activeVolume = new ActiveVolume();
      const XDIM = 64;
      const YDIM = 64;
      const ZDIM = 64;
      const numPix = XDIM * YDIM * ZDIM;
      const pixelsVol = new Uint8Array(numPix);
      for (let i = 0; i < numPix; i++) {
        pixelsVol[i] = 0;
      }
      const XC0 = 0.5;
      const YC0 = 0.5;
      const ZC0 = 0.5;
      const RAD_LARGE = 0.3;
      volumeAddSphere(XDIM, YDIM, ZDIM, pixelsVol, XC0, YC0, ZC0, RAD_LARGE);

      const XC1 = 0.8;
      const YC1 = 0.6;
      const ZC1 = 0.7;
      const RAD_SMALL = 0.1;
      volumeAddSphere(XDIM, YDIM, ZDIM, pixelsVol, XC1, YC1, ZC1, RAD_SMALL);

      const resVol = activeVolume.create(XDIM, YDIM, ZDIM, pixelsVol);
      expect(resVol === 1).to.be.true;

      const pixelsSlice = new Uint8Array(XDIM * YDIM);
      const TWICE = 2;
      const Z_SLICE = ZDIM / TWICE;
      extractSlice(XDIM, YDIM, ZDIM, pixelsVol, Z_SLICE, pixelsSlice);
      saveBitmap(pixelsSlice, XDIM, YDIM);
    }); // it

  }); // describe
}); // describe
