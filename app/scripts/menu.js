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
 * Menu
 * @module app/scripts/menu
 */

import noUiSlider from 'nouislider'; // eslint-disable-line no-unused-vars
import c3 from 'c3'; // eslint-disable-line no-unused-vars
// eslint-disable-next-line
import * as d3 from 'd3'; // eslint-disable-line no-unused-vars
// eslint-disable-next-line
import { event as currentEvent } from 'd3'; // eslint-disable-line no-unused-vars
import Spinner from 'spin'; // eslint-disable-line no-unused-vars
import jsPDF from 'jspdf'; // eslint-disable-line no-unused-vars
import 'jspdf-autotable'; // eslint-disable-line no-unused-vars
import wNumb from 'wnumb'; // eslint-disable-line no-unused-vars
import { loadFileType, RenderMode, LoadState } from '../../lib/scripts/med3web';
import Graphics2d from '../../lib/scripts/graphics2d/graphics2d';
import packageJson from '../../package.json';
import Screenshot from '../../lib/scripts/utils/screenshot';
import config from '../../tools/config';
import NiftiSaver from '../../lib/scripts/savers/niisaver';

const VERSION = typeof '/* @echo PACKAGE_VERSION */' !== 'undefined' && '/* @echo PACKAGE_VERSION */' || '0.0.0-dev';

const developerMode = true;

/** Possible 3d render modes */
export const renderModes = {
  VOLREND: 'volrend',
  ISOSURF: 'isosurf',
};

/** Possible fast 3d render modes */
export const fastRenderModes = {
  VOLRENDFAST: 'fast-volrend',
  ISOSURFFAST: 'fast-isosurf',
  MIP: 'mip',
};

/** Initial values for transfer function 2d slider */
const tf2dSlider = {
  handleN: 10,
  handleColor: ['#000000', '#ff8040', '#ff0000', '#804040', '#800000', '#404040', '#808080', '#c0c0c0', '#ffffff',
    '#ffffff'],
  xName: 'tfX',
  // eslint-disable-next-line
  x: ['tfX', 0, 22, 40, 55, 61, 115, 118, 125, 160, 255],
  yName: 'tfValue',
  // eslint-disable-next-line
  y: ['tfValue', 0, 0, 0.3, 0.12, 0, 0, 0.4, 0.8, 0.95, 1],
};

/** Create HTML element */
function createElement(tag, attrs, content) {
  const element = document.createElement(tag);
  let i;
  let n;
  if (attrs) {
    const keys = Object.keys(attrs);
    for (i = 0, n = keys.length; i < n; ++i) {
      const key = keys[i];
      element.setAttribute(key, attrs[key]);
    }
  }
  if (content) {
    if (!(content instanceof Array)) {
      content = [content];
    }
    for (i = 0, n = content.length; i < n; ++i) {
      const child = content[i];
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    }
  }
  return element;
}


export default class Menu {

  /**
   * Initialize render
   * @param {Object} engine2d - object container for 2d rendering
   * @param {Object} engine3d - object container for 3d rendering
   * @return {Object} Instance of this class (singleton)
   */
  constructor() {
    this.app = null;
    this.engine2d = null;
    this.engine3d = null;
    this.prevTime = 0;
    this.fps = 0;
    this.infoContainer = $('#med3web-info');
    this.loadFileEvent = new CustomEvent('loadFile', {
      detail: {
        fileType: null,
        data: null,
        dataType: null,
      },
    });
    /** slider object for threshold 1 */
    this.sliderThresholdIsoSurf = null;
    /** slider object for transfer function */
    this.sliderTransFunc = null;
    /** slider object for opacityTissue */
    this.sliderOpacity = null;
    /** slider object for brightness */
    this.sliderBrightness = null;
    /** slider object for z cut */
    this.sliderZCut = null;
    /** slider object for quality */
    this.sliderQuality = null;
    /** slider object for 3d eraser radius */
    this.slider3dEraserRadius = null;
    /** slider object for 3d eraser depth */
    this.slider3dEraserDepth = null;
    /** 2d toolbar */
    this.toolbar2d = $('#med3web-toolbar-2d');
    this.curModeSuffix = $('[data-toggle=mode].active').attr('data-mode');
    /** table that contains all dicom tags */
    this.dicomTagsTable = $('#med3web-table-dicom-tags');
    this.dicomTagsSliceSelector = $('#med3web-select-choose-slice');
    this.dicomLastLoadedFileName = null;
    this.curDataType = null;
    /** panel about */
    this.panelAboutVersion = $('#med3web-panel-about-version');
    this.panelAboutDescription = $('#med3web-panel-about-description');
    this.panelAboutCopyright = $('#med3web-panel-about-copyright');
    this.panelMenuHide = $('#med3web-menu-panel-hide');
    const strYear = new Date().getFullYear();
    const strDescr = packageJson.description;
    const strAuthor = packageJson.author;
    const strCopyright = `Copyright ${strYear} ${strAuthor}`;
    this.panelAboutVersion.text(`version ${VERSION}`);
    this.panelAboutDescription.text(strDescr);
    this.panelAboutCopyright.text(strCopyright);
    // console.log(`strCopyright = ${strCopyright}`);

    /** HTML element with data title  (or file name) */
    this.title = $('#med3web-menu-scene-title');
    if (!this.title) {
      console.log('med3web-menu-scene-title element is not found in html');
    }
    this.title.text('Press Open button to load scene');
    /** File(or scene name) to open */
    this.fileToOpen = '';

    this.isHandleGreen = 0;
    /** loaded data histogram */
    this.hist = null;
    this.transFunc2dSlider = null;
    const COLOR_N = 256;
    this.colorBarColors = Array(COLOR_N);
    this.progressBarContainer = $('#med3web-container-progressbar');
    this.progressBarContainerInner = $('#med3web-container-progressbar-inner');
    this.progressBarLabel = this.progressBarContainerInner.find('label');
    this.progressBarContainer.hide();
    /** GUI spinner for files loading */
    this.spinner = new Spinner({
      lines: 15, // The number of lines to draw
      length: 60, // The length of each line
      width: 15, // The line thickness
      radius: 80, // The radius of the inner circle
      scale: 1.25, // Scales overall size of the spinner
      corners: 1, // Corner roundness (0..1)
      color: '#0275d8', // #rgb or #rrggbb or array of colors
      opacity: 0.25, // Opacity of the lines
      rotate: 0, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      speed: 0.9, // Rounds per second
      trail: 55, // Afterglow percentage
      fps: 20, // Frames per second when using setTimeout() as a fallback for CSS
      zIndex: 10, // The z-index (defaults to 2000000000)
      className: 'spinner', // The CSS class to assign to the spinner
      shadow: true, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
    });

    this.initPresets();
    this.initInfoContainer();

    this.initNavBar();
    this.init3DPanel();
    this.init2DPanel();
    this.init2DToolbar();

    // tooltips initialization
    $(() => {
      $('[data-tooltip="tooltip"]').tooltip({
        trigger: 'hover',
        html: 'true',
        container: 'body',
      });
    });
  }
  setRenderEngine(app) {
    this.app = app;
    this.engine2d = app.m_engine2d;
    this.engine3d = app.m_engine3d;
  }

  fillColorBarColorsFromRGB(colors) {
    const HEX_BASE = 16;
    let r, g, b;
    for (let i = 0; i < this.colorBarColors.length; ++i) {
      r = colors[4 * i].toString(HEX_BASE).padStart(2, '0'); // eslint-disable-line
      g = colors[4 * i + 1].toString(HEX_BASE).padStart(2, '0'); // eslint-disable-line
      b = colors[4 * i + 2].toString(HEX_BASE).padStart(2, '0'); // eslint-disable-line
      this.colorBarColors[i] = `#${r}${g}${b}`;
    }
  }

  enableROIMode(enable) {
    if (enable) {
      $('#med3web-accordion-tools-3d').hide();
      $('#med3web-3d-mip-head').parent().hide();
      $('#med3web-setting-3d-hist').hide();
      $('#med3web-setting-3d-transfer-func').hide();
      $('#med3web-setting-3d-transfer-func-2d').hide();
      $('#med3web-setting-3d-color').hide();
    } else {
      $('#med3web-accordion-tools-3d').show();
      $('#med3web-3d-mip-head').parent().show();
      $('#med3web-setting-3d-hist').show();
      $('#med3web-setting-3d-transfer-func').show();
      $('#med3web-setting-3d-transfer-func-2d').show();
      $('#med3web-setting-3d-color').show();
    }
  }

  startProgressBar() {
    this.spinner.spin(this.progressBarContainerInner.get(0));
    this.progressBarLabel.text('0%');
    this.progressBarContainer.show();
  }

  updateProgressBar(ratio) {
    const PERCENT_MULTIPLIER = 100;
    this.progressBarLabel.text(`${Math.floor(ratio * PERCENT_MULTIPLIER)}%`);
  }
  stopProgressBar() {
    this.progressBarContainer.hide();
    this.spinner.stop();
  }

  /** reset user interface, build histogram, stop spinner */
  onFileLoaded(curDataType) {
    this.curDataType = curDataType;
    this.resetUserInterface();
    this.resetTFPlots();
    if (this.dicomTagsTable.length === 1 && this.dicomTagsSliceSelector.length === 1 &&
      this.dicomTagsSliceSelector.find('option').length > 0) {
      this.showDicomTagsOnSliceIdx(0);
    }
    this.enableROIMode(this.engine2d.m_isRoiVolume);
    this.panelMenuHide.hide();
  }

  /** add new tag to dicom tags viewer */
  onNewTag(group, elem, desc, value, imageNumber, fileName) {
    fileName = fileName.replace(/\s+/g, ''); // remove all spaces
    if (this.dicomLastLoadedFileName !== fileName) {
      this.dicomLastLoadedFileName = fileName;
      const fileNameRow = createElement('tr', {
        style: 'display: none;',
      }, [
        createElement('td', {
          class: 'tag-table-col-tag',
        }),
        createElement('td', {
          class: 'tag-table-col-name',
        }, 'File name'),
        createElement('td', {
          class: 'tag-table-col-value',
        }, fileName),
      ]);

      if (this.dicomTagsTable.length === 1) {
        this.dicomTagsTable.find('tbody').append(fileNameRow);
      }
    }
    const row = createElement('tr', {
      'data-file-name': fileName,
    }, [
      createElement('td', {
        class: 'tag-table-col-tag',
        // eslint-disable-next-line
      }, `(${(`0000${group}`).substr(-4)},${(`0000${elem}`).substr(-4)})`),
      createElement('td', {
        class: 'tag-table-col-name',
      }, desc),
      createElement('td', {
        class: 'tag-table-col-value',
      }, value),
    ]);

    if (this.dicomTagsTable.length === 1) {
      this.dicomTagsTable.find('tbody').append(row);
    }
    if (imageNumber !== -1) {
      const option = createElement('option', {}, [
        `Slice ${imageNumber} ('${fileName}')`,
      ]);
      if (this.dicomTagsSliceSelector.length === 1) {
        this.dicomTagsSliceSelector.append(option);
      }
    }
  }

  /** clear dicom tags table */
  clearDicomTagsTable() {
    if (this.dicomTagsTable.length === 1) {
      this.dicomTagsTable.find('tbody').empty();
    }
    if (this.dicomTagsSliceSelector.length === 1) {
      this.dicomTagsSliceSelector.empty();
    }
    this.dicomLastLoadedFileName = null;
  }
  /** save dicom tags to pdf
   * @param {String} fileName - file name with ".pdf" at the end
   * @param {Boolean} saveOnlyCurSlice - if true save tags of current selected slice, save tags of all slices otherwise
   */
  saveDicomTagsToPdf(fileName, saveOnlyCurSlice) {
    const doc = new jsPDF(); // eslint-disable-line
    const elem = this.dicomTagsTable.get(0);
    const res = doc.autoTableHtmlToJson(elem, !saveOnlyCurSlice);
    doc.autoTable(res.columns, res.data,
      {
        startY: 20,
        margin: { horizontal: 7 },
        showHeader: 'everyPage',
        styles: { overflow: 'linebreak', columnWidth: 'wrap' },
        columnStyles: { text: { columnWidth: 'auto' } },
      });
    doc.save(fileName);
  }

  /** Reset sliders values */
  resetUserInterface() {
    $('#med3web-3d-volrend-head').find('a').click();

    this.sliderThresholdIsoSurf.noUiSlider.set(this.curDataType.thresholdIsosurf);
    this.sliderOpacity.noUiSlider.set(this.curDataType.opacityTissue);
    this.sliderTransFunc.noUiSlider.set([this.curDataType.thresholdTissue1, this.curDataType.thresholdTissue2,
      this.curDataType.thresholdIsosurf]);
    this.sliderBrightness.noUiSlider.set(this.curDataType.brightness);
    this.sliderZCut.noUiSlider.set(1);
    const VAL_400 = 400;
    this.sliderQuality.noUiSlider.set(VAL_400);
    $('#med3web-mode-2d').click();
  }


  resetTFPlots() {
    // simple histogram for integer volume data in [0, 255]
    const binsN = 257;
    const data = ['data'];
    const dataX = ['x1'];

    for (let i = 1; i < binsN; i++) {
      data[i] = 0;
      dataX[i] =  i - 1;
    }

    for (let i = 0; i < this.engine2d.m_volumeData.length; i++) {
      data[this.engine2d.m_volumeData[i] + 1] += 1;
    }
    data[1] = 0; // some hack for better visualization
    const norm = Math.max.apply(null, data.slice(1, binsN));
    for (let i = 1; i < binsN; i++) {
      data[i] /= norm;
    }
    data[1] = 1;

    this.transFunc2dSlider.load({
      unload: ['data', 'x1'],
      columns: [
        dataX,
        data
      ],
    });

    this.hist.load({
      unload: 'data',
      columns: [
        data,
      ],
    });
    this.transFunc2dSlider.groups([['data', 'colorbar']]);

    const { internal } = this.transFunc2dSlider;
    const tf2dValues = internal.data.targets.find(z => z.id === tf2dSlider.yName).values;
    for (let i = 0; i < tf2dSlider.handleN; ++i) {
      tf2dValues[i].x = tf2dSlider.x[i + 1];
      tf2dValues[i].y = tf2dValues[i].value = tf2dSlider.y[i + 1];
    }
    this.engine3d.setTransferFuncColors(tf2dSlider.handleColor);
    const colors = this.engine3d.updateTransferFuncTexture(tf2dValues.map(z => z.x), tf2dValues.map(z => z.value));
    this.fillColorBarColorsFromRGB(colors);
    this.transFunc2dSlider.flush();
    this.hist.flush();
  }


  initInfoContainer() {
    if (developerMode) {
      if (this.infoContainer.length === 1) {
        this.infoContainer.html(`FPS = ${this.fps}`);
      } else {
        console.log('med3web-info container is not found in DOM hierarchy');
      }
    } else if (this.infoContainer.length === 1) {
      this.infoContainer.hide();
    }
  }

  /** Update each frame */
  updateEachFrame() {
    const app = this.app;
    if (app === 'undefined') {
      return;
    }
    if (app === null) {
      return;
    }
    const loadState = app.getLoadState();
    // console.log(`in updateEachFrame... loadState = ${loadState}`);
    if (loadState === LoadState.LOAD_STATE_LOADING) {
      const TEXT_LOADING = 'Loading...';
      this.title.text(TEXT_LOADING);
      // console.log('set title text loading...');
    }
    const eng3d = app.m_engine3d;
    const eng2d = app.m_engine2d;
    const eng3dReady = eng3d.isReadyToRender();
    const eng2dLoaded = eng2d.isLoaded();

    if ((loadState === LoadState.LOAD_STATE_READY) && (eng3dReady) && (eng2dLoaded)) {
      // set loaded file/data title
      this.title.text(this.fileToOpen);
      // console.log('set title text to opened file');
    }

    const currentTime = new Date().getTime();
    this.fps += 1;
    const TIME_TO_UPDATE_CONTAINER = 1000;
    if (developerMode) {
      if (this.infoContainer.length !== 1) {
        console.log('med3web-info container is not found in DOM hierarchy');
        return;
      }
      if (currentTime - this.prevTime > TIME_TO_UPDATE_CONTAINER) {
        this.infoContainer.html(`FPS = ${this.fps}`);
      }
    }
    if (currentTime - this.prevTime > TIME_TO_UPDATE_CONTAINER) {
      this.fps = 0;
      this.prevTime = currentTime;
    }
    this.engine3d.fps = this.fps;
  }

  showDicomTagsOnSliceIdx(idx) {
    this.dicomTagsTable.find('tbody tr').hide();
    const optionText = this.dicomTagsSliceSelector.find('option').get(idx).text;
    // get filename from the following string `Slice ${imageNumber} ('${fileName}')`
    const fileName = optionText.replace(/.*\('(.+)'\)/, '$1');
    this.dicomTagsTable.find(`tbody tr[data-file-name="${fileName}"]`).show();
  }

  /** Create html code for one preset */
  createPresetHtml(path, dataType, fileType, iconPath) {
    return createElement('label', {
      class: 'btn col-xs-4',
      'data-data-type': dataType,
      'data-file-type': fileType,
      'data-url': path,
    }, [
      createElement('input', {
        type: 'radio',
        name: 'options',
        autocomplete: 'off',
      }),
      createElement('a', {
        href: '#',
        class: 'thumbnail',
        style: 'margin-bottom: 0;'
      }, [
        createElement('img', {
          src: iconPath,
          height: '128',
          width: '128',
        }),
      ]),
    ]);
  }

  /** Initialize presets modal */
  initPresets() {
    const container = $('#med3web-modal-open .modal-body .row');
    $.getJSON(config.presetListPath)
      .done((data) => {
        $.each(data, (idx, preset) => {
          const child = this.createPresetHtml(preset.path, preset.dataType, preset.fileType, preset.iconPath);
          container.append(child);
        });
        $('#med3web-button-dropdown-open .dropdown-menu li:eq(1) a').show();
      });
  }

  moveSliders(panelBodyId, slidersIds) {
    const curDiv = $(`#${panelBodyId}`).find('div')[0];
    let slider = null;
    for (const id of slidersIds) {
      slider = $(`#${id}`).detach();
      slider.appendTo(curDiv);
    }
  }

  /** Initialize navigation bar */
  initNavBar() {
    // Callback for open local file from computer
    const localOpen = $('#med3web-input-file-open-local');
    if (localOpen.length === 1) {
      localOpen.on('change', (evt) => {
        $('#med3web-button-dropdown-open').click(); // close dropdown menu

        const file = evt.target.files[0];
        const fileName = file.name;
        this.fileToOpen = fileName.slice(0); // copy data, not reference

        // detect file type
        let isKtx = (fileName.indexOf('.ktx') !== -1);
        isKtx = (fileName.indexOf('.KTX') !== -1) ? true : isKtx;
        let isDicom = (fileName.indexOf('.dcm') !== -1);
        isDicom = (fileName.indexOf('.DCM') !== -1) ? true : isDicom;
        let isNifti = (fileName.indexOf('.nii') !== -1);
        isNifti = (fileName.indexOf('.NII') !== -1) ? true : isNifti;
        let isHdr = (fileName.indexOf('.hdr') !== -1);
        isHdr = (fileName.indexOf('.HDR') !== -1) ? true : isHdr;
        isHdr = (fileName.indexOf('.h') !== -1) ? true : isHdr;
        isHdr = (fileName.indexOf('.H') !== -1) ? true : isHdr;
        let isImg = (fileName.indexOf('.img') !== -1);
        isImg = (fileName.indexOf('.IMG') !== -1) ? true : isImg;

        // read local file
        if (isKtx) {
          this.loadFileEvent.detail.fileType = loadFileType.LOCALKTX;
          this.loadFileEvent.detail.data = file;
          this.loadFileEvent.detail.dataType = 'undefined';
          dispatchEvent(this.loadFileEvent);
          this.clearDicomTagsTable();
        } else if (isDicom) {
          const files = evt.target.files;
          this.loadFileEvent.detail.fileType = loadFileType.LOCALDICOM;
          this.loadFileEvent.detail.data = files;
          this.loadFileEvent.detail.dataType = 'undefined';
          dispatchEvent(this.loadFileEvent);
          this.clearDicomTagsTable();
        } else if (isNifti) {
          this.loadFileEvent.detail.fileType = loadFileType.LOCALNIFTI;
          this.loadFileEvent.detail.data = file;
          this.loadFileEvent.detail.dataType = 'undefined';
          dispatchEvent(this.loadFileEvent);
          this.clearDicomTagsTable();
        } else if (isHdr) {
          const files = evt.target.files;
          this.loadFileEvent.detail.fileType = loadFileType.LOCALHDR;
          this.loadFileEvent.detail.data = files;
          this.loadFileEvent.detail.dataType = 'hdr';
          dispatchEvent(this.loadFileEvent);
          this.clearDicomTagsTable();
        } else if (isImg) {
          const files = evt.target.files;
          this.loadFileEvent.detail.fileType = loadFileType.LOCALIMG;
          this.loadFileEvent.detail.data = files;
          this.loadFileEvent.detail.dataType = 'undefined';
          dispatchEvent(this.loadFileEvent);
          this.clearDicomTagsTable();
        } else {
          console.log('Local open file: unknown file type');
        }
      });
    }

    // Callback for open file by URL
    const urlOpen = $('#med3web-input-url-open');
    const urlOpenBtn = $('#med3web-btn-load-url');
    const urlOpenModal = $('#med3web-modal-open-url');
    const alertMsg = urlOpenModal.find('.alert');
    if (urlOpenBtn.length === 1) {
      urlOpenBtn.on('click', () => {
        const strUrlFile = urlOpen.val().trim();
        this.fileToOpen = strUrlFile.slice(0); // copy data, not reference

        // detect file type
        let isDicom = false;
        let isKtx = false;
        let isNifti = false;
        let isHdr = false;
        if (strUrlFile.startsWith('http')) {
          // default is dicom
          isDicom = true;
          this.loadFileEvent.detail.fileType = loadFileType.DICOM;
          if (strUrlFile.endsWith('.ktx')) {
            isDicom = false;
            isKtx = true;
            this.loadFileEvent.detail.fileType = loadFileType.KTX;
          }
          if (strUrlFile.endsWith('.nii')) {
            isDicom = false;
            isNifti = true;
            this.loadFileEvent.detail.fileType = loadFileType.NIFTI;
          }
          if ((strUrlFile.endsWith('.h')) || (strUrlFile.endsWith('.hdr'))) {
            isDicom = false;
            isHdr = true;
            this.loadFileEvent.detail.fileType = loadFileType.HDR;
          }
          this.loadFileEvent.detail.data = strUrlFile;
          this.loadFileEvent.detail.dataType = 'undefined';
          dispatchEvent(this.loadFileEvent);
          this.clearDicomTagsTable();
        }
        if (!isKtx && !isDicom && !isHdr && !isNifti) {
          alertMsg.show();
        } else {
          $('#med3web-modal-open-url').modal('hide');
        }
      });
    }
    if (urlOpen.length === 1) {
      urlOpen.on('input', () => {
        alertMsg.hide();
      });
    }

    if (urlOpenModal.length === 1) {
      urlOpenModal.on('hidden.bs.modal', () => {
        urlOpen.val(''); // clear input
      });
    }

    // callback on open preset value
    const modalOpenPreset = $('#med3web-modal-open');
    if (modalOpenPreset.length === 1) {
      modalOpenPreset.find('[data-btn-role=open]').on('click', () => {
        // here you should load selected file
        const activeBtn = $(modalOpenPreset).find('.btn-group .btn.active');
        const url = activeBtn.data('url');
        const fileType = activeBtn.attr('data-file-type');
        const dataType = activeBtn.attr('data-data-type');

        this.loadFileEvent.detail.fileType = fileType;
        this.loadFileEvent.detail.data = url;
        this.loadFileEvent.detail.dataType = dataType;
        dispatchEvent(this.loadFileEvent);
        this.clearDicomTagsTable();
      });
    }

    // callback on open dicom tags modal
    const modalDicomTags = $('#med3web-modal-dicom-tags');
    if (modalDicomTags.length === 1) {
      this.dicomTagsSliceSelector.on('change', () => {
        if (this.dicomTagsTable.length === 1) {
          this.showDicomTagsOnSliceIdx(this.dicomTagsSliceSelector.prop('selectedIndex'));
        }
      });
    }
    const modalSaveDicomTags = $('#med3web-modal-save-tags');
    if (modalSaveDicomTags.length === 1) {
      modalSaveDicomTags.find('[data-btn-role=save]').on('click', () => {
        const checkedRadio = modalSaveDicomTags.find('input[type=radio][name=saveTagsRadios]:checked');
        if (checkedRadio.length === 1) {
          const saveOnlyCurSlice = checkedRadio.val() === 'slice';
          const fileName = `${modalSaveDicomTags.find('input[type=text]').val()}.pdf`;
          this.saveDicomTagsToPdf(fileName, saveOnlyCurSlice);
          modalSaveDicomTags.find('input[type=text]').val('');
        }
      });
    }

    // handler for screen shot button click
    const buttonScreenshot = $('#med3web-button-screenshot');
    if (buttonScreenshot.length === 1) {
      buttonScreenshot.on('click', () => {
        if (this.curModeSuffix === '2d') {
          const SHOT_W = 800;
          const SHOT_H = 600;
          const containter2d = $('#med3web-container-2d');
          containter2d.click();
          Screenshot.makeScreenshot(this.engine2d, SHOT_W, SHOT_H);
        } else {
          const SHOT_W = 800;
          const SHOT_H = 600;
          const containter3d = $('#med3web-container-3d');
          containter3d.click();
          Screenshot.makeScreenshot(this.engine3d, SHOT_W, SHOT_H);
        }
        // TO DO: add mpr
      });
    }

    // mode switching buttons
    $('[data-toggle=mode]').on('click', (e) => {
      // newModeSuffix is '2d' or '3d' depending on tab, pressed by user
      const newModeSuffix = $(e.currentTarget).attr('data-mode');
      const rendererType = $(e.currentTarget).attr('data-renderer');
      if (newModeSuffix !== this.curModeSuffix) {
        $(`#med3web-panel-menu-${this.curModeSuffix}`).hide();
        $(`#med3web-panel-menu-${newModeSuffix}`).show();
        this.curModeSuffix = newModeSuffix;
        if (rendererType === '2d') {
          $('#med3web-panel-menu').show();
          $('#med3web-container-3d').hide();
          $('#med3web-container-2d').show();
          this.app.setRenderMode(RenderMode.RENDER_MODE_2D);
        } else if (rendererType === '3d') {
          $('#med3web-panel-menu').show();
          $('#med3web-container-2d').hide();
          $('#med3web-container-3d').show();
          this.app.setRenderMode(RenderMode.RENDER_MODE_3D);
          // move sliders
          if (newModeSuffix === '3d') {
            $('#med3web-accordion-render-mode .panel-heading.active [data-toggle=collapse]').click();
            const settings = $('#med3web-accordion-tools-3d').detach();
            settings.prependTo($('#med3web-panel-menu-3d .panel-body')[0]);
            this.transFunc2dSlider.flush();
          } else if (newModeSuffix === '3d-fast') {
            $('#med3web-accordion-fast-render-mode .panel-heading.active [data-toggle=collapse]').click();
            const settings = $('#med3web-accordion-tools-3d').detach();
            settings.prependTo($('#med3web-panel-menu-3d-fast .panel-body')[0]);
            this.hist.flush();
          }
        } else if (rendererType === 'mpr') {
          $('#med3web-panel-menu').hide();
        }
      }
    });

    const modalSaveAsNifti = $('#med3web-modal-save-as-nifti');
    if (modalSaveAsNifti.length === 1) {
      const textInput = modalSaveAsNifti.find('input[type=text]');
      modalSaveAsNifti.find('[data-btn-role=save]').on('click', (e) => {
        const COMPONENTS_N = 4;
        const ALPHA_COMP_IDX = 3;
        const volData = this.engine3d.volTexture.image.data;
        const volSize = {
          x: this.engine2d.m_volumeHeader.m_pixelWidth,
          y: this.engine2d.m_volumeHeader.m_pixelHeight,
          z: volData.length / COMPONENTS_N
            / this.engine2d.m_volumeHeader.m_pixelWidth / this.engine2d.m_volumeHeader.m_pixelHeight,
          pixdim1: this.engine2d.m_volumeBox.x / this.engine2d.m_volumeHeader.m_pixelWidth,
          pixdim2: this.engine2d.m_volumeBox.y / this.engine2d.m_volumeHeader.m_pixelHeight,
          pixdim3: this.engine2d.m_volumeBox.z / this.engine2d.m_volumeHeader.m_pixelDepth,
        };
        const sqrtZ = Math.sqrt(volSize.z);
        const volDataPlain = new Uint8Array(volSize.x * volSize.y * volSize.z);
        for (let z = 0; z < volSize.z; ++z) {
          const newX = (z % sqrtZ);
          const newY = (z - (z % sqrtZ)) / sqrtZ;
          for (let y = 0; y < volSize.y; ++y) {
            for (let x = 0; x < volSize.x; ++x) {
              volDataPlain[volSize.y * volSize.x * z + volSize.x * y + x] = volData[
                (newY * volSize.x * volSize.y * sqrtZ + y * sqrtZ * volSize.x + volSize.x * newX + x)
                * COMPONENTS_N + ALPHA_COMP_IDX];
            }
          }
        }
        const niiArr = NiftiSaver.writeBuffer(volDataPlain, volSize);
        const textToSaveAsBlob = new Blob([niiArr], { type: 'application/octet-stream' });
        const textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
        const fileName = `${textInput.val()}.nii`;

        const downloadLink = document.createElement('a');
        downloadLink.download = fileName;
        downloadLink.innerHTML = 'Download File';
        downloadLink.href = textToSaveAsURL;
        downloadLink.onclick = event => document.body.removeChild(event.target);
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);

        downloadLink.click();

        modalSaveAsNifti.find('input[type=text]').val('');
        modalSaveAsNifti.modal('hide');
        e.stopPropagation();
      });
      modalSaveAsNifti.on('shown.bs.modal', () => {
        textInput.val('');
        textInput.focus();
      });
    }
  }
  /** Initialize 3d menu panel */
  init3DPanel() {
    $('#med3web-accordion-render-mode').find('[data-toggle=collapse]').on('click', (e) => {
      const tgt = $(e.currentTarget);
      // active tabs switching
      $('#med3web-accordion-render-mode').find('.panel-heading.active').removeClass('active');
      tgt.parent().parent().addClass('active');

      // do nothing when active tab is clicked
      if (tgt.parents('.panel').children('.panel-collapse').hasClass('in')) {
        e.preventDefault();
        e.stopPropagation();
      }

      // switch render mode
      if (this.engine3d.isVolumeLoaded()) {
        const mode = tgt.attr('data-value');
        let panelBodyId = null;
        let sliderIds = null;
        switch (mode) {
          case renderModes.VOLREND:
            panelBodyId = 'med3web-3d-volrend-body';
            sliderIds = ['med3web-setting-opacity', 'med3web-setting-3d-brightness', 'med3web-setting-3d-z-cut',
              'med3web-setting-3d-quality'];
            this.moveSliders(panelBodyId, sliderIds);
            this.engine3d.switchToFullVolumeRender();
            break;
          case renderModes.ISOSURF:
            panelBodyId = 'med3web-3d-isosurf-body';
            sliderIds = ['med3web-setting-3d-brightness', 'med3web-setting-3d-z-cut',
              'med3web-setting-3d-quality'];
            this.moveSliders(panelBodyId, sliderIds);
            this.engine3d.switchToIsosurfRender();
            break;
          default:
            console.log('Unexpected 3d render mode');
            break;
        }
      }
    });

    $('#med3web-accordion-fast-render-mode').find('[data-toggle=collapse]').on('click', (e) => {
      const tgt = $(e.currentTarget);
      // active tabs switching
      $('#med3web-accordion-fast-render-mode').find('.panel-heading.active').removeClass('active');
      tgt.parent().parent().addClass('active');

      // do nothing when active tab is clicked
      if (tgt.parents('.panel').children('.panel-collapse').hasClass('in')) {
        e.preventDefault();
        e.stopPropagation();
      }

      // switch render mode
      if (this.engine3d.isVolumeLoaded()) {
        const mode = tgt.attr('data-value');
        let panelBodyId = null;
        let sliderIds = null;
        switch (mode) {
          case fastRenderModes.VOLRENDFAST:
            panelBodyId = 'med3web-3d-fast-volrend-body';
            sliderIds = ['med3web-setting-opacity', 'med3web-setting-3d-brightness', 'med3web-setting-3d-z-cut',
              'med3web-setting-3d-quality'];
            this.moveSliders(panelBodyId, sliderIds);
            this.engine3d.switchToVolumeRender();
            break;
          case fastRenderModes.ISOSURFFAST:
            panelBodyId = 'med3web-3d-fast-isosurf-body';
            sliderIds = ['med3web-setting-3d-brightness', 'med3web-setting-3d-z-cut',
              'med3web-setting-3d-quality'];
            this.moveSliders(panelBodyId, sliderIds);
            this.engine3d.switchToIsosurfRender();
            break;
          case fastRenderModes.MIP:
            panelBodyId = 'med3web-3d-mip-body';
            sliderIds = ['med3web-setting-3d-z-cut', 'med3web-setting-3d-quality'];
            this.moveSliders(panelBodyId, sliderIds);
            this.engine3d.switchToFLATRender();
            break;
          default:
            console.log('Unexpected 3d render mode');
            break;
        }
      }
    });

    // slider threshold bone
    this.sliderThresholdIsoSurf = $('#med3web-slider-threshold-isosurf').get(0);
    if (this.sliderThresholdIsoSurf) {
      noUiSlider.create(this.sliderThresholdIsoSurf, {
        start: 0.5,
        // start: curFileDataType.thresholdIsosurf,
        tooltips: true,
        step: 0.01,
        range: {
          min: 0,
          max: 1,
        },
      });
      this.sliderThresholdIsoSurf.noUiSlider.on('slide', (sliderValue) => {
        // use 'sliderValue' as a float value [0; 1]
        this.engine3d.setIsoThresholdValue(sliderValue);
      });
    }

    // slider opacity tissue
    this.sliderOpacity = $('#med3web-slider-opacity').get(0);
    if (this.sliderOpacity) {
      noUiSlider.create(this.sliderOpacity, {
        start: 0.5,
        // start: curFileDataType.opacityTissue,
        tooltips: true,
        step: 0.01,
        range: {
          min: 0,
          max: 1,
        },
      });
      this.sliderOpacity.noUiSlider.on('slide', (sliderValue) => {
        // use 'sliderValue' as a float value [0; 1]
        this.engine3d.setOpacityBarrier(sliderValue);
      });

      this.sliderOpacity.noUiSlider.on('start', () => {
        this.engine3d.onMouseDown();
      });

      this.sliderOpacity.noUiSlider.on('end', () => {
        this.engine3d.onMouseUp();
      });
    }
    // slider quality
    this.sliderQuality = $('#med3web-slider-3d-quality').get(0);
    if (this.sliderQuality) {
      noUiSlider.create(this.sliderQuality, {
        start: 400,
        step: 10,
        range: {
          min: 100,
          max: 1000,
        },
      });
      this.sliderQuality.noUiSlider.on('slide', (sliderValue) => {
        this.engine3d.setStepsize(sliderValue);
      });

      this.sliderQuality.noUiSlider.on('start', () => {
        this.engine3d.onMouseDown();
      });

      this.sliderQuality.noUiSlider.on('end', () => {
        this.engine3d.onMouseUp();
      });
    }

    // slider 3d x cut
    this.sliderBrightness = $('#med3web-slider-3d-brightness').get(0);
    if (this.sliderBrightness) {
      noUiSlider.create(this.sliderBrightness, {
        start: 1,
        tooltips: true,
        step: 0.01,
        range: {
          min: 0,
          max: 1,
        },
      });
      this.sliderBrightness.noUiSlider.on('slide', (sliderValue) => {
        // use 'sliderValue' as a float value [0; 1]
        this.engine3d.updateBrightness(sliderValue);
      });

      this.sliderBrightness.noUiSlider.on('start', () => {
        this.engine3d.onMouseDown();
      });

      this.sliderBrightness.noUiSlider.on('end', () => {
        this.engine3d.onMouseUp();
      });
    }

    // slider 3d z cut
    this.sliderZCut = $('#med3web-slider-3d-z-cut').get(0);
    if (this.sliderZCut) {
      noUiSlider.create(this.sliderZCut, {
        start: 1,
        tooltips: true,
        step: 0.01,
        range: {
          min: 0,
          max: 1,
        },
      });
      this.sliderZCut.noUiSlider.on('slide', (sliderValue) => {
        // use 'sliderValue' as a float value [0; 1]
        this.engine3d.updateZCutPlane(sliderValue - 0.5);
      });

      this.sliderZCut.noUiSlider.on('start', () => {
        this.engine3d.onMouseDown();
      });

      this.sliderZCut.noUiSlider.on('end', () => {
        this.engine3d.onMouseUp();
      });
    }

    const eraserToggleBtn = $('#med3web-accordion-tools-3d [data-value=eraser]');
    if (eraserToggleBtn.length === 1) {
      eraserToggleBtn.on('click', () => {
        setTimeout((engine3d, domEl) => {
          engine3d.setEraserMode(domEl.getAttribute('aria-expanded') === 'true');
        }, 0, this.engine3d, eraserToggleBtn.get(0));
      });
    }


    // slider 3d eraser radius
    this.slider3dEraserRadius = $('#med3web-slider-radius').get(0);
    if (this.slider3dEraserRadius) {
      noUiSlider.create(this.slider3dEraserRadius, {
        start: 10,
        tooltips: true,
        step: 1,
        range: {
          min: 1,
          max: 25,
        },
        format: wNumb({
          decimals: 0,
          suffix: ' vx',
        }),
      });

      this.slider3dEraserRadius.noUiSlider.on('slide', (sliderValue) => {
        // be careful - sliderValue is string, smth like "10 vx"
        this.engine3d.setEraserRadius(parseInt(sliderValue, 10));
      });
    }

    // slider 3d eraser depth
    this.slider3dEraserDepth = $('#med3web-slider-depth').get(0);
    if (this.slider3dEraserDepth) {
      noUiSlider.create(this.slider3dEraserDepth, {
        start: 20,
        tooltips: true,
        step: 1,
        range: {
          min: 1,
          max: 50,
        },
        format: wNumb({
          decimals: 0,
          suffix: ' vx',
        }),
      });
      this.slider3dEraserDepth.noUiSlider.on('slide', (sliderValue) => { // eslint-disable-line no-unused-vars
        // set 3d eraser depth value in voxels and remove "eslint-disable-line no-unused-vars" comment
      });
    }
    const resetBtn = $('#med3web-accordion-tools-3d .btn [data-value=reset-data]');
    if (resetBtn.length === 1) {
      resetBtn.on('click', () => {
        this.engine3d.resetEraser();
      });
    }

    // slider transfer function
    this.sliderTransFunc = $('#med3web-slider-3d-transfer-func').get(0);
    if (this.sliderTransFunc) {
      noUiSlider.create(this.sliderTransFunc, {
        start: [0, 0.5, 1],
        tooltips: [true, true, true],
        step: 0.01,
        range: {
          min: 0,
          max: 1,
        },
      });

      const handle = $(this.sliderTransFunc).find('.noUi-handle');
      const classes = ['handle-color-red', 'handle-color-red', 'handle-color-grey'];
      for (let i = 0; i < handle.length; i++) {
        handle.get(i).classList.add(classes[i]);
      }


      this.sliderTransFunc.noUiSlider.on('slide', (values) => {
        // use 'values[0]', 'values[1]' and 'values[2]' as a float value [0; 1]
        this.engine3d.setTransferFuncVec3(values, this.isHandleGreen);
      });

      this.sliderTransFunc.noUiSlider.on('start', () => {
        this.engine3d.onMouseDown();
      });

      this.sliderTransFunc.noUiSlider.on('end', () => {
        this.engine3d.onMouseUp();
      });
    }

    const COLOR_N = 256;
    const FILL_VAL = -0.1;
    const colorBar = Array(COLOR_N + 1);
    colorBar[0] = ['colorbar'];
    colorBar.fill(FILL_VAL, 1, COLOR_N + 1);
    const colorBarX = ['colorbarX'];
    colorBarX.push(...[...Array(COLOR_N).keys()]);
    this.hist = c3.generate({
      bindto: '#med3web-setting-3d-hist',
      data: {
        columns: [
          ['data'],
        ],
        type: 'bar'
      },
      bar: {
        width: {
          ratio: 1.1
        }
      },
      legend: {
        show: false
      },
      tooltip: {
        show: false
      },
      axis: {
        y: {
          show: false
        },
        x: {
          show: false
        }
      },
      point: {
        show: false
      },
    });

    this.transFunc2dSlider = c3.generate({
      bindto: '#med3web-setting-3d-transfer-func-2d',
      padding: {
        left: 45,
      },
      data: {
        xs: {
          'data': 'x1',
          [tf2dSlider.yName]: tf2dSlider.xName,
          [colorBar[0]] : colorBarX[0],
        },
        columns: [
          ['x1'],
          tf2dSlider.x,
          colorBarX,
          ['data'],
          tf2dSlider.y,
          colorBar,
        ],
        type: 'bar',
        types: {
          [tf2dSlider.yName]: 'line',
        },
        color: (color, d) => {
          if (d.id === tf2dSlider.yName) {
            return tf2dSlider.handleColor[d.index];
          } else if (d.id === 'colorbar') {
            return this.colorBarColors[d.index];
          } else {
            return color;
          }
        },
        colors: {
          'data': '#a4a4a4'
        },
        groups: [
          ['data', 'colorbar'],
        ],
      },
      bar: {
        width: {
          ratio: 0.0625 * 1.2, // eslint-disable-line
        },
        zerobased: false,
      },
      legend: {
        show: false,
      },
      tooltip: {
        show: false,
      },
      axis: {
        y: {
          show: true,
          tick: {
            values: [0, 0.2, 0.4, 0.6, 0.8, 1.0], // eslint-disable-line
          },
          min: 0,
          max: 1.0,
          label: {
            text: 'Opacity',
            position: 'outer-middle',
          },
        },
        x: {
          show: true,
          tick: {
            fit: true,
            count: 16,
          },
          min: 0,
          max: 255,
          label: {
            text: 'Intensity',
            position: 'outer-center',
          },
        }
      },
      point: {
        show: true,
        r: 5,
        select: {
          r: 6,
        },
        focus: {
          expand: {
            r: 5,
          },
        },
      },
    });

    $('[data-type=reset-to-default]').on('click', () => {
      this.sliderThresholdIsoSurf.noUiSlider.set(this.curDataType.thresholdIsosurf);
      this.sliderOpacity.noUiSlider.set(this.curDataType.opacityTissue);
      this.sliderTransFunc.noUiSlider.set([this.curDataType.thresholdTissue1, this.curDataType.thresholdTissue2,
        this.curDataType.thresholdIsosurf]);
      this.sliderBrightness.noUiSlider.set(this.curDataType.brightness);
      this.sliderZCut.noUiSlider.set(1);
      this.isHandleGreen = 0;
      $('#med3web-3d-color-red').click();

      this.engine3d.setFileDataType(this.curDataType);
      this.engine3d.setIsoThresholdValue(this.curDataType.thresholdIsosurf);
      this.engine3d.setOpacityBarrier(this.curDataType.opacityTissue);
      this.engine3d.setTransferFuncVec3([this.curDataType.thresholdTissue1, this.curDataType.thresholdTissue2,
        this.curDataType.thresholdIsosurf], this.isHandleGreen);
      this.engine3d.updateBrightness(this.curDataType.brightness);
      const HALF_CONTRAST = 0.5;
      this.engine3d.updateContrast(HALF_CONTRAST);
      const UPDATE_CUT_PLANE = 1;
      this.engine3d.updateZCutPlane(UPDATE_CUT_PLANE);
    });

    const classRed = 'handle-color-red';
    const classGreen = 'handle-color-green';
    const handle = $(this.sliderTransFunc).find('.noUi-handle[data-handle=1]');
    const buttonColorRed = $('#med3web-3d-color-red');
    if (buttonColorRed.length === 1) {
      buttonColorRed.on('click', () => {
        this.engine3d.onMouseDown();
        handle.removeClass(classGreen).addClass(classRed);
        this.isHandleGreen = 0;
        this.engine3d.setTransferFuncVec3(this.sliderTransFunc.noUiSlider.get(), this.isHandleGreen);
        this.engine3d.onMouseUp();
      });
    }
    const buttonColorGreen = $('#med3web-3d-color-green');
    if (buttonColorGreen.length === 1) {
      buttonColorGreen.on('click', () => {
        this.engine3d.onMouseDown();
        handle.removeClass(classRed).addClass(classGreen);
        this.isHandleGreen = 1;
        this.engine3d.setTransferFuncVec3(this.sliderTransFunc.noUiSlider.get(), this.isHandleGreen);
        this.engine3d.onMouseUp();
      });
    }

    const circles = this.transFunc2dSlider.internal.getCircles();
    const { internal } = this.transFunc2dSlider;
    const self = this;

    circles.call(d3.behavior.drag()
      .origin(d => d)
      .on('drag', function(d) {
        const yScale = internal.getYScale('y');

        const cy = +d3.select(this).attr('cy');
        const { dx, dy } = currentEvent;
        const { value, x, index } = d;
        // because yScale is linear the k will be the coefficient
        const k = yScale(value + 1) - cy;

        d.value = dy / k + value;

        d.value = d.value > 1 ? 1 : d.value;
        d.value = d.value < 0 ? 0 : d.value;

        if (index > 0 && index < tf2dSlider.handleN - 1) {
          const cx = +d3.select(this).attr('cx');
          // because xScale is linear the k will be the coefficient
          const kX = internal.x(x + 1) - cx;
          d.x = dx / kX + x;
          // get x values of other circles
          const xValues = internal.data.targets.find(z => z.id === tf2dSlider.yName).values.map(z => z.x);
          d.x = d.x > xValues[index + 1] ? xValues[index + 1] : d.x;
          d.x = d.x < xValues[index - 1] ? xValues[index - 1] : d.x;
        }
        const tfValues = internal.data.targets.find(z => z.id === tf2dSlider.yName).values;
        const colors = self.engine3d.updateTransferFuncTexture(tfValues.map(z => z.x), tfValues.map(z => z.value));
        self.fillColorBarColorsFromRGB(colors);
        self.transFunc2dSlider.flush();
      })
      .on('dragstart', () => self.engine3d.onMouseDown())
      .on('dragend', () => self.engine3d.onMouseUp()));
  }

  /** Initialize 2d menu panel */
  init2DPanel() {
    // slider 2d level
    this.sliderSlice = $('#med3web-slider-2d-slice').get(0);
    if (this.sliderSlice) {
      noUiSlider.create(this.sliderSlice, {
        start: 0.5,
        tooltips: true,
        step: 0.01,
        range: {
          min: 0,
          max: 1,
        },
      });
      this.sliderSlice.noUiSlider.on('slide', (sliderValue) => {
        this.engine2d.setSliderPosition(sliderValue);
      });
    }

    this.sliderContrast = $('#med3web-slider-2d-contrast').get(0);
    if (this.sliderContrast) {
      noUiSlider.create(this.sliderContrast, {
        start: 1,
        tooltips: true,
        step: 0.01,
        range: {
          min: 0.5,
          max: 2,
        },
      });
      this.sliderContrast.noUiSlider.on('slide', (sliderValue) => {
        this.engine2d.updateContrastFromSliders(sliderValue);
      });
    }

    this.sliderBrightness = $('#med3web-slider-2d-brightness').get(0);
    if (this.sliderBrightness) {
      noUiSlider.create(this.sliderBrightness, {
        start: 0,
        tooltips: true,
        step: 0.01,
        range: {
          min: -0.5,
          max: 0.5,
        },
      });
      this.sliderBrightness.noUiSlider.on('slide', (sliderValue) => {
        this.engine2d.updateBrightnessFromSliders(sliderValue);
      });
    }


    this.sliderSmoothing = $('#med3web-slider-2d-smoothing').get(0);
    if (this.sliderSmoothing) {
      noUiSlider.create(this.sliderSmoothing, {
        start: 0.8,
        tooltips: true,
        step: 0.01,
        range: {
          min: 0,
          max: 2.4,
        },
      });
      this.sliderSmoothing.noUiSlider.on('slide', (sliderValue) => {
        this.engine2d.updateFilterFromSliders(sliderValue);
        this.engine2d.saveFiltersChanges(false);
      });
    }

    const buttonAxisX = $('#med3web-2d-axis-x');
    if (buttonAxisX.length === 1) {
      buttonAxisX.on('click', () => {
        this.engine2d.setSliceAxis(Graphics2d.SLICE_AXIS_X);
      });
    }
    const buttonAxisY = $('#med3web-2d-axis-y');
    if (buttonAxisY.length === 1) {
      buttonAxisY.on('click', () => {
        this.engine2d.setSliceAxis(Graphics2d.SLICE_AXIS_Y);
      });
    }
    const buttonAxisZ = $('#med3web-2d-axis-z');
    if (buttonAxisZ.length === 1) {
      buttonAxisZ.on('click', () => {
        this.engine2d.setSliceAxis(Graphics2d.SLICE_AXIS_Z);
      });
    }
    const modalFilterData = $('#med3web-modal-filter-data');
    if (modalFilterData.length === 1) {
      modalFilterData.find('[data-btn-role=reset]').on('click', () => {
        this.resetSliders();
        this.engine2d.saveFiltersChanges(true);
      });
      modalFilterData.find('[data-btn-role=cancel]').on('click', () => {
      });
      modalFilterData.find('[data-btn-role=save]').on('click', () => {
        this.engine2d.saveFiltersChanges(true);
      });
    }
    const container2d = $('#med3web-container-2d');
    const inputText2dToolModal = $('#med3web-modal-2d-tool-input-text');
    const textArea = inputText2dToolModal.find('textarea');
    let oldText = null;
    let clicks = 0;
    const DBL_CLICKS_N = 2;
    const DELAY = 400;
    let singleClickTimer = null;
    if (inputText2dToolModal.length === 1) {
      if (container2d.length === 1) {
        container2d.on('mouseup', () => {
          clicks++;
          if (clicks === 1) {
            singleClickTimer = setTimeout(() => {
              clicks = 0;
              if (this.engine2d !== null && this.engine2d.m_toolType === 'text') {
                inputText2dToolModal.modal('show');
              }
            }, DELAY);
          } else if (clicks === DBL_CLICKS_N) {
            clearTimeout(singleClickTimer);
            clicks = 0;
            if (this.engine2d !== null && this.engine2d.m_toolType === 'text') {
              oldText = this.engine2d.m_textTool.removeCurTextByCoords();
              if (oldText !== null) {
                textArea.val(oldText);
                inputText2dToolModal.modal('show');
              }
            }
          }
        });
      }
      inputText2dToolModal.on('shown.bs.modal', () => {
        textArea.focus();
      });
      inputText2dToolModal.find('[data-btn-role=ok]').on('click', () => {
        this.engine2d.m_textTool.setText(textArea.val());
        textArea.val('');
        oldText = null;
      });
      inputText2dToolModal.find('[data-btn-role=cancel]').on('click', () => {
        if (oldText === null) {
          this.engine2d.m_textTool.cancelInput();
        } else {
          this.engine2d.m_textTool.setText(oldText);
        }
        textArea.val('');
        oldText = null;
      });
    }
  }

  resetSliders() {
    this.sliderContrast.noUiSlider.reset();
    this.sliderBrightness.noUiSlider.reset();
    this.sliderSmoothing.noUiSlider.reset();
    this.engine2d.m_contrastBrightTool.clear();
    this.engine2d.m_materialsTex2d.m_uniforms.contrast.value = this.engine2d.m_contrastBrightTool.m_contrast;
    this.engine2d.m_materialsTex2d.m_uniforms.brightness.value = this.engine2d.m_contrastBrightTool.m_brightness;
    this.engine2d.m_filterTool.clear();
    this.engine2d.m_materialsTex2d.m_uniforms.sigma.value = this.engine2d.m_filterTool.m_sigma;
  }
  init2DToolbar() {
    this.toolbar2d.find('label').on('click', (e) => {
      const tgt = $(e.currentTarget);
      if (!(tgt.hasClass('active'))) {
        const toolType = tgt.attr('data-tool-type');
        switch (toolType) {
          case 'clear':
            this.engine2d.clear2DTools();
            break;
          case 'default':
            this.engine2d.default2DTools();
            break;
          case 'save':
            this.engine2d.set2dToolType(toolType);
            break;
          case 'filter':
            break;
          default:
            this.engine2d.set2dToolType(toolType);
            break;
        }
        /*if (toolType === 'clear') {
          this.engine2d.clear2DTools();
        } else if (toolType !== 'save') {
          this.engine2d.set2dToolType(toolType);
        }*/
      }
    });
  }
} // class Menu
