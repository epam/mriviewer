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

import RoiPalette from './loaders/roipalette';

class Graphics2d extends React.Component {
	
	constructor(props) {
		super(props);
		
		this.canvasRef = React.createRef()
		
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseWheel = this.onMouseWheel.bind(this);
		
		this.m_sliceRatio = 0.5;
		
		// scale
		this.m_zoom = 1;
		// mounted
		this.m_isMounted = false;
		
		this.state = {
			wRender: 0,
			hRender: 0,
			stateMouseDown: false,
			xMouse: 0,
			yMouse: 0,
		};
		
		this.segm2d = new Segm2d(this);
		this.m_isSegmented = false;
		
		this.m_toolPick = new ToolPick(this);
		this.m_toolDistance = new ToolDistance(this);
		this.m_toolAngle = new ToolAngle(this);
		this.m_toolArea = new ToolArea(this);
		this.m_toolRect = new ToolRect(this);
		this.m_toolText = new ToolText(this);
		this.m_toolEdit = new ToolEdit(this);
		this.m_toolDelete = new ToolDelete(this);
		
		this.m_roiPalette = new RoiPalette();
		
		props.dispatch({ type: StoreActionType.SET_GRAPHICS_2D, graphics2d: this });
	}
	
	componentDidMount() {
		this.m_isMounted = true;
		
		this.prepareImageForRender();
		this.renderReadyImage();
		
		const w = this.canvasRef.current.clientWidth;
		const h = this.canvasRef.current.clientHeight;
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
		return this.canvasRef.current.toDataURL();
	}
	
	clearCanvas() {
		const canvas = this.canvasRef.current;
		if (canvas === null) {
			return;
		}
		const ctx = canvas.getContext('2d');
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		if (w * h === 0) {
			return;
		}
		this.fillBackground(ctx)
		
		return [w, h, ctx];
	}
	
	prepareImageForRender(volIndexArg) {
		const [w, h, ctx] = this.clearCanvas();
		const store = this.props;
		
		const volSet = store.volumeSet;
		// const volIndex = this.m_volumeIndex;
		const volIndex = (volIndexArg !== undefined) ? volIndexArg : store.volumeIndex;
		
		const vol = volSet.getVolume(volIndex);
		const sliceRatio = store.slider2d;
		
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
			const ONE = 1;
			const FOUR = 4;
			const OFF_3 = 3;
			
			let imgData = null;
			let dataDst = null;
			
			const roiPal256 = this.m_roiPalette.getPalette256();
			
			// determine actual render square (not w * h - viewport)
			// calculate area using physical volume dimension
			const TOO_SMALL = 1.0e-5;
			const pbox = vol.m_boxSize;
			if (pbox.x * pbox.y * pbox.z < TOO_SMALL) {
				console.log(`Bad physical dimensions for rendered volume = ${pbox.x}*${pbox.y}*${pbox.z} `);
			}
			let wScreen = 0, hScreen = 0;
			
			const zoom = store.zoom2d;
			if (this.props.mode2d === Modes2d.TRANSVERSE) {
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
				zSlice = (zSlice < zDim) ? zSlice : (zDim - 1);
				const zOff = zSlice * xyDim;
				const xStep = zoom * xDim / wScreen;
				const yStep = zoom * yDim / hScreen;
				let j = 0;
				let ay = yDim;
				if (vol.m_bytesPerVoxel === ONE) {
					for (let y = 0; y < hScreen; y++, ay += yStep) {
						const ySrc = Math.floor(ay);
						const yOff = ySrc * xDim;
						let ax = xDim;
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
					
				} else if (vol.m_bytesPerVoxel === FOUR) {
					for (let y = 0; y < hScreen; y++, ay += yStep) {
						const ySrc = Math.floor(ay);
						const yOff = ySrc * xDim;
						let ax = xDim;
						for (let x = 0; x < wScreen; x++, ax += xStep) {
							const xSrc = Math.floor(ax);
							const val = dataSrc[(zOff + yOff + xSrc) * FOUR + OFF_3];
							const val4 = val * FOUR;
							const rCol = roiPal256[val4];
							const gCol = roiPal256[val4 + 1];
							dataDst[j] = roiPal256[val4 + 2];
							dataDst[j + 1] = gCol;
							dataDst[j + 2] = rCol;
							dataDst[j + 3] = 255;
							j += 4;
						} // for (x)
					} // for (y)
					
				} // if 4 bpp
				
			} else if (this.props.mode2d === Modes2d.SAGGITAL) {
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
				xSlice = (xSlice < xDim) ? xSlice : (xDim - 1);
				
				const yStep = zoom * yDim / wScreen;
				const zStep = zoom * zDim / hScreen;
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
			} else if (this.props.mode2d === Modes2d.CORONAL) {
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
				ySlice = (ySlice < yDim) ? ySlice : (yDim - 1);
				const yOff = ySlice * xDim;
				
				const xStep = zoom * xDim / wScreen;
				const zStep = zoom * zDim / hScreen;
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
			
			this.imgData = imgData;
			this.segm2d.setImageData(imgData);
		}
	}
	
	fillBackground(ctx) {
		const { hRender, wRender } = this.state;
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, wRender, hRender);
	}
	
	renderReadyImage() {
		const canvas = this.canvasRef.current;
		const ctx = canvas.getContext('2d');
		this.fillBackground(ctx);
		
		const volSet = this.props.volumeSet;
		if (volSet.getNumVolumes() === 0) {
			return;
		}
		const volIndex = this.props.volumeIndex;
		const vol = volSet.getVolume(volIndex);
		if (vol === null) {
			return;
		}
		
		if (this.m_isSegmented) {
			const w = this.m_toolPick.m_wScreen;
			const h = this.m_toolPick.m_hScreen;
			this.segm2d.render(ctx, w, h, this.imgData);
		} else {
			ctx.putImageData(this.imgData, 0, 0);
		}
		
		// render all tools
		this.m_toolPick.render(ctx);
		this.m_toolDistance.render(ctx, this.props);
		this.m_toolAngle.render(ctx, this.props);
		this.m_toolArea.render(ctx, this.props);
		this.m_toolRect.render(ctx, this.props);
		this.m_toolText.render(ctx, this.props);
		this.m_toolEdit.render(ctx, this.props);
		this.m_toolDelete.render(ctx, this.props);
	}
	
	onMouseWheel({ deltaY }) {
		const zoom = this.props.zoom2d;
		const zoomNew = zoom + deltaY * 2 ** (-5);
		
		if (zoomNew >= 1 || zoomNew < 0.2) {
			return false;
		}
		this.props.dispatch({ type: StoreActionType.SET_2D_ZOOM, zoom2d: zoomNew });
		this.props.graphics2d.forceUpdate();
		return false;
		
	}
	
	onMouseUp({ clientX, clientY }) {
		const toolsMediator = {
			[Tools2dType.DISTANCE]: () => {
				this.m_toolDistance.onMouseUp(clientX, clientY, this.props)
			},
			[Tools2dType.ANGLE]: () => {
				this.m_toolAngle.onMouseUp(clientX, clientY, this.props)
			},
			[Tools2dType.AREA]: () => {
				this.m_toolArea.onMouseUp(clientX, clientY, this.props)
			},
			[Tools2dType.RECT]: () => {
				this.m_toolRect.onMouseUp(clientX, clientY, this.props)
			},
			[Tools2dType.EDIT]: () => {
				this.m_toolEdit.onMouseUp(clientX, clientY, this.props)
			},
			[Tools2dType.DELETE]: () => {
				this.m_toolDelete.onMouseUp(clientX, clientY, this.props)
			}
		}[this.props.indexTools2d];
		
		if (typeof toolsMediator === 'function') {
			toolsMediator();
		}
	}
	
	onMouseMove({ clientX, clientY }) {
		const toolsMediator = {
			[Tools2dType.DISTANCE]: () => {
				this.m_toolDistance.onMouseMove(clientX, clientY, this.props)
			},
			[Tools2dType.ANGLE]: () => {
				this.m_toolAngle.onMouseMove(clientX, clientY, this.props)
			},
			[Tools2dType.AREA]: () => {
				this.m_toolArea.onMouseMove(clientX, clientY, this.props)
			},
			[Tools2dType.RECT]: () => {
				this.m_toolRect.onMouseMove(clientX, clientY, this.props)
			},
			[Tools2dType.EDIT]: () => {
				this.m_toolEdit.onMouseMove(clientX, clientY, this.props)
			},
			[Tools2dType.DELETE]: () => {
				this.m_toolDelete.onMouseMove(clientX, clientY, this.props)
			}
		}[this.props.indexTools2d]
		
		if (typeof toolsMediator === 'function') {
			toolsMediator();
		}
	}
	
	onMouseDown({ clientX, clientY }) {
		const toolsMediator = {
			[Tools2dType.INTENSITY]: () => {
				this.m_toolPick.onMouseDown(clientX, clientY, this.props)
			},
			[Tools2dType.DISTANCE]: () => {
				this.m_toolDistance.onMouseDown(clientX, clientY, this.props)
			},
			[Tools2dType.ANGLE]: () => {
				this.m_toolAngle.onMouseDown(clientX, clientY, this.props)
			},
			[Tools2dType.AREA]: () => {
				this.m_toolArea.onMouseDown(clientX, clientY, this.props)
			},
			[Tools2dType.RECT]: () => {
				this.m_toolRect.onMouseDown(clientX, clientY, this.props)
			},
			[Tools2dType.TEXT]: () => {
				this.m_toolText.onMouseDown(clientX, clientY, this.props)
			},
			[Tools2dType.EDIT]: () => {
				this.m_toolEdit.onMouseDown(clientX, clientY, this.props)
			},
			[Tools2dType.DELETE]: () => {
				this.m_toolDelete.onMouseDown(clientX, clientY, this.props)
			}
		}[this.props.indexTools2d]
		
		if (typeof toolsMediator === 'function') {
			toolsMediator();
		}
		
		this.forceUpdate();
	}
	
	clear() {
		this.m_toolDistance.clear();
		this.m_toolAngle.clear();
		this.m_toolArea.clear();
		this.m_toolRect.clear();
		this.m_toolText.clear();
		this.m_toolEdit.clear();
		this.m_toolDelete.clear();
	}
	
	forceUpdate(volIndex) {
		this.prepareImageForRender(volIndex);
		if (this.m_isSegmented) {
			if (this.segm2d.model !== null) {
				this.segm2d.startApplyImage();
			}
		} else {
			this.forceRender();
		}
	}
	
	forceRender() {
		if (this.m_isMounted) {
			this.setState({ state: this.state });
		}
	}
	
	handleResize() {
		this.forceRender();
	}
	
	render() {
		window.addEventListener('scroll', (e) => {
			e.preventDefault()
		});
		
		window.addEventListener('scroll', (e) => {e.preventDefault()})
		
		const styleObj = {
			width: '100%',
			height: '100%',
			display: 'block',
		};
		
		return <div style={styleObj}>
			<canvas
				ref={this.canvasRef}
				style={styleObj}
				width={this.state.wRender}
				height={this.state.hRender}
				
				onMouseDown={this.onMouseDown}
				onMouseUp={this.onMouseUp}
				onMouseMove={this.onMouseMove}
				onWheel={this.onMouseWheel}/>
		</div>
	}
}

export default connect(store => store)(Graphics2d);
