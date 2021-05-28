/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useEffect, useState } from 'react';

import { Context } from "../../context/Context";
import RoiPalette from './loaders/roipalette';
import Segm2d from "./Segm2d";

const Graphics2d = props => {
    const canvasRef = React.createRef();

    const { context } = useContext(Context)

    const [plane, setPlane] = useState('TRANSVERSE')

    useEffect((plane) => {
        if (props.plane !== plane) {
            setPlane(props.plane)
        }
    }, [plane])

    const prepareImageForRender = () => {
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

        // Test draw rainbow
        if (context.ff.NEED_TEST_RAINBOW) {
            const imageData = ctx.createImageData(w, h);
            const dataDst = imageData.data;
            let j = 0;


            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    dataDst[j] = Math.floor(255 * x / w);
                    dataDst[j + 1] = Math.floor(255 * y / h);
                    dataDst[j + 2] = 120;
                    dataDst[j + 3] = 255;
                    j += 4;
                } // for (x)
            } // for (y)
            ctx.putImageData(imageData, 0, 0);
        }

        const vol = context.volumeSet[context.volumeIndex];
        // const sliceRatio = context.slider2d;

        if (!vol) return;
        const xPos = context.render2dxPos;
        const yPos = context.render2dyPos;
        const zoom = context.render2dZoom;
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

        const roiPalette = new RoiPalette();
        const roiPal256 = roiPalette.getPalette256();
        // determine actual render square (not w * h - viewport)
        // calculate area using physical volume dimension
        const TOO_SMALL = 1.0e-5;
        const pbox = vol.m_boxSize;
        if (pbox.x * pbox.y * pbox.z < TOO_SMALL) {
            console.log(`Bad physical dimensions for rendered volume = ${pbox.x}*${pbox.y}*${pbox.z} `);
        }
        let wScreen = 0, hScreen = 0;

        if (plane === 'TRANSVERSE') {
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


            // create image data
            localImgData = ctx.createImageData(wScreen, hScreen);
            dataDst = localImgData.data;
            if (dataDst.length !== wScreen * hScreen * 4) {
                console.log(`Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`);
            }

            // z slice
            let zSlice = Math.floor(zDim * context.slider2d);
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

        } else if (plane === 'SAGGITAL') {
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

            localImgData = ctx.createImageData(wScreen, hScreen);
            dataDst = localImgData.data;
            if (dataDst.length !== wScreen * hScreen * 4) {
                console.log(`Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`);
            }

            // x slice
            let xSlice = Math.floor(xDim * context.slider2d);
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
        } else if (plane === 'CORONAL') {
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
            localImgData = ctx.createImageData(wScreen, hScreen);
            dataDst = localImgData.data;
            if (dataDst.length !== wScreen * hScreen * 4) {
                console.log(`Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`);
            }

            // y slice
            let ySlice = Math.floor(yDim * context.slider2d);
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
        (new Segm2d()).setImageData(localImgData);
        return localImgData;
    }

    const renderTextInfo = (volSet, vol) => {
        let strMsg;
        let xText = 4;
        let yText = 4;
        const FONT_SZ = 16;
        const objCanvas = canvasRef.current;
        if (objCanvas === null) {
            return;
        }
        const ctx = objCanvas.getContext('2d');

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

        if (context.volSetInfo.m_patientName) {
            strMsg = 'patient name = ' + context.volSetInfo.m_patientName;
            ctx.fillText(strMsg, xText, yText);
            yText += FONT_SZ;
        }
        if (context.volSetInfo.m_patientBirth) {
            strMsg = 'patient birth = ' + context.volSetInfo.m_patientBirth;
            ctx.fillText(strMsg, xText, yText);
            yText += FONT_SZ;
        }
        if (context.volSetInfo.m_seriesDescr) {
            strMsg = 'series descr = ' + context.volSetInfo.m_seriesDescr;
            ctx.fillText(strMsg, xText, yText);
            yText += FONT_SZ;
        }
        if (context.volSetInfo.m_institutionName) {
            strMsg = 'institution name = ' + context.volSetInfo.m_institutionName;
            ctx.fillText(strMsg, xText, yText);
            yText += FONT_SZ;
        }
        if (context.volSetInfo.m_operatorsName) {
            strMsg = 'operators name = ' + context.volSetInfo.m_operatorsName;
            ctx.fillText(strMsg, xText, yText);
            yText += FONT_SZ;
        }
        if (context.volSetInfo.m_physicansName) {
            strMsg = 'physicans name = ' + context.volSetInfo.m_physicansName;
            ctx.fillText(strMsg, xText, yText);
        }
    }

    const renderReadyImage = (imgData) => {
        const objCanvas = canvasRef.current;
        if (objCanvas === null) {
            return;
        }
        const ctx = objCanvas.getContext('2d');
        const volSet = context.volumeSet;
        if (volSet.length === 0) {
            return;
        }
        const vol = volSet[context.volumeIndex];
        if (vol === null) {
            return;
        }

        renderTextInfo(volSet, vol);
        ctx.putImageData(imgData, 0, 0);
    }

    useEffect(() => {
        renderReadyImage(prepareImageForRender());
    })


    const onMouseWheel = () => {
        const box = canvasRef.current.getBoundingClientRect();
        console.log(box);
    }

    const onMouseUp = () => {
        const box = canvasRef.current.getBoundingClientRect();
        console.log(box);
    }

    const onMouseMove = () => {
        const box = canvasRef.current.getBoundingClientRect();
        console.log(box);
    }

    const onMouseDown = () => {
        const box = canvasRef.current.getBoundingClientRect();
        console.log(box);
        // const xContainer = evt.clientX - box.left;
        // const yContainer = evt.clientY - box.top;
    }

    return <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        onWheel={onMouseWheel}

    />

}

export default Graphics2d;
