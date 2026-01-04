import StoreActionType from '../../../../store/ActionTypes';
import Modes2d from '../../../../store/Modes2d';
import Segm2d from '../../../Segm2d';
import Volume from '../../../Volume';
import { getPalette256 } from '../../../loaders/RoiPalette256';
import { MRIStoreService, mriStoreService } from '../../services';
import { GraphicsTools2D } from './GraphicsTools2D';

export class GraphicsRenderer2D {
  // Canvas
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  container: HTMLElement;
  m_sliceRatio: number;
  m_mode2d: number;
  m_zoom: number;
  m_xPos: number;
  m_yPos: number;
  wRender: number;
  hRender: number;
  imgData: ImageData;
  screenWidth: number;
  screenHeight: number;
  // Window range
  winRight: number;
  winLeft: number;
  // Segmentation
  segm2d: Segm2d;
  m_isSegmented: boolean;
  // Services
  store: MRIStoreService = mriStoreService;
  // Volume
  volume: Volume;
  // Tools
  tools: GraphicsTools2D;
  palette256 = getPalette256();

  constructor() {
    // Canvas related properties
    this.m_sliceRatio = 0.5;
    this.m_mode2d = Modes2d.TRANSVERSE;
    this.m_zoom = 1;
    this.m_xPos = 0;
    this.m_yPos = 0;
    this.wRender = 0;
    this.hRender = 0;
    this.imgData = null;
    // Graphics Tools
    this.tools = new GraphicsTools2D(this);

    // segm 2d
    this.segm2d = new Segm2d(this);
    this.m_isSegmented = false;

    // Window Range with 16 bit
    this.winLeft = 0;
    this.winRight = 1;

    this.store.dispatch({ type: StoreActionType.SET_GRAPHICS_2D, graphics2d: this });

    this.forceUpdate = this.forceUpdate.bind(this);
    this.setDataWindow = this.setDataWindow.bind(this);
  }

  render(containerId: string) {
    this.container = document.getElementById(containerId);

    if (!this.container) {
      return console.error(`Container with id '${containerId}' not found.`);
    }

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    this.initializeRendering();
  }

  initializeRendering() {
    this.setCanvasSize();
    this.updateWindowSettings();
    this.fillBackground();
    this.prepareImageForRender();
    this.renderReadyImage();
    this.bindEventListeners();
  }

  setCanvasSize() {
    const containerWidth = this.container.clientWidth;
    const canvasWidth = parseInt('' + containerWidth / 3);

    this.screenWidth = canvasWidth;
    this.screenHeight = canvasWidth;
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasWidth;
  }

  fillBackground() {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.wRender, this.hRender);
  }

  prepareImageForRender() {
    const imgData = this.createImageData();
    if (!imgData) return;

    this.imgData = imgData;
    this.segm2d.setImageData(imgData);
  }

  createImageData() {
    const imgData = this.ctx.createImageData(this.screenWidth, this.screenHeight);
    const dataDst = imgData.data;
    const sliceRatio = this.store.getState().sliceRatio;

    this.tools.setToolsScreenAndPixelSizes(this.screenWidth, this.screenHeight, this.volume.m_xDim, this.volume.m_yDim, this.volume);

    switch (this.m_mode2d) {
      case Modes2d.TRANSVERSE:
        this.fillImageDataForTransverse(dataDst, sliceRatio);
        break;
      case Modes2d.SAGGITAL:
        this.fillImageDataForSagittal(dataDst, sliceRatio);
        break;
      case Modes2d.CORONAL:
        this.fillImageDataForCoronal(dataDst, sliceRatio);
        break;
      default:
        console.error('Unknown mode2d:', this.m_mode2d);
        break;
    }

    return imgData;
  }

  fillImageDataForTransverse(dataDst: any, sliceRatio: any) {
    const zSlice = Math.floor(this.volume.m_zDim * sliceRatio);
    this.fillSliceData(dataDst, zSlice, 'z');
  }

  fillImageDataForSagittal(dataDst: any, sliceRatio: any) {
    const xSlice = Math.floor(this.volume.m_xDim * sliceRatio);
    this.fillSliceData(dataDst, xSlice, 'x');
  }

  fillImageDataForCoronal(dataDst: any, sliceRatio: any) {
    const ySlice = Math.floor(this.volume.m_yDim * sliceRatio);
    this.fillSliceData(dataDst, ySlice, 'y');
  }

  fillSliceData(dataDst: any, sliceIndex: any, axis: any) {
    for (let y = 0; y < this.screenHeight; y++) {
      for (let x = 0; x < this.screenWidth; x++) {
        // Convert screen coordinates (x, y) to volume coordinates based on the current axis
        // Example for Transverse (z axis): (x, y, sliceIndex)
        // You need to adjust the conversion based on the axis and your data structure
        const [volX, volY, volZ] = this.convertScreenToVolumeCoordinates(x, y, sliceIndex, axis);

        // Get pixel value from volume data
        const pixelValue = this.getVolumePixelValue(volX, volY, volZ);

        // Convert pixel value to RGBA (this is where you apply your color mapping)
        const [r, g, b, a] = this.convertPixelValueToRGBA(pixelValue);

        // Fill in the image data
        const index = (y * this.screenWidth + x) * 4;
        dataDst[index] = r;
        dataDst[index + 1] = g;
        dataDst[index + 2] = b;
        dataDst[index + 3] = a;
      }
    }
  }

  convertScreenToVolumeCoordinates(x: any, y: any, sliceIndex: any, axis: any) {
    // Example conversion logic (assuming an isotropic volume)
    let volX, volY, volZ;
    switch (axis) {
      case 'x':
        volX = sliceIndex;
        volZ = Math.floor((y * this.volume.m_zDim) / this.screenHeight);
        volY = this.volume.m_yDim - 1 - Math.floor((x * this.volume.m_yDim) / this.screenWidth);
        break;
      case 'y':
        volX = Math.floor((x * this.volume.m_xDim) / this.screenWidth);
        volY = sliceIndex;
        volZ = Math.floor((y * this.volume.m_zDim) / this.screenHeight);
        break;
      case 'z':
      default:
        volX = Math.floor((x * this.volume.m_xDim) / this.screenWidth);
        volY = Math.floor((y * this.volume.m_yDim) / this.screenHeight);
        volZ = sliceIndex;
        break;
    }
    return [volX, volY, volZ];
  }
  mem = {
    '1,2,3': 1,
  };
  getVolumePixelValue(x: number, y: number, z: number) {
    const is16bit = this.store.getState().is16bit;
    const dataArray = is16bit ? this.volume.m_dataArray16 : this.volume.m_dataArray;

    if (this.volume.m_bytesPerVoxel === 4) {
      // Assuming the fourth byte is used for indexing into the palette
      const index = (z * (this.volume.m_xDim * this.volume.m_yDim) + y * this.volume.m_xDim + x) * 4;
      const value = dataArray[index + 3]; // Get the fourth byte
      return value;
    } else {
      // Original code for 1-byte or 2-byte per voxel
      return dataArray[z * (this.volume.m_xDim * this.volume.m_yDim) + y * this.volume.m_xDim + x];
    }
  }

  convertPixelValueToRGBA(pixelValue: any) {
    const dicom = this.store.getState().loaderDicom;
    const is16bit = this.store.getState().is16bit;

    let grayValue;

    if (this.volume.m_bytesPerVoxel === 4) {
      // Use the roiPal256 palette for 4-byte per voxel data
      const colorIndex = pixelValue * 4;
      const r = this.palette256[colorIndex];
      const g = this.palette256[colorIndex + 1];
      const b = this.palette256[colorIndex + 2];
      const a = this.palette256[colorIndex + 3];
      return [r, g, b, a];
    }

    if (is16bit) {
      // Scale the pixel value for 16-bit images
      const scale = 255 / ((this.winRight - this.winLeft) * (dicom.m_maxVal - dicom.m_minVal));
      grayValue = Math.floor((pixelValue - this.winLeft * (dicom.m_maxVal - dicom.m_minVal)) * scale);

      if (grayValue < 0) grayValue = 0;
      if (grayValue > 255) grayValue = 255;
    } else {
      // Basic grayscale conversion for 8-bit images
      grayValue = pixelValue & 0xff;
    }

    return [grayValue, grayValue, grayValue, 255]; // RGBA
  }

  async renderReadyImage() {
    this.m_isSegmented ? this.renderSegmentedData() : await this.renderRegularImage();
  }

  renderSegmentedData() {
    this.segm2d.render(this.ctx, this.screenWidth, this.screenHeight, this.imgData);
  }

  async renderRegularImage() {
    const store = this.store.getState();
    const zoom = store.render2dZoom;
    const xPos = store.render2dxPos;
    const yPos = store.render2dyPos;
    const newImgWidth = this.screenWidth / zoom;
    const newImgHeight = this.screenHeight / zoom;
    const imageBitmap = await createImageBitmap(this.imgData);

    this.ctx.drawImage(imageBitmap, xPos, yPos, this.screenWidth, this.screenHeight, 0, 0, newImgWidth, newImgHeight);
    this.tools.render();
  }

  forceUpdate() {
    this.prepareImageForRender();
    this.renderReadyImage();
  }

  setDataWindow(value: any) {
    const [min, max] = value;
    this.winLeft = min;
    this.winRight = max;
    this.updateWindowSettings();
  }

  updateWindowSettings() {
    const dicom = this.store.getState().loaderDicom;
    const is16bit = this.store.getState().is16bit;

    if (dicom && !is16bit) {
      this.winRight = dicom.m_winRight;
      this.winLeft = dicom.m_winLeft;
    }
  }

  bindEventListeners() {
    this.canvas.addEventListener('mousedown', this.tools.onMouseDown.bind(this.tools));
    this.canvas.addEventListener('mousemove', this.tools.onMouseMove.bind(this.tools));
    this.canvas.addEventListener('mouseup', this.tools.onMouseUp.bind(this.tools));
    this.canvas.addEventListener('wheel', this.tools.onMouseWheel.bind(this.tools));
  }
}
