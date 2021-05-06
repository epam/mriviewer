/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useRef, useState } from 'react';
import { connect } from 'react-redux';

import Modes2d from '../store/Modes2d';
import ToolPick from './tools2d/ToolPick';
import ToolZoom from './tools2d/ToolZoom';
import ToolDistance from './tools2d/ToolDistance';
import ToolAngle from './tools2d/ToolAngle';
import ToolArea from './tools2d/ToolArea';
import ToolRect from './tools2d/ToolRect';
import ToolText from './tools2d/ToolText';
import ToolEdit from './tools2d/ToolEdit';
import ToolDelete from './tools2d/ToolDelete';

import Tools2dType from './tools2d/ToolTypes';
import Segm2d from './Segm2d';

import RoiPalette from './loaders/roipalette';
import { Context } from "../context/Context";

const Graphics2d = props => {
  const m_mode2d = props.mode2d || Modes2d.TRANSVERSE;
  
  const { context } = useContext(Context);
  const [state, setState] = useState({
    wRender: 0,
    hRender: 0,
    stateMouseDown: false,
    xMouse: -1,
    yMouse: -1,
  })
  
  const segm2d = new Segm2d(this);
  const m_isSegmented = false;
  const m_toolPick = new ToolPick(this);
  const m_toolDistance = new ToolDistance(this);
  const m_toolZoom = new ToolZoom(this);
  const m_toolAngle = new ToolAngle(this);
  const m_toolArea = new ToolArea(this);
  const m_toolRect = new ToolRect(this);
  const m_toolText = new ToolText(this);
  const m_toolEdit = new ToolEdit(this);
  const m_toolDelete = new ToolDelete(this);
  const m_roiPalette = new RoiPalette();
  let imgData = null;
  
  const canvasRef = React.createRef();
  
  const prepareImageForRender = (volIndexArg) => {
    const objCanvas = canvasRef.current;
    if (objCanvas === null) {
      return;
    }
    const ctx = objCanvas.getContext('2d');
    const w = objCanvas.clientWidth;
    const h = objCanvas.clientHeight;
    if (w * h === 0) {
      return;
    }
    
    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillRect(0, 0, w, h);
    // console.log(`render scene 2d. screen = ${w} * ${h}`);
    
    // Test draw chessboard
    const NEED_TEST_RAINBOW = true;
    if (NEED_TEST_RAINBOW) {
      const wImg = 800;
      const hImg = 600;
      const imageData = ctx.createImageData(wImg, hImg);
      const dataDst = imageData.data;
      let j = 0;
      for (let y = 0; y < hImg; y++) {
        for (let x = 0; x < wImg; x++) {
          dataDst[j] = Math.floor(255 * x / wImg);
          dataDst[j + 1] = Math.floor(255 * y / hImg);
          dataDst[j + 2] = 120;
          dataDst[j + 3] = 255;
          j += 4;
        } // for (x)
      } // for (y)
      ctx.putImageData(imageData, 0, 0);
    }
    
    const volSet = context.volumeSet;
    // const volIndex = m_volumeIndex;
    const volIndex = (volIndexArg !== undefined) ? volIndexArg : props.volumeIndex;
    
    const vol = volSet.getVolume(volIndex);
    const sliceRatio = context.slider2d;
    
    if (vol !== null) {
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
      
      let localImgData = null;
      let dataDst = null;
      
      const roiPal256 = m_roiPalette.getPalette256();
      
      // determine actual render square (not w * h - viewport)
      // calculate area using physical volume dimension
      const TOO_SMALL = 1.0e-5;
      const pbox = vol.m_boxSize;
      if (pbox.x * pbox.y * pbox.z < TOO_SMALL) {
        console.log(`Bad physical dimensions for rendered volume = ${pbox.x}*${pbox.y}*${pbox.z} `);
      }
      let wScreen = 0, hScreen = 0;
      
      const xPos = props.render2dxPos;
      const yPos = props.render2dyPos;
      const zoom = props.render2dZoom;
      // console.log(`Gra2d. RenderScene. zoom=${zoom}, xyPos=${xPos}, ${yPos}`);
      if (m_mode2d === Modes2d.TRANSVERSE) {
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
        hScreen = (hScreen > 0) ? hScreen : 1;
        // console.log(`gra2d. render: wScreen*hScreen = ${wScreen} * ${hScreen}, but w*h=${w}*${h} `);
        
        m_toolPick.setScreenDim(wScreen, hScreen);
        m_toolZoom.setScreenDim(wScreen, hScreen);
        m_toolDistance.setScreenDim(wScreen, hScreen);
        m_toolAngle.setScreenDim(wScreen, hScreen);
        m_toolArea.setScreenDim(wScreen, hScreen);
        m_toolRect.setScreenDim(wScreen, hScreen);
        m_toolText.setScreenDim(wScreen, hScreen);
        m_toolEdit.setScreenDim(wScreen, hScreen);
        m_toolDelete.setScreenDim(wScreen, hScreen);
        
        // setup pixel size for 2d tools
        const xPixelSize = vol.m_boxSize.x / xDim;
        const yPixelSize = vol.m_boxSize.y / yDim;
        // console.log(`xyPixelSize = ${xPixelSize} * ${yPixelSize}`);
        m_toolDistance.setPixelSize(xPixelSize, yPixelSize);
        m_toolAngle.setPixelSize(xPixelSize, yPixelSize);
        m_toolArea.setPixelSize(xPixelSize, yPixelSize);
        m_toolRect.setPixelSize(xPixelSize, yPixelSize);
        m_toolText.setPixelSize(xPixelSize, yPixelSize);
        m_toolEdit.setPixelSize(xPixelSize, yPixelSize);
        m_toolDelete.setPixelSize(xPixelSize, yPixelSize);
        
        // create image data
        localImgData = ctx.createImageData(wScreen, hScreen);
        dataDst = localImgData.data;
        if (dataDst.length !== wScreen * hScreen * 4) {
          console.log(`Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`);
        }
        
        // z slice
        let zSlice = Math.floor(zDim * sliceRatio);
        zSlice = (zSlice < zDim) ? zSlice : (zDim - 1);
        const zOff = zSlice * xyDim;
        const xStep = zoom * xDim / wScreen;
        const yStep = zoom * yDim / hScreen;
        let j = 0;
        let ay = yPos * yDim;
        if (vol.m_bytesPerVoxel === 1) {
          for (let y = 0; y < hScreen; y++, ay += yStep) {
            const ySrc = Math.floor(ay);
            const yOff = ySrc * xDim;
            let ax = xPos * xDim;
            for (let x = 0; x < wScreen; x++, ax += xStep) {
              const xSrc = Math.floor(ax);
              const val = dataSrc[zOff + yOff + xSrc];
              dataDst[j] = val;
              dataDst[j + 1] = val;
              dataDst[j + 2] = val;
              dataDst[j + 3] = 255; // opacity
              j += 4;
            }
          }
          
        } else if (vol.m_bytesPerVoxel === 4) {
          for (let y = 0; y < hScreen; y++, ay += yStep) {
            const ySrc = Math.floor(ay);
            const yOff = ySrc * xDim;
            let ax = xPos * xDim;
            for (let x = 0; x < wScreen; x++, ax += xStep) {
              const xSrc = Math.floor(ax);
              const val4 = dataSrc[(zOff + yOff + xSrc) * 4 + 3] * 4;
              dataDst[j] = roiPal256[val4 + 2];
              dataDst[j + 1] = roiPal256[val4 + 1];
              dataDst[j + 2] = roiPal256[val4];
              dataDst[j + 3] = 255;
              j += 4;
            }
          }
        }
        
      } else if (m_mode2d === Modes2d.SAGGITAL) {
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
        hScreen = (hScreen > 0) ? hScreen : 1;
        // console.log(`gra2d. render: wScreen*hScreen = ${wScreen} * ${hScreen}, but w*h=${w}*${h} `);
        
        m_toolPick.setScreenDim(wScreen, hScreen);
        m_toolZoom.setScreenDim(wScreen, hScreen);
        m_toolDistance.setScreenDim(wScreen, hScreen);
        m_toolAngle.setScreenDim(wScreen, hScreen);
        m_toolArea.setScreenDim(wScreen, hScreen);
        m_toolRect.setScreenDim(wScreen, hScreen);
        m_toolText.setScreenDim(wScreen, hScreen);
        m_toolEdit.setScreenDim(wScreen, hScreen);
        m_toolDelete.setScreenDim(wScreen, hScreen);
        
        // setup pixel size for 2d tools
        const xPixelSize = vol.m_boxSize.y / yDim;
        const yPixelSize = vol.m_boxSize.z / zDim;
        // console.log(`xyPixelSize = ${xPixelSize} * ${yPixelSize}`);
        m_toolDistance.setPixelSize(xPixelSize, yPixelSize);
        m_toolAngle.setPixelSize(xPixelSize, yPixelSize);
        m_toolArea.setPixelSize(xPixelSize, yPixelSize);
        m_toolRect.setPixelSize(xPixelSize, yPixelSize);
        m_toolText.setPixelSize(xPixelSize, yPixelSize);
        m_toolEdit.setPixelSize(xPixelSize, yPixelSize);
        m_toolDelete.setPixelSize(xPixelSize, yPixelSize);
        
        // create image data
        localImgData = ctx.createImageData(wScreen, hScreen);
        dataDst = localImgData.data;
        if (dataDst.length !== wScreen * hScreen * 4) {
          console.log(`Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`);
        }
        
        // x slice
        let xSlice = Math.floor(xDim * sliceRatio);
        xSlice = (xSlice < xDim) ? xSlice : (xDim - 1);
        
        const yStep = zoom * yDim / wScreen;
        const zStep = zoom * zDim / hScreen;
        let j = 0;
        let az = yPos * zDim;
        if (vol.m_bytesPerVoxel === 1) {
          for (let y = 0; y < hScreen; y++, az += zStep) {
            const zSrc = Math.floor(az);
            const zOff = zSrc * xDim * yDim;
            let ay = xPos * yDim;
            for (let x = 0; x < wScreen; x++, ay += yStep) {
              const ySrc = Math.floor(ay);
              const yOff = ySrc * xDim;
              const val = dataSrc[zOff + yOff + xSlice];
              
              dataDst[j] = val;
              dataDst[j + 1] = val;
              dataDst[j + 2] = val;
              dataDst[j + 3] = 255; // opacity
              
              j += 4;
            } // for (x)
          } // for (y)
        } else if (vol.m_bytesPerVoxel === 4) {
          for (let y = 0; y < hScreen; y++, az += zStep) {
            const zSrc = Math.floor(az);
            const zOff = zSrc * xDim * yDim;
            let ay = xPos * yDim;
            for (let x = 0; x < wScreen; x++, ay += yStep) {
              const ySrc = Math.floor(ay);
              const yOff = ySrc * xDim;
              const val = dataSrc[(zOff + yOff + xSlice) * 4 + 3];
              const val4 = val * 4;
              const rCol = roiPal256[val4];
              const gCol = roiPal256[val4 + 1];
              dataDst[j] = roiPal256[val4 + 2];
              dataDst[j + 1] = gCol;
              dataDst[j + 2] = rCol;
              dataDst[j + 3] = 255; // opacity
              
              j += 4;
            } // for (x)
          } // for (y)
        } // if 4 bppp
      } else if (m_mode2d === Modes2d.CORONAL) {
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
        hScreen = (hScreen > 0) ? hScreen : 1;
        // console.log(`gra2d. render: wScreen*hScreen = ${wScreen} * ${hScreen}, but w*h=${w}*${h} `);
        
        m_toolPick.setScreenDim(wScreen, hScreen);
        m_toolZoom.setScreenDim(wScreen, hScreen);
        m_toolDistance.setScreenDim(wScreen, hScreen);
        m_toolAngle.setScreenDim(wScreen, hScreen);
        m_toolArea.setScreenDim(wScreen, hScreen);
        m_toolRect.setScreenDim(wScreen, hScreen);
        m_toolText.setScreenDim(wScreen, hScreen);
        m_toolEdit.setScreenDim(wScreen, hScreen);
        m_toolDelete.setScreenDim(wScreen, hScreen);
        
        // setup pixel size for 2d tools
        const xPixelSize = vol.m_boxSize.x / xDim;
        const yPixelSize = vol.m_boxSize.z / zDim;
        // console.log(`xyPixelSize = ${xPixelSize} * ${yPixelSize}`);
        m_toolDistance.setPixelSize(xPixelSize, yPixelSize);
        m_toolAngle.setPixelSize(xPixelSize, yPixelSize);
        m_toolArea.setPixelSize(xPixelSize, yPixelSize);
        m_toolRect.setPixelSize(xPixelSize, yPixelSize);
        m_toolText.setPixelSize(xPixelSize, yPixelSize);
        m_toolEdit.setPixelSize(xPixelSize, yPixelSize);
        m_toolDelete.setPixelSize(xPixelSize, yPixelSize);
        
        // create image data
        localImgData = ctx.createImageData(wScreen, hScreen);
        dataDst = localImgData.data;
        if (dataDst.length !== wScreen * hScreen * 4) {
          console.log(`Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`);
        }
        
        // y slice
        let ySlice = Math.floor(yDim * sliceRatio);
        ySlice = (ySlice < yDim) ? ySlice : (yDim - 1);
        const yOff = ySlice * xDim;
        
        const xStep = zoom * xDim / wScreen;
        const zStep = zoom * zDim / hScreen;
        let j = 0;
        let az = yPos * zDim;
        if (vol.m_bytesPerVoxel === 1) {
          for (let y = 0; y < hScreen; y++, az += zStep) {
            const zSrc = Math.floor(az);
            const zOff = zSrc * xDim * yDim;
            let ax = xPos * xDim;
            for (let x = 0; x < wScreen; x++, ax += xStep) {
              const xSrc = Math.floor(ax);
              const val = dataSrc[zOff + yOff + xSrc];
              
              dataDst[j] = val;
              dataDst[j + 1] = val;
              dataDst[j + 2] = val;
              dataDst[j + 3] = 255; // opacity
              
              j += 4;
            } // for (x)
          } // for (y)
        } else if (vol.m_bytesPerVoxel === 4) {
          for (let y = 0; y < hScreen; y++, az += zStep) {
            const zSrc = Math.floor(az);
            const zOff = zSrc * xDim * yDim;
            let ax = xPos * xDim;
            for (let x = 0; x < wScreen; x++, ax += xStep) {
              const xSrc = Math.floor(ax);
              const val = dataSrc[(zOff + yOff + xSrc) * 4 + 3];
              const val4 = val * 4;
              const rCol = roiPal256[val4];
              const gCol = roiPal256[val4 + 1];
              dataDst[j] = roiPal256[val4 + 2];
              dataDst[j + 1] = gCol;
              dataDst[j + 2] = rCol;
              dataDst[j + 3] = 255; // opacity
              
              j += 4;
            } // for (x)
          } // for (y)
        } // end if 4 bpp
      }
      imgData = localImgData
      segm2d.setImageData(localImgData);
    }
  }
  const renderTextInfo = (ctx, volSet, vol) => {
    let strMsg;
    let xText = 4;
    let yText = 4;
    const FONT_SZ = 16;
    ctx.font = FONT_SZ.toString() + 'px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'grey';
    
    strMsg = 'volume dim = ' + vol.m_xDim.toString() + ' * ' +
      vol.m_yDim.toString() + ' * ' +
      vol.m_zDim.toString();
    ctx.fillText(strMsg, xText, yText);
    yText += FONT_SZ;
    
    const xSize = Math.floor(vol.m_boxSize.x);
    const ySize = Math.floor(vol.m_boxSize.y);
    const zSize = Math.floor(vol.m_boxSize.z);
    strMsg = 'vol phys size = ' + xSize.toString() + ' * ' +
      ySize.toString() + ' * ' +
      zSize.toString();
    ctx.fillText(strMsg, xText, yText);
    yText += FONT_SZ;
    
    const patName = volSet.m_patientName;
    if (patName.length > 1) {
      strMsg = 'patient name = ' + patName;
      ctx.fillText(strMsg, xText, yText);
      yText += FONT_SZ;
    }
    const patBirth = volSet.m_patientBirth;
    if (patBirth.length > 1) {
      strMsg = 'patient birth = ' + patBirth;
      ctx.fillText(strMsg, xText, yText);
      yText += FONT_SZ;
    }
    const seriesDescr = volSet.m_seriesDescr;
    if (seriesDescr.length > 1) {
      strMsg = 'series descr = ' + seriesDescr;
      ctx.fillText(strMsg, xText, yText);
      yText += FONT_SZ;
    }
    const institutionName = volSet.m_institutionName;
    if (institutionName.length > 1) {
      strMsg = 'institution name = ' + institutionName;
      ctx.fillText(strMsg, xText, yText);
      yText += FONT_SZ;
    }
    const operatorsName = volSet.m_operatorsName;
    if (operatorsName.length > 1) {
      strMsg = 'operators name = ' + operatorsName;
      ctx.fillText(strMsg, xText, yText);
      yText += FONT_SZ;
    }
    const physicansName = volSet.m_physicansName;
    if (physicansName.length > 1) {
      strMsg = 'physicans name = ' + physicansName;
      ctx.fillText(strMsg, xText, yText);
    }
  }
  
  const renderReadyImage = () => {
    const objCanvas = canvasRef.current;
    if (objCanvas === null) {
      return;
    }
    const ctx = objCanvas.getContext('2d');
    
    const volSet = context.volumeSet;
    if (volSet.getNumVolumes() === 0) {
      return;
    }
    const volIndex = props.volumeIndex;
    const vol = volSet.getVolume(volIndex);
    if (vol === null) {
      return;
    }
    
    if (m_isSegmented) {
      const w = m_toolPick.m_wScreen;
      const h = m_toolPick.m_hScreen;
      segm2d.render(ctx, w, h, imgData);
    } else {
      ctx.putImageData(imgData, 0, 0);
    }
    // render text info
    renderTextInfo(ctx, volSet, vol);
    // render all tools
    m_toolPick.render(ctx);
    m_toolDistance.render(ctx, props);
    m_toolAngle.render(ctx, props);
    m_toolArea.render(ctx, props);
    m_toolRect.render(ctx, props);
    m_toolText.render(ctx, props);
    m_toolEdit.render(ctx, props);
    m_toolDelete.render(ctx, props);
  }
  
  const forceRender = () => {
    setState(state);
  }
  
  const forceUpdate = (volIndex) => {
    prepareImageForRender(volIndex);
    if (m_isSegmented) {
      if (segm2d.model !== null) {
        segm2d.startApplyImage().then(r => (r));
      }
    } else {
      forceRender();
    }
  }
  useRef(() => {
    prepareImageForRender();
    renderReadyImage();
    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;
    if (state.wRender === 0) {
      setState({ ...state, wRender: w });
      setState({ ...state, hRender: h });
    }
  })
  
  
  const onMouseWheel = (evt) => {
    const indexTools2d = props.indexTools2d;
    if (indexTools2d === Tools2dType.ZOOM) {
      m_toolZoom.onMouseWheel(props, evt);
    }
  }
  
  const onMouseUp = (evt) => {
    const indexTools2d = props.indexTools2d;
    if (indexTools2d === Tools2dType.ZOOM) {
      m_toolZoom.onMouseUp();
    }
    if (indexTools2d === Tools2dType.DISTANCE) {
      const box = canvasRef.current.getBoundingClientRect();
      const xScr = evt.clientX - box.left;
      const yScr = evt.clientY - box.top;
      m_toolDistance.onMouseUp(xScr, yScr, props);
    }
    if (indexTools2d === Tools2dType.ANGLE) {
      const box = canvasRef.current.getBoundingClientRect();
      const xScr = evt.clientX - box.left;
      const yScr = evt.clientY - box.top;
      m_toolAngle.onMouseUp(xScr, yScr, props);
    }
    if (indexTools2d === Tools2dType.AREA) {
      const box = canvasRef.current.getBoundingClientRect();
      const xScr = evt.clientX - box.left;
      const yScr = evt.clientY - box.top;
      m_toolArea.onMouseUp(xScr, yScr, props);
    }
    if (indexTools2d === Tools2dType.RECT) {
      const box = canvasRef.current.getBoundingClientRect();
      const xScr = evt.clientX - box.left;
      const yScr = evt.clientY - box.top;
      m_toolRect.onMouseUp(xScr, yScr, props);
    }
    if (indexTools2d === Tools2dType.EDIT) {
      const box = canvasRef.current.getBoundingClientRect();
      const xScr = evt.clientX - box.left;
      const yScr = evt.clientY - box.top;
      m_toolEdit.onMouseUp(xScr, yScr, props);
    }
    if (indexTools2d === Tools2dType.DELETE) {
      const box = canvasRef.current.getBoundingClientRect();
      const xScr = evt.clientX - box.left;
      const yScr = evt.clientY - box.top;
      m_toolDelete.onMouseUp(xScr, yScr, props);
    }
  }
  
  const onMouseMove = (evt) => {
    const indexTools2d = props.indexTools2d;
    const box = canvasRef.current.getBoundingClientRect();
    const xContainer = evt.clientX - box.left;
    const yContainer = evt.clientY - box.top;
    const xScr = xContainer;
    const yScr = yContainer;
    
    if (indexTools2d === Tools2dType.ZOOM) {
      m_toolZoom.onMouseMove(props, xScr, yScr);
    }
    if (indexTools2d === Tools2dType.DISTANCE) {
      m_toolDistance.onMouseMove(xScr, yScr, props);
    }
    if (indexTools2d === Tools2dType.ANGLE) {
      m_toolAngle.onMouseMove(xScr, yScr, props);
    }
    if (indexTools2d === Tools2dType.AREA) {
      m_toolArea.onMouseMove(xScr, yScr, props);
    }
    if (indexTools2d === Tools2dType.RECT) {
      m_toolRect.onMouseMove(xScr, yScr, props);
    }
    if (indexTools2d === Tools2dType.EDIT) {
      m_toolEdit.onMouseMove(xScr, yScr, props);
    }
    if (indexTools2d === Tools2dType.DELETE) {
      m_toolDelete.onMouseMove(xScr, yScr, props);
    }
  }
  
  const onMouseDown = (evt) => {
    const box = canvasRef.current.getBoundingClientRect();
    const xContainer = evt.clientX - box.left;
    const yContainer = evt.clientY - box.top;
    const xScr = xContainer;
    const yScr = yContainer;
    // console.log(`onMouseDown. down = ${xScr}, ${yScr}`);
    
    const indexTools2d = props.indexTools2d;
    // console.log(`onMouseDown. tool index = ${indexTools2d}`);
    
    
    switch (indexTools2d) {
    case Tools2dType.INTENSITY:
      m_toolPick.onMouseDown(xScr, yScr, props);
      break;
    case Tools2dType.DISTANCE:
      m_toolDistance.onMouseDown(xScr, yScr, props);
      break;
    case Tools2dType.ZOOM:
      m_toolZoom.onMouseDown(xScr, yScr);
      break;
    case Tools2dType.ANGLE:
      m_toolAngle.onMouseDown(xScr, yScr, props);
      break;
    case Tools2dType.AREA:
      m_toolArea.onMouseDown(xScr, yScr, props);
      break;
    case Tools2dType.RECT:
      m_toolRect.onMouseDown(xScr, yScr, props);
      break;
    case Tools2dType.TEXT:
      m_toolText.onMouseDown(xScr, yScr, props);
      break;
    case Tools2dType.EDIT:
      m_toolEdit.onMouseDown(xScr, yScr, props);
      break;
    case Tools2dType.DELETE:
      m_toolDelete.onMouseDown(xScr, yScr, props);
      break;
    default:
    }
    forceUpdate();
  }
  
  return <canvas ref={canvasRef} width={state.wRender} height={state.hRender}
                 onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove} onWheel={onMouseWheel}/>
  
}

export default connect(store => store)(Graphics2d);
