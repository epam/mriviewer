
/**
 * 3D volume processing engine: blur, contrast filter
 * @module lib/scripts/graphics3d/volumeFilter3d
 */

import * as THREE from 'three';
import MaterialBlur from './gfx/matblur';
import GlSelector from './GlSelector';
import AmbientTexture from './ambientTexture';
import TransferTexture from './transferTexture'
import Eraser from './Eraser';
/** Class VolumeFilter3d is used for 3d render */
export default class VolumeFilter3d {
  constructor() {
    this.transferFunc = null;
    this.xDim = 0;
    this.yDim = 0;
    this.zDim = 0;
    this.bufferTextureCPU = null;
    this.eraser = null;
  }
  /**
   * Filtering the source data and building the normals on the GPU
   * @param isRoiVolume
   * @param roiColors Array of roi colors in RGBA format
   */
  initRenderer(isRoiVolume, roiColors) {
    this.sceneBlur = new THREE.Scene();
    const blurSigma = 0.8;
    this.numRois = 256;
    // eslint-disable-next-line
    this.cameraOrtho = new THREE.OrthographicCamera(this.xDim / -2, this.xDim / 2, this.yDim / 2, this.yDim / -2, 0.1, 100);
    const glSelector = new GlSelector();
    this.context = glSelector.createWebGLContext();
    this.canvas3d = glSelector.getCanvas();
    this.rendererBlur = new THREE.WebGLRenderer({
      canvas: this.canvas3d,
      context: this.context
    });
    this.ambientTexture = new AmbientTexture({
      xDim: this.xDim,
      yDim: this.yDim,
      zDim: this.zDim,
      renderer: this.rendererBlur,
      scene: this.sceneBlur,
      camera: this.cameraOrtho,
    });

    console.log('rendererBlur done');
    const geometryBlur = new THREE.PlaneGeometry(1.0, 1.0);
    this.rendererBlur.setSize(this.xDim, this.yDim);
    //
    this.transferFunc = new TransferTexture();
    this.transferFunc.init(isRoiVolume, roiColors);
    const texelSize = new THREE.Vector3(1.0 / this.xDim, 1.0 / this.yDim, 1.0 / this.zDim);
    const matBlur = new MaterialBlur();

    matBlur.create(this.origVolumeTex, this.RoiVolumeTex, texelSize, this.transferFunc.texRoiColor, this.transferFunc.texRoiId, (mat) => {
      const mesh = new THREE.Mesh(geometryBlur, mat);
      mat.uniforms.volumeSizeZ.value = this.zDim;
      mat.uniforms.xDim.value = this.xDim;
      mat.uniforms.yDim.value = this.yDim;
      mat.defines.useWebGL2 = this.isWebGL2;
      this.material = mat;
      this.sceneBlur.add(mesh);
      if (isRoiVolume === false) {
        this.switchToBlurRender();
      } else {
        this.switchToRoiMapRender();
      }
      // render with blur and copy pixels back to this.bufferRgba
      console.log(`isRoiVolume: ${isRoiVolume}`);
      this.setVolumeTexture(blurSigma);
    });
    this.vectorsTex = null;
  }
  /**
   * Create 2D texture containing transfer func colors
  */
  createTransferFuncTexture() {
    if (this.transferFunc !== null) {
      return this.transferFunc.createTransferFuncTexture();
    }
    return null;
  }
  /**
   * Creates transfer function color map
   * @param ctrlPts Array of control points of type HEX  = color value
   */
  setTransferFuncColors(ctrlPtsColorsHex) {
    this.transferFunc.setTransferFuncColors(ctrlPtsColorsHex);
  }
  /**
   * Creates transfer function color map
   * @param ctrlPts Array of Vector2 where (x,y) = x coordinate in [0, 1], alpha value in [0, 1]
   * //intensity [0,255] opacity [0,1]
   */
  updateTransferFuncTexture(intensities, opacities) {
    return this.transferFunc.updateTransferFuncTexture(intensities, opacities);
  }
  /**
   * Setting a variable for conditional compilation (Roi Render)
   */
  switchToRoiMapRender() {
    this.material.defines.renderRoiMap = 1;
    this.material.needsUpdate = true;
  }
  /**
   * Setting a variable for conditional compilation (Blur)
   */
  switchToBlurRender() {
    this.material.defines.renderRoiMap = 0;
    this.material.needsUpdate = true;
  }
  /**
   * Filtering the source data and building the normals on the GPU
   * @param blurSigma Gauss sigma parameter
   */
  setVolumeTexture(blurSigma) {
    if ((!this.material) || (typeof this.material === 'undefined')) {
      console.log('blur material null');
      return;
    }
    console.log('blur material NOT null');
    this.setVolumeTextureWebGL2(blurSigma);
    this.updatableTexture.needsUpdate = true;
  }
  updateVolumeTextureWithMask() {
    if (this.eraser.bufferMask === null){
      console.log('volTextureMask null');
    }
    for (let z = 0; z < this.zDim; z++) {
      const zVolOff = z * this.xDim * this.yDim;
      for (let y = 0; y < this.yDim; y++) {
        const yVol = y;
        const yVolOff = yVol * this.xDim;
        for (let x = 0; x < this.xDim; x++) {
          const xVol = x;
          const offSrc = (xVol + yVolOff + zVolOff);
          let valInt = this.arrPixels[offSrc];
          const offDst = offSrc;
          if ((this.zDim > 5) && ((z === 0) || (z === this.zDim - 1) || (this.eraser.bufferMask[offSrc] === 0))) {
            valInt = 0;
          }
          this.bufferR[offDst] = valInt;
        }
      }
    }
    this.origVolumeTex.needsUpdate = true;
    this.setVolumeTexture(1.0);
  }
  setVolumeTextureWebGL2(blurSigma) {
    this.material.uniforms.blurSigma.value = blurSigma;
    this.material.uniforms.blurSigma.needsUpdate = true;
    const VAL_1 = 1;
    const VAL_2 = 2;
    const VAL_3 = 3;
    const VAL_4 = 4;
    const frameBuf = new Uint8Array(VAL_4 * this.xDim * this.yDim);
    const gl = this.rendererBlur.getContext();
    for (let z = 1; z < this.zDim - 1; ++z) {
      this.material.uniforms.curZ.value = z / this.zDim;
      this.material.uniforms.curZ.needsUpdate = true;

      this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
      gl.readPixels(0, 0, this.xDim, this.yDim, gl.RGBA, gl.UNSIGNED_BYTE, frameBuf);
      const zOffs = z * this.xDim * this.yDim;
      for (let y = 0; y < this.yDim; y++) {
        for (let x = 0; x < this.xDim; x++) {
          if (this.isRoiVolume) {
            const indxR = VAL_4 * (x + y * this.xDim);
            const indxL = indxR + zOffs * VAL_4;
            this.bufferTextureCPU[indxL] = frameBuf[indxR];
            this.bufferTextureCPU[indxL + VAL_1] = frameBuf[indxR + VAL_1];
            this.bufferTextureCPU[indxL + VAL_2] = frameBuf[indxR + VAL_2];
            this.bufferTextureCPU[indxL + VAL_3] = frameBuf[indxR + VAL_3];
          } else {
            this.bufferTextureCPU[x + y * this.xDim + zOffs] =
            frameBuf[VAL_4 * (x + y * this.xDim)]; //256.0 * k / this.zDim;
          }
        }
      }
    }
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
          //const valRoi = this.arrPixels[offSrc + 0];
          //const valInt = this.arrPixels[offSrc + OFF3];
          const offDst = xVol + yVolOff + zVolOff;
          //if (x === 0 || x === this.xDim - 1 || y === 0 || y === this.yDim - 1 || z === 0 || z === this.zDim - 1)
          if (x < 2 || x > this.xDim - 4 || y < 2 || y > this.yDim - 4 || z < 2 || z > this.zDim - 4)
            this.bufferR[offDst + OFF0] = 0;
          else
            this.bufferR[offDst + OFF0] = valInt;
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
    this.isWebGL2 = 1;
    this.arrPixels = volume.m_dataArray;
    const xDim = volume.m_xDim;
    const yDim = volume.m_yDim;
    const zDim = volume.m_zDim;
    this.xDim = xDim;
    this.yDim = yDim;
    this.zDim = zDim;
    this.isRoiVolume = isRoiVolume;

    this.RoiVolumeTex = null;
    if (!isRoiVolume) {
      this.set3DTextureFrom1Byte();
    } else {
      this.set3DTextureFrom4Bytes();
      this.RoiVolumeTex = new THREE.DataTexture3D(this.bufferRoi, this.xDim, this.yDim, this.zDim);
      this.RoiVolumeTex.format = THREE.RedFormat; //RedFormat?
      this.RoiVolumeTex.type = THREE.UnsignedByteType;
      this.RoiVolumeTex.wrapS = THREE.ClampToEdgeWrapping;
      this.RoiVolumeTex.wrapT = THREE.ClampToEdgeWrapping;
      this.RoiVolumeTex.magFilter = THREE.NearestFilter;
      this.RoiVolumeTex.minFilter = THREE.NearestFilter;
      this.RoiVolumeTex.needsUpdate = true;
    }
    this.bufferTexture = new THREE.WebGLRenderTarget(this.xDim,
      this.yDim, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
      });

    if (this.origVolumeTex) {
      this.origVolumeTex.dispose();
    }

    this.origVolumeTex = new THREE.DataTexture3D(this.bufferR, this.xDim, this.yDim, this.zDim);
    this.origVolumeTex.format = THREE.RedFormat;
    this.origVolumeTex.type = THREE.UnsignedByteType;
    this.origVolumeTex.wrapR = THREE.ClampToEdgeWrapping;
    this.origVolumeTex.wrapS = THREE.ClampToEdgeWrapping;
    this.origVolumeTex.wrapT = THREE.ClampToEdgeWrapping;
    this.origVolumeTex.magFilter = THREE.NearestFilter;//THREE.LinearFilter;
    this.origVolumeTex.minFilter = THREE.NearestFilter;//THREE.LinearFilter;
    this.origVolumeTex.needsUpdate = true;

    let volTexFormat = THREE.RedFormat;
    if (isRoiVolume) {
      volTexFormat = THREE.RGBAFormat;
    }
    this.updatableTexture = new THREE.DataTexture3D(this.bufferTextureCPU, this.xDim, this.yDim, this.zDim);
    this.updatableTexture.format = volTexFormat;
    this.updatableTexture.type = THREE.UnsignedByteType;
    this.updatableTexture.wrapR = THREE.ClampToEdgeWrapping;
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
} // class VolumeFilter3d
