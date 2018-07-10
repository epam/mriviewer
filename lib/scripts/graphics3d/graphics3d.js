/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

/**
 * 3D volume/isosurface rendering engine
 * @module app/scripts/graphics3d/graphics3d
 */

import * as THREE from 'three';
import swal from 'sweetalert';

import OrbitControl from '../controls/orbitcontrol';
import MaterialBF from '../gfx/matbackface';
import MaterialFF from '../gfx/matfrontface';
import MaterialClipPlane from '../gfx/matclipplane';
import MaterialRenderToTexture from '../gfx/matrendertotexture';
import MaterialInterpolation from '../gfx/matinterpolation';
import MaterialVolumeRender from '../gfx/matvolumerender';
import VolumeFilter3D from './volumeFilter3d';
import GlCheck from './glcheck';
import RoiPalette from '../loaders/roipalette';


/**  @constant {number} SCENE_3D_BACKGROUND_COLOR - backgroudn color for 3d window */
const SCENE_3D_BACKGROUND_COLOR = 0x0;// 0xbbbbff;
const VOLUME_COLOR1_MIN_R = 0.1;
const VOLUME_COLOR1_MIN_G = 0.0;
const VOLUME_COLOR1_MIN_B = 0.0;
const VOLUME_COLOR3_MIN_R = 0.0;
const VOLUME_COLOR3_MIN_G = 0.8;
const VOLUME_COLOR3_MIN_B = 0.0;
const VOLUME_COLOR1_MAX_R = 1.0;
const VOLUME_COLOR1_MAX_G = 0.0;
const VOLUME_COLOR1_MAX_B = 0.0;
const VOLUME_COLOR2_MIN_R = 1.0;
const VOLUME_COLOR2_MIN_G = 0.902;
const VOLUME_COLOR2_MIN_B = 0.773;
const VOLUME_COLOR2_MAX_R = 0.5;
const VOLUME_COLOR2_MAX_G = 0.4;
const VOLUME_COLOR2_MAX_B = 0.3;
const STEP_SIZE1 = 0.0025;
const STEP_SIZE2 = 0.0033;
const STEP_SIZE3 = 0.0025;
//const STEP_SIZE3 = 0.0039;
const STEP_SIZE4 = 0.0029;
const OPACITY_SCALE = 175.0;
//const MIN_FPS = 10;

// Special values to check frame buffer
const CHECK_MODE_NOT_CHECKED = 0;
const CHECK_MODE_RESULT_OK = 1;
const CHECK_MODE_RESULT_BAD = 2;

// When scene is ready (how much materials are created via arrow functions)
const SCENE_READY_COUNTER_OK = 5;

/** Class Graphics3d is used for 3d render */
export default class Graphics3d {

  /**
   * Initialize render
   * @param (object) engine2d - object container for 2d rendering
   * @param (object) root3dContainer - object container for 3d rendering
   * @param (object) curFileDataType - file type
   * @return {Object} Instance of this class (singleton)
   */
  constructor(engine2d, root3dContainer, curFileDataType) {
    this.curFileDataType = curFileDataType;
    this.sceneReadyCounter = 0;
    this.renderCounter = 0;
    this.scene = new THREE.Scene();
    this.sceneClipPlane = new THREE.Scene();
    this.planeGeometry = null;
    this.engine2d = engine2d;
    this.mesh = null;
    this.renderer = null;
    this.texTF = null;
    this.volTexture = null;
    this.origVolumeTex = null;
    this.texRoiId = null;
    this.texRoiColor = null;
    this.RoiVolumeTex = null;
    this.volTextureMask = null;
    this.bfTexture = null;
    this.ffTexture = null;
    this.renderToTexture = null;
    this.geometry = null;
    this.matBF = null;
    this.matFF = null;
    this.matRenderToTexture = null;
    this.matInterpolation = null;
    this.matVolumeRender = null;
    this.volumeUpdater = null;
    this.checkFrameBufferMode = CHECK_MODE_NOT_CHECKED;
    // eslint-disable-next-line
    this.planeCenterPt = new THREE.Vector3(-0.5, -0.5, 0.5 * 1.4);
    // this.renderer = new THREE.WebGLRenderer({ antialias: false, logarithmicDepthBuffer: false });
    // this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
    this.renderer.autoClearStencil = false;
    this.renderer.autoClearColor = false;
    if (!this.renderer) {
      console.log('cant create 3d renderer');
    }

    // Assign current window to render area
    this.windowWidth = Math.floor(root3dContainer.width());
    // eslint-disable-next-line
    this.windowHeight = Math.floor(root3dContainer.height() - 5);
    // console.log("Window: " + this.windowWidth + "x" + this.windowHeight);
    console.log(`Window: ${this.windowWidth} x ${this.windowHeight}`);
    const camAspect = this.windowWidth / this.windowHeight;
    // eslint-disable-next-line
    this.camera = new THREE.PerspectiveCamera(60, camAspect, 0.01, 100);
    this.camera.position.z = 10;
    this.renderer.setSize(this.windowWidth, this.windowHeight);

    this.renderer.setClearColor(SCENE_3D_BACKGROUND_COLOR);

    if (root3dContainer.length === 1) {
      root3dContainer.append(this.renderer.domElement);
    } else {
      console.log('containter with id=med3web-container-3d not found in scene');
    }
    // When rotating an object, it is necessary to reverse the rotation of
    // the cutting plane and the direction vector onto the light source
    this.orbitControl = new OrbitControl(root3dContainer, this.camera, this.scene, this.mesh, () => {
      if (this.checkFrameBufferMode === CHECK_MODE_RESULT_OK) {
        this.updateCutPlanes();
        this.updateLightDir();
      }
    });
    this.orbitControl.addCallbacks();
    this.renderer.gammaInput = true;
    this.renderer.gammaOutput = true;

    this.RENDER_STATE = {
      ENABLED : 0,
      ONCE : 1,
      DISABLED : 2
    };

    this.renderState = this.RENDER_STATE.ENABLED;
    this.fps = 0;
    root3dContainer.on('mousedown', (event) => {
      const domElem = root3dContainer.get(0);
      const box = domElem.getBoundingClientRect();
      const containerX = event.clientX - box.left;
      const containerY = event.clientY - box.top;
      this.onMouseDown(containerX, this.windowHeight - containerY, event.ctrlKey);
    });
    root3dContainer.on('mouseup', () => { this.onMouseUp(); });
    root3dContainer.on('mousemove', (event) => {
      const domElem = root3dContainer.get(0);
      const box = domElem.getBoundingClientRect();
      const containerX = event.clientX - box.left;
      const containerY = event.clientY - box.top;
      this.onMouseMove(containerX, this.windowHeight - containerY, event.ctrlKey);
    });
    root3dContainer.on('DOMMouseScroll', (e) => { this.onMouseWheel(e); });
    root3dContainer.on('mousewheel', (e) => { this.onMouseWheel(e); });
    this.isEraseMode = false;
    this.eraserRadius = 10;
    this.eraserDepth = 20;
    this.lockEraserBuffersUpdating = false;
    this.eraserMouseDown = false;
  }

  setFileDataType(curFileDataType) {
    this.curFileDataType = curFileDataType;
  }

  /**
   * Returns true if the maderial for VolumeRender is set
   */
  isVolumeLoaded() {
    return (this.matVolumeRender !== null);
  }

  fov2Tan(fov) {
    const HALF = 0.5;
    return Math.tan(THREE.Math.degToRad(HALF * fov));
  }

  tan2Fov(tan) {
    const TWICE = 2.0;
    return THREE.Math.radToDeg(Math.atan(tan)) * TWICE;
  }

  /**
   * Get screen copy image from current render
   *
   * @param {number} width Desired image width
   * @param {number} height Desired image height
   * @return {Object} Image with 3d renderer output (as URI string)
   */
  screenshot(width, height) {
    if (this.renderer === null) {
      return null;
    }
    let screenshotImage = null;
    if (typeof width === 'undefined') {
      screenshotImage = this.renderer.domElement.toDataURL('image/png');
    } else {
      // width and height are specified
      const originalAspect = this.camera.aspect;
      const originalFov = this.camera.fov;
      const originalTanFov2 = this.fov2Tan(this.camera.fov);

      // screen shot should contain the principal area of interest (a centered square touching screen sides)
      const areaOfInterestSize = Math.min(this.windowWidth, this.windowHeight);
      const areaOfInterestTanFov2 = originalTanFov2 * areaOfInterestSize / this.windowHeight;

      // set appropriate camera aspect & FOV
      const shotAspect = width / height;
      this.camera.aspect = shotAspect;
      this.camera.fov = this.tan2Fov(areaOfInterestTanFov2 / Math.min(shotAspect, 1.0));
      this.camera.updateProjectionMatrix();

      // resize canvas to the required size of screen shot
      this.renderer.setSize(width, height);

      // make screen shot
      this.render();
      screenshotImage = this.renderer.domElement.toDataURL('image/png');

      // restore original camera & canvas proportions
      this.camera.aspect = originalAspect;
      this.camera.fov = originalFov;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.windowWidth, this.windowHeight);
      this.render();
    }
    return screenshotImage;
  }
  /**
   * Setting a MaskFlag
   */
  setMaskFlag(MaskFlag) {
    this.matVolumeRender.defines.MaskFlag = MaskFlag;
    this.matVolumeRender.needsUpdate = true;
    this.matRenderToTexture.defines.MaskFlag = MaskFlag;
    this.matRenderToTexture.needsUpdate = true;
  }

  /**
   * Setting a variable for conditional compilation (Volume Render)
   */
  switchToVolumeRender() {
    if (this.isRoiVolume > 0) {
      this.matVolumeRender.defines.isoRenderFlag = 4;
      this.matVolumeRender.needsUpdate = true;
      this.matInterpolation.defines.isoRenderFlag = 4;
      this.matInterpolation.needsUpdate = true;
      this.matRenderToTexture.defines.isoRenderFlag = 4;
      this.matRenderToTexture.needsUpdate = true;
      this.renderState = this.RENDER_STATE.ONCE;
    } else {
      this.matVolumeRender.defines.isoRenderFlag = 0;
      this.matVolumeRender.needsUpdate = true;
      this.matInterpolation.defines.isoRenderFlag = 0;
      this.matInterpolation.needsUpdate = true;
      this.matRenderToTexture.defines.isoRenderFlag = 0;
      this.matRenderToTexture.needsUpdate = true;
      this.renderState = this.RENDER_STATE.ONCE;
    }
  }
  /**
   * Setting a variable for conditional compilation (Full Volume Render)
   */
  switchToFullVolumeRender() {
    if (this.isRoiVolume > 0) {
      this.matVolumeRender.defines.isoRenderFlag = 4;
      this.matVolumeRender.needsUpdate = true;
      this.matInterpolation.defines.isoRenderFlag = 4;
      this.matInterpolation.needsUpdate = true;
      this.matRenderToTexture.defines.isoRenderFlag = 4;
      this.matRenderToTexture.needsUpdate = true;
      this.renderState = this.RENDER_STATE.ONCE;
    } else {
      this.matVolumeRender.defines.isoRenderFlag = 3;
      this.matVolumeRender.needsUpdate = true;
      this.matInterpolation.defines.isoRenderFlag = 3;
      this.matInterpolation.needsUpdate = true;
      this.matRenderToTexture.defines.isoRenderFlag = 3;
      this.matRenderToTexture.needsUpdate = true;
      this.renderState = this.RENDER_STATE.ONCE;
    }
  }
  /**
   * Setting a variable for conditional compilation (ROI Volume Render)
   */
  /*
  switchToROIVolumeRender() {
    this.matVolumeRender.defines.isoRenderFlag = 4;
    this.matVolumeRender.needsUpdate = true;
    this.matInterpolation.defines.isoRenderFlag = 4;
    this.matInterpolation.needsUpdate = true;
    this.matRenderToTexture.defines.isoRenderFlag = 4;
    this.matRenderToTexture.needsUpdate = true;
    this.renderState = this.RENDER_STATE.ONCE;
    this.volumeUpdater.switchToRoiMapRender();
  }
  */
  /**
   * Setting a variable for conditional compilation (Isosurface render)
   */
  switchToIsosurfRender() {
    if (this.isRoiVolume > 0) {
      this.matVolumeRender.defines.isoRenderFlag = 5;
      this.matVolumeRender.needsUpdate = true;
      this.matInterpolation.defines.isoRenderFlag = 5;
      this.matInterpolation.needsUpdate = true;
      this.matRenderToTexture.defines.isoRenderFlag = 5;
      this.matRenderToTexture.needsUpdate = true;
      this.renderState = this.RENDER_STATE.ONCE;
      this.volumeUpdater.switchToRoiMapRender();
    } else {
      this.matVolumeRender.defines.isoRenderFlag = 1;
      this.matVolumeRender.needsUpdate = true;
      this.matInterpolation.defines.isoRenderFlag = 1;
      this.matInterpolation.needsUpdate = true;
      this.matRenderToTexture.defines.isoRenderFlag = 1;
      this.matRenderToTexture.needsUpdate = true;
      this.renderState = this.RENDER_STATE.ONCE;
    }
  }
  /**
   * Setting a variable for conditional compilation (Max projection render)
   */
  switchToFLATRender() {
    this.matVolumeRender.defines.isoRenderFlag = 2;
    this.matVolumeRender.needsUpdate = true;
    this.matInterpolation.defines.isoRenderFlag = 2;
    this.matInterpolation.needsUpdate = true;
    this.matRenderToTexture.defines.isoRenderFlag = 2;
    this.matRenderToTexture.needsUpdate = true;
    this.renderState = this.RENDER_STATE.ONCE;
  }

  /**
   * Setting isosurface threshold
   */
  setIsoThresholdValue(sliderValue) {
    this.matRenderToTexture.uniforms.isoThreshold.value = sliderValue;
    this.matRenderToTexture.uniforms.isoThreshold.needsUpdate = true;
    this.matVolumeRender.uniforms.isoThreshold.value = sliderValue;
    this.matVolumeRender.uniforms.isoThreshold.needsUpdate = true;
    this.renderState = this.RENDER_STATE.ONCE;
  }

  /**
   * Setting volume opacity
   * @param (number) sliderValue - slider ration in 0..1
   */
  setOpacityBarrier(sliderValue) {
    this.matVolumeRender.uniforms.opacityBarrier.value = OPACITY_SCALE * sliderValue;
    this.matVolumeRender.uniforms.opacityBarrier.needsUpdate = true;
    this.matRenderToTexture.uniforms.opacityBarrier.value = OPACITY_SCALE * sliderValue;
    this.matRenderToTexture.uniforms.opacityBarrier.needsUpdate = true;
  }

  /**
   * Setting Brightness
   * @param (number) value - brightness of ???
   */
  updateBrightness(value) {
    this.matRenderToTexture.uniforms.brightness3D.value = value;
    this.matRenderToTexture.uniforms.brightness3D.needsUpdate = true;
    this.matVolumeRender.uniforms.brightness3D.value = value;
    this.matVolumeRender.uniforms.brightness3D.needsUpdate = true;
    // this.volumeUpdater.updateVolumeTexture(0.1 + 1.5*value);
  }

  /**
   * Setting Contrast
   * @param (number) value - constrast of ???
   */
  updateContrast(value) {
    this.matRenderToTexture.uniforms.contrast3D.value = value;
    this.matVolumeRender.uniforms.contrast3D.value = value;
    this.matRenderToTexture.uniforms.contrast3D.needsUpdate = true;
    this.matVolumeRender.uniforms.contrast3D.needsUpdate = true;
  }

  /**
   * Setting Cut Plane
   * @param (number) value - ???
   */
  updateZCutPlane(value) {
    const Z_MULTIPLIER = 1.4;
    this.planeCenterPt.z = Z_MULTIPLIER * value;
    this.updateCutPlanes();
  }

  /**
   * Setting Transfer Function Params
   * @param (array) values - 3 threshold values for volumetric render
   */
  setTransferFuncVec3(values, colorFlag) {
    if (colorFlag === 0) {
      this.matRenderToTexture.uniforms.t_function1min.value =
        new THREE.Vector4(VOLUME_COLOR1_MIN_R, VOLUME_COLOR1_MIN_G, VOLUME_COLOR1_MIN_B, values[0]);
    } else {
      this.matRenderToTexture.uniforms.t_function1min.value =
        new THREE.Vector4(VOLUME_COLOR3_MIN_R, VOLUME_COLOR3_MIN_G, VOLUME_COLOR3_MIN_B, values[0]);
    }
    this.matRenderToTexture.uniforms.t_function1min.needsUpdate = true;
    this.matRenderToTexture.uniforms.t_function1max.value =
      new THREE.Vector4(VOLUME_COLOR1_MAX_R, VOLUME_COLOR1_MAX_G, VOLUME_COLOR1_MAX_B, values[1]);
    this.matRenderToTexture.uniforms.t_function1max.needsUpdate = true;
    this.matRenderToTexture.uniforms.t_function2min.value =
      new THREE.Vector4(VOLUME_COLOR2_MIN_R, VOLUME_COLOR2_MIN_G, VOLUME_COLOR2_MIN_B, values[2]);
    this.matRenderToTexture.uniforms.t_function2min.needsUpdate = true;
    this.matRenderToTexture.uniforms.t_function2max.value =
      new THREE.Vector4(VOLUME_COLOR2_MAX_R, VOLUME_COLOR2_MAX_G, VOLUME_COLOR2_MAX_B, values[2]);
    this.matRenderToTexture.uniforms.t_function2max.needsUpdate = true;
    this.matRenderToTexture.uniforms.stepSize.value =
      new THREE.Vector4(STEP_SIZE1, STEP_SIZE2, STEP_SIZE3, STEP_SIZE4);
    this.matRenderToTexture.uniforms.stepSize.needsUpdate = true;
    if (colorFlag === 0) {
      this.matVolumeRender.uniforms.t_function1min.value =
        new THREE.Vector4(VOLUME_COLOR1_MIN_R, VOLUME_COLOR1_MIN_G, VOLUME_COLOR1_MIN_B, values[0]);
    } else {
      this.matVolumeRender.uniforms.t_function1min.value =
        new THREE.Vector4(VOLUME_COLOR3_MIN_R, VOLUME_COLOR3_MIN_G, VOLUME_COLOR3_MIN_B, values[0]);
    }
    this.matVolumeRender.uniforms.t_function1min.needsUpdate = true;
    this.matVolumeRender.uniforms.t_function1max.value =
      new THREE.Vector4(VOLUME_COLOR1_MAX_R, VOLUME_COLOR1_MAX_G, VOLUME_COLOR1_MAX_B, values[1]);
    this.matVolumeRender.uniforms.t_function1max.needsUpdate = true;
    this.matVolumeRender.uniforms.t_function2min.value =
      new THREE.Vector4(VOLUME_COLOR2_MIN_R, VOLUME_COLOR2_MIN_G, VOLUME_COLOR2_MIN_B, values[2]);
    this.matVolumeRender.uniforms.t_function2min.needsUpdate = true;
    this.matVolumeRender.uniforms.t_function2max.value =
      new THREE.Vector4(VOLUME_COLOR2_MAX_R, VOLUME_COLOR2_MAX_G, VOLUME_COLOR2_MAX_B, values[2]);
    this.matVolumeRender.uniforms.t_function2max.needsUpdate = true;
    this.matVolumeRender.uniforms.stepSize.value =
      new THREE.Vector4(STEP_SIZE1, STEP_SIZE2, STEP_SIZE3, STEP_SIZE4);
    this.matVolumeRender.uniforms.stepSize.needsUpdate = true;
  }

  /**
   * Compute 3D texture coordinates on BBOX
   * @param (object) nonEmptyBoxMin - Min corner for non empty box in volume
   * @param (object) nonEmptyBoxMax - Max corner for non empty box in volume
   */
  computeGeometryUVs(nonEmptyBoxMin, nonEmptyBoxMax) {
    this.geometry.computeBoundingBox();

    const VAL_3 = 3;
    const HALF = 0.5;

    const max = this.geometry.boundingBox.max;
    const min = this.geometry.boundingBox.min;
    const offset = new THREE.Vector3(0 - min.x, 0 - min.y, 0 - min.z);
    const range = new THREE.Vector3(max.x - min.x, max.y - min.y, max.z - min.z);
    const uvw = new Float32Array(this.geometry.getAttribute('position').count * VAL_3);
    this.geo_offset1 = new THREE.Vector3(0, 0, 0);
    this.geo_offset1 = offset;
    this.geo_offset2 = new THREE.Vector3(0, 0, 0);
    this.geo_offset2.x = nonEmptyBoxMin.x + HALF;
    this.geo_offset2.y = nonEmptyBoxMin.y - HALF;
    this.geo_offset2.z = nonEmptyBoxMin.z - HALF;
    this.geo_scale = new THREE.Vector3(0, 0, 0);
    this.geo_scale.x = (nonEmptyBoxMax.x - nonEmptyBoxMin.x) / range.x;
    this.geo_scale.y = (nonEmptyBoxMax.y - nonEmptyBoxMin.y) / range.y;
    this.geo_scale.z = (nonEmptyBoxMax.z - nonEmptyBoxMin.z) / range.z;

    for (let i = 0; i < this.geometry.getAttribute('position').count; i++) {
      const vx = this.geometry.getAttribute('position').getX(i);
      const vy = this.geometry.getAttribute('position').getY(i);
      const vz = this.geometry.getAttribute('position').getZ(i);
      // eslint-disable-next-line
      uvw[i * VAL_3 + 0] = -(vx + this.geo_offset1.x) * this.geo_scale.x + this.geo_offset2.x;
      // eslint-disable-next-line
      uvw[i * VAL_3 + 1] = (vy + this.geo_offset1.y) * this.geo_scale.y + this.geo_offset2.y;
      // eslint-disable-next-line
      uvw[i * VAL_3 + 2] = (vz + this.geo_offset1.z) * this.geo_scale.z + this.geo_offset2.z;
      /*
      uvw[i * VAL_3 + 0] = -vx;
      // eslint-disable-next-line
      uvw[i * VAL_3 + 1] = vy;
      // eslint-disable-next-line
      uvw[i * VAL_3 + 2] = vz;

      uvw[i * VAL_3 + 0] = -(vx + offset.x) * (nonEmptyBoxMax.x - nonEmptyBoxMin.x) / range.x + nonEmptyBoxMin.x + HALF;
      // eslint-disable-next-line
      uvw[i * VAL_3 + 1] = (vy + offset.y) * (nonEmptyBoxMax.y - nonEmptyBoxMin.y) / range.y + nonEmptyBoxMin.y - HALF;
      // eslint-disable-next-line
      uvw[i * VAL_3 + 2] = (vz + offset.z) * (nonEmptyBoxMax.z - nonEmptyBoxMin.z) / range.z + nonEmptyBoxMin.z - HALF;
      */
    }
    this.geometry.addAttribute('uvw', new THREE.BufferAttribute(uvw, VAL_3));
    this.geometry.getAttribute('uvw').needsUpdate = true;
  }

  createClipPlaneGeometry() {
    const matClipPlane = new MaterialClipPlane();
    matClipPlane.create((mat) => {
      // eslint-disable-next-line
      this.planeGeometry = new THREE.PlaneBufferGeometry(2, 2);
      const plane = new THREE.Mesh(this.planeGeometry, mat);
      this.sceneClipPlane.add(plane);
    });
  }
  updateClipPlaneGeometry() {
    const VAL_3 = 3;
    const uvw = new Float32Array(this.planeGeometry.getAttribute('position').count * VAL_3);
    const l2w = new THREE.Matrix4();
    l2w.getInverse(this.mesh.matrix);
    const invPerspective = new THREE.Matrix4();
    invPerspective.getInverse(this.camera.projectionMatrix);
    const invView = new THREE.Matrix4();
    invView.copy(this.camera.matrixWorld);
    for (let i = 0; i < this.planeGeometry.getAttribute('position').count; i++) {
      const v = new THREE.Vector3();
      const SOME_SMALL_ADD = 0.001;
      v.x = this.planeGeometry.getAttribute('position').getX(i);
      v.y = this.planeGeometry.getAttribute('position').getY(i);
      v.z = this.planeGeometry.getAttribute('position').getZ(i) + SOME_SMALL_ADD;
      v.applyMatrix4(invPerspective);
      v.applyMatrix4(invView);
      v.applyMatrix4(l2w);
      uvw[i * VAL_3 + 0] = -(v.x + this.geo_offset1.x) * this.geo_scale.x + this.geo_offset2.x;
      // eslint-disable-next-line
      uvw[i * VAL_3 + 1] = (v.y + this.geo_offset1.y) * this.geo_scale.y + this.geo_offset2.y;
      // eslint-disable-next-line
      uvw[i * VAL_3 + 2] = (v.z + this.geo_offset1.z) * this.geo_scale.z + this.geo_offset2.z;
      /*
      // eslint-disable-next-line
      uvw[i * VAL_3 + 0] = -v.x;
      // eslint-disable-next-line
      uvw[i * VAL_3 + 1] = v.y;
      // eslint-disable-next-line
      uvw[i * VAL_3 + 2] = v.z;
      */
    }
    this.planeGeometry.addAttribute('uvw', new THREE.BufferAttribute(uvw, VAL_3));
    this.planeGeometry.getAttribute('uvw').needsUpdate = true;
  }

  /**
   * Create geometry and materials for 3D rendering
   * @param (object) window - browser related
   * @param (object) box - physic volume box dimensions
   * @param (object) nonEmptyBoxMin - Min corner for non empty box in volume
   * @param (object) nonEmptyBoxMin - Min corner for non empty box in volume
   * @param (bool) isRoiVolume) - is roi volume
   */
  callbackCreateCubeVolumeBF(window, box, nonEmptyBoxMin, nonEmptyBoxMax, isRoiVolume = false) {
    this.sceneReadyCounter = 0;
    this.renderCounter = 0;
    let matBfThreeGS = null;
    let matFfThreeGS = null;
    let matRenderToTextureThreeGS = null;
    let matIntetpl = null;
    let matSkullThreeGS = null;
    if (this.sceneClipPlane) {
      this.sceneClipPlane = new THREE.Scene();
    }
    this.createClipPlaneGeometry();
    if (!this.scene) {
      return;
    }
    // remove old mesh
    if (this.mesh !== null) {
      this.scene.remove(this.mesh);
    }
    if (this.geometry !== null) {
      this.geometry.dispose();
    }
    this.mesh = null;
    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    let sideMax = (box.x > box.y) ? box.x : box.y;
    sideMax = (box.z > sideMax) ? box.z : sideMax;
    const vBoxVirt = {
      x: box.x / sideMax,
      y: box.y / sideMax,
      z: box.z / sideMax,
    };
    this.geometry.fromGeometry(new THREE.BoxGeometry(vBoxVirt.x, vBoxVirt.y, vBoxVirt.z));
    // Compute texture coordinates
    this.computeGeometryUVs(nonEmptyBoxMin, nonEmptyBoxMax);
    // Set camera
    // eslint-disable-next-line
    this.camera.position.set(0.0, 0.0, 1.5);
    // eslint-disable-next-line
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
    // Create 3D texture
    const header = this.engine2d.m_volumeHeader;
    const xDim = header.m_pixelWidth;
    const yDim = header.m_pixelHeight;
    const zDim = header.m_pixelDepth;
    const zDimSqrt = Math.ceil(Math.sqrt(zDim));
    if (this.volTexture) {
      this.volTexture.dispose();
    }
    this.isRoiVolume = isRoiVolume;
    this.roiPalette = null;
    if (isRoiVolume === true) {
      const palette = new RoiPalette();
      this.roiPalette = palette.getPalette256();
      const BYTES_PER_COLOR = 4;
      const MAGIC_COLOR = 250;
      const OFFS_0 = 0;
      const OFFS_1 = 1;
      const OFFS_2 = 2;

      const palB = this.roiPalette[MAGIC_COLOR * BYTES_PER_COLOR + OFFS_0];
      const palG = this.roiPalette[MAGIC_COLOR * BYTES_PER_COLOR + OFFS_1];
      const palR = this.roiPalette[MAGIC_COLOR * BYTES_PER_COLOR + OFFS_2];
      console.log(`RoiPalette: pal[250] = ${palR}, ${palG}, ${palB}`);
    }
    this.volumeUpdater = new VolumeFilter3D();
    this.engine2d.volumeUpdater = this.volumeUpdater;

    this.volTexture = this.volumeUpdater.createUpdatableVolumeTex(this.engine2d, isRoiVolume, this.roiPalette);
    this.origVolumeTex = this.volumeUpdater.origVolumeTex;
    this.texTF = this.volumeUpdater.createTransferFuncTexture();
    this.volTextureMask = this.volumeUpdater.createUpdatableVolumeMask(this.engine2d);

    if (this.renderer.getContext().getExtension('OES_texture_float')) {
      if (this.bfTexture) {
        this.bfTexture.dispose();
      }
      // Create Render Target for back face render
      //this.bfTexture = new THREE.WebGLRenderTarget(this.windowWidth * window.devicePixelRatio,
      //this.windowHeight * window.devicePixelRatio, {
      this.bfTexture = new THREE.WebGLRenderTarget(this.windowWidth, this.windowHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: false,
      });
      const VAL_4 = 4;
      this.bufferBFTextureCPU = new Float32Array(VAL_4 * this.windowWidth * this.windowHeight);

      if (this.ffTexture) {
        this.ffTexture.dispose();
      }
      // Create Render Target for front face render
      //this.ffTexture = new THREE.WebGLRenderTarget(this.windowWidth * window.devicePixelRatio,
      //this.windowHeight * window.devicePixelRatio, {
      this.ffTexture = new THREE.WebGLRenderTarget(this.windowWidth,
        this.windowHeight, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          type: THREE.FloatType,
          depthBuffer: false,
        });
      this.bufferFFTextureCPU = new Float32Array(VAL_4 * this.windowWidth * this.windowHeight);

      if (this.renderfTexture) {
        this.renderToTexture.dispose();
      }
      // Create Render Target for volume render to texture
      const VAL_3 = 3;
      this.xSmallTexSize = Math.floor(this.windowWidth / VAL_3);
      this.ySmallTexSize = Math.floor(this.windowHeight / VAL_3);
      //this.renderToTexture = new THREE.WebGLRenderTarget((this.windowWidth * window.devicePixelRatio) / VAL_3,
      //(this.windowHeight * window.devicePixelRatio) / VAL_3, {
      this.renderToTexture = new THREE.WebGLRenderTarget(this.xSmallTexSize,
        this.ySmallTexSize, {
          minFilter: THREE.NearestFilter,
          magFilter: THREE.NearestFilter,
          format: THREE.RGBAFormat,
          type: THREE.FloatType,
          depthBuffer: false,
        });
      this.bufferRenderToTextureCPU = new Float32Array(VAL_4 * this.xSmallTexSize * this.ySmallTexSize);
    } else {
      console.log('cant create float texture');
    }

    // Create material for back face render
    matBfThreeGS = new MaterialBF();
    matBfThreeGS.create((mat) => {
      this.matBF = mat;
      this.sceneReadyCounter++;
    });

    // Create material for front face render
    matFfThreeGS = new MaterialFF();
    matFfThreeGS.m_uniforms.PlaneX.value = new THREE.Vector4(-1.0, 0.0, 0.0, 0.5);
    matFfThreeGS.m_uniforms.PlaneY.value = new THREE.Vector4(0.0, -1.0, 0.0, 0.5);
    matFfThreeGS.m_uniforms.PlaneZ.value = new THREE.Vector4(0.0, 0.0, -1.0, 0.5);
    matFfThreeGS.create(this.bfTexture, (mat) => {
      this.matFF = mat;
      this.sceneReadyCounter++;
    });

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry);
    this.mesh.rotation.y += this.curFileDataType.startRotY;
    this.mesh.rotation.x += this.curFileDataType.startRotX;
    console.log(`startRot = ${this.curFileDataType.startRotX} ${this.curFileDataType.startRotY}`);
    this.orbitControl.setMesh(this.mesh);

    // Create material for volume render to texture
    const offsets = [];
    const nOffs = 64;
    // create offsets for ssao
    for (let i = 0; i < nOffs; ++i) {
      // eslint-disable-next-line
      const x = Math.random() * 2 - 1;
      // eslint-disable-next-line
      const y = Math.random() * 2 - 1;
      // eslint-disable-next-line
//      const z = Math.random() * 2 - 1;
      const z = -Math.random();
      offsets.push(new THREE.Vector3(x, y, z));
    }
    matRenderToTextureThreeGS = new MaterialRenderToTexture();
    matRenderToTextureThreeGS.m_uniforms.colorMap1D.value = this.colorMapTexture;
    matRenderToTextureThreeGS.create(this.texTF, this.volTexture,
      this.volTextureMask, this.bfTexture, this.ffTexture, offsets,
      (mat) => {
        mat.uniforms.t_function1min.value =
          new THREE.Vector4(VOLUME_COLOR1_MIN_R, VOLUME_COLOR1_MIN_G, VOLUME_COLOR1_MIN_B,
            this.curFileDataType.thresholdTissue1);
        mat.uniforms.t_function1max.value =
          new THREE.Vector4(VOLUME_COLOR1_MAX_R, VOLUME_COLOR1_MAX_G, VOLUME_COLOR1_MAX_B,
            this.curFileDataType.thresholdTissue2);
        mat.uniforms.t_function2min.value =
          new THREE.Vector4(VOLUME_COLOR2_MIN_R, VOLUME_COLOR2_MIN_G, VOLUME_COLOR2_MIN_B,
            this.curFileDataType.thresholdIsosurf);
        mat.uniforms.t_function2max.value =
          new THREE.Vector4(VOLUME_COLOR2_MAX_R, VOLUME_COLOR2_MAX_G, VOLUME_COLOR2_MAX_B,
            this.curFileDataType.thresholdIsosurf);
        mat.uniforms.stepSize.value =
          new THREE.Vector4(STEP_SIZE1, STEP_SIZE2, STEP_SIZE3, STEP_SIZE4);
        mat.uniforms.texSize.value = this.engine2d.m_volumeHeader.m_pixelWidth;
        mat.uniforms.isoThreshold.value = this.curFileDataType.thresholdIsosurf;
        mat.uniforms.brightness3D.value = this.curFileDataType.brightness;
        mat.uniforms.opacityBarrier.value = OPACITY_SCALE * this.curFileDataType.opacityTissue;
        mat.uniforms.tileCountX.value = zDimSqrt;
        mat.uniforms.volumeSizeZ.value = zDim;

        mat.uniforms.xDim.value = xDim;
        mat.uniforms.yDim.value = yDim;

        mat.uniforms.lightDir.value = new THREE.Vector3(this.curFileDataType.lightDirComp,
          this.curFileDataType.lightDirComp, this.curFileDataType.lightDirComp);
        mat.uniforms.needsUpdate = true;
        this.matRenderToTexture = mat;
        this.sceneReadyCounter++;
      });

    // Create material for interpolation
    matIntetpl = new MaterialInterpolation();
    const VAL_3 = 3.0;
    matIntetpl.m_uniforms.isoSurfTexel.value = new THREE.Vector2(VAL_3 / this.windowWidth,
      VAL_3 / this.windowHeight);
    matIntetpl.create(this.renderToTexture, (mat) => {
      mat.uniforms.needsUpdate = true;
      this.matInterpolation = mat;
      this.sceneReadyCounter++;
    });

    // Create material for main pass of volume render
    matSkullThreeGS = new MaterialVolumeRender();
    matSkullThreeGS.m_uniforms.isoSurfTexel.value = new THREE.Vector2(VAL_3 / this.windowWidth,
      VAL_3 / this.windowHeight);
    matSkullThreeGS.m_uniforms.colorMap1D.value = this.colorMapTexture;
    matSkullThreeGS.create(this.texTF, this.volTexture,
      this.volTextureMask, this.bfTexture, this.ffTexture,
      this.renderToTexture, offsets, (mat) => {
        mat.uniforms.t_function1min.value =
          new THREE.Vector4(VOLUME_COLOR1_MIN_R, VOLUME_COLOR1_MIN_G, VOLUME_COLOR1_MIN_B,
            this.curFileDataType.thresholdTissue1);
        mat.uniforms.t_function1max.value =
          new THREE.Vector4(VOLUME_COLOR1_MAX_R, VOLUME_COLOR1_MAX_G, VOLUME_COLOR1_MAX_B,
            this.curFileDataType.thresholdTissue2);
        mat.uniforms.t_function2min.value =
          new THREE.Vector4(VOLUME_COLOR2_MIN_R, VOLUME_COLOR2_MIN_G, VOLUME_COLOR2_MIN_B,
            this.curFileDataType.thresholdIsosurf);
        mat.uniforms.t_function2max.value =
          new THREE.Vector4(VOLUME_COLOR2_MAX_R, VOLUME_COLOR2_MAX_G, VOLUME_COLOR2_MAX_B,
            this.curFileDataType.thresholdIsosurf);
        mat.uniforms.stepSize.value =
          new THREE.Vector4(STEP_SIZE1, STEP_SIZE2, STEP_SIZE3, STEP_SIZE4);
        mat.uniforms.texSize.value = this.engine2d.m_volumeHeader.m_pixelWidth;
        mat.uniforms.isoThreshold.value = this.curFileDataType.thresholdIsosurf;
        mat.uniforms.brightness3D.value = this.curFileDataType.brightness;
        mat.uniforms.tileCountX.value = zDimSqrt;
        mat.uniforms.volumeSizeZ.value = zDim;

        mat.uniforms.xDim.value = xDim;
        mat.uniforms.yDim.value = yDim;

        mat.uniforms.opacityBarrier.value = OPACITY_SCALE * this.curFileDataType.opacityTissue;
        mat.uniforms.lightDir.value = new THREE.Vector3(this.curFileDataType.lightDirComp,
          this.curFileDataType.lightDirComp, this.curFileDataType.lightDirComp);
        mat.uniforms.needsUpdate = true;
        this.scene.add(this.mesh);
        this.matVolumeRender = mat;
        this.mesh.material = this.matVolumeRender;
        this.sceneReadyCounter++;
      });
  } // callbackCreateCubeVolume


  /**
   * Creates transfer function color map
   * @param ctrlPts Array of control points of type HEX  = color value
   */
  setTransferFuncColors(ctrlPtsColorsHex) {
    this.volumeUpdater.setTransferFuncColors(ctrlPtsColorsHex);
  }

  /**
   * Creates transfer function color map
   * @param ctrlPts Array of Vector2 where (x,y) = x coordinate in [0, 1], alpha value in [0, 1]
   * //intensity [0,255] opacity [0,1]
   */
  updateTransferFuncTexture(intensities, opacities) {
    return this.volumeUpdater.updateTransferFuncTexture(intensities, opacities);
  }

  /**
   * Rotate Cut Plane (Rotation is inverse to the object)
   */
  updateCutPlanes() {
    if (!this.mesh) {
      return;
    }
    const mtx = new THREE.Matrix4();
    mtx.getInverse(mtx.extractRotation(this.mesh.matrix));
    const xAxis = new THREE.Vector3(-1.0, 0.0, 0.0);
    const yAxis = new THREE.Vector3(0.0, -1.0, 0.0);
    const zAxis = new THREE.Vector3(0.0, 0.0, -1.0);
    const centerPt = new THREE.Vector3().copy(this.planeCenterPt);
    centerPt.applyMatrix4(mtx);
    xAxis.applyMatrix4(mtx);
    yAxis.applyMatrix4(mtx);
    zAxis.applyMatrix4(mtx);
    this.matFF.uniforms.PlaneX.value.x = xAxis.x;
    this.matFF.uniforms.PlaneX.value.y = xAxis.y;
    this.matFF.uniforms.PlaneX.value.z = xAxis.z;
    this.matFF.uniforms.PlaneX.value.w = -centerPt.dot(xAxis);

    this.matFF.uniforms.PlaneY.value.x = yAxis.x;
    this.matFF.uniforms.PlaneY.value.y = yAxis.y;
    this.matFF.uniforms.PlaneY.value.z = yAxis.z;
    this.matFF.uniforms.PlaneY.value.w = -centerPt.dot(yAxis);

    this.matFF.uniforms.PlaneZ.value.x = -zAxis.x;
    this.matFF.uniforms.PlaneZ.value.y = zAxis.y;
    this.matFF.uniforms.PlaneZ.value.z = zAxis.z;
    this.matFF.uniforms.PlaneZ.value.w = -centerPt.dot(zAxis);
  }

  /**
   * Rotate light direction (Rotation is inverse to the object)
   */
  updateLightDir() {
    if (!this.mesh) {
      console.log('UpdateLightDir call mesh is not created');
      return;
    }

    const mtx = new THREE.Matrix4();
    mtx.getInverse(mtx.extractRotation(this.mesh.matrix));
    const lightDir = new THREE.Vector3(1.0, 1.0, 1.0);
    lightDir.normalize();
    lightDir.applyMatrix4(mtx);
    lightDir.x = -lightDir.x;
    this.matRenderToTexture.uniforms.lightDir.value = lightDir;
    this.matRenderToTexture.uniforms.lightDir.needsUpdate = true;
    this.matVolumeRender.uniforms.lightDir.value = lightDir;
    this.matVolumeRender.uniforms.lightDir.needsUpdate = true;
  }

  /** Check is scene ready to render */
  isReadyToRender() {
    if (this.sceneReadyCounter !== SCENE_READY_COUNTER_OK) {
      return false;
    }
    const matReady = (this.matVolumeRender !== null) && (this.matBF !== null) &&
      (this.matFF !== null) && (this.matRenderToTexture !== null);
    if (!matReady) {
      return false;
    }
    if (this.checkFrameBufferMode !== CHECK_MODE_RESULT_OK) {
      return false;
    }
    // give some frames to render
    const MIN_FRAMES_TO_APPEAR_ON_SCREEN = 32;
    if (this.renderCounter < MIN_FRAMES_TO_APPEAR_ON_SCREEN) {
      return false;
    }
    return true;
  }

  /** Render 3d scene */
  render() {
    if (this.sceneReadyCounter !== SCENE_READY_COUNTER_OK) {
      // render empty scene to show "black" empty screen
      this.renderer.render(this.scene, this.camera);
      return;
    }
    const matReady = (this.matVolumeRender !== null) && (this.matBF !== null) &&
      (this.matFF !== null) && (this.matRenderToTexture !== null);
    if (!matReady) {
      // do nothing
    } else {
      // check once render target
      if (this.checkFrameBufferMode === CHECK_MODE_NOT_CHECKED) {
        const isGood = GlCheck.checkFrameBuffer(this.renderer, this.bfTexture);
        this.checkFrameBufferMode = (isGood) ? CHECK_MODE_RESULT_OK : CHECK_MODE_RESULT_BAD;
        if (this.checkFrameBufferMode === CHECK_MODE_RESULT_BAD) {
          const strTitle = 'Device video card problem';
          const strLog = 'Cant setup render framebuffer. Application can not run in this browser/device';
          swal({
            title: strTitle,
            text: strLog,
            icon: 'error',
            button: 'continue',
          });
        }
      }
      this.updateClipPlaneGeometry();
      this.renderer.clearTarget(this.bfTexture);
      this.scene.overrideMaterial = this.matBF;
      this.renderer.render(this.scene, this.camera, this.bfTexture);
      const glC = this.renderer.getContext();
      if (this.isEraseMode && !this.lockEraserBuffersUpdating) {
        glC.readPixels(0, 0, this.windowWidth, this.windowHeight, glC.RGBA, glC.FLOAT, this.bufferBFTextureCPU);
      }
      this.renderer.clearTarget(this.ffTexture);
      // render clip plane without depth test
      this.renderer.render(this.sceneClipPlane, this.camera, this.ffTexture);
      // enable test again
      this.scene.overrideMaterial = this.matFF;
      this.renderer.render(this.scene, this.camera, this.ffTexture);
      if (this.isEraseMode && !this.lockEraserBuffersUpdating) {
        glC.readPixels(0, 0, this.windowWidth, this.windowHeight, glC.RGBA, glC.FLOAT, this.bufferFFTextureCPU);
      }
      this.renderer.clearTarget(this.renderfTexture);
      this.scene.overrideMaterial = this.matRenderToTexture;
      this.renderer.render(this.scene, this.camera, this.renderToTexture);
      if (this.isEraseMode && !this.lockEraserBuffersUpdating) {
        glC.readPixels(0, 0, this.xSmallTexSize, this.ySmallTexSize, glC.RGBA, glC.FLOAT,
          this.bufferRenderToTextureCPU);
      }
      // get a reference to the internal WebGL rendering context
      const gl = this.renderer.context;

      // enable stencil test
      const FF_VAL = 0xff;
      gl.clearStencil(0);
      gl.enable(gl.STENCIL_TEST);
      gl.stencilFunc(gl.ALWAYS, 1, FF_VAL);
      gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
      this.scene.overrideMaterial = this.matInterpolation;
      this.renderer.render(this.scene, this.camera);

      // change stencil function and operation for testing
      gl.stencilFunc(gl.EQUAL, 0, FF_VAL);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      // this.scene.overrideMaterial = this.matVolumeRender;
      this.scene.overrideMaterial = null;
      this.renderer.render(this.scene, this.camera);

      // disable stencil test
      gl.disable(gl.STENCIL_TEST);
      this.renderCounter++;
    }
  }
  setStepsize(sliderValue) {
    const scaleY = 2.0;
    this.matRenderToTexture.uniforms.stepSize.value = new THREE.Vector4(1.0 / sliderValue,
      1.0 / sliderValue, scaleY / sliderValue, 1.0 / sliderValue);
    this.matRenderToTexture.uniforms.needsUpdate = true;
    this.matVolumeRender.uniforms.stepSize.value = new THREE.Vector4(1.0 / sliderValue,
      1.0 / sliderValue, 1.0 / sliderValue, 1.0 / sliderValue);
    this.matVolumeRender.uniforms.needsUpdate = true;
  }
  /**
   * Keyboard event handler
   * @param (number) keyCode - keyboard code
   * @param (Boolean) debug - true if debug false otherwise
   */
  /*  onKeyDown(keyCode, debug) {
    const KEY_CODE_E = 69;
    if (debug) {
      if (keyCode === KEY_CODE_E) {
        this.isEraseMode = !this.isEraseMode;
        console.log(`Erase mode: ${this.isEraseMode}`);
      } // if pressed 'E' key
    }
  }
  */
  /*eslint-disable no-unused-vars*/
  onKeyDown(keyCode, debug) {
  }

  setEraserMode(isOn) {
    const lastState = this.isEraseMode;
    this.isEraseMode = isOn;
    this.orbitControl.setEraserMode(isOn);
    //console.log(`Erase mode: ${this.isEraseMode}`);
    if (!lastState && isOn) {
      this.render();
    }
    if (isOn) {
      this.setMaskFlag(1);
    } else {
      this.setMaskFlag(0);
    }
  }

  resetEraser() {
    this.volumeUpdater.resetBufferTextureCPU();
    this.render();
  }

  undoEraser() {
    this.volumeUpdater.undoLastErasing();
  }

  setEraserNormalMode(isNormalMode) {
    this.eraserNormalMode = isNormalMode;
    //console.log(`Normal mode: ${this.eraserNormalMode}`);
  }

  setEraserRadius(radius) {
    this.eraserRadius = radius;
    //console.log(`Eraser radius: ${this.eraserRadius}`);
  }

  setEraserDepth(depth) {
    this.eraserDepth = depth;
    //console.log(`Eraser depth: ${this.eraserDepth}`);
  }
  onMouseDown(xx, yy, ctrlKey) {
    const x =  Math.round(xx);
    const y =  Math.round(yy);
    if (this.mouseupflag === true) {
      this.mouseupflag = false;
    }
    if (this.checkFrameBufferMode !== CHECK_MODE_RESULT_OK) {
      return;
    }

    this.renderState = this.RENDER_STATE.ENABLED;
    this.eraserMouseDown = true;
    if (this.isEraseMode && ctrlKey) {
      const OFF0 = 0;
      const OFF1 = 1;
      const OFF2 = 2;
      const OFF3 = 3;
      const GPU_CELL_SIZE = 4;

      this.lockEraserBuffersUpdating = true;
      //console.log(`Small Tex Size: ${this.xSmallTexSize} x ${this.ySmallTexSize}`);
      //console.log(`Erasing! X: ${x} Y: ${y}`);

      const cellInd = (y * this.windowWidth + x) * GPU_CELL_SIZE;
      const THREE3 = 3;
      const bigCellInd = (Math.floor(y / THREE3) * this.xSmallTexSize +
        Math.floor(x / THREE3)) * GPU_CELL_SIZE;

      //console.log("Dist: " + this.bufferRenderToTextureCPU[bigCellInd + OFF3]);
      const NO_MATERIAL = 2;
      if (this.bufferRenderToTextureCPU[bigCellInd + OFF3] === NO_MATERIAL) {
        return;
      }
      let vX = this.bufferBFTextureCPU[cellInd + OFF0] - this.bufferFFTextureCPU[cellInd + OFF0];
      let vY = this.bufferBFTextureCPU[cellInd + OFF1] - this.bufferFFTextureCPU[cellInd + OFF1];
      let vZ = this.bufferBFTextureCPU[cellInd + OFF2] - this.bufferFFTextureCPU[cellInd + OFF2];
      const vDir = new THREE.Vector3(vX, vY, vZ);
      //console.log("Vec: " + vX + "; " + vY + "; " + vZ);
      const length = Math.sqrt(vX * vX + vY * vY + vZ * vZ);
      const COORD_SHIFT = 0.5;
      vX = vX / length * this.bufferRenderToTextureCPU[bigCellInd + OFF3] + COORD_SHIFT +
        this.bufferFFTextureCPU[cellInd + OFF0];
      vY = vY / length * this.bufferRenderToTextureCPU[bigCellInd + OFF3] + COORD_SHIFT +
        this.bufferFFTextureCPU[cellInd + OFF1];
      vZ = vZ / length * this.bufferRenderToTextureCPU[bigCellInd + OFF3] + COORD_SHIFT +
        this.bufferFFTextureCPU[cellInd + OFF2];
      if (this.eraserNormalMode) {
        this.volumeUpdater.erasePixels(vX, vY, vZ, this.eraserRadius, this.eraserDepth, vDir,
          this.matVolumeRender.uniforms.isoThreshold.value, true, false, true);
      } else {
        this.volumeUpdater.erasePixels(vX, vY, vZ, this.eraserRadius, this.eraserDepth, vDir,
          this.matVolumeRender.uniforms.isoThreshold.value, true, false, false);
      }
    }
  }

  onMouseMove(xx, yy, ctrlKey) {
    const x =  Math.round(xx);
    const y =  Math.round(yy);
    if (this.checkFrameBufferMode !== CHECK_MODE_RESULT_OK) {
      return;
    }

    this.renderState = this.RENDER_STATE.ENABLED;
    if (this.isEraseMode && this.eraserMouseDown && ctrlKey) {
      const OFF0 = 0;
      const OFF1 = 1;
      const OFF2 = 2;
      const OFF3 = 3;
      const GPU_CELL_SIZE = 4;

      //console.log(`Small Tex Size: ${this.xSmallTexSize} x ${this.ySmallTexSize}`);
      //console.log(`Erasing! X: ${x} Y: ${y}`);

      const cellInd = (y * this.windowWidth + x) * GPU_CELL_SIZE;
      const THREE3 = 3;
      const bigCellInd = (Math.floor(y / THREE3) * this.xSmallTexSize +
        Math.floor(x / THREE3)) * GPU_CELL_SIZE;
      const NO_MATERIAL = 2;
      if (this.bufferRenderToTextureCPU[bigCellInd + OFF3] === NO_MATERIAL) {
        return;
      }
      let vX = this.bufferBFTextureCPU[cellInd + OFF0] - this.bufferFFTextureCPU[cellInd + OFF0];
      let vY = this.bufferBFTextureCPU[cellInd + OFF1] - this.bufferFFTextureCPU[cellInd + OFF1];
      let vZ = this.bufferBFTextureCPU[cellInd + OFF2] - this.bufferFFTextureCPU[cellInd + OFF2];
      const vDir = new THREE.Vector3(vX, vY, vZ);
      //console.log("Vec: " + vX + "; " + vY + "; " + vZ);
      const length = Math.sqrt(vX * vX + vY * vY + vZ * vZ);
      const COORD_SHIFT = 0.5;
      vX = vX / length * this.bufferRenderToTextureCPU[bigCellInd + OFF3] + COORD_SHIFT +
        this.bufferFFTextureCPU[cellInd + OFF0];
      vY = vY / length * this.bufferRenderToTextureCPU[bigCellInd + OFF3] + COORD_SHIFT +
        this.bufferFFTextureCPU[cellInd + OFF1];
      vZ = vZ / length * this.bufferRenderToTextureCPU[bigCellInd + OFF3] + COORD_SHIFT +
        this.bufferFFTextureCPU[cellInd + OFF2];
      if (this.eraserNormalMode) {
        this.volumeUpdater.erasePixels(vX, vY, vZ, this.eraserRadius, this.eraserDepth, vDir,
          this.matVolumeRender.uniforms.isoThreshold.value, false, this.mouseupflag, true);
      } else {
        this.volumeUpdater.erasePixels(vX, vY, vZ, this.eraserRadius, this.eraserDepth, vDir,
          this.matVolumeRender.uniforms.isoThreshold.value, false, this.mouseupflag, false);
      }

    }
  }


  onMouseUp() {
    if (this.checkFrameBufferMode !== CHECK_MODE_RESULT_OK) {
      return;
    }
    this.lockEraserBuffersUpdating = false;
    this.eraserMouseDown = false;
    this.renderState = this.RENDER_STATE.ONCE;
    this.mouseupflag = true;
  }

  onMouseWheel(e) {
    if (this.checkFrameBufferMode !== CHECK_MODE_RESULT_OK) {
      return;
    }
    this.renderState = this.RENDER_STATE.ONCE;
    e.preventDefault();
  }
} // class Graphics3d
