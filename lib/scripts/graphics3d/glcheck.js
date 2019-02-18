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
* OpenGL, WebGL capability checking
* @module lib/scripts/graphics3d/glcheck
*/

export default class GlCheck {
  constructor() {
    this.m_supportedFlags = 0; // see GlCheck.SUPPORT_FLAG_XXX
    this.m_webglVersion = '';
    this.m_webglRenderer = '';
    this.m_maxTextureSize = 0;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const exts = ctx.getSupportedExtensions();
      this.m_webglVersion = ctx.getParameter(ctx.VERSION);

      this.m_maxTextureSize = ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
      // console.log(`gl.MAX_TEXTURE_SIZE = ${this.m_maxTextureSize}`);

      const STR_SUPPORT_TEXTURE_FLOAT_LINEAR = 'OES_texture_float_linear';
      const STR_SUPPORT_FILTER_ANI = 'EXT_texture_filter_anisotropic';
      const STR_SUPPORT_INDEX_UINT = 'OES_element_index_uint';

      // console.log(`WebGL num extensions = ${exts.length}`);
      // console.log(ctx.getParameter(ctx.VERSION));
      // console.log(ctx.getParameter(ctx.SHADING_LANGUAGE_VERSION));
      // console.log(ctx.getParameter(ctx.VENDOR));
      const extInfo = ctx.getExtension('WEBGL_debug_renderer_info');
      // if the extension exists, find out the info.
      if (extInfo) {
        // console.log(ctx.getParameter(extInfo.UNMASKED_VENDOR_WEBGL));
        // console.log(ctx.getParameter(extInfo.UNMASKED_RENDERER_WEBGL));
        this.m_webglRenderer = ctx.getParameter(extInfo.UNMASKED_RENDERER_WEBGL);
      }

      for (let i = 0; i < exts.length; i++) {
        // console.log(`WebGL extensions[${i}] = ${exts[i]}`);
        if (exts[i] === STR_SUPPORT_TEXTURE_FLOAT_LINEAR) {
          this.m_supportedFlags |= GlCheck.SUPPORT_FLAG_TEXTURE_FLOAT_LINEAR;
        }
        if (exts[i] === STR_SUPPORT_FILTER_ANI) {
          this.m_supportedFlags |= GlCheck.SUPPORT_FLAG_FILTER_ANI;
        }
        if (exts[i] === STR_SUPPORT_INDEX_UINT) {
          this.m_supportedFlags |= GlCheck.SUPPORT_FLAG_INDEX_UINT;
        }
      } // for (i) all extensions of webgl
    } catch (err) {
      if (err instanceof SyntaxError) {
        // handle the error
      } else {
        throw err;
      }
    } finally {
      // do nothing
    } // try
  } // constructror

  /**
  * Check possibility to setup frame buffer foir render into.
  *
  * @param (object) renderer - WebGL renderer
  * @param (object) renderTarget - desired render target object
  * @return (boolean) true, if device support frame buffers
  */
  static checkFrameBuffer(renderer, renderTarget) {
    renderer.setRenderTarget(renderTarget);
    const context = renderer.getContext();
    const result = context.checkFramebufferStatus(context.FRAMEBUFFER);
    if (result !== context.FRAMEBUFFER_COMPLETE) {
      console.log('checkFrameBuffer: Device not supports framebuffers');
      return false;
    }
    console.log('checkFrameBuffer: Device SUPPORTS framebuffers');
    return true;
  }

  /**
  * @return (number) Combination of GlCheck.SUPPORT_FLAG_XXX
  */
  getMaxTextureSize() {
    return this.m_maxTextureSize;
  }

  /**
  * @return (number) Combination of GlCheck.SUPPORT_FLAG_XXX
  */
  getSupportedFlags() {
    return this.m_supportedFlags;
  }

  /**
  * @return (string) WebGL version. Proobably should be 1.0.
  */
  getWebglVersion() {
    return this.m_webglVersion;
  }

  /**
  * @return (string) WebGL renderer information: video card manufacturer and model
  */
  getWebglRenderer() {
    return this.m_webglRenderer;
  }

} // class GlCheck

GlCheck.SUPPORT_FLAG_TEXTURE_FLOAT_LINEAR = 1;
GlCheck.SUPPORT_FLAG_FILTER_ANI = 2;
GlCheck.SUPPORT_FLAG_INDEX_UINT = 4;

GlCheck.SUPPORT_ALL = (GlCheck.SUPPORT_FLAG_TEXTURE_FLOAT_LINEAR |
  GlCheck.SUPPORT_FLAG_FILTER_ANI | GlCheck.SUPPORT_FLAG_INDEX_UINT);
