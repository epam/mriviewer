/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

import { Nouislider } from '../Nouislider/Nouislider';

import GaussSmoother from '../../engine/imgproc/Gauss';

import StoreActionType from '../../store/ActionTypes';
import ViewMode from '../../store/ViewMode';
import Modes3d from '../../store/Modes3d';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ModalBase';
import { UIButton } from '../Button/Button';

import buttonCss from '../Button/Button.module.css';

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

  onChangeSliderKoefDist(value) {
    this.m_updateEnable = false;
    this.m_koefDist = value;
  }

  onChangeSliderKoefVal(value) {
    this.m_updateEnable = false;
    this.m_koefVal = value;
  }

  //
  render() {
    const stateVis = this.props.stateVis;
    const onHideFunc = this.props.onHide;
    this.m_hideFunc = onHideFunc;

    const defaultDist = 3;
    const defaultVal = 0.1;

    return (
      <Modal isOpen={stateVis} close={onHideFunc}>
        <ModalHeader title="Bilateral filtration" />

        <ModalBody>
          Select koefficient distance (kd)
          <Nouislider onChange={this.onChangeSliderKoefDist.bind(this)} range={{ min: 0.5, max: 3.0 }} value={defaultDist} step={0.00001} />
          Select koefficient value (kv)
          <Nouislider onChange={this.onChangeSliderKoefVal.bind(this)} range={{ min: 0.1, max: 4.0 }} value={defaultVal} step={0.00001} />
          <p>
            <b>Hints to setup values:</b> <br />
            kd = 0.5, kv = 0.1 ={'>'} original image <br />
            kd = 3.0, kv = 0.1 ={'>'} denoise image <br />
            kd = 3.0, kv = 4.0 ={'>'} image blur <br />
          </p>
        </ModalBody>
        <ModalFooter>
          <UIButton handler={this.onButtonStart} caption="Start" cx={buttonCss.apply} />
        </ModalFooter>
      </Modal>
    );
  }
}

export default connect((store) => store)(UiModalBilateral);
