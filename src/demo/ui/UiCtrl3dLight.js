/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';
import { ButtonGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';

//import Nouislider from 'react-nouislider';
import Modes3d from '../store/Modes3d';
import Modes3droi from '../store/Modes3droi';
import StoreActionType from '../store/ActionTypes';
import UiTF from './UiTF';
import UiTFroi from './UiTFroi';
import UiRoiSelect from './UiRoiSelect';
import { UIButton } from "./Button/Button";

class UiCtrl3dLight extends React.Component {
  constructor(props) {
    super(props);
    this.onModeA = this.onModeA.bind(this);
    this.onModeB = this.onModeB.bind(this);
    this.onModeC = this.onModeC.bind(this);
    this.onModeD = this.onModeD.bind(this);
    this.onMode = this.onMode.bind(this);
    this.onModeroi = this.onModeroi.bind(this);
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

  onModeroi(indexMode) {
    this.m_updateEnable = true;
    this.props.dispatch({ type: StoreActionType.SET_MODE_3Droi, mode3droi: indexMode });
  }

  onModeAroi() {
    this.onModeroi(Modes3droi.ISO);
  }

  onModeBroi() {
    this.onModeroi(Modes3droi.RAYCAST);
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
    // const mode3droi = store.mode3droi;

    const strA = (mode3d === Modes3d.ISO);
    const strB = (mode3d === Modes3d.RAYCAST);
    const strC = (mode3d === Modes3d.RAYFAST);
    const strD = (mode3d === Modes3d.ERASER);
    // const strAroi = (mode3droi === Modes3droi.ISO);
    // const strBroi = (mode3droi === Modes3droi.RAYCAST);

    const jsxRenderControls =
      <>
        <p>3D mode selection</p>
        <ButtonGroup>
          <OverlayTrigger key="iso" placement="bottom" overlay={
            <Tooltip>
              Show just barrier value surface, 1st ray intersection
            </Tooltip>
          }>
            <UIButton active={strA} handler={this.onModeA} caption="Iso" icon="I"/>
          </OverlayTrigger>

          <OverlayTrigger key="vre" placement="bottom" overlay={
            <Tooltip>
              Show complete 3D volumetric rendering
            </Tooltip>
          }>
            <UIButton active={strB} handler={this.onModeB} caption="Vol" icon="V"/>
          </OverlayTrigger>

          <OverlayTrigger key="maxproj" placement="bottom" overlay={
            <Tooltip>
              Show maximum projection rendering
            </Tooltip>
          }>
            <UIButton active={strC} handler={this.onModeC} caption="MaxPrj" icon="M"/>
          </OverlayTrigger>

          <OverlayTrigger key="volera" placement="bottom" overlay={
            <Tooltip>
              Special volume eraser tool
            </Tooltip>
          }>
            <UIButton active={strD} handler={this.onModeD} caption="Eraser" icon="E"/>
          </OverlayTrigger>

        </ButtonGroup>
        <UiTF/>
      </>

    const jsxROI =
      <>
          <UiRoiSelect setRoiFunc={this.setRoi}/>
        <UiTFroi/>
      </>
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

export default connect(store => store)(UiCtrl3dLight);

