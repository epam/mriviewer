/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
'License'); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

/**
/**
* Nifti file loader
* @module lib/scripts/loaders/roipalette
*/

// ******************************************************************
// imports
// ******************************************************************

// ******************************************************************
// Class
// ******************************************************************

export default class RoiPalette {
  /**
  * Create loader
  */
  constructor() {
    this.m_palette = [
      {
        'name': 'amygdala',
        'roiColor': '0.247059 0.584314 0.270588 1',
        'roiId': 139,
        'position': 'right'
      },
      {
        'name': 'amygdala',
        'roiColor': '0.309804 0.929412 0.054902 1',
        'roiId': 118,
        'position': 'left'
      },
      {
        'name': 'angular gyrus',
        'roiColor': '0.686275 0.231373 0.152941 1',
        'roiId': 19,
        'position': 'right'
      },
      {
        'name': 'angular gyrus',
        'roiColor': '0.811765 0.486275 0.117647 1',
        'roiId': 159,
        'position': 'left'
      },
      {
        'name': 'anterior limb of internal capsule',
        'roiColor': '0.309804 0.203922 0.462745 1',
        'roiId': 128,
        'position': 'right'
      },
      {
        'name': 'anterior limb of internal capsule',
        'roiColor': '0.435294 0.733333 0.027451 1',
        'roiId': 43,
        'position': 'left'
      },
      {
        'roiColor': '0.937255 0.94902 0.513725 1',
        'roiId': 20,
        'name': 'brain stem'
      },
      {
        'name': 'caudate nucleus',
        'roiColor': '0.74902 0.278431 0.141176 1',
        'roiId': 53,
        'position': 'right'
      },
      {
        'name': 'caudate nucleus',
        'roiColor': '0.184314 0.0745098 0.356863 1',
        'roiId': 39,
        'position': 'left'
      },
      {
        'name': 'cerebellum',
        'roiColor': '0.811765 0.458824 0.952941 1',
        'roiId': 76,
        'position': 'right'
      },
      {
        'name': 'cerebellum',
        'roiColor': '0.247059 0.113725 0.843137 1',
        'roiId': 67,
        'position': 'left'
      },
      {
        'name': 'cingulate region',
        'roiColor': '0.623529 0.45098 0.666667 1',
        'roiId': 7,
        'position': 'right'
      },
      {
        'name': 'cingulate region',
        'roiColor': '0.937255 0.631373 0.505882 1',
        'roiId': 27,
        'position': 'left'
      },
      {
        'roiColor': '0.937255 0.301961 0.470588 1',
        'roiId': 133,
        'name': 'corpus callosum'
      },
      {
        'name': 'cuneus',
        'roiColor': '0.435294 0.513725 0.768627 1',
        'roiId': 175,
        'position': 'right'
      },
      {
        'name': 'cuneus',
        'roiColor': '0.937255 0.729412 0.192157 1',
        'roiId': 54,
        'position': 'left'
      },
      {
        'name': 'fornix',
        'roiColor': '0.937255 0.415686 0.847059 1',
        'roiId': 254,
        'position': 'right'
      },
      {
        'name': 'fornix',
        'roiColor': '0.811765 0.67451 0.980392 1',
        'roiId': 29,
        'position': 'left'
      },
      {
        'roiColor': '0.247059 0.466667 0.105882 1',
        'roiId': 233,
        'name': 'fourth ventricle'
      },
      {
        'name': 'frontal lobe WM',
        'roiColor': '0.560784 0.290196 0.215686 1',
        'roiId': 17,
        'position': 'right'
      },
      {
        'name': 'frontal lobe WM',
        'roiColor': '0.498039 0.662745 0.101961 1',
        'roiId': 30,
        'position': 'left'
      },
      {
        'name': 'globus palladus',
        'roiColor': '0.0588235 0.843137 0.168627 1',
        'roiId': 11,
        'position': 'right'
      },
      {
        'name': 'globus palladus',
        'roiColor': '0.247059 0.74902 0.447059 1',
        'roiId': 12,
        'position': 'left'
      },
      {
        'name': 'hippocampal formation',
        'roiColor': '0.498039 0.709804 0.619608 1',
        'roiId': 36,
        'position': 'right'
      },
      {
        'name': 'hippocampal formation',
        'roiColor': '0.121569 0.4 0.972549 1',
        'roiId': 101,
        'position': 'left'
      },
      {
        'name': 'inferior frontal gyrus',
        'roiColor': '0.247059 0.85098 0.0666667 1',
        'roiId': 75,
        'position': 'right'
      },
      {
        'name': 'inferior frontal gyrus',
        'roiColor': '0.937255 0.662745 0.329412 1',
        'roiId': 15,
        'position': 'left'
      },
      {
        'name': 'inferior occipital gyrus',
        'roiColor': '0.0588235 0.643137 0.643137 1',
        'roiId': 97,
        'position': 'right'
      },
      {
        'name': 'inferior occipital gyrus',
        'roiColor': '0.247059 0.411765 0.568627 1',
        'roiId': 37,
        'position': 'left'
      },
      {
        'name': 'inferior temporal gyrus',
        'roiColor': '0.247059 0.00392157 0.796078 1',
        'roiId': 140,
        'position': 'right'
      },
      {
        'name': 'inferior temporal gyrus',
        'roiColor': '0.87451 0.819608 0.541176 1',
        'roiId': 164,
        'position': 'left'
      },
      {
        'name': 'insula',
        'roiColor': '0.623529 0.886275 0.356863 1',
        'roiId': 4,
        'position': 'right'
      },
      {
        'name': 'insula',
        'roiColor': '0.560784 0.698039 0.12549 1',
        'roiId': 108,
        'position': 'left'
      },
      {
        'name': 'lateral front-orbital gyrus',
        'roiColor': '0.435294 0.501961 0.203922 1',
        'roiId': 6,
        'position': 'right'
      },
      {
        'name': 'lateral front-orbital gyrus',
        'roiColor': '1 0.8 0.00784314 1',
        'roiId': 90,
        'position': 'left'
      },
      {
        'name': 'lateral occipitotemporal gyrus',
        'roiColor': '0.0588235 0.027451 0.470588 1',
        'roiId': 99,
        'position': 'right'
      },
      {
        'name': 'lateral occipitotemporal gyrus',
        'roiColor': '0.937255 0.101961 0.913725 1',
        'roiId': 196,
        'position': 'left'
      },
      {
        'name': 'lateral ventricle',
        'roiColor': '0.435294 0.176471 0.568627 1',
        'roiId': 8,
        'position': 'right'
      },
      {
        'name': 'lateral ventricle',
        'roiColor': '0.74902 0.764706 0.247059 1',
        'roiId': 3,
        'position': 'left'
      },
      {
        'name': 'lingual gyrus',
        'roiColor': '0.435294 0.458824 0.47451 1',
        'roiId': 112,
        'position': 'right'
      },
      {
        'name': 'lingual gyrus',
        'roiColor': '0.811765 0.0941176 0.301961 1',
        'roiId': 69,
        'position': 'left'
      },
      {
        'name': 'medial front-orbital gyrus',
        'roiColor': '0.87451 0.364706 0.384314 1',
        'roiId': 1,
        'position': 'right'
      },
      {
        'name': 'medial front-orbital gyrus',
        'roiColor': '0.811765 0.160784 0.247059 1',
        'roiId': 85,
        'position': 'left'
      },
      {
        'name': 'medial frontal gyrus',
        'roiColor': '0.435294 0.615686 0.0705882 1',
        'roiId': 114,
        'position': 'right'
      },
      {
        'name': 'medial frontal gyrus',
        'roiColor': '0.184314 0.372549 0.423529 1',
        'roiId': 9,
        'position': 'left'
      },
      {
        'name': 'medial occipitotemporal gyrus',
        'roiColor': '0.247059 0.368627 0.211765 1',
        'roiId': 165,
        'position': 'right'
      },
      {
        'name': 'medial occipitotemporal gyrus',
        'roiColor': '1 0.843137 0.254902 1',
        'roiId': 119,
        'position': 'left'
      },
      {
        'name': 'middle frontal gyrus',
        'roiColor': '0.623529 0.905882 0.113725 1',
        'roiId': 2,
        'position': 'right'
      },
      {
        'name': 'middle frontal gyrus',
        'roiColor': '0.686275 0.0901961 0.811765 1',
        'roiId': 50,
        'position': 'left'
      },
      {
        'name': 'middle occipital gyrus',
        'roiColor': '0.686275 0.933333 0.698039 1',
        'roiId': 63,
        'position': 'right'
      },
      {
        'name': 'middle occipital gyrus',
        'roiColor': '0.435294 0.0588235 0.964706 1',
        'roiId': 154,
        'position': 'left'
      },
      {
        'name': 'middle temporal gyrus',
        'roiColor': '0.937255 0.498039 0.67451 1',
        'roiId': 130,
        'position': 'right'
      },
      {
        'name': 'middle temporal gyrus',
        'roiColor': '0.498039 0.768627 0.439216 1',
        'roiId': 64,
        'position': 'left'
      },
      {
        'name': 'nucleus accumbens',
        'roiColor': '1 0.807843 0.529412 1',
        'roiId': 25,
        'position': 'right'
      },
      {
        'name': 'nucleus accumbens',
        'roiColor': '0.0588235 0.65098 0.0509804 1',
        'roiId': 72,
        'position': 'left'
      },
      {
        'name': 'occipital lobe WM',
        'roiColor': '0.0588235 0.368627 0.552941 1',
        'roiId': 45,
        'position': 'right'
      },
      {
        'name': 'occipital lobe WM',
        'roiColor': '0.0588235 0.639216 0.839216 1',
        'roiId': 73,
        'position': 'left'
      },
      {
        'name': 'occipital pole',
        'roiColor': '0.74902 0.494118 0.419608 1',
        'roiId': 132,
        'position': 'right'
      },
      {
        'name': 'occipital pole',
        'roiColor': '0.247059 0.807843 0.74902 1',
        'roiId': 251,
        'position': 'left'
      },
      {
        'name': 'parahippocampal gyrus',
        'roiColor': '0.121569 0.847059 0.00392157 1',
        'roiId': 125,
        'position': 'right'
      },
      {
        'name': 'parahippocampal gyrus',
        'roiColor': '0.247059 0.0705882 0.321569 1',
        'roiId': 18,
        'position': 'left'
      },
      {
        'name': 'parietal lobe WM',
        'roiColor': '1 0.4 0.223529 1',
        'roiId': 105,
        'position': 'right'
      },
      {
        'name': 'parietal lobe WM',
        'roiColor': '0.309804 0.678431 0.639216 1',
        'roiId': 57,
        'position': 'left'
      },
      {
        'name': 'postcentral gyrus',
        'roiColor': '0.560784 0.478431 0.2 1',
        'roiId': 110,
        'position': 'right'
      },
      {
        'name': 'postcentral gyrus',
        'roiColor': '0.498039 0.576471 0.027451 1',
        'roiId': 74,
        'position': 'left'
      },
      {
        'name': 'posterior limb of internal capsule inc. cerebral peduncle',
        'roiColor': '1 0.917647 0.576471 1',
        'roiId': 35,
        'position': 'right'
      },
      {
        'name': 'posterior limb of internal capsule inc. cerebral peduncle',
        'roiColor': '0.435294 0.490196 0.0784314 1',
        'roiId': 34,
        'position': 'left'
      },
      {
        'name': 'precentral gyrus',
        'roiColor': '0.184314 0.709804 0.615686 1',
        'roiId': 5,
        'position': 'right'
      },
      {
        'name': 'precentral gyrus',
        'roiColor': '0.87451 0.560784 1 1',
        'roiId': 80,
        'position': 'left'
      },
      {
        'name': 'precuneus',
        'roiColor': '1 0.654902 0.223529 1',
        'roiId': 32,
        'position': 'right'
      },
      {
        'name': 'precuneus',
        'roiColor': '1 0 0.211765 1',
        'roiId': 56,
        'position': 'left'
      },
      {
        'name': 'putamen',
        'roiColor': '1 0.831373 0.227451 1',
        'roiId': 16,
        'position': 'right'
      },
      {
        'name': 'putamen',
        'roiColor': '0.372549 0.678431 0.32549 1',
        'roiId': 14,
        'position': 'left'
      },
      {
        'name': 'subthalamic nucleus',
        'roiColor': '0.184314 0.545098 0.619608 1',
        'roiId': 23,
        'position': 'right'
      },
      {
        'name': 'subthalamic nucleus',
        'roiColor': '0.309804 0.686275 0.243137 1',
        'roiId': 33,
        'position': 'left'
      },
      {
        'name': 'superior frontal gyrus',
        'roiColor': '0.87451 0.380392 0.768627 1',
        'roiId': 10,
        'position': 'right'
      },
      {
        'name': 'superior frontal gyrus',
        'roiColor': '1 0.113725 0.396078 1',
        'roiId': 70,
        'position': 'left'
      },
      {
        'name': 'superior occipital gyrus',
        'roiColor': '0.372549 0.0431373 0.537255 1',
        'roiId': 38,
        'position': 'right'
      },
      {
        'name': 'superior occipital gyrus',
        'roiColor': '0.623529 0.301961 0.2 1',
        'roiId': 98,
        'position': 'left'
      },
      {
        'name': 'superior parietal lobule',
        'roiColor': '0.247059 0.843137 0.407843 1',
        'roiId': 88,
        'position': 'right'
      },
      {
        'name': 'superior parietal lobule',
        'roiColor': '0.87451 0.533333 0.254902 1',
        'roiId': 52,
        'position': 'left'
      },
      {
        'name': 'superior temporal gyrus',
        'roiColor': '0.498039 0.721569 0.996078 1',
        'roiId': 145,
        'position': 'right'
      },
      {
        'name': 'superior temporal gyrus',
        'roiColor': '1 0.67451 0.45098 1',
        'roiId': 61,
        'position': 'left'
      },
      {
        'name': 'supramarginal gyrus',
        'roiColor': '0.87451 0.45098 0.270588 1',
        'roiId': 60,
        'position': 'right'
      },
      {
        'name': 'supramarginal gyrus',
        'roiColor': '0.623529 0.0235294 0.654902 1',
        'roiId': 41,
        'position': 'left'
      },
      {
        'name': 'temporal lobe WM',
        'roiColor': '0.498039 0.603922 0.768627 1',
        'roiId': 59,
        'position': 'right'
      },
      {
        'name': 'temporal lobe WM',
        'roiColor': '0.87451 0.411765 0.368627 1',
        'roiId': 83,
        'position': 'left'
      },
      {
        'name': 'thalamus',
        'roiColor': '0.0588235 0.796078 0.866667 1',
        'roiId': 203,
        'position': 'right'
      },
      {
        'name': 'thalamus',
        'roiColor': '0.74902 0.984314 0.341176 1',
        'roiId': 102,
        'position': 'left'
      },
      {
        'roiColor': '0.811765 0.258824 0.823529 1',
        'roiId': 232,
        'name': 'third ventricle'
      },
      {
        'name': 'uncus',
        'roiColor': '0.121569 0.352941 0.196078 1',
        'roiId': 26,
        'position': 'right'
      },
      {
        'name': 'uncus',
        'roiColor': '0.623529 0.117647 0.14902 1',
        'roiId': 62,
        'position': 'left'
      },
      {
        'name': 'xxx_brain_internal',
        'roiColor': '0.8 0.8 0.1 1',
        'roiId': 150,
        'position': 'left'
      },
      {
        'name': 'xxx_brain_core',
        'roiColor': '0.2 0.8 0.2 1',
        'roiId': 250,
        'position': 'left'
      },
    ];
    this.createBytePalette256();
  }
  /**
  * Transform array of objects into uint32 color array with 256 entries
  */
  createBytePalette256() {
    const PAL_SIZE = 256;
    const MAX_PAL_COLOR = 255.0;
    const BYTES_PER_COLOR = 4;
    const OFFS_0 = 0;
    const OFFS_1 = 1;
    const OFFS_2 = 2;
    const OFFS_3 = 3;
    this.m_palette256 = new Uint8Array(PAL_SIZE * BYTES_PER_COLOR);
    let i;
    // init palette with black colors
    for (i = 0; i < PAL_SIZE * BYTES_PER_COLOR; i++) {
      this.m_palette256[i] = 0;
    }
    // load colors
    const numPalColors = this.m_palette.length;
    for (i = 0; i < numPalColors; i++) {
      const strIndexPalette = this.m_palette[i].roiId;
      const strColor = this.m_palette[i].roiColor;
      const arrColor = strColor.split(' ');
      const rCol = Math.floor(parseFloat(arrColor[OFFS_0]) * MAX_PAL_COLOR);
      const gCol = Math.floor(parseFloat(arrColor[OFFS_1]) * MAX_PAL_COLOR);
      const bCol = Math.floor(parseFloat(arrColor[OFFS_2]) * MAX_PAL_COLOR);
      const aCol = 255;
      const ind = parseInt(strIndexPalette, 10) * BYTES_PER_COLOR;
      this.m_palette256[ind + OFFS_0] = rCol;
      this.m_palette256[ind + OFFS_1] = gCol;
      this.m_palette256[ind + OFFS_2] = bCol;
      this.m_palette256[ind + OFFS_3] = aCol;
    }
  }
  /**
  * Return palette array of objects
  */
  getPalette() {
    return this.m_palette;
  }
  /**
  * Return array of uints8 with 256 entries * 4
  */
  getPalette256() {
    return this.m_palette256;
  }
}
