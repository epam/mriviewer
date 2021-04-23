import 'nouislider/distribute/nouislider.css';

import React from 'react';
import { connect } from 'react-redux';
import Modes3d from '../store/Modes3d';
import Modes3droi from '../store/Modes3droi';
import StoreActionType from '../store/ActionTypes';
import UiTF from './UiTF';
import UiTFroi from './UiTFroi';
import UiRoiSelect from './UiRoiSelect';

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
  }
  setRoi(arrayRoi) {
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
  render() {
    const store = this.props;

    const jsxRenderControls =
      <div>
        <h3>3d mode selection</h3>
                  Hint: Show just barrier value surface, 1st ray intersection
               
        <button onClick={this.onModeA}  >
                  Iso
        </button>

             Hint:                 Show complete 3d volumetric rendering
        <button onClick={this.onModeB} >
                  Vol
        </button>

              Hint:
                  Show maximum projection rendering
        <button onClick={this.onModeC} >
                  MaxPrj</button>

              Hint:
                  Special volume eraser tool
        <button onClick={this.onModeD} >
                  Eraser
        </button>
        <UiTF />
      </div>

    const jsxROI = <div>
      <UiRoiSelect setRoiFunc={this.setRoi}/>
      <UiTFroi/>
    </div>
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

