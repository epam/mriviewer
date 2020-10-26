import MaterialAO from './gfx/matAO';
import TetrahedronGenerator from './actvolume/tetra';
import * as THREE from 'three';

/**
 * 3D ambient texture processing engine
 * @module lib/scripts/graphics3d/ambientTexture
 */
export default class AmbientTexture {
  constructor(inParams) {
    //this.rendererBlur.render(this.sceneBlur, this.cameraOrtho
    this.rendererBlur = inParams.renderer;
    this.sceneBlur = inParams.scene;
    this.cameraOrtho = inParams.camera;
    this.xDim = inParams.xDim;
    this.yDim = inParams.yDim;
    this.zDim = inParams.zDim;
    this.texVolumeAO = null;
    this.vectorsTex = null;
  }
  _setAOVectorTex() {
    const VAL_4 = 4;
    const VAL_255 = 255;
    const gen = new TetrahedronGenerator();
    const vRadius = new THREE.Vector3(0.5, 0.5, 0.5);
    const NUM_SUBDIVIDES = 2;
    const okCreateTetra = gen.create(vRadius, NUM_SUBDIVIDES);
    if (okCreateTetra < 1) {
      return;
    }
    this.numAOVectors = gen.getNumVertices();

    this.vectors = new Uint8Array(VAL_4 * this.numAOVectors);

    for (let i = 0; i < this.numAOVectors; i++) {
      const vert = gen.getVertex(i);
      this.vectors[i * VAL_4 + 0] = (vert.x + 0.5) * VAL_255;
      this.vectors[i * VAL_4 + 1] = (vert.y + 0.5) * VAL_255;
      this.vectors[i * VAL_4 + 2] = (vert.z + 0.5) * VAL_255;
      this.vectors[i * VAL_4 + 3] = VAL_255;
    }

    this.vectorsTex = new THREE.DataTexture(this.vectors, this.numAOVectors, 1, THREE.RGBAFormat);
    this.vectorsTex.wrapS = THREE.ClampToEdgeWrapping;
    this.vectorsTex.wrapT = THREE.ClampToEdgeWrapping;
    this.vectorsTex.magFilter = THREE.NearestFilter;
    this.vectorsTex.minFilter = THREE.NearestFilter;
    this.vectorsTex.needsUpdate = true;
  }
  set(texVolume, isoThreshold) {
    if (this.vectorsTex === null) {
      this._setAOVectorTex();
    }
    this.xDimAO = this.xDim;
    this.yDimAO = this.yDim;
    this.zDimAO = this.zDim;
    this.bufferTextureAO = new THREE.WebGLRenderTarget(this.xDimAO,
      this.yDimAO, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
      });

    this.ambientVolumeTexCPU = new Uint8Array(this.xDimAO * this.yDimAO * this.zDimAO);
    if (this.isWebGL2 === 0) {
      this.texVolumeAO = new THREE.DataTexture(this.ambientVolumeTexCPU, this.xTex, this.yTex, THREE.AlphaFormat);
    } else {
      this.texVolumeAO = new THREE.DataTexture3D(this.ambientVolumeTexCPU, this.xDimAO, this.yDimAO, this.zDimAO);
      this.texVolumeAO.format = THREE.RedFormat;
      //this.texVolumeAO.type = THREE.UnsignedByteType;
    }
    this.texVolumeAO.wrapS = THREE.ClampToEdgeWrapping;
    this.texVolumeAO.wrapT = THREE.ClampToEdgeWrapping;
    this.texVolumeAO.wrapR = THREE.ClampToEdgeWrapping;
    this.texVolumeAO.magFilter = THREE.LinearFilter;
    this.texVolumeAO.minFilter = THREE.LinearFilter;
    this.texVolumeAO.needsUpdate = true;

    const texelSize = new THREE.Vector3(1.0 / this.xDim, 1.0 / this.yDim, 1.0 / this.zDim);
    const matAO = new MaterialAO();
    matAO.create(texVolume, texelSize, this.vectorsTex, this.numAOVectors, isoThreshold, (mat) => {
      this.materialAO = mat;
      mat.uniforms.tileCountX.value = this.zTexDivSqrt;
      mat.uniforms.volumeSizeZ.value = this.zDim;
      this.setAmbientTextureWebGL2();
      this.texVolumeAO.needsUpdate = true;
    });
  }
  setAmbientTextureWebGL2() {
    const VAL_4 = 4;
    const frameBuf = new Uint8Array(VAL_4 * this.xDimAO * this.yDimAO);
    const gl = this.rendererBlur.getContext();
    console.log('AO WebGL2');
    for (let z = 0; z < this.zDimAO; ++z) {
      this.materialAO.uniforms.curZ.value = z / (this.zDimAO - 1);
      this.materialAO.uniforms.curZ.needsUpdate = true;
      this.sceneBlur.overrideMaterial = this.materialAO;
      this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTextureAO);
      this.sceneBlur.overrideMaterial = null;
      gl.readPixels(0, 0, this.xDimAO, this.yDimAO, gl.RGBA, gl.UNSIGNED_BYTE, frameBuf);
      const zOffs = z * this.xDimAO * this.yDimAO;
      for (let y = 0; y < this.yDimAO; y++) {
        for (let x = 0; x < this.xDimAO; x++) {
          this.ambientVolumeTexCPU[x + y * this.xDimAO + zOffs] = 
            frameBuf[VAL_4 * (x + y * this.xDimAO)]; //256.0 * k / this.zDim;
        }
      }
    }
    console.log('AO WebGL2 End');
  }
  get() {
    return this.texVolumeAO;
  }
}