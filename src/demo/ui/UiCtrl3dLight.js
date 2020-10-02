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
import { Card, ListGroup, Button, ButtonGroup } from 'react-bootstrap';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

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

    const strA = (mode3d === Modes3d.ISO) ? 'primary' : 'secondary';
    const strB = (mode3d === Modes3d.RAYCAST) ? 'primary' : 'secondary';
    const strC = (mode3d === Modes3d.RAYFAST) ? 'primary' : 'secondary';
    const strD = (mode3d === Modes3d.ERASER) ? 'primary' : 'secondary';
    // const strAroi = (mode3droi === Modes3droi.ISO) ? 'primary' : 'secondary';
    // const strBroi = (mode3droi === Modes3droi.RAYCAST) ? 'primary' : 'secondary';

    const jsxRenderControls =
      <div>
        <Card>
          <Card.Title>
            3d mode selection
          </Card.Title>
          <Card.Body>

            <ButtonGroup>
              <OverlayTrigger key="iso" placement="bottom" overlay={
                <Tooltip>
                  Show just barrier value surface, 1st ray intersection
                </Tooltip>
              }>
                <Button variant={strA} onClick={this.onModeA}  >
                  Iso
                </Button>
              </OverlayTrigger>

              <OverlayTrigger key="vre" placement="bottom" overlay={
                <Tooltip>
                  Show complete 3d volumetric rendering
                </Tooltip>
              }>
                <Button variant={strB} onClick={this.onModeB} >
                  Vol
                </Button>
              </OverlayTrigger>

              <OverlayTrigger key="maxproj" placement="bottom" overlay={
                <Tooltip>
                  Show maximum projection rendering
                </Tooltip>
              }>
                <Button variant={strC} onClick={this.onModeC} >
                  MaxPrj
                </Button>
              </OverlayTrigger>

              <OverlayTrigger key="volera" placement="bottom" overlay={
                <Tooltip>
                  Special volume eraser tool
                </Tooltip>
              }>
                <Button variant={strD} onClick={this.onModeD} >
                  Eraser
                </Button>
              </OverlayTrigger>

            </ButtonGroup>

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
    const jsxRet = jsxArray[indx];
    return jsxRet;

  }
}

export default connect(store => store)(UiCtrl3dLight);

