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
import { ListGroup, ButtonGroup, Button } from 'react-bootstrap';

import Nouislider from 'react-nouislider';

import Modes3d from '../store/Modes3d';
import StoreActionType from '../store/ActionTypes';
import UiTF from './UiTF';

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
  onChangeSliderBrightness() {
    this.m_updateEnable = false;
    const aval = this.refs.sliderBrightness.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Brightness, sliderBrightness: Number.parseFloat(aval) });
  }
  onChangeSliderCut() {
    this.m_updateEnable = false;
    const aval = this.refs.sliderCut.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Cut, sliderCut: Number.parseFloat(aval) });
  }
  onChangeSliderQuality() {
    this.m_updateEnable = false;
    const aval = this.refs.sliderQuality.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Quality, sliderQuality: Number.parseFloat(aval) });    
  }
  shouldComponentUpdate() {
    return this.m_updateEnable;
    //return true;
  }
  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;

    const sliderBrightness = store.sliderBrightness;
    const sliderCut = store.sliderCut;
    const sliderQuality = store.sliderQuality;

    const wArrBrightness = [sliderBrightness];
    const wArrCut = [sliderCut];
    const wArrQuality = [sliderQuality];
    const mode3d = store.mode3d;

    const strClass = 'btn btn-info';
    const strA = strClass + ((mode3d === Modes3d.ISO) ? ' active' : '');
    const strB = strClass + ((mode3d === Modes3d.RAYCAST) ? ' active' : '');
    const strC = strClass + ((mode3d === Modes3d.RAYFAST) ? ' active' : '');
    const strD = strClass + ((mode3d === Modes3d.EREASER) ? ' active' : '');

    // console.log(`UiCtr3dLight. render. flags = ${bCheckedSag}+${bCheckedCor}+${bCheckedTra}`);

    // btn-default active

    const jsxRenderControls =
      <ListGroup as="ul" variant="flush">
        <ListGroup.Item as="li">
          <ButtonGroup>
            <Button variant="secondary" className={strA} onClick={this.onModeA} >
              Isosurface
            </Button>
            <Button variant="secondary" className={strB} onClick={this.onModeB} >
              VolumeRender
            </Button>
            <Button variant="secondary" className={strC} onClick={this.onModeC} >
              MaxProjection
            </Button>
            <Button variant="secondary" className={strD} onClick={this.onModeD} >
              Eraser
            </Button>

          </ButtonGroup>          
        </ListGroup.Item>

        <ListGroup.Item>
          <UiTF/>
        </ListGroup.Item>

        <ListGroup.Item>
          <p> Brightness </p>
          <Nouislider onSlide={this.onChangeSliderBrightness.bind(this)} ref={'sliderBrightness'}
            range={{ min: 0.0, max: 1.0 }}
            start={wArrBrightness} step={0.02} tooltips={true} />          
        </ListGroup.Item>

        <ListGroup.Item>
          <p> Cut </p>
          <Nouislider onSlide={this.onChangeSliderCut.bind(this)} ref={'sliderCut'}
            range={{ min: 0.0, max: 1.0 }}
            start={wArrCut} step={0.01} tooltips={true} />
        </ListGroup.Item>

        <ListGroup.Item>
          <p> Quality </p>
          <Nouislider onSlide={this.onChangeSliderQuality.bind(this)} ref={'sliderQuality'}
            range={{ min: 0.0, max: 1.0 }}
            start={wArrQuality} step={0.02} tooltips={true} />
        </ListGroup.Item>

      </ListGroup>

    return jsxRenderControls;
  }
}

export default connect(store => store)(UiCtrl3dLight);
