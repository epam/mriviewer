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
* 2d texture material, used for 2d edit mode
* @module app/scripts/fgx/shaders/mattex2d
*/

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as THREE from 'three';

// app imports
import RoiPalette from '../loaders/roipalette';

const TEX2D_PLANE_X = 0;
const TEX2D_PLANE_Y = 1;
const TEX2D_PLANE_Z = 2;

/** @class MaterialTex2d to render texture in 2d mode */

export default class MaterialTex2d {

  /** Simple material constructor
  * @constructor
  */
  constructor() {
    this.m_defines = {
      useWebGL2: 1,
    };
    this.m_uniforms = {
      volTexture: { type: 't', value: null },
      palTexture: { type: 't', value: null },
      // plane values are: 0-x, 1-y, 2-z
      plane: { type: 'i', value: 0 },
      tilesHor: { type: 'f', value: 1.0 },
      sliceIndex: { type: 'i', value: 0 },
      numSlices: { type: 'i', value: 0 },
      xDim: { type: 'i', value: 0 },
      yDim: { type: 'i', value: 0 },
      zDim: { type: 'i', value: 0 },
      isRoiVolume: { type: 'f', value: 1.0 },
      contrast: { type: 'f', value: 1.0 },
      brightness: { type: 'f', value: 0.0 },
      sigma: { type: 'f', value: 0.85 },
      //sigmaB: { type: 'f', value: 0.01 },
      xPixelSize: { type: 'f', value: 0.0 },
      yPixelSize: { type: 'f', value: 0.0 },
      flag: { type: 'b', value: false },
      showAll: { type: 'b', value: false },
      zoom: { type: 'f', value: 1 },
      posX: { type: 'f', value: 0 },
      posY: { type: 'f', value: 0 },
    };
    this.m_strShaderVertex = `
      varying vec3 vecPos;
      varying vec2 vecUV;
      void main() {
        vecPos = position;
        vecUV = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;
    this.m_strShaderFragment = `
      precision highp float;
      precision highp int;
      

      varying vec3 vecPos;
      varying vec2 vecUV;

      #if useWebGL2 == 0
      uniform sampler2D volTexture;
      #else
      precision highp sampler3D;
      uniform sampler3D volTexture;
      #endif
      uniform sampler2D palTexture;
      uniform int plane;
      uniform float tilesHor;
      uniform int sliceIndex;
      uniform int numSlices;
      uniform int xDim;
      uniform int yDim;
      uniform int zDim;
      uniform float isRoiVolume;
      uniform float contrast;
      uniform float brightness;
      uniform float sigma;
      uniform float zoom;
      uniform float posX;
      uniform float posY;
      //uniform float sigmaB;
      uniform float xPixelSize;
      uniform float yPixelSize;
      uniform bool flag;
      uniform bool showAll;
          
      const int SLICE_AXIS_X = 0;
      const int SLICE_AXIS_Y = 1;
      const int SLICE_AXIS_Z = 2;
      
      vec2 getTexCoord(vec3 vecVol) {
        float tileScale = 1.0 / (tilesHor);
        vec2 vTex = vecVol.xy;
        float sliceZ = float(zDim);
        float zSliceIndex = floor(vecVol.z * sliceZ);
        zSliceIndex = min(zSliceIndex, sliceZ - 1.0);
        
        // add tile x corner
        float floorPart = floor((zSliceIndex) / (tilesHor));
        float modPart = zSliceIndex - floorPart * (tilesHor);
        vTex.x += modPart;//mod((zSliceIndex), float(tilesHor));
        // add tile y corner
        vTex.y += floorPart;//floor((zSliceIndex) / (tilesHor));
        return vTex * tileScale;
      }
      vec4 tex3D(vec3 vecVol) {
        #if useWebGL2 == 0
        return texture2D(volTexture, getTexCoord(vecVol));
        #else
          return texture(volTexture, vecVol).rrrr;
        #endif
      }
      
      void main() {
        vec3 vVol = vec3(0.0, 0.0, 0.0);
        if (plane == SLICE_AXIS_Z) {
          vVol.x = vecUV.x * float(zoom) + float(posX) / 2.0;
          vVol.y = vecUV.y * float(zoom) - float(posY) / 2.0;
          vVol.z = float(sliceIndex) / float(numSlices);
        } // if z slices
        if (plane == SLICE_AXIS_Y) {
          vVol.x = vecUV.x * float(zoom) + float(posX) / 2.0;
          vVol.y = float(sliceIndex) / float(numSlices);
          vVol.z = vecUV.y * float(zoom) - float(posY) / 2.0;
        } // if y slices
        if (plane == SLICE_AXIS_X) {
          vVol.x = float(sliceIndex) / float(numSlices);
          vVol.y = vecUV.x * float(zoom) + float(posX) / 2.0;
          vVol.z = vecUV.y * float(zoom) - float(posY) / 2.0;
        } // if x slices
        
        vec2 texCoord = getTexCoord(vVol);
        // get texture pixel from source texture
        
/*        if (isRoiVolume > 0.5) {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
          return;
        }
*/
        if (isRoiVolume > 0.5) {
          //vec4 vColTex = texture2D(texture, texCoord);
          vec4 vColTex = tex3D(vVol);
          vec4 col = vec4(1.0, 0.0, 0.0, 1.0);
          //float fPalIndex = vColTex.w;
          //vec2 vPalCoord = vec2(fPalIndex, 0.0);
          //vColTex = texture2D(palTexture, vPalCoord);
          if (vColTex.a > 0.4)
            col = vec4(vColTex.rgb, 1.0);
          else  
            col = vec4(2.0 * vColTex.r, 2.0 * vColTex.g, 2.0 * vColTex.b, 1.0);
          
          gl_FragColor = col;
          return;
        }
          float sigma2 = sigma*sigma;
          //float sigmaB2 = sigmaB*sigmaB;
       
          float val = tex3D(vVol).a;//texture2D(texture, texCoord).a;
          float BIFICOBR = 0.0;
          float norm_factorB = 0.0;
          //Bilateral Filtering 
        
        for (float i = -2.0; i < 2.5; i += 1.0)
          for (float j = -2.0; j < 2.5; j += 1.0)
            for(float k = -2.0; k < 2.5; k += 1.0)
            {
              vec3 vAdd = vec3(0.0,0.0,0.0);
              if (plane == SLICE_AXIS_Z) {
                vAdd.x = xPixelSize * i;
                vAdd.y = yPixelSize * j;
                vAdd.z = k/float(numSlices);
              } // if z slices
              if (plane == SLICE_AXIS_Y) {
                vAdd.x = xPixelSize * i;
                vAdd.y = k/float(numSlices);
                vAdd.z = yPixelSize * j;
              } // if y slices
              if (plane == SLICE_AXIS_X) {
                vAdd.x = k/float(numSlices);
                vAdd.y = xPixelSize * i;
                vAdd.z = yPixelSize * j;
              } // if x slices

              vec2 curTexCoord = getTexCoord(vVol + vAdd);  
              float curVal = tex3D(vVol + vAdd).a;//texture2D(texture,curTexCoord).a;
              float gaussB = exp( -(i*i + j*j + k*k) / (2.0 * sigma2));
              BIFICOBR += curVal * gaussB;
              norm_factorB += gaussB;
            }
        // intensity
        BIFICOBR = BIFICOBR / norm_factorB;
        BIFICOBR = contrast * (BIFICOBR - 0.5) + 0.5 + brightness;
        gl_FragColor = vec4(BIFICOBR,BIFICOBR,BIFICOBR, 1.0);
      } // end of main
    `;
  }

  /** Create material for 2d texture display
  * @param {object} tex - texture with 2d layout of 3d source
  * @param {int} xDim - 3d texture dimension on x
  * @param {int} yDim - 3d texture dimension on y
  * @param {int} zDim - 3d texture dimension on z
  * @param {int} planeMode - see TEX2D_PLANE_X, TEX2D_PLANE_Y, TEX2D_PLANE_Z
  * @param {int} sliceIndex - current sliceIndex
  * @param {bool} isRoiVolume - is roi volume or not
  */
  create(tex, xDim, yDim, zDim, planeMode, sliceIndex, isRoiVolume) {
    this.m_uniforms.volTexture.value = tex;
    this.m_uniforms.plane.value = planeMode;
    this.m_uniforms.sliceIndex.value = sliceIndex;
    this.m_uniforms.xDim.value = xDim;
    this.m_uniforms.yDim.value = yDim;
    this.m_uniforms.zDim.value = zDim;
    this.m_uniforms.isRoiVolume.value = (isRoiVolume) ? 1.0 : 0.0;
    const TWO = 2;
    const ONE = 1;
    const zDimSqrt = TWO ** (ONE + Math.floor(Math.log(Math.sqrt(zDim)) / Math.log(TWO)));
    this.m_uniforms.tilesHor.value = zDimSqrt;

    if (isRoiVolume) {
      const roiPalette = new RoiPalette();
      const palette = roiPalette.getPalette256();
      const BYTES_PER_COLOR = 4;
      const MAGIC_COLOR = 250;
      const OFFS_0 = 0;
      const OFFS_1 = 1;
      const OFFS_2 = 2;

      const palB = palette[MAGIC_COLOR * BYTES_PER_COLOR + OFFS_0];
      const palG = palette[MAGIC_COLOR * BYTES_PER_COLOR + OFFS_1];
      const palR = palette[MAGIC_COLOR * BYTES_PER_COLOR + OFFS_2];
      console.log(`RoiPalette: pal[250] = ${palR}, ${palG}, ${palB}`);

      const TEX_W = 256;
      const TEX_H = 1;
      if (this.m_palTexture) {
        this.m_palTexture.dispose();
      }
      this.m_palTexture = new THREE.DataTexture(palette, TEX_W, TEX_H, THREE.RGBAFormat);
      this.m_palTexture.needsUpdate = true;
      this.m_palTexture.wrapS = THREE.ClampToEdgeWrapping;
      this.m_palTexture.wrapT = THREE.ClampToEdgeWrapping;
      this.m_palTexture.magFilter = THREE.NearestFilter;
      this.m_palTexture.minFilter = THREE.NearestFilter;
      this.m_uniforms.palTexture.value = this.m_palTexture;
    } else {
      this.m_uniforms.palTexture.value = null;
    }

    if (planeMode === TEX2D_PLANE_X) {
      this.m_uniforms.numSlices.value = xDim - 1;
    } else if (planeMode === TEX2D_PLANE_Y) {
      this.m_uniforms.numSlices.value = yDim - 1;
    } else if (planeMode === TEX2D_PLANE_Z) {
      this.m_uniforms.numSlices.value = zDim - 1;
    }

    this.m_material = new THREE.ShaderMaterial({
      uniforms: this.m_uniforms,
      defines: this.m_defines,
      vertexShader: this.m_strShaderVertex,
      fragmentShader: this.m_strShaderFragment
    });
    this.m_material.needsUpdate = true;
  }
} // end of class
