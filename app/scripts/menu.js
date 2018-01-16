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
import Spinner from 'spin'; // eslint-disable-line no-unused-vars
import Graphics2d from './graphics2d/graphics2d';
import packageJson from '../../package.json';
import Screenshot from './utils/screenshot';
import config from '../../tools/config';

const developerMode = true;

/** Possible 3d render modes */
export const loadFileType = {
  LOCALKTX: 'local ktx',
  LOCALDICOM: 'local dicom',
  LOCALNIFTI: 'local nifti',
  LOCALHDR: 'local hdr',
  LOCALIMG: 'local img',
  KTX: 'ktx',
  DICOM: 'dicom',
  NIFTI: 'nifti',
  HDR: 'hdr',
  IMG: 'img',
};

/** Possible 3d render modes */
export const renderModes = {
  VOLREND: 'volrend',
  ISOSURF: 'isosurf',
  MIP: 'mip',
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
  constructor(engine2d, engine3d) {
    this.engine2d = engine2d;
    this.engine3d = engine3d;
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
    this.sliderOpacityTissue = null;
    /** slider object for brightness */
    this.sliderBrightness = null;
    /** slider object for z cut */
    this.sliderZCut = null;
    /** 2d toolbar */
    this.toolbar2d = $('#med3web-toolbar-2d');
    this.curModeSuffix = $('[data-toggle=mode].active').attr('data-value');
    /** table that contains all dicom tags */
    this.dicomTagsTable = $('#med3web-table-dicom-tags');
    this.dicomTagsSliceSelector = $('#med3web-select-choose-slice');
    this.curDataType = null;
    /** panel about */
    this.panelAboutVersion = $('#med3web-panel-about-version');
    this.panelAboutDescription = $('#med3web-panel-about-description');
    this.panelAboutCopyright = $('#med3web-panel-about-copyright');
    this.panelMenuHide = $('#med3web-menu-panel-hide');
    const strVer = packageJson.version;
    const strDate = new Date().toISOString()
      .replace(/[-:]|\..+/gi, '')
      .replace(/T/, '.');
    const strYear = new Date().getFullYear();
    const strDescr = packageJson.description;
    const strAuthor = packageJson.author;
    const strCopyright = `Copyright ${strYear} ${strAuthor}`;
    this.panelAboutVersion.text(`version ${strVer}-${strDate}`);
    this.panelAboutDescription.text(strDescr);
    this.panelAboutCopyright.text(strCopyright);
    // console.log(`strCopyright = ${strCopyright}`);

    this.isHandleGreen = 0;
    /** loaded data histogram */
    this.hist = null;
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
    this.resetHist();
    if (this.dicomTagsTable.length === 1 && this.dicomTagsSliceSelector.length === 1 &&
      this.dicomTagsSliceSelector.find('option').length > 0) {
      this.showDicomTagsOnSliceIdx(0);
    }
    this.panelMenuHide.hide();
  }

  /** add new tag to dicom tags viewer */
  onNewTag(group, elem, desc, value, imageNumber, fileName) {
    fileName = fileName.replace(/\s+/g, ''); // remove all spaces
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
      this.dicomTagsTable.find('tbody').get(0).append(row);
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
  }

  /** Reset sliders values */
  resetUserInterface() {
    $('#med3web-3d-volrend-head').find('a').click();

    this.sliderThresholdIsoSurf.noUiSlider.set(this.curDataType.thresholdIsosurf);
    this.sliderOpacityTissue.noUiSlider.set(this.curDataType.opacityTissue);
    this.sliderTransFunc.noUiSlider.set([this.curDataType.thresholdTissue1, this.curDataType.thresholdTissue2,
      this.curDataType.thresholdIsosurf]);
    this.sliderBrightness.noUiSlider.set(this.curDataType.brightness);
    this.sliderZCut.noUiSlider.set(1);
  }

  resetHist() {
    // simple histogram for integer volume data in [0, 255]
    const binsN = 257;
    const data = ['data'];

    for (let i = 1; i < binsN; i++) {
      data[i] = 0;
    }

    for (let i = 0; i < this.engine2d.m_volumeData.length; i++) {
      data[this.engine2d.m_volumeData[i] + 1] += 1;
    }
    data[1] = 0; // some hack for better visualization

    this.hist.load({
      unload: 'data',
      columns: [
        data,
      ],
    });
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

  updateInfoContainer() {
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

  /** Initialize navigation bar */
  initNavBar() {
    // Callback for open local file from computer
    const localOpen = $('#med3web-input-file-open');
    if (localOpen.length === 1) {
      localOpen.on('change', (evt) => {
        $('#med3web-button-dropdown-open').click(); // close dropdown menu

        const file = evt.target.files[0];
        const fileName = file.name;
        // detect file type
        let isKtx = (fileName.indexOf('.ktx') !== -1);
        isKtx = (fileName.indexOf('.KTX') !== -1) ? true : isKtx;
        let isDicom = (fileName.indexOf('.dcm') !== -1);
        isDicom = (fileName.indexOf('.DCM') !== -1) ? true : isDicom;
        let isNifti = (fileName.indexOf('.nii') !== -1);
        isNifti = (fileName.indexOf('.NII') !== -1) ? true : isNifti;
        let isHdr = (fileName.indexOf('.hdr') !== -1);
        isHdr = (fileName.indexOf('.HDR') !== -1) ? true : isHdr;
        let isImg = (fileName.indexOf('.img') !== -1);
        isImg = (fileName.indexOf('.IMG') !== -1) ? true : isImg;

        // read local file
        if (isKtx) {
          this.loadFileEvent.detail.fileType = loadFileType.LOCALKTX;
          this.loadFileEvent.detail.data = file;
          this.loadFileEvent.detail.dataType = 'undefined';
          dispatchEvent(this.loadFileEvent);
          this.clearDicomTagsTable();
        }
        if (isDicom) {
          const files = evt.target.files;
          this.loadFileEvent.detail.fileType = loadFileType.LOCALDICOM;
          this.loadFileEvent.detail.data = files;
          this.loadFileEvent.detail.dataType = 'undefined';
          dispatchEvent(this.loadFileEvent);
          this.clearDicomTagsTable();
        }
        if (isNifti) {
          this.loadFileEvent.detail.fileType = loadFileType.LOCALNIFTI;
          this.loadFileEvent.detail.data = file;
          this.loadFileEvent.detail.dataType = 'undefined';
          dispatchEvent(this.loadFileEvent);
          this.clearDicomTagsTable();
        }
        if (isHdr) {
          const files = evt.target.files;
          this.loadFileEvent.detail.fileType = loadFileType.LOCALHDR;
          this.loadFileEvent.detail.data = files;
          this.loadFileEvent.detail.dataType = 'hdr';
          dispatchEvent(this.loadFileEvent);
          this.clearDicomTagsTable();
        }
        if (isImg) {
          const files = evt.target.files;
          this.loadFileEvent.detail.fileType = loadFileType.LOCALIMG;
          this.loadFileEvent.detail.data = files;
          this.loadFileEvent.detail.dataType = 'undefined';
          dispatchEvent(this.loadFileEvent);
          this.clearDicomTagsTable();
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

        // some debug trick: if user press Load button in URL open
        // with empty URL => perform screen copy take
        if (strUrlFile.length < 1) {
          $('#med3web-modal-open-url').modal('hide');

          const containter3d = $('#med3web-container-3d');
          containter3d.click();
          Screenshot.makeScreenshot(this.engine3d);
          return;
        }
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
          if (strUrlFile.endsWith('.h')) {
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

    // mode switching buttons
    $('[data-toggle=mode]').on('click', (e) => {
      const newModeSuffix = $(e.currentTarget).attr('data-value');
      if (newModeSuffix !== this.curModeSuffix) {
        $(`#med3web-container-${this.curModeSuffix}`).hide();
        $(`#med3web-container-${newModeSuffix}`).show();
        $(`#med3web-panel-menu-${this.curModeSuffix}`).hide();
        $(`#med3web-panel-menu-${newModeSuffix}`).show();
        if ($(`#med3web-toolbar-${this.curModeSuffix}`)) {
          $(`#med3web-toolbar-${this.curModeSuffix}`).hide();
        }
        if ($(`#med3web-toolbar-${newModeSuffix}`)) {
          $(`#med3web-toolbar-${newModeSuffix}`).show();
        }
        this.curModeSuffix = newModeSuffix;
      }
    });
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
        let slider = null;
        let curDiv = null;
        switch (mode) {
          case renderModes.VOLREND:
            curDiv = $('#med3web-3d-volrend-body').find('div')[0];
            slider = $('#med3web-setting-3d-brightness').detach();
            slider.appendTo(curDiv);
            slider = $('#med3web-setting-3d-contrast').detach();
            slider.appendTo(curDiv);
            slider = $('#med3web-setting-3d-z-cut').detach();
            slider.appendTo(curDiv);
            this.engine3d.switchToVolumeRender();
            break;
          case renderModes.ISOSURF:
            curDiv = $('#med3web-3d-isosurf-body').find('div')[0];
            slider = $('#med3web-setting-3d-brightness').detach();
            slider.appendTo(curDiv);
            slider = $('#med3web-setting-3d-contrast').detach();
            slider.appendTo(curDiv);
            slider = $('#med3web-setting-3d-z-cut').detach();
            slider.appendTo(curDiv);
            this.engine3d.switchToIsosurfRender();
            break;
          case renderModes.MIP:
            slider = $('#med3web-setting-3d-z-cut').detach();
            slider.appendTo($('#med3web-3d-mip-body').find('div')[0]);
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
    this.sliderOpacityTissue = $('#med3web-slider-opacity-tissue').get(0);
    if (this.sliderOpacityTissue) {
      noUiSlider.create(this.sliderOpacityTissue, {
        start: 0.5,
        // start: curFileDataType.opacityTissue,
        tooltips: true,
        step: 0.01,
        range: {
          min: 0,
          max: 1,
        },
      });
      this.sliderOpacityTissue.noUiSlider.on('slide', (sliderValue) => {
        // use 'sliderValue' as a float value [0; 1]
        this.engine3d.setOpacityBarrier(sliderValue);
      });

      this.sliderOpacityTissue.noUiSlider.on('start', () => {
        this.engine3d.onMouseDown();
      });

      this.sliderOpacityTissue.noUiSlider.on('end', () => {
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
          ratio: 1
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

    $('[data-type=reset-to-default]').on('click', () => {
      this.sliderThresholdIsoSurf.noUiSlider.set(this.curDataType.thresholdIsosurf);
      this.sliderOpacityTissue.noUiSlider.set(this.curDataType.opacityTissue);
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
  }

  /** Initialize 2d menu panel */
  init2DPanel() {
    // slider 2d level
    const sliderSlice = $('#med3web-slider-2d-slice').get(0);
    if (sliderSlice) {
      noUiSlider.create(sliderSlice, {
        start: 0.5,
        tooltips: true,
        step: 0.01,
        range: {
          min: 0,
          max: 1,
        },
      });
      sliderSlice.noUiSlider.on('slide', (sliderValue) => {
        this.engine2d.setSliderPosition(sliderValue);
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
  }


  init2DToolbar() {
    this.toolbar2d.find('label').on('click', (e) => {
      const tgt = $(e.currentTarget);
      if (!(tgt.hasClass('active'))) {
        const toolType = tgt.attr('data-tool-type');
        if (toolType === 'clear') {
          this.engine2d.clear2DTools();
        } else {
          this.engine2d.set2dToolType(toolType);
        }
      }
    });
  }
} // class Menu
