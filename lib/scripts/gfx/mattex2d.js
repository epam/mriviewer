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
import THREE from 'n3d-threejs';

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
    this.m_uniforms = {
      texture: { type: 't', value: null },
      palTexture: { type: 't', value: null },
      // plane values are: 0-x, 1-y, 2-z
      plane: { type: 'i', value: 0 },
      tilesHor: { type: 'i', value: 0 },
      sliceIndex: { type: 'i', value: 0 },
      numSlices: { type: 'i', value: 0 },
      xDim: { type: 'i', value: 0 },
      yDim: { type: 'i', value: 0 },
      zDim: { type: 'i', value: 0 },
      isRoiVolume: { type: 'i', value: 0 },
      contrast: { type: 'f', value: 1.0 },
      brightness: { type: 'f', value: 0.0 },
      sigma: { type: 'f', value: 0.0 },
      //sigmaB: { type: 'f', value: 0.01 },
      xPixelSize: { type: 'f', value: 0.0 },
      yPixelSize: { type: 'f', value: 0.0 },
      flag: { type: 'b', value: false },
      showAll: { type: 'b', value: false }
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

      uniform sampler2D texture;
      uniform sampler2D palTexture;
      uniform int plane;
      uniform int tilesHor;
      uniform int sliceIndex;
      uniform int numSlices;
      uniform int xDim;
      uniform int yDim;
      uniform int zDim;
      uniform int isRoiVolume;
      uniform float contrast;
      uniform float brightness;
      uniform float sigma;
      //uniform float sigmaB;
      uniform float xPixelSize;
      uniform float yPixelSize;
      uniform bool flag;
      uniform bool showAll;
          
      const int SLICE_AXIS_X = 0;
      const int SLICE_AXIS_Y = 1;
      const int SLICE_AXIS_Z = 2;
      
      vec2 getTexCoord(vec3 vecVol) {
        float tileScale = 1.0 / float(tilesHor);
        vec2 vTex = vecVol.xy;
        vTex *= tileScale;
        int zSliceIndex = int(floor(vecVol.z * float(zDim)));
        
        // add tile x corner
        vTex.x += mod(float(zSliceIndex), float(tilesHor)) * tileScale;
        // add tile y corner
        vTex.y += floor(float(zSliceIndex) / float(tilesHor)) * tileScale;
        // add 0.5 correction
        int xSize = xDim * tilesHor;
        int ySize = yDim * tilesHor;
        vTex.x += 0.5 / float(xSize);
        vTex.y += 0.5 / float(ySize);
        return vTex;
      }
      
      void main() {
        // special debug mode: show all texture
        if (showAll) {
          vec4 vColTex = texture2D(texture, vecUV);
          float intensity = vColTex.w;
          gl_FragColor = vec4(intensity, intensity, intensity, 1.0);
          return;
        }
        vec3 vVol = vec3(0.0, 0.0, 0.0);
        if (plane == SLICE_AXIS_Z) {
          vVol.x = vecUV.x;
          vVol.y = vecUV.y;
          vVol.z = float(sliceIndex) / float(numSlices);
        } // if z slices
        if (plane == SLICE_AXIS_Y) {
          vVol.x = vecUV.x;
          vVol.y = float(sliceIndex) / float(numSlices);
          vVol.z = vecUV.y;
        } // if y slices
        if (plane == SLICE_AXIS_X) {
          vVol.x = float(sliceIndex) / float(numSlices);
          vVol.y = vecUV.x;
          vVol.z = vecUV.y;
        } // if x slices
        
        vec2 texCoord = getTexCoord(vVol);
        // get texture pixel from source texture
        vec4 vColTex = texture2D(texture, texCoord);
        
        float sigma2 = sigma*sigma;
        //float sigmaB2 = sigmaB*sigmaB;
       
        float val = texture2D(texture, texCoord).w;
        float BIFICOBR = 0.0;
        float norm_factorB = 0.0;
        //Bilateral Filtering 
        
        for (float i = -2.0; i < 2.5; i += 1.0)
          for (float j = -2.0; j < 2.5; j += 1.0)
            {
                vec3 vAdd = vec3(0.0,0.0,0.0);
                if (plane == SLICE_AXIS_Z) {
                  vAdd.x = xPixelSize * i;
                  vAdd.y = yPixelSize * j;
                  vAdd.z = 0.0;
                } // if z slices
                if (plane == SLICE_AXIS_Y) {
                  vAdd.x = xPixelSize * i;
                  vAdd.y = 0.0;
                  vAdd.z = yPixelSize * j;
                } // if y slices
                if (plane == SLICE_AXIS_X) {
                  vAdd.x = 0.0;
                  vAdd.y = xPixelSize * i;
                  vAdd.z = yPixelSize * j;
                } // if x slices

              vec2 curTexCoord = getTexCoord(vVol + vAdd);  
              float curVal = texture2D(texture,curTexCoord).w;
              float gaussB = exp( -(i*i + j*j) / (2.0 * sigma2));// - (val - curVal)*(val - curVal) / (2.0 * sigmaB2) );
              BIFICOBR += curVal * gaussB;
              norm_factorB += gaussB;
            }
        // intencity
        BIFICOBR = BIFICOBR / norm_factorB;
        
        
        if (isRoiVolume > 0) {
          //float fPalIndex = vColTex.w;
          //vec2 vPalCoord = vec2(fPalIndex, 0.0);
          //vColTex = texture2D(palTexture, vPalCoord);
          gl_FragColor = vec4(vColTex.x, vColTex.y, vColTex.z, 1.0);
        } 
        else if(flag){
          BIFICOBR = contrast * (BIFICOBR - 0.5) + 0.5 + brightness;
          gl_FragColor = vec4(BIFICOBR,BIFICOBR,BIFICOBR, 1.0);
        }
        else {
          // use vec4.w component as a color. This is grey value, others (x,y,z) are used as normals, etc...
          float intensity = vColTex.w;
          gl_FragColor = vec4(intensity, intensity, intensity, 1.0);
        }
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
    this.m_uniforms.texture.value = tex;
    this.m_uniforms.plane.value = planeMode;
    this.m_uniforms.sliceIndex.value = sliceIndex;
    this.m_uniforms.xDim.value = xDim;
    this.m_uniforms.yDim.value = yDim;
    this.m_uniforms.zDim.value = zDim;
    this.m_uniforms.isRoiVolume.value = (isRoiVolume) ? 1 : 0;
    this.m_uniforms.tilesHor.value = Math.ceil(Math.sqrt(zDim));

    if (isRoiVolume) {
      console.log('MaterialTex2d: 2d texture will be rendered as roi indices');
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
      this.m_uniforms.numSlices.value = xDim;
    } else if (planeMode === TEX2D_PLANE_Y) {
      this.m_uniforms.numSlices.value = yDim;
    } else if (planeMode === TEX2D_PLANE_Z) {
      this.m_uniforms.numSlices.value = zDim;
    }

    this.m_material = new THREE.ShaderMaterial({
      uniforms: this.m_uniforms,
      vertexShader: this.m_strShaderVertex,
      fragmentShader: this.m_strShaderFragment
    });
    this.m_material.needsUpdate = true;
  }
} // end of class
