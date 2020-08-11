/**
 * @fileOverview UiModalGauss
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import { Modal, Button, Form, Row, Col, Table } from 'react-bootstrap';
import Nouislider from 'react-nouislider';

import GaussSmoother from '../engine/imgproc/Gauss';

import StoreActionType from '../store/ActionTypes';
import Texture3D from '../engine/Texture3D';
import ModeView from '../store/ModeView';
import Modes3d from '../store/Modes3d';


// ********************************************************
// Class
// ********************************************************

class UiModalGauss extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onModalShow = this.onModalShow.bind(this);
    this.onModalHide = this.onModalHide.bind(this);
    this.onButtonStart = this.onButtonStart.bind(this);
    this.onChangeSliderSlice = this.onChangeSliderSlice.bind(this);

    this.onGaussCallback = this.onGaussCallback.bind(this);

    this.m_hideFunc = null;
    this.m_gauss = null;

    this.state = {
      showModalGauss: false,
      text: 'dump'
    };
    this.m_kernelSize = 2;
  } // end constr
  //
  //
  //
  onButtonStart() {
    console.log('on button start gauss with kernel = ' + this.m_kernelSize.toString());
    this.m_hideFunc();

    const store = this.props;

    const volSet = store.volumeSet;
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);

    if ((vol === undefined) || (vol === null)) {
      console.log('onButtonSobel: no volume!');
      return;
    }
    this.m_vol = vol;
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    if (xDim * yDim * zDim < 1) {
      console.log(`onButtonGauss: bad volume! dims = ${xDim}*${yDim}*${zDim}`);
      return;
    }
    // let volTextureSrc = vol.m_dataArray;
    const ONE = 1;
    if (vol.m_bytesPerVoxel !== ONE) {
      console.log('onButtonGauss: supported only 1bpp volumes');
      return;
    }

    console.log('onButtonGauss: start gauss...');
    //const xyzDim = xDim * yDim * zDim;
    //const volTextureDst = new Uint8Array(xyzDim);

    const gauss = new GaussSmoother();

    // test
    // gauss.testSimple();

    const kernelSize = this.m_kernelSize;
    const sigma = kernelSize / 6.0;
    gauss.start(vol, kernelSize, sigma);
    this.m_gauss = gauss;

    const uiApp = store.uiApp;
    uiApp.doShowProgressBar('Apply gauss smoother...');
    uiApp.doSetProgressBarRatio(0.0);

    const UPDATE_DELAY_MSEC = 150;
    this.m_timerId = setTimeout(this.onGaussCallback, UPDATE_DELAY_MSEC);
  }
  //
  // callback for periodicallt invoke sobel 3d volume filtering
  //
  onGaussCallback() {
    this.m_gauss.update();

    const store = this.props;

    let ratioUpdate = this.m_gauss.getRatio();
    ratioUpdate = (ratioUpdate < 1.0) ? ratioUpdate : 1.0;
    ratioUpdate *= 100;
    ratioUpdate = Math.floor(ratioUpdate);
    // console.log('ratio = ' + ratioUpdate.toString() );

    const uiApp = store.uiApp;
    uiApp.doSetProgressBarRatio(ratioUpdate);

    const isFinished = this.m_gauss.isFinished();

    if (isFinished) {
      console.log('onGaussCallback: iters finished!');
      uiApp.doHideProgressBar();

      clearInterval(this.m_timerId);
      this.m_timerId = 0;

      const volSet = store.volumeSet;
      const volIndex = store.volumeIndex;
      const vol = volSet.getVolume(volIndex);

      // copy result pixels into source
      const xDim = vol.m_xDim;
      const yDim = vol.m_yDim;
      const zDim = vol.m_zDim;
      const xyzDim = xDim * yDim * zDim;
      const pixelsDst = this.m_gauss.getPixelsDst()
      for (let i = 0; i < xyzDim; i++) {
        vol.m_dataArray[i] = Math.floor(pixelsDst[i]);
      } // for i
      this.m_gauss.stop();

      // rebuild 3d data
      store.dispatch({ type: StoreActionType.SET_VOLUME_SET, volumeSet: volSet });
      store.dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
      const tex3d = new Texture3D();
      tex3d.createFromRawVolume(vol);
      store.dispatch({ type: StoreActionType.SET_TEXTURE3D, texture3d: tex3d });
      store.dispatch({ type: StoreActionType.SET_MODE_VIEW, modeView: ModeView.VIEW_2D });
      store.dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: Modes3d.RAYCAST });
    } // if finished
    // update render
    store.graphics2d.forceUpdate();
    // next update timer
    if (!isFinished) {
      const UPDATE_DELAY_MSEC = 150;
      this.m_timerId = setTimeout(this.onGaussCallback, UPDATE_DELAY_MSEC);
    }
  } // end onGaussCallback
  //
  onModalShow() {
    this.setState({ showModalGauss: true });
  }
  onModalHide() {
    this.setState({ showModalGauss: false });
  }
  handleFormSubmit(evt) {
    evt.preventDefault();
    this.m_hideFunc();
    // this.onSaveNifti();
  }
  onChangeSliderSlice() {
    if (this.refs === undefined) {
      return;
    }
    this.m_updateEnable = false;
    let val = 0.0;
    const aval = this.refs.slider1.slider.get();
    if (typeof (aval) === 'string') {
      val = Number.parseFloat(aval);
      this.m_kernelSize = val;
    }

  }
  render() {
    const stateVis = this.props.stateVis;
    const onHideFunc = this.props.onHide;
    this.m_hideFunc = onHideFunc;

    const valSlider = 2;
    const strSlider1 = 'slider1';
    const wArr = [valSlider];
    const valToolTps = true;

    const jsxModalGauss =
    <Modal show={stateVis} onHide={onHideFunc} >

      <Modal.Title>
        Gauss smoothing
      </Modal.Title>

      <Modal.Body>

        <Table>
          <tbody>

            <tr>
              <td style={{ paddingBottom: '32px' }}>
                Select kernel size 
              </td>
            </tr>

            <tr>
              <td>

                <Row>
                  <Col>
                    <Form onSubmit={evt => this.handleFormSubmit(evt)}>
                      <Nouislider onSlide={this.onChangeSliderSlice.bind(this)} ref={strSlider1}
                        range={{ min: 1.0, max: 8.0 }}
                        start={wArr} step={1.0} tooltips={valToolTps} />
                    </Form>
                  </Col>
                </Row>

              </td>
            </tr>
            <tr>
              <td>
                <Row>
                  <Col lg xl="2">
                    <Button onClick={this.onButtonStart} >
                      Start
                    </Button>
                  </Col>

                  <Col lg xl="10">
                  </Col>

                </Row>
              </td>
            </tr>
          </tbody>
        </Table>

      </Modal.Body>

    </Modal>
    return jsxModalGauss;
  } // end render

} // end class

export default connect(store => store)(UiModalGauss);


