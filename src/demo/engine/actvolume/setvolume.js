
/**
 * 3D volume processing engine: blur, contrast filter
 * @module lib/scripts/graphics3d/volumeFilter3d
 */

import * as THREE from 'three';
// import MaterialBlur from './gfx/matblur';
// import GlSelector from './GlSelector';
// import AmbientTexture from './ambientTexture';
// import TransferTexture from './transferTexture'
import Eraser from './Eraser';
/** Class Graphics3d is used for 3d render */
export default class VolumeFilter3d {
  constructor() {
    this.transferFunc = null;
    this.lastSize = [];
    this.lastDepth = [];
    this.lastRotationVector = [];
    this.lastTarget = [];
    this.lastMode = [];
    this.lastBackDistance = [];
    this.resetflag = false;
    this.xDim = 0;
    this.yDim = 0;
    this.zDim = 0;
    this.zDimSqrt = 0;
    this.initMatBlure = 0;
    this.bufferTextureCPU = null;
    this.eraser = null;
  }
  /**
   * Copies the source data into the buffer (bufferRgba) from which the 3� texture is created
   */
  set3DTextureFrom1Byte() {
    const OFF0 = 0;
    this.bufferTextureCPU = new Uint8Array(this.xDim * this.yDim * this.zDim);
    this.bufferR = new Uint8Array(this.xDim * this.yDim * this.zDim);
    // Fill initial rgba array
    for (let z = 0; z < this.zDim; z++) {
      const zVolOff = z * this.xDim * this.yDim;
      for (let y = 0; y < this.yDim; y++) {
        const yVol = y;
        const yVolOff = yVol * this.xDim;
        for (let x = 0; x < this.xDim; x++) {
          const xVol = x;
          const offSrc = (xVol + yVolOff + zVolOff);
          let valInt = this.arrPixels[offSrc + 0];
          const offDst = offSrc;
          if (this.zDim > 5 && (z === 0 || z === this.zDim - 1)) {
            valInt = 0;
          }
          this.bufferR[offDst + OFF0] = valInt;
          this.bufferTextureCPU[offDst + OFF0] = valInt;
        }
      }
    }
    console.log('setBufferRgbaFrom1Bytes for 3d texture');
  }
  /**
   * Copies the source data into the buffer (bufferRgba) from which the 3� texture is created
   */
  setBufferRgbaFrom4Bytes() {
    const OFF0 = 0;
    const OFF1 = 1;
    const OFF2 = 2;
    const OFF3 = 3;
    const BID = 4;
    if (this.isRoiVolume) {
      this.bufferRoi = new Uint8Array(this.numPixelsBuffer);
      const c4 = 4;
      this.bufferTextureCPU = new Uint8Array(c4 * this.numPixelsBuffer);
      console.log('ROI');
    }
    this.bufferR = new Uint8Array(this.numPixelsBuffer);

    // Fill initial rgba array
    for (let yTile = 0; yTile < this.zDimSqrt; yTile++) {
      const yTileOff = (yTile * this.yDim) * this.xTex;
      for (let xTile = 0; xTile < this.zDimSqrt; xTile++) {
        const xTileOff = xTile * this.xDim;
        const zVol = xTile + (yTile * this.zDimSqrt);
        if (zVol >= this.zDim) {
          break;
        }
        const zVolOff = zVol * this.xDim * this.yDim;
        for (let y = 0; y < this.yDim; y++) {
          const yVol = y;
          const yVolOff = yVol * this.xDim;
          for (let x = 0; x < this.xDim; x++) {
            const xVol = x;

            const offSrc = (xVol + yVolOff + zVolOff) * BID;
            const valInt = this.arrPixels[offSrc + 0];
            const valRoi = this.arrPixels[offSrc + OFF3];
            const offDst = yTileOff + xTileOff + (y * this.xTex) + x;
            this.bufferR[offDst + OFF0] = valRoi;
            this.bufferTextureCPU[BID * offDst + OFF0] = valInt;
            this.bufferTextureCPU[BID * offDst + OFF1] = valInt;
            this.bufferTextureCPU[BID * offDst + OFF2] = valInt;
            // this.bufferTextureCPU[BID * offDst + OFF3] =
            // 255.0 * zVol * (x + y) / ( this.zDimSqrt * this.zDimSqrt * (this.xDim + this.yDim));
            this.bufferTextureCPU[BID * offDst + OFF3] = valInt;
            this.bufferRoi[offDst + OFF0] = valRoi;

          }
        }
      }
    }
    console.log('setBufferRgbaFrom4Bytes');
  }
  /**
   * Copies the source data into the buffer (bufferRgba) from which the 3� texture is created
   */
  set3DTextureFrom4Bytes() {
    const OFF0 = 0;
    const OFF1 = 1;
    const OFF2 = 2;
    const OFF3 = 3;
    const BID = 4;
    if (this.isRoiVolume) {
      this.bufferRoi = new Uint8Array(this.xDim * this.yDim * this.zDim);
      this.bufferTextureCPU = new Uint8Array(BID * this.xDim * this.yDim * this.zDim);
      console.log('ROI');
    }
    this.bufferR = new Uint8Array(this.xDim * this.yDim * this.zDim);
    // Fill initial rgba array
    for (let z = 0; z < this.zDim; z++) {
      const zVolOff = z * this.xDim * this.yDim;
      for (let y = 0; y < this.yDim; y++) {
        const yVol = y;
        const yVolOff = yVol * this.xDim;
        for (let x = 0; x < this.xDim; x++) {
          const xVol = x;

          const offSrc = (xVol + yVolOff + zVolOff) * BID;
          const valInt = this.arrPixels[offSrc + 0];
          const valRoi = this.arrPixels[offSrc + OFF3];
          const offDst = xVol + yVolOff + zVolOff;
          this.bufferR[offDst + OFF0] = valRoi;
          this.bufferTextureCPU[BID * offDst + OFF0] = valInt;
          this.bufferTextureCPU[BID * offDst + OFF1] = valInt;
          this.bufferTextureCPU[BID * offDst + OFF2] = valInt;
          this.bufferTextureCPU[BID * offDst + OFF3] = valInt;
          this.bufferRoi[offDst + OFF0] = valRoi;
        }
      }
    }
    console.log('setBufferRgbaFrom4Bytes for 3D texture');
  }
  getOffDstValueByXYZ(mainX, mainY, mainZ) {
    if (this.isWebGL2 === 0) {
      const yTile = Math.floor(mainZ / this.zDimSqrt);
      const xTile = mainZ - this.zDimSqrt * yTile;
      const yTileOff = (yTile * this.yDim) * this.xTex;
      const xTileOff = xTile * this.xDim;
      return yTileOff + (mainY * this.xTex) + xTileOff + mainX;
    } else {
      return mainX + mainY * this.xTex + mainZ * this.xTex * this.yTex;
    }
  }
  getIntensity(pointX, pointY, pointZ, undoFlag) {
    const full = 255;
    let offDst = 0;
    if (this.isWebGL2 === 0) {
      const yTile = Math.floor(pointZ / this.zDimSqrt);
      const xTile = pointZ - this.zDimSqrt * yTile;
      const yTileOff = (yTile * this.yDim) * this.xTex;
      const xTileOff = xTile * this.xDim;
      offDst = yTileOff + (pointY * this.xTex) + xTileOff + pointX;
    } else {
      offDst = pointX + pointY * this.xDim + pointZ * this.xDim * this.yDim;
    }
    let intensityPoint = this.bufferTextureCPU[offDst];
    if ((this.bufferMask[offDst] === 0) && (!undoFlag)) {
      intensityPoint = 0;
    } else if ((this.bufferMask[offDst] === full) && (undoFlag)) {
      intensityPoint = 0;
    }
    return intensityPoint;
  }
  changeIntensity(targetX, targetY, targetZ, undoFlag) {
    const mainX = targetX;
    const mainY = targetY;
    const mainZ = targetZ;
    let offDst = 0;
    if (this.isWebGL2 === 0) {
      const yTile = Math.floor(mainZ / this.zDimSqrt);
      const xTile = mainZ - this.zDimSqrt * yTile;
      const yTileOff = (yTile * this.yDim) * this.xTex;
      const xTileOff = xTile * this.xDim;
      offDst = yTileOff + (mainY * this.xTex) + xTileOff + mainX;
    } else {
      offDst = mainX + mainY * this.xDim + mainZ * this.xDim * this.xDim;
    }
    if (undoFlag) {
      this.bufferMask[offDst] = 255;
    } else {
      this.bufferMask[offDst] = 0;
    }
  }
  /**
   * Create 2D texture containing roi color map
   * @param colorArray 256 RGBA roi colors
   */
  createRoiColorMap(colorArray) {
    return this.transferFunc.createRoiColorMap(colorArray);
  }
  /**
   * Create 2D texture containing selected ROIs
   * @param colorArray 256 RGBA roi colors
   */
  createSelectedRoiMap() {
    return this.createSelectedRoiMap();
  }
  /**
   * Create 2D texture containing selected ROIs
   * @param selectedROIs 256 byte roi values
   */
  updateSelectedRoiMap(selectedROIs) {
    this.transferFunc.updateSelectedRoiMap(selectedROIs);
    this.setVolumeTexture(1.0);
  }
  /**
   * Update roi selection map
   * @param roiId ROI id from 0..255
   * @param selectedState True if roi must be visible
   */
  // eslint-disable-next-line
  updateSelectedRoi(roiId, selectedState) {
    this.transferFunc.updateSelectedRoi(roiId, selectedState);
    this.setVolumeTexture(1.0);
  }
  /**
   * Create 3D texture containing filtered source data and calculated normal values
   * @param props An object that contains all volume-related info
   * @param

   * @param roiColors Array of roi colors in RGBA format
   * @return (object) Created texture
   */
  createUpdatableVolumeTex(volume, isRoiVolume, roiColors) {
    //
    // Some notes about tetxure layout.
    // Actually we have replaces3d texture with 2d texture (large size).
    // Idea: pack 2d slices of original texture into single 2d texture, looking
    // like tile map
    //
    // Let we have 7 slices on z direction and want to create
    // 2d visualization in (x,y) plane.
    // We can arrange 7 slices in a following manner (ooo - means unused)
    //
    // +-----+-----+-----+
    // |     |     |     |
    // |  0  |  1  |  2  |
    // |     |     |     |
    // +-----+-----+-----+
    // |     |     |     |
    // |  3  |  4  |  5  |
    // |     |     |     |
    // +-----+-----+-----+
    // |     |00000|00000|
    // |  6  |00000|00000|
    // |     |00000|00000|
    // +-----+-----+-----+
    //
    // Numbers 0..6 inside tiles shows original tiles indices
    //
    // Shader parameter
    // tileCointX: number of tiles in hor direction
    // volumeSizeZ: number of slices in z directiion
    //
    // console.log(roiColors);
    this.isWebGL2 = 1;
    this.arrPixels = volume.m_dataArray;
    const xDim = volume.m_xDim;
    const yDim = volume.m_yDim;
    const zDim = volume.m_zDim;
    const TWO = 2;
    const ONE = 1;
    const zDimSqrt = TWO ** (ONE + Math.floor(Math.log(Math.sqrt(zDim)) / Math.log(TWO)));
    if (!Number.isInteger(zDimSqrt)) {
      console.log(`!!! zDimSqrt should be integer, but = ${zDimSqrt}`);
    }
    const xTex = xDim * zDimSqrt;
    const yTex = yDim * zDimSqrt;
    const numPixelsBuffer = xTex * yTex;
    this.numPixelsBuffer = numPixelsBuffer;
    this.xTex = xTex;
    this.yTex = yTex;
    this.xDim = xDim;
    this.yDim = yDim;
    this.zDim = zDim;
    this.zDimSqrt = zDimSqrt;
    this.isRoiVolume = isRoiVolume;

    this.RoiVolumeTex = null;
    if (!isRoiVolume) {
      if (this.isWebGL2 === 0) {
        this.setBufferRgbaFrom1Byte();
      } else {
        this.set3DTextureFrom1Byte();
      }
    } else {
      if (this.isWebGL2 === 0) {
        this.setBufferRgbaFrom4Bytes();
        this.RoiVolumeTex = new THREE.DataTexture(this.bufferRoi, this.xTex, this.yTex, THREE.AlphaFormat);
      } else {
        this.set3DTextureFrom4Bytes();
        this.RoiVolumeTex = new THREE.DataTexture3D(this.bufferRoi, this.xDim, this.yDim, this.zDim);
        this.RoiVolumeTex.format = THREE.RedFormat; //RedFormat?
        this.RoiVolumeTex.type = THREE.UnsignedByteType;
      }
      this.RoiVolumeTex.wrapS = THREE.ClampToEdgeWrapping;
      this.RoiVolumeTex.wrapT = THREE.ClampToEdgeWrapping;
      this.RoiVolumeTex.magFilter = THREE.NearestFilter;
      this.RoiVolumeTex.minFilter = THREE.NearestFilter;
      this.RoiVolumeTex.needsUpdate = true;
    }
    let rtFormat = THREE.RGBAFormat;
    if (this.isWebGL2 === 1) {
      rtFormat = THREE.RGBAFormat;// can we use ALPHA?
    }
    this.bufferTexture = new THREE.WebGLRenderTarget(this.xDim,
      this.yDim, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: rtFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
      });

    if (this.origVolumeTex) {
      this.origVolumeTex.dispose();
    }

    if (this.isWebGL2 === 0) {
      this.origVolumeTex = new THREE.DataTexture(this.bufferR, this.xTex, this.yTex, THREE.AlphaFormat);
    } else {
      this.origVolumeTex = new THREE.DataTexture3D(this.bufferR, this.xDim, this.yDim, this.zDim);
      this.origVolumeTex.format = THREE.RedFormat;
      this.origVolumeTex.type = THREE.UnsignedByteType;
      this.origVolumeTex.wrapR = THREE.ClampToEdgeWrapping;
    }
    this.origVolumeTex.wrapS = THREE.ClampToEdgeWrapping;
    this.origVolumeTex.wrapT = THREE.ClampToEdgeWrapping;

    this.origVolumeTex.magFilter = THREE.NearestFilter;//THREE.LinearFilter;
    this.origVolumeTex.minFilter = THREE.NearestFilter;//THREE.LinearFilter;

    this.origVolumeTex.needsUpdate = true;
    if (this.origVolumeTex) {
      this.origVolumeTex.dispose();
    }

    if (this.isWebGL2 === 0) {
      this.updatableTexture = new THREE.DataTexture(this.bufferTextureCPU, this.xTex, this.yTex, THREE.AlphaFormat);
    } else {
      let volTexFormat = THREE.RedFormat;
      if (isRoiVolume) {
        volTexFormat = THREE.RGBAFormat;
      }
      this.updatableTexture = new THREE.DataTexture3D(this.bufferTextureCPU, this.xDim, this.yDim, this.zDim);
      this.updatableTexture.format = volTexFormat;
      this.updatableTexture.type = THREE.UnsignedByteType;
      this.updatableTexture.wrapR = THREE.ClampToEdgeWrapping;
    }
    this.updatableTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.updatableTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.updatableTexture.magFilter = THREE.LinearFilter;
    this.updatableTexture.minFilter = THREE.LinearFilter;
    if (this.zDim > 1) {
      this.initRenderer(isRoiVolume, roiColors);
    }
    this.updatableTexture.needsUpdate = true;
    this.eraser = new Eraser();
    return this.updatableTexture;
  }
  /**
   * Create 3D texture containing mask of data which were erase
   * @param volume An object that contains all volume-related info
   * @return (object) Created texture
   */
  createUpdatableVolumeMask(params) {
    return this.eraser.createUpdatableVolumeMask(params, this.bufferTextureCPU);
  }
} // class Graphics3d
