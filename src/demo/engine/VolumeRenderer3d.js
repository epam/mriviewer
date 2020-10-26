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
 * @module app/scripts/engine/VolumeRenderer3d
 */

import * as THREE from 'three';
// import swal from 'sweetalert';

import GlSelector from './GlSelector';
import OrbitControl from './orbitcontrol';
import MaterialBF from './gfx/matbackface';
import MaterialFF from './gfx/matfrontface';
import MaterialWC from './gfx/matwireframecull';
import MaterialScreenTexMap from './gfx/matscreentexmapping';
import MaterialClipPlane from './gfx/matclipplane';
import MaterialRenderToTexture from './gfx/matrendertotexture';
import MaterialInterpolation from './gfx/matinterpolation';
import MaterialVolumeRender from './gfx/matvolumerender';
import VolumeFilter3D from './volumeFilter3d';
import RoiPalette from './loaders/roipalette';
import TetrahedronGenerator from './actvolume/tetra';
import Graphics23d from './tools23d/graphics23d';
// import MaterialColor2d from './gfx/matcolor2d';


// import GlCheck from './glcheck';
// import GeoRender from '../actvolume/georender';

/**  @constant {number} SCENE_3D_BACKGROUND_COLOR - backgroudn color for 3d window */
const SCENE_3D_BACKGROUND_COLOR = 0x0;
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
// const CHECK_MODE_RESULT_BAD = 2;

// When scene is ready (how much materials are created via arrow functions)
const SCENE_READY_COUNTER_OK = 5;

// Scene render type
const SCENE_TYPE_RAYCAST = 0;
const SCENE_TYPE_SPHERE = 1;

/** Class Graphics3d is used for 3d render */
export default class VolumeRenderer3d {

  /**
   * Initialize render
   * @param (object) props - object container for various properties
   * @param (object) curFileDataType - file type
   * @return {Object} Instance of this class (singleton)
   */
  constructor(props) {
    this.curFileDataType = props.curFileDataType;
    this.sceneReadyCounter = 0;
    this.renderCounter = 0;
    this.scene = new THREE.Scene();
    this.sceneClipPlane = new THREE.Scene();

    // tetra scene seems to be unused!
    // this.sceneTetra = new THREE.Scene();

    this.scene23D = new THREE.Scene();
    this.graphics23d = null;
    this.sceneSphere = new THREE.Scene();
    this.meshSphere = null;
    this.newScene = new THREE.Scene();
    this.renderScene = SCENE_TYPE_RAYCAST;

    this.planeGeometry = null;
    this.props = props;
    this.mesh = null;
    this.renderer = null;
    this.texTF = null;
    this.volTexture = null;
    this.origVolumeTex = null;
    this.texRoiId = null;
    this.texRoiColor = null;
    this.RoiVolumeTex = null;
    this.volTextureMask = null;
    this.texVolumeAO = null;
    this.bfTexture = null;
    this.ffTexture = null;
    this.renderToTexture = null;
    this.geometry = null;
    this.geometrySphere = null;
    this.geometryWireFrameSphere = null;
    this.matBF = null;
    this.matFF = null;
    this.matScreenTex = null;
    this.matWireFrame = null;
    this.matRenderToTexture = null;
    //this.matInterpolation = null;
    this.matVolumeRender = null;
    this.volumeUpdater = null;
    this.checkFrameBufferMode = CHECK_MODE_NOT_CHECKED;
    this.eraserStarted = false;
    this.lockEraserBuffersUpdating = false;

    // eslint-disable-next-line
    this.planeCenterPt = new THREE.Vector3(-0.5, -0.5, 0.5 * 1.4);
    // this.renderer = new THREE.WebGLRenderer({ antialias: false, logarithmicDepthBuffer: false });
    // this.renderer = new THREE.WebGLRenderer({ antialias: false }
    // this.canvas3d = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
    const glSelector = new GlSelector();
    this.context = glSelector.createWebGLContext();
    this.isWebGL2 = glSelector.useWebGL2();
    this.canvas3d = glSelector.getCanvas();
    this.renderer = new THREE.WebGLRenderer({
      antialias: false, canvas: this.canvas3d,
      preserveDrawingBuffer: true, context: this.context
    });
    this.renderer.autoClearStencil = false;
    this.renderer.autoClearColor = false;
    if (!this.renderer) {
      console.log('cant create 3d renderer');
    }

    // Assign current window to render area
    this.windowWidth = Math.floor(props.width);
    // eslint-disable-next-line
    this.windowHeight = Math.floor(props.height);
    // console.log("Window: " + this.windowWidth + "x" + this.windowHeight);
    console.log(`Window: ${this.windowWidth} x ${this.windowHeight}`);
    const camAspect = this.windowWidth / this.windowHeight;
    // eslint-disable-next-line
    this.camera = new THREE.PerspectiveCamera(60, camAspect, 0.01, 3);
    this.camera.position.z = 10;
    this.renderer.setSize(this.windowWidth, this.windowHeight);

    this.renderer.setClearColor(SCENE_3D_BACKGROUND_COLOR);

    /*if (root3dContainer.length === 1) {
      root3dContainer.append(this.renderer.domElement);
    } else {
      console.log('containter with id=med3web-container-3d not found in scene');
    }*/
    props.mount.appendChild(this.renderer.domElement);
    // When rotating an object, it is necessary to reverse the rotation of
    // the cutting plane and the direction vector onto the light source
    // this.orbitControl = new OrbitControl(root3dContainer, this.camera, this.scene, this.meshSphere, () => {
    this.orbitControl = new OrbitControl(this.renderer.domElement, this.camera, this.scene, this.mesh, () => {
      if (true) {
      //  if (this.checkFrameBufferMode === CHECK_MODE_RESULT_OK) {
        this.updateCutPlanes();
        this.updateLightDir();
        //this.updateMeshSphere();
      }
    });
    //this.orbitControl.addCallbacks();

    // tetra geometry seems to be unused!
    // this.createTetraGeometry();

    this.renderer.gammaInput = true;
    this.renderer.gammaOutput = true;

    this.RENDER_STATE = {
      ENABLED : 0,
      ONCE : 1,
      DISABLED : 2
    };

    this.renderState = this.RENDER_STATE.ENABLED;
    this.fps = 0;
    this.isoThreshold = 0.0;
    /*root3dContainer.on('mousedown', (event) => {
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
    root3dContainer.on('mousewheel', (e) => { this.onMouseWheel(e); });*/
    this.isEraseMode = false;
    this.eraserRadius = 10;
    this.eraserDepth = 20;
    this.eraserSrart = false;
    this.lockEraserBuffersUpdating = false;
    this.eraserMouseDown = false;
    this.m_eraser = null;

    this.isSculptingMode = false;
    this.sculptingCapturedVertex = null;
    this.sculptingSphereCenter = new THREE.Vector3(0.0, 0.0, 0.0);
    this.sculptingSphereSize = 1.0;
    this.vBoxVirt = {
      x: 1.0,
      y: 1.0,
      z: 1.0,
    };

  }
  setFileDataType(curFileDataType) {
    this.curFileDataType = curFileDataType;
  }
  /**
  * Special scene with sphere: remove old before adding new one
  */
  removeSphereFromSphereScene() {
    if (this.meshSphere !== null) {
      this.sceneSphere.remove(this.meshSphere);
    }
    this.meshSphere = null;
    this.geometrySphere = null;
  }
  /**
  * Special scene with sphere: add new generated Three js geometry (sphere)
  */
  addSphereToSphereScene() {
    const gen = new TetrahedronGenerator();
    const vRadius = new THREE.Vector3(0.5, 0.5, 0.5);
    const NUM_SUBDIVIDES = 2;
    const okCreateTetra = gen.create(vRadius, NUM_SUBDIVIDES);
    if (okCreateTetra < 1) {
      return okCreateTetra;
    }
    const numVertices = gen.getNumVertices();
    const numTriangles = gen.getNumTriangles();
    const INDICES_IN_TRI = 3;

    // console.log(`TetrahedronGenerator. numVertices = ${numVertices}, numTriangles = ${numTriangles}`);

    const NUM_0 = 0;
    const NUM_1 = 1;
    const NUM_2 = 2;
    const NUM_3 = 3;
    const positions = [];
    const indices = [];
    const normals = [];
    // copy vertices from generator
    for (let i = 0; i < numVertices; i++) {
      const vert = gen.getVertex(i);
      const vNew = new THREE.Vector3(vert.x, vert.y, vert.z);
      positions.push(vert.x, vert.y, vert.z);
      vNew.normalize();
      normals.push(vNew.x, vNew.y, vNew.z);
    } // for (i) all vertices
    // copy triangles from generator
    for (let i = 0, j = 0; i < numTriangles; i++, j += INDICES_IN_TRI) {
      const triIndices = gen.getTriangle(i);
      //const faceNew = new THREE.Face3(triIndices[NUM_0], triIndices[NUM_1], triIndices[NUM_2]);
      indices.push(triIndices[NUM_0], triIndices[NUM_1], triIndices[NUM_2]);
    } // for (i) all triangles
    // old style: buffered geometry
    this.geometrySphere = new THREE.BufferGeometry();
    const posAttribute = new Float32Array(positions);
    const normalsAttribute = new Float32Array(normals);
    const indAttribute = new Uint8Array(indices);

    this.geometrySphere.addAttribute('position', new THREE.BufferAttribute(posAttribute, NUM_3));
    this.geometrySphere.addAttribute('normal', new THREE.BufferAttribute(normalsAttribute, NUM_3));
    this.geometrySphere.setIndex(new THREE.BufferAttribute(indAttribute, 1));
    this.computeGeometrySphereUVs();
    this.meshSphere = new THREE.Mesh(this.geometrySphere);
    this.sceneSphere.add(this.meshSphere);
    return this.meshSphere;
  }
  /**
  * Special scene with sphere: copy rotated (by mouse) orientation from
  * main mesh to sphere mesh
  */
  updateMeshSphere() {
  /*
    if (this.meshSphere !== null) {
      const pos = this.mesh.position;
      const quat = this.mesh.quaternion;
      this.meshSphere.position.copy(pos);
      this.meshSphere.quaternion.copy(quat);
      this.meshSphere.updateMatrix();
    }
  */
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
  switchToTool23D(isTool23D) {
    this.Tool23D = isTool23D;
    if (this.Tool23D) {
      this.graphics23d = new Graphics23d(this.scene23D, this.windowWidth, this.windowHeight);
    }
    else {
      this.graphics23d = null;
    }
  }
  switchToVolumeRender() {
    if (this.matVolumeRender !== null && this.matRenderToTexture !== null) {
      if (this.isRoiVolume > 0) {
        this.matVolumeRender.defines.isoRenderFlag = 4;
        this.matVolumeRender.needsUpdate = true;
        //this.matInterpolation.defines.isoRenderFlag = 4;
        //this.matInterpolation.needsUpdate = true;
        this.matRenderToTexture.defines.isoRenderFlag = 4;
        this.matRenderToTexture.needsUpdate = true;
        this.renderState = this.RENDER_STATE.ONCE;
      } else {
        this.matVolumeRender.defines.isoRenderFlag = 0;
        this.matVolumeRender.needsUpdate = true;
        //this.matInterpolation.defines.isoRenderFlag = 0;
        //this.matInterpolation.needsUpdate = true;
        this.matRenderToTexture.defines.isoRenderFlag = 0;
        this.matRenderToTexture.needsUpdate = true;
        this.renderState = this.RENDER_STATE.ONCE;
      }
    }
  }
  /**
   * Setting a variable for conditional compilation (Full Volume Render)
   */
  switchToFullVolumeRender() {
    if (this.matVolumeRender !== null && this.matRenderToTexture !== null) {
      if (this.isRoiVolume > 0) {
        this.matVolumeRender.defines.isoRenderFlag = 4;
        this.matVolumeRender.needsUpdate = true;
        //this.matInterpolation.defines.isoRenderFlag = 4;
        //this.matInterpolation.needsUpdate = true;
        this.matRenderToTexture.defines.isoRenderFlag = 4;
        this.matRenderToTexture.needsUpdate = true;
        this.renderState = this.RENDER_STATE.ONCE;
      } else {
        this.matVolumeRender.defines.isoRenderFlag = 3;
        this.matVolumeRender.needsUpdate = true;
        //this.matInterpolation.defines.isoRenderFlag = 3;
        //this.matInterpolation.needsUpdate = true;
        this.matRenderToTexture.defines.isoRenderFlag = 3;
        this.matRenderToTexture.needsUpdate = true;
        this.renderState = this.RENDER_STATE.ONCE;
      }
    }
  }
  /**
   * Setting a variable for conditional compilation (Isosurface render)
   */
  switchToIsosurfRender() {
    if (this.matVolumeRender !== null && this.matRenderToTexture !== null) {
      if (this.isRoiVolume > 0) {
        this.matVolumeRender.defines.isoRenderFlag = 5;
        this.matVolumeRender.needsUpdate = true;
        //this.matInterpolation.defines.isoRenderFlag = 5;
        //this.matInterpolation.needsUpdate = true;
        this.matRenderToTexture.defines.isoRenderFlag = 5;
        this.matRenderToTexture.needsUpdate = true;
        this.renderState = this.RENDER_STATE.ONCE;
        this.volumeUpdater.switchToRoiMapRender();
      } else {
        this.matVolumeRender.defines.isoRenderFlag = 1;
        this.matVolumeRender.needsUpdate = true;
        //this.matInterpolation.defines.isoRenderFlag = 1;
        //this.matInterpolation.needsUpdate = true;
        this.matRenderToTexture.defines.isoRenderFlag = 1;
        this.matRenderToTexture.needsUpdate = true;
        this.renderState = this.RENDER_STATE.ONCE;
      }
    }
  }
  /**
   * Setting a variable for conditional compilation (Max projection render)
   */
  switchToFLATRender() {
    if (this.matVolumeRender !== null && this.matRenderToTexture !== null) {
      this.matVolumeRender.defines.isoRenderFlag = 2;
      this.matVolumeRender.needsUpdate = true;
      //this.matInterpolation.defines.isoRenderFlag = 2;
      //this.matInterpolation.needsUpdate = true;
      this.matRenderToTexture.defines.isoRenderFlag = 2;
      this.matRenderToTexture.needsUpdate = true;
      this.renderState = this.RENDER_STATE.ONCE;
    }
  }
  /**
   * Setting isosurface threshold
   */
  setIsoThresholdValue(sliderValue) {
    if (this.matVolumeRender !== null && this.matRenderToTexture !== null) {
      this.matRenderToTexture.uniforms.isoThreshold.value = sliderValue;
      this.matRenderToTexture.uniforms.isoThreshold.needsUpdate = true;
      this.matVolumeRender.uniforms.isoThreshold.value = sliderValue;
      this.matVolumeRender.uniforms.isoThreshold.needsUpdate = true;
      this.isoThreshold = sliderValue;
      this.renderState = this.RENDER_STATE.ONCE;
    }
  }
  /**
   * Setting volume opacity
   * @param (number) sliderValue - slider ration in 0..1
   */
  setOpacityBarrier(sliderValue) {
    if (this.matVolumeRender !== null && this.matRenderToTexture !== null) {
      this.matVolumeRender.uniforms.opacityBarrier.value = OPACITY_SCALE * sliderValue;
      this.matVolumeRender.uniforms.opacityBarrier.needsUpdate = true;
      this.matRenderToTexture.uniforms.opacityBarrier.value = OPACITY_SCALE * sliderValue;
      this.matRenderToTexture.uniforms.opacityBarrier.needsUpdate = true;
    }
  }
  /**
   * Setting Brightness
   * @param (number) value - brightness of ???
   */
  updateBrightness(value) {
    if (this.matRenderToTexture !== null) {
      this.matRenderToTexture.uniforms.brightness3D.value = value;
      this.matRenderToTexture.uniforms.brightness3D.needsUpdate = true;
    }
    if (this.matVolumeRender !== null) {
      this.matVolumeRender.uniforms.brightness3D.value = value;
      this.matVolumeRender.uniforms.brightness3D.needsUpdate = true;
      // this.volumeUpdater.updateVolumeTexture(0.1 + 1.5*value);
    }
  }
  /**
   * Setting Contrast
   * @param (number) value - constrast of ???
   */
  updateContrast(value) {
    if (this.matVolumeRender !== null && this.matRenderToTexture !== null) {
      this.matRenderToTexture.uniforms.contrast3D.value = value;
      this.matVolumeRender.uniforms.contrast3D.value = value;
      this.matRenderToTexture.uniforms.contrast3D.needsUpdate = true;
      this.matVolumeRender.uniforms.contrast3D.needsUpdate = true;
    }
  }
  setAmbientTextureMode(isoThreshold) {
    if (this.texVolumeAO) {
      this.texVolumeAO.dispose();
    }
    this.volumeUpdater.ambientTexture.set(this.volTexture, isoThreshold);
    this.texVolumeAO = this.volumeUpdater.ambientTexture.get();
    this.matRenderToTexture.defines.useAmbientTex = 1;
    this.matVolumeRender.defines.useAmbientTex = 1;
    this.matRenderToTexture.needsUpdate = true;
    this.matVolumeRender.needsUpdate = true;
    this.matRenderToTexture.uniforms.texVolumeAO.value = this.texVolumeAO;
    this.matRenderToTexture.uniforms.texVolumeAO.needsUpdate = true;
    this.matVolumeRender.uniforms.texVolumeAO.value = this.texVolumeAO;
    this.matVolumeRender.uniforms.texVolumeAO.needsUpdate = true;
  }
  offAmbientTextureMode() {
    if (this.texVolumeAO) {
      this.texVolumeAO.dispose();
    }
    this.matRenderToTexture.defines.useAmbientTex = 0;
    this.matVolumeRender.defines.useAmbientTex = 0;
    this.matRenderToTexture.needsUpdate = true;
    this.matVolumeRender.needsUpdate = true;
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
    if (this.matRenderToTexture !== null) {
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

    const NEED_GEO_UVW = true;
    if (NEED_GEO_UVW) {
      const uvw = new Float32Array(this.geometry.getAttribute('position').count * VAL_3);
      for (let i = 0; i < this.geometry.getAttribute('position').count; i++) {
        const vx = this.geometry.getAttribute('position').getX(i);
        const vy = this.geometry.getAttribute('position').getY(i);
        const vz = this.geometry.getAttribute('position').getZ(i);
        // eslint-disable-next-line
        uvw[i * VAL_3 + 0] = -vx;
        // eslint-disable-next-line
        uvw[i * VAL_3 + 1] = vy;
        // eslint-disable-next-line
        uvw[i * VAL_3 + 2] = vz;
      }
      this.geometry.addAttribute('uvw', new THREE.BufferAttribute(uvw, VAL_3));
      this.geometry.getAttribute('uvw').needsUpdate = true;
    }
  }
  computeGeometrySphereUVs() {
    const VAL_3 = 3;
    // Need calculate uvw coords for sphere geo
    const NEED_SPHERE_UVW = true;
    if (NEED_SPHERE_UVW) {
      // console.log(`vBoxVirt = ${this.vBoxVirt.x}, ${this.vBoxVirt.y}, ${this.vBoxVirt.z}`);
      const uvw = new Float32Array(this.geometrySphere.getAttribute('position').count * VAL_3);
      for (let i = 0; i < this.geometrySphere.getAttribute('position').count; i++) {
        const vx = this.geometrySphere.getAttribute('position').getX(i);
        const vy = this.geometrySphere.getAttribute('position').getY(i);
        const vz = this.geometrySphere.getAttribute('position').getZ(i);
        // eslint-disable-next-line
        uvw[i * VAL_3 + 0] = -vx / this.vBoxVirt.x;// / this.vBoxVirt.x; //-(vx + this.geo_offset1.x) * this.geo_scale.x  + this.geo_offset2.x;
        // eslint-disable-next-line
        uvw[i * VAL_3 + 1] = +vy / this.vBoxVirt.y;// / this.vBoxVirt.y; //(vy + this.geo_offset1.y) * this.geo_scale.y  + this.geo_offset2.y;
        // eslint-disable-next-line
        uvw[i * VAL_3 + 2] = +vz / this.vBoxVirt.z;// / this.vBoxVirt.z; //(vz + this.geo_offset1.z) * this.geo_scale.z  + this.geo_offset2.z;
      }
      this.geometrySphere.addAttribute('uvw', new THREE.BufferAttribute(uvw, VAL_3));
      this.geometrySphere.getAttribute('uvw').needsUpdate = true;
    }

    const NEED_FACE_VERTEX_UVW = false;
    if (NEED_FACE_VERTEX_UVW) {
      this.geometrySphere.faceVertexUvs = [];
      const numVertices = this.geometrySphere.vertices.count;
      const OFF_0 = 0, OFF_1 = 1, OFF_2 = 2;
      const uvw = new Float32Array(numVertices * VAL_3);
      let j = 0;
      for (let i = 0; i < numVertices; i++, j += VAL_3) {
        const vx = this.geometrySphere.vertices[i].x;
        const vy = this.geometrySphere.vertices[i].y;
        const vz = this.geometrySphere.vertices[i].z;
        // this.geometrySphere.faceVertexUvs.push(new THREE.Vector2(vx, vy));
        uvw[j + OFF_0] = -vx;
        uvw[j + OFF_1] = vy;
        uvw[j + OFF_2] = vz;
      } // for (i)
      // this.geometrySphere.addAttribute('uvw', new THREE.BufferAttribute(uvw, VAL_3));
      this.geometrySphere.uvw = uvw;
    } // if need face uv
  }
  createClipPlaneGeometry() {
    const matClipPlane = new MaterialClipPlane();
    matClipPlane.create(this.bfTexture, (mat) => {
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
      //v.applyMatrix4(this.getScreen2WorldTransform());
      //uvw[i * VAL_3 + 1] = (v.y + this.geo_offset1.y) * this.geo_scale.y + this.geo_offset2.y;
      //uvw[i * VAL_3 + 0] = -(v.x + this.geo_offset1.x) * this.geo_scale.x + this.geo_offset2.x;
      //// eslint-disable-next-line
      //uvw[i * VAL_3 + 1] = (v.y + this.geo_offset1.y) * this.geo_scale.y + this.geo_offset2.y;
      //// eslint-disable-next-line
      //uvw[i * VAL_3 + 2] = (v.z + this.geo_offset1.z) * this.geo_scale.z + this.geo_offset2.z;

      // eslint-disable-next-line
      uvw[i * VAL_3 + 0] = -v.x;
      // eslint-disable-next-line
      uvw[i * VAL_3 + 1] = v.y;
      // eslint-disable-next-line
      uvw[i * VAL_3 + 2] = v.z;

    }
    this.planeGeometry.addAttribute('uvw', new THREE.BufferAttribute(uvw, VAL_3));
    this.planeGeometry.getAttribute('uvw').needsUpdate = true;
  }
  getScreen2WorldTransform() {
    const l2w = new THREE.Matrix4();
    l2w.getInverse(this.mesh.matrix);
    const s2w = new THREE.Matrix4();
    s2w.getInverse(this.camera.projectionMatrix);
    const invView = new THREE.Matrix4();
    invView.copy(this.camera.matrixWorld);
    s2w.multiply(invView);
    s2w.multiply(l2w);
    return s2w;
  }
  /**
   * Create geometry and materials for 3D rendering
   * @param (object) box - physic volume box dimensions
   * @param (object) nonEmptyBoxMin - Min corner for non empty box in volume
   * @param (object) nonEmptyBoxMin - Min corner for non empty box in volume
   * @param (bool) isRoiVolume) - is roi volume
   */
  initWithVolume(volume, box, nonEmptyBoxMin, nonEmptyBoxMax, isRoiVolume, isFULL3D) {
    let sideMax = (box.x > box.y) ? box.x : box.y;
    sideMax = (box.z > sideMax) ? box.z : sideMax;
    this.vBoxVirt.x = box.x / sideMax;
    this.vBoxVirt.y = box.y / sideMax;
    this.vBoxVirt.z = box.z / sideMax;
    this.isoThreshold = this.curFileDataType.thresholdIsosurf;    
    this.volume = volume;
    this.nonEmptyBoxMin = nonEmptyBoxMin;
    this.nonEmptyBoxMax = nonEmptyBoxMax;
    // remove old sphere
    this.matWireFrame = null;
    this.removeSphereFromSphereScene();

    // create new sphere
    const matWCloader = new MaterialWC();
    this.matWireFrame = matWCloader.create(this.bfTexture, this.ffTexture);
    // const matColor = new MaterialColor2d();
    // this.matColor23d = matColor.create();

    /*
    console.log(`this.bfTexture`);
    if (this.bfTexture === null) {
      console.log(`this.bfTexture === null`);
      return 1;
    }
    */
    this.addSphereToSphereScene();

    this.renderScene = SCENE_TYPE_RAYCAST;
    this.sceneReadyCounter = 0;
    this.renderCounter = 0;
    let matBfThreeGS = null;
    let matFfThreeGS = null;
    let matIntetpl = null;
    let matScreenTex = null;
    if (this.sceneClipPlane) {
      this.sceneClipPlane = new THREE.Scene();
    }
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
    //this.geometry.fromGeometry(new THREE.BoxGeometry(this.vBoxVirt.x, this.vBoxVirt.y, this.vBoxVirt.z));
    this.geometry.fromGeometry(new THREE.BoxGeometry(1.0, 1.0, 1.0));
    // Compute texture coordinates

    // compute UVW
    this.computeGeometryUVs(nonEmptyBoxMin, nonEmptyBoxMax);
    this.geometry.scale(this.vBoxVirt.x, this.vBoxVirt.y, this.vBoxVirt.z);

    // Set camera
    // eslint-disable-next-line
    this.camera.position.set(0.0, 0.0, 1.5);
    // eslint-disable-next-line
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
    // Create 3D texture    
    const xDim = this.volume.m_xDim;
    const yDim = this.volume.m_yDim;
    const zDim = this.volume.m_zDim;
    console.log(`3D tex size = ${xDim} ${yDim} ${zDim}`);
    if (this.volTexture) {
      this.volTexture.dispose();
    }
    this.eraserStarted = false;
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
    // this.engine2d.volumeUpdater = this.volumeUpdater;
    /*const props = {
      volume: this.volume,
      isWebGL2: this.isWebGL2
    };*/
    this.volTexture = this.volumeUpdater.createUpdatableVolumeTex(this.volume, isRoiVolume, this.roiPalette);
    this.origVolumeTex = this.volumeUpdater.origVolumeTex;
    this.texTF = this.volumeUpdater.createTransferFuncTexture();
    //this.volTextureMask = this.volumeUpdater.createUpdatableVolumeMask(this.volume);

    if (this.volTextureMask) {
      this.volTextureMask.dispose();
    }
    if (this.texVolumeAO) {
      this.texVolumeAO.dispose();
    }
    //this.texVolumeAO = this.volumeUpdater.gettexVolumeAO();

    if (this.renderer.getContext().getExtension('EXT_color_buffer_float')) {
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
        depthBuffer: true,
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
          depthBuffer: true,
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
          depthBuffer: true,
        });
      this.bufferRenderToTextureCPU = new Float32Array(VAL_4 * this.xSmallTexSize * this.ySmallTexSize);
    } else {
      console.log('cant create float texture');
    }

    this.createClipPlaneGeometry();

    if (this.matWireFrame) {
      this.matWireFrame.uniforms.texBF.value = this.bfTexture;
      this.matWireFrame.uniforms.texBF.needsUpdate = true;
      this.matWireFrame.uniforms.texFF.value = this.ffTexture;
      this.matWireFrame.uniforms.texFF.needsUpdate = true;
    }

    // create material for screen texture mapping
    // Used to map backface texture to frontface geom
    matScreenTex = new MaterialScreenTexMap();
    this.matScreenTex = matScreenTex.create(this.ffTexture);
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
    matFfThreeGS.create(this.bfTexture.texture, (mat) => {
      this.matFF = mat;
      this.sceneReadyCounter++;
    });

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry);
    //console.log(`startRot = ${this.curFileDataType.startRotX} ${this.curFileDataType.startRotY}`);
    this.orbitControl.setMesh(this.mesh);
    this.orbitControl.setWireMesh(this.meshSphere);


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
    this.matRenderToTextureThreeGS = new MaterialRenderToTexture();
    this.matRenderToTextureThreeGS.m_uniforms.colorMap1D.value = this.colorMapTexture;
    this.matRenderToTextureThreeGS.create(this.texTF, this.volTexture,
      null, this.texVolumeAO, this.bfTexture.texture, this.ffTexture.texture, offsets,
      //this.volTextureMask, this.texVolumeAO, this.bfTexture.texture, this.ffTexture.texture, offsets,
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
        mat.uniforms.texSize.value = xDim;//this.engine2d.m_volumeHeader.m_pixelWidth;
        mat.uniforms.isoThreshold.value = this.curFileDataType.thresholdIsosurf;
        mat.uniforms.brightness3D.value = this.curFileDataType.brightness;
        mat.uniforms.opacityBarrier.value = OPACITY_SCALE * this.curFileDataType.opacityTissue;
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
    matIntetpl.create(this.renderToTexture.texture, (mat) => {
      mat.uniforms.needsUpdate = true;
      //this.matInterpolation = mat;
      this.sceneReadyCounter++;
    });

    // Create material for main pass of volume render
    this.matSkullThreeGS = new MaterialVolumeRender();
    this.matSkullThreeGS.m_uniforms.isoSurfTexel.value = new THREE.Vector2(VAL_3 / this.windowWidth,
      VAL_3 / this.windowHeight);
    this.matSkullThreeGS.m_uniforms.colorMap1D.value = this.colorMapTexture;
    this.matSkullThreeGS.create(this.texTF, this.volTexture,
      null, this.texVolumeAO, this.bfTexture.texture, this.ffTexture.texture,
      //this.volTextureMask, this.texVolumeAO, this.bfTexture.texture, this.ffTexture.texture,
      this.renderToTexture.texture, offsets, (mat) => {
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
        mat.uniforms.texSize.value = xDim;
        mat.uniforms.isoThreshold.value = this.curFileDataType.thresholdIsosurf;
        mat.uniforms.brightness3D.value = this.curFileDataType.brightness;
        mat.uniforms.volumeSizeZ.value = zDim;

        mat.uniforms.xDim.value = xDim;
        mat.uniforms.yDim.value = yDim;

        mat.uniforms.opacityBarrier.value = OPACITY_SCALE * this.curFileDataType.opacityTissue;
        mat.uniforms.lightDir.value = new THREE.Vector3(this.curFileDataType.lightDirComp,
          this.curFileDataType.lightDirComp, this.curFileDataType.lightDirComp);
        mat.uniforms.needsUpdate = true;
        this.scene.add(this.mesh);
        this.matVolumeRender = mat;
        if (isFULL3D) {
          this.switchToFullVolumeRender() 
        } else {
          this.switchToVolumeRender();      
        }
        this.mesh.material = this.matVolumeRender;
        this.meshSphere.material = this.matVolumeRender;
        this.sceneReadyCounter++;
      });
    //this.tools23d.set2dToolType(toolType);
    //matSkullThreeGS.m_uniforms.texVolumeMask.value = this.volTextureMask;
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
   * Create 2D texture containing selected ROIs
   * @param selectedROIs 256 byte roi values
   */
  updateSelectedRoiMap(selectedROIs) {
    this.volumeUpdater.updateSelectedRoiMap(selectedROIs);
  }  /**
   * Rotate Cut Plane (Rotation is inverse to the object)
   */
  updateCutPlanes() {
    if (!this.mesh) {
      return;
    }
    const mtx = new THREE.Matrix4();
    if (this.renderScene === SCENE_TYPE_SPHERE) {
      mtx.getInverse(mtx.extractRotation(this.meshSphere.matrix));
    } else {
      mtx.getInverse(mtx.extractRotation(this.mesh.matrix));
    }
    const xAxis = new THREE.Vector3(-1.0, 0.0, 0.0);
    const yAxis = new THREE.Vector3(0.0, -1.0, 0.0);
    const zAxis = new THREE.Vector3(0.0, 0.0, -1.0);
    const centerPt = new THREE.Vector3().copy(this.planeCenterPt);
    centerPt.applyMatrix4(mtx);
    xAxis.applyMatrix4(mtx);
    yAxis.applyMatrix4(mtx);
    zAxis.applyMatrix4(mtx);
    if (this.matFF !== null) {
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
    //mtx.getInverse(mtx.extractRotation(this.mesh.matrix));
    if (this.renderScene === SCENE_TYPE_RAYCAST) {
      mtx.getInverse(mtx.extractRotation(this.mesh.matrix));
    } else {
      mtx.getInverse(mtx.extractRotation(this.meshSphere.matrix));
    }
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
    return true;
  }
  /** Render 3d scene */
  render() {
    /*if (this.sceneReadyCounter !== SCENE_READY_COUNTER_OK) {
      // render empty scene to show "black" empty screen
      this.renderer.render(this.scene, this.camera);
      return;
    }*/
    if (!this.isReadyToRender()) {
      return;
    }
    const matReady = (this.matVolumeRender !== null) && (this.matBF !== null) &&
      (this.matFF !== null) && (this.matRenderToTexture !== null);
    if (!matReady) {
      // do nothing
    } else {
      // check once render target
      if (this.checkFrameBufferMode === CHECK_MODE_NOT_CHECKED) {
        // const isGood = true;// GlCheck.checkFrameBuffer(this.renderer, this.bfTexture);
        this.checkFrameBufferMode = CHECK_MODE_RESULT_OK;
      }

      if (this.renderScene === SCENE_TYPE_RAYCAST) {
        this.updateLightDir();
        this.updateClipPlaneGeometry();
        this.updateCutPlanes();
        
        this.renderer.setRenderTarget(this.bfTexture);
        this.renderer.clear();
        this.renderer.state.buffers.depth.setClear(0);
        this.scene.overrideMaterial = this.matBF;
        this.renderer.render(this.scene, this.camera, this.bfTexture);
        const glC = this.renderer.getContext();
        if (this.isEraseMode && !this.lockEraserBuffersUpdating) {
          glC.readPixels(0, 0, this.windowWidth, this.windowHeight, glC.RGBA, glC.FLOAT, this.bufferBFTextureCPU);
        }
        this.renderer.setRenderTarget(this.ffTexture);
        this.renderer.clear();
        this.renderer.state.buffers.depth.setClear(1);
        // render clip plane without depth test
        this.renderer.render(this.sceneClipPlane, this.camera, this.ffTexture);
        // enable test again
        this.scene.overrideMaterial = this.matFF;
        this.renderer.render(this.scene, this.camera, this.ffTexture);
        if (this.isEraseMode && !this.lockEraserBuffersUpdating) {
          glC.readPixels(0, 0, this.windowWidth, this.windowHeight, glC.RGBA, glC.FLOAT, this.bufferFFTextureCPU);
        }

        this.renderer.setRenderTarget();
        this.renderer.clear();
        this.renderer.state.buffers.depth.setClear(0);

        this.scene.overrideMaterial = this.matRenderToTexture;
        this.renderer.render(this.scene, this.camera, this.renderToTexture);
        if (this.isEraseMode && !this.lockEraserBuffersUpdating) {
          glC.readPixels(0, 0, this.xSmallTexSize, this.ySmallTexSize, glC.RGBA, glC.FLOAT,
            this.bufferRenderToTextureCPU);
        }
        // get a reference to the internal WebGL rendering context
        this.scene.overrideMaterial = null;
        this.renderer.render(this.scene, this.camera);
        // Render wireframe mesh
        this.renderer.autoClearDepth = false;
        
        //this.matWireFrame
        //this.renderer.clear();
        if (this.Tool23D) {
          this.renderer.render(this.scene23D, this.camera);
        }
        //this.renderer.render(this.sceneSphereWireFrame, this.camera);
        this.renderer.autoClearDepth = true;
        //this.renderer.clear();
        /*
        this.renderer.clear();
        this.renderer.render(this.scene23D, this.camera);
        */
      }
      this.renderCounter++;
    }
  }
  setStepsize(sliderValue) {
    const A = 100.0;
    const B = 700.0;
    const h = 1.0 / (A + B * sliderValue);
    if (this.matRenderToTexture !== null) {
      this.matRenderToTexture.uniforms.stepSize.value = new THREE.Vector4(h, h, h, h);
      this.matRenderToTexture.uniforms.needsUpdate = true;
    }
    if (this.matVolumeRender !== null) {
      this.matVolumeRender.uniforms.stepSize.value = new THREE.Vector4(h, h, h, h);
      this.matVolumeRender.uniforms.needsUpdate = true;
    }
  }
  /**
  * Get object's vertex (3d) projection on screen, using current object transformation
  *
  * param vPos(THREE.Vector3) - sphere vertex of object
  * param vProjScreen(THREE.Vector2) - screen projection of vertex above
  * return z coordinate of projection on screen. If > 0, then visible
  */
  getVertexProjectionToScreen(vPos, vProjScreen) {
    const vProj = vPos.clone();
    vProj.applyMatrix4(this.meshSphere.matrixWorld);
    vProj.project(this.camera);
    const W_HALF = this.windowWidth * 0.5;
    const H_HALF = this.windowHeight * 0.5;
    const xProj = W_HALF + (W_HALF * vProj.x);
    // it should be H_HALF - (...
    // but we have y axis up in mouse coord system
    const yProj = H_HALF + (H_HALF * vProj.y);
    vProjScreen.x = xProj;
    vProjScreen.y = yProj;

    const vPrj = vPos.clone();
    vPrj.applyMatrix4(this.meshSphere.matrixWorld);
    vPrj.applyMatrix3(this.camera.normalMatrix);
    // return vProj.z;
    return vPrj.z;
  }
  setEraserMode(isOn) {
    this.isEraseMode = isOn;
    this.orbitControl.setEraserMode(isOn);
    if (!this.eraserStarted && isOn) {
      this.eraserStarted = true;
      const params = {
        xDim: this.volume.m_xDim,
        yDim: this.volume.m_yDim,
        zDim: this.volume.m_zDim,
        bufBF: this.bufferBFTextureCPU,
        bufFF: this.bufferFFTextureCPU,
        bufTex: this.bufferRenderToTextureCPU,
      };
      this.volTextureMask = this.volumeUpdater.createUpdatableVolumeMask(params);
      this.matSkullThreeGS.m_uniforms.texVolumeMask.value = this.volTextureMask;
      this.matRenderToTextureThreeGS.m_uniforms.texVolumeMask.value = this.volTextureMask;
    }
    if (isOn) {
      this.setMaskFlag(1);
    } else {
      this.setMaskFlag(0);
    }
  }
  undoEraser() {
    this.volumeUpdater.eraser.undoLastErasing();
  }
  setEraserStart(isOn) {
    this.eraserStart = isOn;
  }
  onMouseDown(xx, yy) {
    if (this.Tool23D) {
      this.graphics23d.onMouseDown(xx / this.windowWidth, yy / this.windowHeight);
      return;
    }
    this.orbitControl.onMouseDown(xx, yy);
    //this.tools23d.onMouseDown(xx /this.windowWidth, yy / this.windowHeight);
    if (this.checkFrameBufferMode !== CHECK_MODE_RESULT_OK) {
      return;
    }
    this.renderState = this.RENDER_STATE.ENABLED;
    this.eraserMouseDown = true;
    if (this.isEraseMode && this.eraserStart) {
      this.lockEraserBuffersUpdating = true;
      this.volumeUpdater.eraser.eraseStart(xx, yy, this.windowWidth, this.matVolumeRender.uniforms.isoThreshold.value, true);
    }
  }
  onMouseMove(xx, yy) {
    //this.tools23d.onMouseMove(xx / this.windowWidth, yy / this.windowHeight);
    if (this.Tool23D) {
      this.graphics23d.onMouseMove(xx / this.windowWidth, yy / this.windowHeight);
      return;
    }
    if (this.checkFrameBufferMode !== CHECK_MODE_RESULT_OK) {
      return;
    }
    this.renderState = this.RENDER_STATE.ENABLED;
    if (!(this.isEraseMode && this.eraserMouseDown && this.eraserStart)) {
      this.orbitControl.onMouseMove(xx, yy);
    }
    else {
      this.volumeUpdater.eraser.eraseStart(xx, yy, this.windowWidth, this.matVolumeRender.uniforms.isoThreshold.value, false);
    }
  }
  onMouseUp( xx, yy ) {
    if (this.Tool23D) {
      this.graphics23d.onMouseUp(xx / this.windowWidth, yy / this.windowHeight);
      return;
    }
    //this.tools23d.onMouseUp(xx / this.windowWidth, yy / this.windowHeight);
    this.orbitControl.onMouseUp();
    if (this.checkFrameBufferMode !== CHECK_MODE_RESULT_OK) {
      return;
    }
    this.lockEraserBuffersUpdating = false;
    this.eraserMouseDown = false;
    this.renderState = this.RENDER_STATE.ONCE;
  }
  onMouseWheel(e) {
    //const e = window.event || event; // old IE support
    const delta = Math.max(-1, Math.min(1, (e.deltaY || -e.detail)));
    // console.log(`mouse wheel event . delta = ${delta}`);
    this.orbitControl.onZoom(-delta);
    if (this.checkFrameBufferMode !== CHECK_MODE_RESULT_OK) {
      return;
    }
    this.renderState = this.RENDER_STATE.ONCE;
    // e.preventDefault();
  }
} // class Graphics3d
