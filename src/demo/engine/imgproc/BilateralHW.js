//
// Bilateral filter for 3d iamge using render and shader 
// 

import * as THREE from 'three';
import GlSelector from '../GlSelector';

// Shaders

const s_shaderVertex = `
varying vec2 texCoord;
void main() {
  texCoord = position.xy + vec2(0.5, 0.5);
  gl_Position = vec4(position * 2.0, 1.0);
}
`;

const s_shaderFragment = `
varying vec2 texCoord;
precision highp sampler3D;
uniform sampler3D texVolume;
uniform vec3 texelSize;
uniform float volumeSizeZ;
uniform float distSigma;
uniform float valSigma;
uniform float kernelSize;
uniform float xDim;
uniform float yDim;
uniform float curZ;

float filterBlur(vec3 base)
{
  float koefDist = 1.0 / (3.0 * distSigma * distSigma);
  float koefVal = 1.0 / (valSigma * valSigma);
  float valCenter = texture(texVolume, base + vec3(0.5, 0.5, 0.5)).r;
  float sumWeights = 0.0;
  float acc = 0.0;

  float range = kernelSize;
  float rangePlusHalf = range + 0.5;

  for (float i = -range; i < rangePlusHalf; i += 1.0) {
    float tz = i / range;
    for (float j = -range; j < rangePlusHalf; j += 1.0) {
      float ty = j / range;
      for (float k = -range; k < rangePlusHalf; k += 1.0)
      {
        float tx = k / range;
        vec3 texc = base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k);
        texc = texc + vec3(0.5, 0.5, 0.5);
        texc = clamp(texc, vec3(0.0, 0.0, 0.0), vec3(1.0 - texelSize.x, 1.0 - texelSize.y, 1.0 - texelSize.z));
        float curVal = texture(texVolume, texc).r;
        float deltaVal = (curVal - valCenter) / 256.0;
        float weightDist = exp( -(tx * tx + ty * ty + tz * tz) * koefDist);
        float weightVal = exp( -(deltaVal * deltaVal) * koefVal );
        float weight = weightDist * weightVal;
        // float weight = weightDist;
        acc += curVal * weight;
        sumWeights += weight;
      } // for x
    } // for j
  } // for i

  // get weighted result intencity
  acc = acc / sumWeights;
  return acc;
  //return valCenter;
}

void main() {
  vec3 base;
  base.xy = texCoord;
  base.z = curZ;
  base = base - vec3(0.5, 0.5, 0.5);
  float val = filterBlur(base);
  gl_FragColor = vec4(val, val, val, 1);
}

`;

export default class BilateralHW {
  constructor() {
    this.m_strShaderVertex = s_shaderVertex;
    this.m_strShaderFragment = s_shaderFragment;
    this.m_bufferTextureCPU = null;
    this.m_iter = 0;
    this.m_z = 0;
    const VOL_SIZE_Z = 256.0;
    const DIST_SIGMA = 0.8;
    const VAL_SIGMA = 1.6;
    this.m_uniforms = {
      texVolume: { type: 't', value: null },
      texelSize: { type: 'v3', value: null },
      volumeSizeZ: { type: 'f', value: VOL_SIZE_Z },
      xDim: { type: 'f', value: VOL_SIZE_Z },
      yDim: { type: 'f', value: VOL_SIZE_Z },
      distSigma:   { type: 'f', value: DIST_SIGMA },
      valSigma:   { type: 'f', value: VAL_SIGMA },
      curZ: { type: 'f', value: 0.0 },
      kernelSize: { type: 'f', value: 0.0 },
    };
    this.m_defines = {
      useWebGL2: 1,
    };
  } // end constructor
  getImageDst() {
    return this.m_bufferTextureCPU;
  }
  // check is iters finished
  isFinished() {
    if (this.m_z >= this.m_zDim) {
      return true;
    }    
    return false;
  }
  update() {
    const zDim = this.m_zDim;
    const STEP = (zDim > 16 ) ? 24 : 2;
    const zNext = Math.floor((this.m_iter + 1) * zDim / STEP);

    const VAL_4 = 4;

    let valMax = 0;
    for (let z = this.m_z; z < zNext; z++) {
      this.m_material.uniforms.curZ.value = z / this.m_zDim;
      this.m_material.uniforms.curZ.needsUpdate = true;

      this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
      this.gl.readPixels(0, 0, this.m_xDim, this.m_yDim, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.m_frameBuf);
      const zOffs = z * this.m_xDim * this.m_yDim;
      for (let y = 0; y < this.m_yDim; y++) {
        const yOff = y * this.m_xDim;
        for (let x = 0; x < this.m_xDim; x++) {
          const val = this.m_frameBuf[VAL_4 * (x + yOff)];
          this.m_bufferTextureCPU[x + yOff + zOffs] = val;
          valMax = (val > valMax) ? val : valMax;
        } // for x
      } // for y
    } // for z
    // console.log('val max = ' + valMax.toString());
    // update iteration parameters
    this.m_iter += 1;
    this.m_z = zNext;
  }
  // before iterative renders
  setVolumeTextureWebGL2(distSigma, valSigma) {
    this.m_material.uniforms.distSigma.value = distSigma;
    this.m_material.uniforms.distSigma.needsUpdate = true;
    this.m_material.uniforms.valSigma.value = valSigma;
    this.m_material.uniforms.valSigma.needsUpdate = true;

    this.m_z = 0;
    this.m_iter = 0;
    const VAL_4 = 4;
    this.m_frameBuf = new Uint8Array(VAL_4 * this.m_xDim * this.m_yDim);
    this.gl = this.rendererBlur.getContext();
  }
  // create camera , context
  initRenderer(distSigma, valSigma) {
    this.sceneBlur = new THREE.Scene();
    // eslint-disable-next-line
    this.cameraOrtho = new THREE.OrthographicCamera(
      -this.m_xDim / 2, +this.m_xDim / 2, 
      +this.m_yDim / 2, -this.m_yDim / 2, 
      0.1, 100);
    const glSelector = new GlSelector();
    this.context = glSelector.createWebGLContext();
    this.canvas3d = glSelector.getCanvas();
    this.rendererBlur = new THREE.WebGLRenderer({
      canvas: this.canvas3d,
      context: this.context
    });

    const geometryBlur = new THREE.PlaneGeometry(1.0, 1.0);
    this.rendererBlur.setSize(this.m_xDim, this.m_yDim);
    const mesh = new THREE.Mesh(geometryBlur, this.m_material);

    this.m_uniforms.volumeSizeZ.value = this.m_zDim;
    this.m_uniforms.xDim.value = this.m_xDim;
    this.m_uniforms.yDim.value = this.m_yDim;
    this.m_defines.useWebGL2 = 1;
    this.sceneBlur.add(mesh);

    this.m_material.needsUpdate = true;

    // render with blur and copy pixels back to this.bufferRgba
    this.setVolumeTextureWebGL2(distSigma, valSigma);
  }
  // create renderer
  // koefDist in 0.5 .. 3.0
  // koefVal in 0.1 .. 4.0
  // 
  //                | koefDist = 0.5  | koefDist = 3.0
  // ---------------+-----------------+----------------
  // koefVal = 0.1  | orig            | Nice without noise 
  // koefVal = 4.0  | orig            | Blurred
  //
  //
  create(volume, texelSize, kernelSize, koefDist, koefVal = 0.1) {

    const distSigma = (1.0 / kernelSize) * koefDist;
    const valSigma = (1.0 / 256.0) * koefVal;
    console.log('BilateralHW params: kernel=' + kernelSize.toString() +  ' dist sigma=' + distSigma.toString() + ' val sigma=' + valSigma.toString() );
    const xDim = volume.m_xDim;
    const yDim = volume.m_yDim;
    const zDim = volume.m_zDim;
    this.m_xDim = xDim;
    this.m_yDim = yDim;
    this.m_zDim = zDim;
    // create volume textures
    const arrPixels = volume.m_dataArray;
    // bufferTextureCPU: here will be render result
    this.m_bufferTextureCPU = new Uint8Array(this.m_xDim * this.m_yDim * this.m_zDim);
    this.bufferR = new Uint8Array(this.m_xDim * this.m_yDim * this.m_zDim);
    const xyzDim = xDim * yDim * zDim;
    for (let i = 0; i < xyzDim; i++) {
      this.m_bufferTextureCPU[i] = arrPixels[i];
      this.bufferR[i] = arrPixels[i];
    }
    this.bufferTexture = new THREE.WebGLRenderTarget(this.m_xDim, this.m_yDim, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
    });
    // Source texture, used in rendering: assigned as a texture in shader
    this.origVolumeTex = new THREE.DataTexture3D(this.bufferR, this.m_xDim, this.m_yDim, this.m_zDim);
    this.origVolumeTex.format = THREE.RedFormat;
    this.origVolumeTex.type = THREE.UnsignedByteType;
    this.origVolumeTex.wrapR = THREE.ClampToEdgeWrapping;
    this.origVolumeTex.wrapS = THREE.ClampToEdgeWrapping;
    this.origVolumeTex.wrapT = THREE.ClampToEdgeWrapping;
    this.origVolumeTex.magFilter = THREE.NearestFilter;//THREE.LinearFilter;
    this.origVolumeTex.minFilter = THREE.NearestFilter;//THREE.LinearFilter;
    this.origVolumeTex.needsUpdate = true;
  
    // compile shaders
    this.m_material = new THREE.ShaderMaterial({
      uniforms: this.m_uniforms,
      defines: this.m_defines,
      vertexShader: this.m_strShaderVertex,
      fragmentShader: this.m_strShaderFragment
    });

    this.m_uniforms.texVolume.value = this.origVolumeTex;
    this.m_uniforms.texelSize.value = texelSize;
    this.m_uniforms.kernelSize.value = kernelSize;

    if (this.m_zDim >= 1) {
      this.initRenderer(distSigma, valSigma);
    }
    return this.m_bufferTextureCPU;
  } // end create

} // end class
