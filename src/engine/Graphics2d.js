/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { connect } from 'react-redux';

import Modes2d from '../store/Modes2d';
import StoreActionType from '../store/ActionTypes';
import ToolPick from './tools2d/ToolPick';
import ToolDistance from './tools2d/ToolDistance';
import ToolAngle from './tools2d/ToolAngle';
import ToolArea from './tools2d/ToolArea';
import ToolRect from './tools2d/ToolRect';
import ToolText from './tools2d/ToolText';
import ToolEdit from './tools2d/ToolEdit';
import ToolDelete from './tools2d/ToolDelete';

import Tools2dType from './tools2d/ToolTypes';
import Segm2d from './Segm2d';

import { getPalette256 } from './loaders/RoiPalette256';

class Graphics2d extends React.Component {
  constructor(props) {
    super(props);

    this.m_mount = React.createRef();

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);

    this.m_sliceRatio = 0.5;
    this.m_mode2d = Modes2d.TRANSVERSE;

    // scale
    this.m_zoom = 1;
    this.m_xPos = 0;
    this.m_yPos = 0;

    // mounted
    this.m_isMounted = false;

    // animation
    // this.animate = this.animate.bind(this);
    // this.m_frameId = null;

    // actual render window dimenison
    this.state = {
      wRender: 0,
      hRender: 0,
      stateMouseDown: false,
      xMouse: -1,
      yMouse: -1,
    };

    // segm 2d
    this.segm2d = new Segm2d(this);
    this.m_isSegmented = false;

    // tools2d
    this.m_toolPick = new ToolPick(this);
    this.m_toolDistance = new ToolDistance(this);
    this.m_toolAngle = new ToolAngle(this);
    this.m_toolArea = new ToolArea(this);
    this.m_toolRect = new ToolRect(this);
    this.m_toolText = new ToolText(this);
    this.m_toolEdit = new ToolEdit(this);
    this.m_toolDelete = new ToolDelete(this);

    // store
    props.dispatch({ type: StoreActionType.SET_GRAPHICS_2D, graphics2d: this });
  }

  componentDidMount() {
    this.m_isMounted = true;
    this.prepareImageForRender();
    this.renderReadyImage();

    const w = this.m_mount.current.clientWidth;
    const h = this.m_mount.current.clientHeight;
    if (this.state.wRender === 0) {
      this.setState({ wRender: w });
      this.setState({ hRender: h });
    }
  }

  componentWillUnmount() {
    this.m_isMounted = false;
  }

  componentDidUpdate() {
    if (this.m_isMounted) {
      this.renderReadyImage();
    }
  }

  screenshot() {
    return this.m_mount.current.toDataURL();
  }

  prepareImageForRender(volIndexArg) {
    //TODO: center the image by click
    const objCanvas = this.m_mount.current; // Canvas HTML element reference
    if (objCanvas === null) {
      return;
    }
    // resetting canvas max sizes, by checking its wrapper's size
    const canvasWrapper = objCanvas.parentNode;
    const w = canvasWrapper.clientWidth;
    const h = canvasWrapper.clientHeight;
    if (w * h === 0) {
      return;
    }

    const ctx = objCanvas.getContext('2d');
    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillRect(0, 0, w, h);

    const store = this.props;
    const volSet = store.volumeSet;
    // const volIndex = this.m_volumeIndex;
    const volIndex = volIndexArg !== undefined ? volIndexArg : store.volumeIndex;

    const vol = volSet.getVolume(volIndex);
    const mode2d = this.m_mode2d;
    const sliceRatio = store.sliceRatio;

    if (vol === null) return;

    if (vol.m_dataArray === null) {
      console.log('Graphics2d. Volume has no data array');
      return;
    }
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    const xyDim = xDim * yDim;
    const dataSrc = vol.m_dataArray; // 1 or 4 bytes array of pixels
    if (dataSrc.length !== xDim * yDim * zDim * vol.m_bytesPerVoxel) {
      console.log(`Bad src data len = ${dataSrc.length}, but expect ${xDim}*${yDim}*${zDim}`);
    }

    // console.log(`Graphics2d. prepareImageForRender. mode= ${mode2d}`);

    const ONE = 1;
    const FOUR = 4;
    const OFF_3 = 3;

    let imgData = null;
    let dataDst = null;

    const roiPal256 = getPalette256();

    // determine actual render square (not w * h - viewport)
    // calculate area using physical volume dimension
    const TOO_SMALL = 1.0e-5;
    const pbox = vol.m_boxSize;
    if (pbox.x * pbox.y * pbox.z < TOO_SMALL) {
      console.log(`Bad physical dimensions for rendered volume = ${pbox.x}*${pbox.y}*${pbox.z} `);
    }
    let wScreen = 0,
      hScreen = 0;

    const xPos = store.render2dxPos;
    const yPos = store.render2dyPos;
    const zoom = store.render2dZoom;

    if (mode2d === Modes2d.TRANSVERSE) {
      // calc screen rect based on physics volume slice size (z slice)
      const xyRratio = pbox.x / pbox.y;
      wScreen = w;
      hScreen = Math.floor(w / xyRratio);
      if (hScreen > h) {
        hScreen = h;
        wScreen = Math.floor(h * xyRratio);
        if (wScreen > w) {
          console.log(`logic error! wScreen * hScreen = ${wScreen} * ${hScreen}`);
        }
      }
      hScreen = hScreen > 0 ? hScreen : 1;

      // console.log(`gra2d. render: wScreen*hScreen = ${wScreen} * ${hScreen}, but w*h=${w}*${h} `);

      this.m_toolPick.setScreenDim(wScreen, hScreen);
      this.m_toolDistance.setScreenDim(wScreen, hScreen);
      this.m_toolAngle.setScreenDim(wScreen, hScreen);
      this.m_toolArea.setScreenDim(wScreen, hScreen);
      this.m_toolRect.setScreenDim(wScreen, hScreen);
      this.m_toolText.setScreenDim(wScreen, hScreen);
      this.m_toolEdit.setScreenDim(wScreen, hScreen);
      this.m_toolDelete.setScreenDim(wScreen, hScreen);

      // setup pixel size for 2d tools
      const xPixelSize = vol.m_boxSize.x / xDim;
      const yPixelSize = vol.m_boxSize.y / yDim;
      // console.log(`xyPixelSize = ${xPixelSize} * ${yPixelSize}`);
      this.m_toolDistance.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolAngle.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolArea.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolRect.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolText.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolEdit.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolDelete.setPixelSize(xPixelSize, yPixelSize);

      // create image data
      imgData = ctx.createImageData(wScreen, hScreen);
      dataDst = imgData.data;
      if (dataDst.length !== wScreen * hScreen * 4) {
        console.log(`Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`);
      }

      // z slice
      let zSlice = Math.floor(zDim * sliceRatio);
      zSlice = zSlice < zDim ? zSlice : zDim - 1;
      const zOff = zSlice * xyDim;
      const xStep = (zoom * xDim) / wScreen;
      const yStep = (zoom * yDim) / hScreen;
      let j = 0;
      let ay = yPos * yDim;
      if (vol.m_bytesPerVoxel === ONE) {
        for (let y = 0; y < hScreen; y++, ay += yStep) {
          const ySrc = Math.floor(ay);
          const yOff = ySrc * xDim;
          let ax = xPos * xDim;
          for (let x = 0; x < wScreen; x++, ax += xStep) {
            const xSrc = Math.floor(ax);
            const val = dataSrc[zOff + yOff + xSrc];
            dataDst[j + 0] = val;
            dataDst[j + 1] = val;
            dataDst[j + 2] = val;
            dataDst[j + 3] = 255; // opacity
            j += 4;
          } // for (x)
        } // for (y)
      } else if (vol.m_bytesPerVoxel === FOUR) {
        for (let y = 0; y < hScreen; y++, ay += yStep) {
          const ySrc = Math.floor(ay);
          const yOff = ySrc * xDim;
          let ax = xPos * xDim;
          for (let x = 0; x < wScreen; x++, ax += xStep) {
            const xSrc = Math.floor(ax);
            const val = dataSrc[(zOff + yOff + xSrc) * FOUR + OFF_3];
            const val4 = val * FOUR;
            const rCol = roiPal256[val4 + 0];
            const gCol = roiPal256[val4 + 1];
            const bCol = roiPal256[val4 + 2];

            dataDst[j + 0] = bCol;
            dataDst[j + 1] = gCol;
            dataDst[j + 2] = rCol;
            dataDst[j + 3] = 255;
            j += 4;
          } // for (x)
        } // for (y)
      } // if 4 bpp
    } else if (mode2d === Modes2d.SAGGITAL) {
      // calc screen rect based on physics volume slice size (x slice)
      const yzRatio = pbox.y / pbox.z;
      wScreen = w;
      hScreen = Math.floor(w / yzRatio);
      if (hScreen > h) {
        hScreen = h;
        wScreen = Math.floor(h * yzRatio);
        if (wScreen > w) {
          console.log(`logic error! wScreen * hScreen = ${wScreen} * ${hScreen}`);
        }
      }
      hScreen = hScreen > 0 ? hScreen : 1;
      // console.log(`gra2d. render: wScreen*hScreen = ${wScreen} * ${hScreen}, but w*h=${w}*${h} `);

      this.m_toolPick.setScreenDim(wScreen, hScreen);
      this.m_toolDistance.setScreenDim(wScreen, hScreen);
      this.m_toolAngle.setScreenDim(wScreen, hScreen);
      this.m_toolArea.setScreenDim(wScreen, hScreen);
      this.m_toolRect.setScreenDim(wScreen, hScreen);
      this.m_toolText.setScreenDim(wScreen, hScreen);
      this.m_toolEdit.setScreenDim(wScreen, hScreen);
      this.m_toolDelete.setScreenDim(wScreen, hScreen);

      // setup pixel size for 2d tools
      const xPixelSize = vol.m_boxSize.y / yDim;
      const yPixelSize = vol.m_boxSize.z / zDim;
      // console.log(`xyPixelSize = ${xPixelSize} * ${yPixelSize}`);
      this.m_toolDistance.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolAngle.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolArea.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolRect.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolText.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolEdit.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolDelete.setPixelSize(xPixelSize, yPixelSize);

      // create image data
      imgData = ctx.createImageData(wScreen, hScreen);
      dataDst = imgData.data;
      if (dataDst.length !== wScreen * hScreen * 4) {
        console.log(`Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`);
      }

      // x slice
      let xSlice = Math.floor(xDim * sliceRatio);
      xSlice = xSlice < xDim ? xSlice : xDim - 1;

      const yStep = (zoom * yDim) / wScreen;
      const zStep = (zoom * zDim) / hScreen;
      let j = 0;
      let az = yPos * zDim;
      if (vol.m_bytesPerVoxel === ONE) {
        for (let y = 0; y < hScreen; y++, az += zStep) {
          const zSrc = Math.floor(az);
          const zOff = zSrc * xDim * yDim;
          let ay = xPos * yDim;
          for (let x = 0; x < wScreen; x++, ay += yStep) {
            const ySrc = Math.floor(ay);
            const yOff = ySrc * xDim;
            const val = dataSrc[zOff + yOff + xSlice];

            dataDst[j + 0] = val;
            dataDst[j + 1] = val;
            dataDst[j + 2] = val;
            dataDst[j + 3] = 255; // opacity

            j += 4;
          } // for (x)
        } // for (y)
      } else if (vol.m_bytesPerVoxel === FOUR) {
        for (let y = 0; y < hScreen; y++, az += zStep) {
          const zSrc = Math.floor(az);
          const zOff = zSrc * xDim * yDim;
          let ay = xPos * yDim;
          for (let x = 0; x < wScreen; x++, ay += yStep) {
            const ySrc = Math.floor(ay);
            const yOff = ySrc * xDim;
            const val = dataSrc[(zOff + yOff + xSlice) * FOUR + OFF_3];
            const val4 = val * FOUR;
            const rCol = roiPal256[val4 + 0];
            const gCol = roiPal256[val4 + 1];
            const bCol = roiPal256[val4 + 2];

            dataDst[j + 0] = bCol;
            dataDst[j + 1] = gCol;
            dataDst[j + 2] = rCol;
            dataDst[j + 3] = 255; // opacity

            j += 4;
          } // for (x)
        } // for (y)
      } // if 4 bppp
    } else if (mode2d === Modes2d.CORONAL) {
      // calc screen rect based on physics volume slice size (y slice)
      const xzRatio = pbox.x / pbox.z;
      wScreen = w;
      hScreen = Math.floor(w / xzRatio);
      if (hScreen > h) {
        hScreen = h;
        wScreen = Math.floor(h * xzRatio);
        if (wScreen > w) {
          console.log(`logic error! wScreen * hScreen = ${wScreen} * ${hScreen}`);
        }
      }
      hScreen = hScreen > 0 ? hScreen : 1;
      // console.log(`gra2d. render: wScreen*hScreen = ${wScreen} * ${hScreen}, but w*h=${w}*${h} `);

      this.m_toolPick.setScreenDim(wScreen, hScreen);
      this.m_toolDistance.setScreenDim(wScreen, hScreen);
      this.m_toolAngle.setScreenDim(wScreen, hScreen);
      this.m_toolArea.setScreenDim(wScreen, hScreen);
      this.m_toolRect.setScreenDim(wScreen, hScreen);
      this.m_toolText.setScreenDim(wScreen, hScreen);
      this.m_toolEdit.setScreenDim(wScreen, hScreen);
      this.m_toolDelete.setScreenDim(wScreen, hScreen);

      // setup pixel size for 2d tools
      const xPixelSize = vol.m_boxSize.x / xDim;
      const yPixelSize = vol.m_boxSize.z / zDim;
      // console.log(`xyPixelSize = ${xPixelSize} * ${yPixelSize}`);
      this.m_toolDistance.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolAngle.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolArea.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolRect.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolText.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolEdit.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolDelete.setPixelSize(xPixelSize, yPixelSize);

      // create image data
      imgData = ctx.createImageData(wScreen, hScreen);
      dataDst = imgData.data;
      if (dataDst.length !== wScreen * hScreen * 4) {
        console.log(`Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`);
      }

      // y slice
      let ySlice = Math.floor(yDim * sliceRatio);
      ySlice = ySlice < yDim ? ySlice : yDim - 1;
      const yOff = ySlice * xDim;

      const xStep = (zoom * xDim) / wScreen;
      const zStep = (zoom * zDim) / hScreen;
      let j = 0;
      let az = yPos * zDim;
      if (vol.m_bytesPerVoxel === ONE) {
        for (let y = 0; y < hScreen; y++, az += zStep) {
          const zSrc = Math.floor(az);
          const zOff = zSrc * xDim * yDim;
          let ax = xPos * xDim;
          for (let x = 0; x < wScreen; x++, ax += xStep) {
            const xSrc = Math.floor(ax);
            const val = dataSrc[zOff + yOff + xSrc];

            dataDst[j + 0] = val;
            dataDst[j + 1] = val;
            dataDst[j + 2] = val;
            dataDst[j + 3] = 255; // opacity

            j += 4;
          } // for (x)
        } // for (y)
      } else if (vol.m_bytesPerVoxel === FOUR) {
        for (let y = 0; y < hScreen; y++, az += zStep) {
          const zSrc = Math.floor(az);
          const zOff = zSrc * xDim * yDim;
          let ax = xPos * xDim;
          for (let x = 0; x < wScreen; x++, ax += xStep) {
            const xSrc = Math.floor(ax);
            const val = dataSrc[(zOff + yOff + xSrc) * FOUR + OFF_3];
            const val4 = val * FOUR;
            const rCol = roiPal256[val4 + 0];
            const gCol = roiPal256[val4 + 1];
            const bCol = roiPal256[val4 + 2];

            dataDst[j + 0] = bCol;
            dataDst[j + 1] = gCol;
            dataDst[j + 2] = rCol;
            dataDst[j + 3] = 255; // opacity

            j += 4;
          } // for (x)
        } // for (y)
      } // end if 4 bpp
    }

    // centering: setting canvas image size, to match its HTML element's size
    objCanvas.width = wScreen;
    objCanvas.height = hScreen;
    // check is segmentation 2d mode is active
    // const isSegm = store.graphics2dModeSegmentation;
    // console.log("Segm2d mode = " + isSegm);

    this.imgData = imgData;
    this.segm2d.setImageData(imgData);
  } // prepareImageForRender

  fillBackground(ctx) {
    const { hRender, wRender } = this.state;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, wRender, hRender);
  }

  renderReadyImage() {
    if (!this.m_isMounted) {
      return;
    }

    const objCanvas = this.m_mount.current;
    if (objCanvas === null) {
      return;
    }
    const ctx = objCanvas.getContext('2d');
    // prepare canvas
    this.fillBackground(ctx);

    const store = this.props;

    const volSet = store.volumeSet;
    if (volSet.getNumVolumes() === 0) {
      return;
    }
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);
    if (vol === null) {
      return;
    }

    const isSegm = this.m_isSegmented;
    if (isSegm) {
      const w = this.m_toolPick.m_wScreen;
      const h = this.m_toolPick.m_hScreen;
      this.segm2d.render(ctx, w, h, this.imgData);
    } else {
      ctx.putImageData(this.imgData, 0, 0);
    }

    // render all tools
    this.m_toolPick.render(ctx);
    this.m_toolDistance.render(ctx, store);
    this.m_toolAngle.render(ctx, store);
    this.m_toolArea.render(ctx, store);
    this.m_toolRect.render(ctx, store);
    this.m_toolText.render(ctx, store);
    this.m_toolEdit.render(ctx, store);
    this.m_toolDelete.render(ctx, store);
  }

  onMouseWheel(evt) {
    const store = this.props;
    const step = evt.deltaY * 2 ** -10;

    const zoom = store.render2dZoom;
    let zoomNew = zoom + step;
    let xPosNew = store.render2dxPos - ((step / 4) * evt.clientX) / evt.clientY;
    let yPosNew = store.render2dyPos - ((step / 4) * evt.clientY) / evt.clientX;

    console.log(`onMouseWheel.evt = ${xPosNew}, ${yPosNew}`);
    // console.log(`onMouseWheel. zoom.puml = ${zoom.puml} zoomNew = ${zoomNew}, xyPos = ${xPosNew},${yPosNew}`);
    if (Math.abs(zoomNew) > 1 || Math.abs(zoomNew) < 0.02 || xPosNew < 0 || yPosNew < 0 || xPosNew > 1 || yPosNew > 1) {
      return;
    }
    store.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: zoomNew });
    store.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: xPosNew });
    store.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: yPosNew });

    store.graphics2d.forceUpdate();
  }

  onMouseUp(evt) {
    const store = this.props;
    const indexTools2d = store.indexTools2d;
    if (indexTools2d === Tools2dType.DISTANCE) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = evt.clientX - box.left;
      const yScr = evt.clientY - box.top;
      this.m_toolDistance.onMouseUp(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.ANGLE) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = evt.clientX - box.left;
      const yScr = evt.clientY - box.top;
      this.m_toolAngle.onMouseUp(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.AREA) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = evt.clientX - box.left;
      const yScr = evt.clientY - box.top;
      this.m_toolArea.onMouseUp(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.RECT) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = evt.clientX - box.left;
      const yScr = evt.clientY - box.top;
      this.m_toolRect.onMouseUp(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.EDIT) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = evt.clientX - box.left;
      const yScr = evt.clientY - box.top;
      this.m_toolEdit.onMouseUp(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.DELETE) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = evt.clientX - box.left;
      const yScr = evt.clientY - box.top;
      this.m_toolDelete.onMouseUp(xScr, yScr, store);
    }
  }

  onMouseMove(evt) {
    const store = this.props;
    const indexTools2d = store.indexTools2d;
    const box = this.m_mount.current.getBoundingClientRect();
    const xContainer = evt.clientX - box.left;
    const yContainer = evt.clientY - box.top;
    const xScr = xContainer;
    const yScr = yContainer;

    if (indexTools2d === Tools2dType.DISTANCE) {
      this.m_toolDistance.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.ANGLE) {
      this.m_toolAngle.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.AREA) {
      this.m_toolArea.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.RECT) {
      this.m_toolRect.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.EDIT) {
      this.m_toolEdit.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.DELETE) {
      this.m_toolDelete.onMouseMove(xScr, yScr, store);
    }
  }

  onMouseDown(evt) {
    const box = this.m_mount.current.getBoundingClientRect();
    const xContainer = evt.clientX - box.left;
    const yContainer = evt.clientY - box.top;
    const xScr = xContainer;
    const yScr = yContainer;
    // console.log(`onMouseDown. down = ${xScr}, ${yScr}`);

    const store = this.props;
    const indexTools2d = store.indexTools2d;
    // console.log(`onMouseDown. tool index = ${indexTools2d}`);

    switch (indexTools2d) {
      case Tools2dType.INTENSITY:
        this.m_toolPick.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.DISTANCE:
        this.m_toolDistance.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.ANGLE:
        this.m_toolAngle.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.AREA:
        this.m_toolArea.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.RECT:
        this.m_toolRect.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.TEXT:
        this.m_toolText.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.EDIT:
        this.m_toolEdit.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.DELETE:
        this.m_toolDelete.onMouseDown(xScr, yScr, store);
        break;
      default:
      // not defined
    } // switch
    // force update
    this.forceUpdate();
  } // onMouseDown

  /**
   * Invoke clear all tools
   */
  clear() {
    this.m_toolDistance.clear();
    this.m_toolAngle.clear();
    this.m_toolArea.clear();
    this.m_toolRect.clear();
    this.m_toolText.clear();
    this.m_toolEdit.clear();
    this.m_toolDelete.clear();
  }

  /**
   * Invoke forced rendering, after some tool visual changes
   */
  forceUpdate(volIndex) {
    // console.log('forceUpdate ...');
    this.prepareImageForRender(volIndex);
    // this.forceRender();
    if (this.m_isSegmented) {
      // need to draw segmented image
      if (this.segm2d.model !== null) {
        // we have loaded model: applt it to image
        this.segm2d.startApplyImage();
      }
    } else {
      this.forceRender();
    } // if not segmented image
  }

  forceRender() {
    if (this.m_isMounted) {
      // console.log('forceRender ...');
      this.setState({ state: this.state });
    }
  }

  /**
   * Main component render func callback
   */
  render() {
    // const store = this.props;
    // const volSet = store.volumeSet;
    this.m_sliceRatio = this.props.sliderValue;
    this.m_mode2d = this.props.mode2d;

    const wrapperStyles = {
      display: 'flex',
      justifyContent: 'flex-start',
      width: `calc(100% - 110px)`,
      height: `calc(100% - 110px)`,
      margin: '100px 125px',
    };
    const canvasStyles = {
      maxWidth: '100%',
      border: '2px solid #dc5e47',
      borderRadius: '10px',
    };
    return (
      <div style={wrapperStyles}>
        <canvas
          ref={this.m_mount}
          style={canvasStyles}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onMouseMove={this.onMouseMove}
          onWheel={this.onMouseWheel}
        />
      </div>
    );
  }
}

export default connect((store) => store)(Graphics2d);
