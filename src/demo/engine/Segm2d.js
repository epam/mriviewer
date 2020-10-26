/**
 * @fileOverview Segm2d
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import * as tf from '@tensorflow/tfjs';

// ********************************************************
// Const
// ********************************************************

// where VGG_UNET ready model file located to download
// this folder should contain following files:
// - model.json: description of machine learning model koefficienst
// - group1-shard1of12.bin: 1st binary koeeficient file
// - group1-shard2of12.bin: 2nd binary koeeficient file
// - ...
// - group1-shard12of12.bin: last binary koeeficient file
// - .htaccess: file to prevent CORS issue

const PATH_MODEL = 'http://lugachai.ru/med3web/tfjs/model.json';

// stages
const STAGE_MODEL_NOT_LOADED = 0;
const STAGE_MODEL_IS_LOADING = 1;
const STAGE_MODEL_READY = 2;
const STAGE_IMAGE_PROCESSED = 3;
const STAGE_SEGMENTATION_READY = 4;
// const STAGE_READY_NEXT_IMAGE = 5;


const OUT_W = 240;
const OUT_H = 160;
const NUM_CLASSES = 96;


// ********************************************************
// Class
// ********************************************************

class Segm2d
{
  constructor(objGraphics2d) {
    this.stage = STAGE_MODEL_NOT_LOADED;
    this.objGraphics2d = objGraphics2d;
    this.model = null;
    this.tensorIndices = null;
    this.imgData = null;
    this.pixels = null;

    // source image for segmentation
    this.srcImageData = null;
    this.wSrc = -1;
    this.hSrc = -1;

    this.onLoadModel = this.onLoadModel.bind(this);
    this.startApplyImage = this.startApplyImage.bind(this);

    this.m_needApplySegmentation = false;
  }
  // debug
  printTensor(tensor, numValues = 64 * 3) {
    console.log('tensor shape = ' + tensor.shape);
    const tensorData = tensor.dataSync();
    let strDebug = ''
    for (let i = 0; i < numValues; i++) {
      strDebug += tensorData[i].toString() + ", ";
    }
    console.log("tensor raw data = " + strDebug);
  }
  // debug
  printTensorIndices(tensor) {
    const numCols = tensor.shape[1];
    const numRows = tensor.shape[0];
    const tensorData = tensor.dataSync();
    console.log('Tensor indices');
    let i = 0;
    for (let y = 0; y < numRows; y++) {
      let strOut = '';
      for (let x = 0; x < numCols; x++) {
        const val = tensorData[i++];
        strOut += val.toString();
      } // for (x)
      console.log(strOut);
    } // for (y)
  }
  scaleUp(pixelsSrcInt, wSrc, hSrc, pixelsDst, wDst, hDst) {
    // float scales
    const xScale = wSrc / wDst;
    const yScale = hSrc / hDst;
    let ySrcAcc = 0.0;
    let iDst = 0;
    for (let y = 0; y < hDst; y++, ySrcAcc += yScale) {
      const ySrcBase = Math.floor(ySrcAcc);
      const yRem = ySrcAcc - ySrcBase;
      const ySrcInd = (yRem < 0.5) ? 0 : 1;
      const ySrc = ySrcBase + ySrcInd;
      const ySrcOff = ySrc * wSrc;

      let xSrcAcc = 0.0;
      for (let x = 0; x < wDst; x++, xSrcAcc += xScale) {
        const xSrcBase = Math.floor(xSrcAcc);
        const xRem = xSrcAcc - xSrcBase;
        const xSrcInd = (xRem < 0.5) ? 0 : 1;
        const xSrc = xSrcBase + xSrcInd;
        pixelsDst[iDst++] = pixelsSrcInt[xSrc + ySrcOff];
          
      } // for (x)
    } // for (y)
  }
  //
  // Load model
  async onLoadModel() {
    this.stage = STAGE_MODEL_IS_LOADING;
    this.pixels = null;

    console.log('Loading tfjs model...');
    const modelLoaded = await tf.loadLayersModel(PATH_MODEL, { strict: false } );

    this.model = modelLoaded;
    this.stage = STAGE_MODEL_READY;

    // print success model loading
    console.log("Model is loaded shape = " + modelLoaded.output.shape);
    //this.objGraphics2d.forceUpdate();
    this.startApplyImage();
  }
  async startApplyImage() {
    this.stage = STAGE_IMAGE_PROCESSED;
    console.log("Start apply segm to image ...");

    // prepare tensor
    const imgTensor = tf.browser.fromPixels(this.srcImageData).toFloat();
    // this.printTensor(imgTensor);

    // resize
    const IN_W = 320;
    const IN_H = 480;
    const imgResized = imgTensor.resizeBilinear([IN_W, IN_H]);

    // normalize to [-127..+127]
    const mean = tf.tensor([123.0, 116.0, 103.0])
    const imgNormalized = imgResized.sub(mean);

    // reshape tensor => [1, 320, 480, 3]
    const imgReshaped = imgNormalized.reshape([1, IN_W, IN_H, 3]); 

    // apply prediction
    const prediction = this.model.predict(imgReshaped);
    // this.printTensor(prediction, 150*3);

    const outpTensor = prediction.as2D(OUT_W * OUT_H, NUM_CLASSES);
    const outRes = outpTensor.reshape([OUT_H, OUT_W, NUM_CLASSES]);

    // get argmax: replace vec float[96] with index of maximum element
    const tensorPreData = outRes.dataSync();
    this.tensorIndices = new tf.zeros([OUT_H, OUT_W], 'int32');
    const tensorIndData = this.tensorIndices.dataSync();

    let iSrc = 0;
    let iDst = 0;

    for (let y = 0; y < OUT_H; y++) {
      for (let x = 0; x < OUT_W; x++) {
        let bestIndex = -1;
        let valMax = -0.1;
        for (let i = 0; i < NUM_CLASSES; i++) {
          if (tensorPreData[iSrc + i] > valMax) {
            valMax = tensorPreData[iSrc + i];
            bestIndex = i;
          } // if
        } // for (i)
        tensorIndData[iDst] = bestIndex;
        iSrc += NUM_CLASSES;
        iDst += 1;
      } // for (x)
    } // for (y)

    // debug print tesor indices
    // this.printTensorIndices(this.tensorIndices, 200*3);

    // scale up image with indices
    const pixelsUpScale = new Uint8ClampedArray(this.wSrc * this.hSrc);
    this.scaleUp(tensorIndData, OUT_W, OUT_H, pixelsUpScale, this.wSrc, this.hSrc);

    // generate 96-colors palette
    const palette = new Uint8ClampedArray(256 * 4);
    let i, j;
    i = 0; j = 0;
    // fill 5 first elements by hand
    palette[j++] = 0;
    palette[j++] = 0;
    palette[j++] = 255;
    palette[j++] = 255;
    i++;

    palette[j++] = 0;
    palette[j++] = 255;
    palette[j++] = 0;
    palette[j++] = 255;
    i++;

    palette[j++] = 255;
    palette[j++] = 0;
    palette[j++] = 0;
    palette[j++] = 255;
    i++;

    palette[j++] = 255;
    palette[j++] = 0;
    palette[j++] = 255;
    palette[j++] = 255;
    i++;

    palette[j++] = 64;
    palette[j++] = 200;
    palette[j++] = 255;
    palette[j++] = 255;
    i++;

    for (; i < 256; i++, j += 4) {
      palette[j + 0] = Math.floor(Math.random() * 255);
      palette[j + 1] = Math.floor(Math.random() * 255);
      palette[j + 2] = Math.floor(Math.random() * 255);
      palette[j + 3] = 255;
    }

    // convert 96-classes output image into colors image
    this.pixels = new Uint8ClampedArray(this.wSrc * this.hSrc * 4);
    const pixels = this.pixels;

    const w = this.wSrc;
    const h = this.hSrc;

    i = 0; j = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ind = pixelsUpScale[i];
        pixels[j + 0] = palette[ind * 4 + 0];
        pixels[j + 1] = palette[ind * 4 + 1];
        pixels[j + 2] = palette[ind * 4 + 2];
        pixels[j + 3] = 255;

        i++; j += 4;
      }
    }

    this.stage = STAGE_SEGMENTATION_READY;
    console.log("Segm complete now ");

    this.objGraphics2d.forceRender();
  }
  getStageString() {
    const msgArr = [
      'Wait. Model is not loaded', // const STAGE_MODEL_NOT_LOADED = 0;
      'Wait. Model is loading ...',  // const STAGE_MODEL_IS_LOADING = 1;
      'Model is ready', // const STAGE_MODEL_READY = 2;
      'Image is processed ...',  // const STAGE_IMAGE_PROCESSED = 3;
      'Segmentation is ready', // const STAGE_SEGMENTATION_READY = 4;
    ];
    const strMessage = msgArr[this.stage];
    return strMessage;
  }
  setImageData(imgData) {
    this.srcImageData = imgData;
  }
  render(ctx, w, h, imgData) {
    this.srcImageData = imgData;
    this.wSrc = w;
    this.hSrc = h;

    // debug
    console.log('Segm2d render. VGG model ' + ((this.model === null) ? 'not loaded' : 'loaded') );
    const strMessage = this.getStageString();
    console.log('Segm2d render. stage = ' + strMessage );

    /*
    // load model
    if (this.model === null) {
      this.onLoadModel();
    } else {
      // change slider or similar: need to rebuild segm for the new source image
      if (this.stage === STAGE_MODEL_READY) {
        this.startApplyImage();
        return;
      }
    } // if model non null
    */
    
    if ((this.stage === STAGE_SEGMENTATION_READY) && (this.pixels !== null)) {
      // draw pixels array on screen
      this.imgData = ctx.createImageData(w, h);
      const pixDst = this.imgData.data;
      // this.imgData.data = this.pixels;
      const numBytes = w * h * 4;
      for (let i = 0; i < numBytes; i++) {
        pixDst[i] = this.pixels[i];
      }
      ctx.putImageData(this.imgData, 0, 0);
      return;
    }



    // clear screen
    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillRect(0,0, w, h);
    // draw cross
    ctx.strokeStyle = '#FF0000';

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w - 1, h - 1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w - 1 , 0);
    ctx.lineTo(0, h - 1);
    ctx.stroke();
    // draw wait message
    const strMsgPrint = this.getStageString();
    ctx.font = '24px serif';
    ctx.fillStyle = 'rgb(64, 255, 64)';
    ctx.fillText(strMsgPrint, w / 2, h / 2);
  }
}

export default Segm2d;