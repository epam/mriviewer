/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';
import Modes3d from '../store/Modes3d';
import StoreActionType from '../store/ActionTypes';
import UiTF from './UiTF';
import UiTFroi from './UiTFroi';
import UiRoiSelect from './UiRoiSelect';
import { UIButton } from './Button/Button';
import { Container } from './Tollbars/Container';

class UiCtrl3dLight extends React.Component {
  constructor(props) {
    super(props);
    this.onModeA = this.onModeA.bind(this);
    this.onModeB = this.onModeB.bind(this);
    this.onModeC = this.onModeC.bind(this);
    this.onModeD = this.onModeD.bind(this);
    this.onMode = this.onMode.bind(this);
    this.m_updateEnable = true;
  }

  onMode(indexMode) {
    this.m_updateEnable = true;
    this.props.dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: indexMode });
    const store = this.props;
    store.volumeRenderer.offAmbientTextureMode();
  }

  onModeA() {
    this.onMode(Modes3d.ISO);
    this.props.volumeRenderer.setEraserMode(false);
  }

  onModeB() {
    this.onMode(Modes3d.RAYCAST);
    this.props.volumeRenderer.setEraserMode(false);
  }

  onModeC() {
    this.onMode(Modes3d.RAYFAST);
    this.props.volumeRenderer.setEraserMode(false);
  }

  onModeD() {
    this.onMode(Modes3d.EREASER);
    this.props.volumeRenderer.setEraserMode(true);
  }

  shouldComponentUpdate() {
    return this.m_updateEnable;
    //return true;
  }

  /**
   * Callback, invoked after any ROI setup array change
   *
   * @param {object} arrayRoi - array of objects with props: id, name, selected, see (UiRoiSelect)
   */
  setRoi(arrayRoi) {
    // This is demo code:
    // just print all states of all roi elements, according to the UI
    const numElems = arrayRoi.length;
    const store = this.props;
    const MAXELEM = 256;
    const selectedROI = new Uint8Array(MAXELEM);
    //const BYTES_IN_COLOR = 4;
    for (let i = 0; i < MAXELEM; i++) {
      selectedROI[i] = false;
    }
    for (let i = 0; i < numElems; i++) {
      const id = arrayRoi[i].id;
      const name = arrayRoi[i].name;
      const isSel = arrayRoi[i].selected;
      selectedROI[id] = isSel;
      console.log(`setRoi: [${i}]: name=${name} id= ${id} isSel=${isSel} `);
    }
    store.volumeRenderer.updateSelectedRoiMap(selectedROI);
  }

  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const mode3d = store.mode3d;

    const strA = mode3d === Modes3d.ISO;
    const strB = mode3d === Modes3d.RAYCAST;
    const strC = mode3d === Modes3d.RAYFAST;
    const strD = mode3d === Modes3d.ERASER;

    const jsxRenderControls = (
      <>
        <p>3D mode selection</p>
        <Container direction="horizontal">
          <UIButton active={strA} handler={this.onModeA} caption="Show just barrier value surface, 1st ray intersection" icon="I" />
          <UIButton active={strB} handler={this.onModeB} caption="Show complete 3D volumetric rendering" icon="V" />
          <UIButton active={strC} handler={this.onModeC} caption="Show maximum projection rendering" icon="M" />
          <UIButton active={strD} handler={this.onModeD} caption="Special volume eraser tool" icon="E" />
        </Container>
        <UiTF />
      </>
    );

    const jsxROI = (
      <>
        <UiRoiSelect setRoiFunc={this.setRoi} />
        <UiTFroi />
      </>
    );
    let indx = 0;

    const volSet = store.volumeSet;
    if (volSet.getNumVolumes() > 0) {
      const volIndex = store.volumeIndex;
      const vol = volSet.getVolume(volIndex);

      const FOUR = 4;
      if (vol.m_bytesPerVoxel === FOUR) {
        indx = 1;
      }
    } // end if more 0 volumes
    const jsxArray = [jsxRenderControls, jsxROI];
    return jsxArray[indx];
  }
}

export default connect((store) => store)(UiCtrl3dLight);
