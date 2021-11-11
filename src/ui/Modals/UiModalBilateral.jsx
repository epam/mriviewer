/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

import Nouislider from 'react-nouislider';

import GaussSmoother from '../../engine/imgproc/Gauss';

import StoreActionType from '../../store/ActionTypes';
import ViewMode from '../../store/ViewMode';
import Modes3d from '../../store/Modes3d';
import { Modal, ModalBody, ModalHeader } from './ModalBase';
import { UIButton } from '../Button/Button';

class UiModalBilateral extends React.Component {
  constructor(props) {
    super(props);
    this.onModalShow = this.onModalShow.bind(this);
    this.onModalHide = this.onModalHide.bind(this);
    this.onButtonStart = this.onButtonStart.bind(this);
    this.onChangeSliderKoefDist = this.onChangeSliderKoefDist.bind(this);
    this.onChangeSliderKoefVal = this.onChangeSliderKoefVal.bind(this);

    this.onBilateralCallback = this.onBilateralCallback.bind(this);

    this.m_hideFunc = null;
    this.m_gauss = null;

    this.state = {
      showModalGauss: false,
      text: 'dump',
    };

    this.m_kernelSize = 10;
    this.m_koefDist = 3.0;
    this.m_koefVal = 0.1;
  }

  onButtonStart() {
    console.log('on button start Bilateral with kernel = ' + this.m_kernelSize.toString());
    this.m_hideFunc();

    const store = this.props;

    const volSet = store.volumeSet;
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);

    if (vol === undefined || vol === null) {
      console.log('onButtonSobel: no volume!');
      return;
    }
    this.m_vol = vol;
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    if (xDim * yDim * zDim < 1) {
      console.log(`onButtonBilateral: bad volume! dims = ${xDim}*${yDim}*${zDim}`);
      return;
    }
    // let volTextureSrc = vol.m_dataArray;
    const ONE = 1;
    if (vol.m_bytesPerVoxel !== ONE) {
      console.log('onButtonBilateral: supported only 1bpp volumes');
      return;
    }

    console.log('onButtonBilateral: start 3d bilateral filtration...');
    //const xyzDim = xDim * yDim * zDim;
    //const volTextureDst = new Uint8Array(xyzDim);

    const NEED_HW = true;
    const gauss = new GaussSmoother(NEED_HW);

    // test
    // gauss.testSimple();

    const kernelSize = this.m_kernelSize;
    gauss.start(vol, kernelSize, this.m_koefDist, this.m_koefVal);
    this.m_gauss = gauss;
    store.dispatch({ type: StoreActionType.SET_PROGRESS, progress: 0 });
    const UPDATE_DELAY_MSEC = 150;
    this.m_timerId = setTimeout(this.onBilateralCallback, UPDATE_DELAY_MSEC);
  }

  onBilateralCallback() {
    this.m_gauss.update();

    const store = this.props;

    let ratioUpdate = this.m_gauss.getRatio();
    ratioUpdate = ratioUpdate < 1.0 ? ratioUpdate : 1.0;
    ratioUpdate *= 100;
    ratioUpdate = Math.floor(ratioUpdate);
    // console.log('ratio = ' + ratioUpdate.toString() );

    store.dispatch({ type: StoreActionType.SET_PROGRESS, progress: ratioUpdate });
    const isFinished = this.m_gauss.isFinished();

    if (isFinished) {
      console.log('onBilateralCallback: iters finished!');
      store.dispatch({ type: StoreActionType.SET_PROGRESS, progress: 0 });

      clearInterval(this.m_timerId);
      this.m_timerId = 0;

      const volSet = store.volumeSet;
      const volIndex = store.volumeIndex;
      const vol = volSet.getVolume(volIndex);

      const xDim = vol.m_xDim;
      const yDim = vol.m_yDim;
      const zDim = vol.m_zDim;
      const xyzDim = xDim * yDim * zDim;
      const pixelsDst = this.m_gauss.getPixelsDst();
      for (let i = 0; i < xyzDim; i++) {
        vol.m_dataArray[i] = Math.floor(pixelsDst[i]);
      } // for i
      this.m_gauss.stop();

      // rebuild 3d data
      store.dispatch({ type: StoreActionType.SET_VOLUME_SET, volumeSet: volSet });
      store.dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
      store.dispatch({ type: StoreActionType.SET_MODE_VIEW, viewMode: ViewMode.VIEW_2D });
      store.dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: Modes3d.RAYCAST });
    } // if finished
    // update render
    store.graphics2d.forceUpdate();
    // next update timer
    if (!isFinished) {
      const UPDATE_DELAY_MSEC = 150;
      this.m_timerId = setTimeout(this.onBilateralCallback, UPDATE_DELAY_MSEC);
    }
  } // end onBilateralCallback

  //
  onModalShow() {
    this.setState({ showModalGauss: true });
  }

  onModalHide() {
    this.setState({ showModalGauss: false });
  }

  onChangeSliderKoefDist() {
    if (this.refs === undefined) {
      return;
    }
    this.m_updateEnable = false;
    let val = 0.0;
    const aval = this.refs.slider1.slider.get();
    if (typeof aval === 'string') {
      val = Number.parseFloat(aval);
      this.m_koefDist = val;
    }
  }

  onChangeSliderKoefVal() {
    if (this.refs === undefined) {
      return;
    }
    this.m_updateEnable = false;
    let val = 0.0;
    const aval = this.refs.slider2.slider.get();
    if (typeof aval === 'string') {
      val = Number.parseFloat(aval);
      this.m_koefVal = val;
    }
  }

  //
  render() {
    const stateVis = this.props.stateVis;
    const onHideFunc = this.props.onHide;
    this.m_hideFunc = onHideFunc;

    const strSlider1 = 'slider1';
    const strSlider2 = 'slider2';
    const defaultDist = 3;
    const defaultVal = 0.1;
    const wArrDist = [defaultDist];
    const wArrVal = [defaultVal];

    const valToolTps = true;

    return (
      <Modal isOpen={stateVis} close={onHideFunc}>
        <ModalHeader title="Bilateral filtration" />

        <ModalBody>
          Select koefficient distance (kd)
          <Nouislider
            onSlide={this.onChangeSliderKoefDist.bind(this)}
            ref={strSlider1}
            range={{ min: 0.5, max: 3.0 }}
            start={wArrDist}
            step={0.00001}
            tooltips={valToolTps}
          />
          Select koefficient value (kv)
          <Nouislider
            onSlide={this.onChangeSliderKoefVal.bind(this)}
            ref={strSlider2}
            range={{ min: 0.1, max: 4.0 }}
            start={wArrVal}
            step={0.00001}
            tooltips={valToolTps}
          />
          <b>Hints to setup values:</b> <br />
          kd = 0.5, kv = 0.1 => original image <br />
          kd = 3.0, kv = 0.1 => denoise image <br />
          kd = 3.0, kv = 4.0 => image blur
          <UIButton handler={this.onButtonStart} caption="Start" />
        </ModalBody>
      </Modal>
    );
  }
}

export default connect((store) => store)(UiModalBilateral);
