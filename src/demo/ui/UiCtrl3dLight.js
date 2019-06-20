/**
 * @fileOverview UiCtrl3dLight
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

// special css for NoUiSlioder
import 'nouislider/distribute/nouislider.css';

import React from 'react';
import { connect } from 'react-redux';
import { Card, ListGroup, Button } from 'react-bootstrap';

//import Nouislider from 'react-nouislider';

import Modes3d from '../store/Modes3d';
import Modes3droi from '../store/Modes3droi';
import StoreActionType from '../store/ActionTypes';
import UiTF from './UiTF';
import UiTFroi from './UiTFroi';
import UiRoiSelect from './UiRoiSelect';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiCtrl3dLight some text later...
 */
class UiCtrl3dLight extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
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
    // TODO
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

    const strA = (mode3d === Modes3d.ISO) ? 'active' : '';
    const strB = (mode3d === Modes3d.RAYCAST) ? 'active' : '';
    const strC = (mode3d === Modes3d.RAYFAST) ? 'active' : '';
    const strD = (mode3d === Modes3d.ERASER) ? 'active' : '';
    // const strAroi = (mode3droi === Modes3droi.ISO) ? 'active' : '';
    // const strBroi = (mode3droi === Modes3droi.RAYCAST) ? 'active' : '';

    const jsxRenderControls =
      <div>
        <Card>
          <Card.Body>

            <Button variant="info" className={strA} onClick={this.onModeA}  >
              Isosurface
            </Button>
            <Button variant="info" className={strB} onClick={this.onModeB} >
              VolumeRender
            </Button>

            <Button variant="info" className={strC} onClick={this.onModeC} >
              MaxProjection
            </Button>

            <Button variant="info" className={strD} onClick={this.onModeD} >
              VolumeEraser
            </Button>

          </Card.Body>
        </Card>
        <UiTF />
      </div>

    const jsxROI =
      <ListGroup as="ul" variant="flush">

        <ListGroup.Item as="li">
          <UiRoiSelect setRoiFunc={this.setRoi}/>
        </ListGroup.Item>

        <UiTFroi/>
      </ListGroup>
    let indx = 0;
    const vol = store.volume;
    const FOUR = 4;
    if (vol.m_bytesPerVoxel === FOUR) {
      indx = 1;
    }
    const jsxArray = [jsxRenderControls, jsxROI];
    const jsxRet = jsxArray[indx];
    return jsxRet;

  }
}

export default connect(store => store)(UiCtrl3dLight);

