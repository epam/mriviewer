/**
 * @fileOverview UiMain3dLight
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';
import { Container, Row, Col } from 'react-bootstrap';

import UiCtrl3dLight from './UiCtrl3dLight';
import UiCtrl3d from './UiCtrl3d';
import Graphics3d from '../engine/Graphics3d';
import 'nouislider/distribute/nouislider.css';

import { ListGroup } from 'react-bootstrap';

import Nouislider from 'react-nouislider';

//import Modes3d from '../store/Modes3d';

import StoreActionType from '../store/ActionTypes';
import ModeView from '../store/ModeView';


// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiMain3dLight some text later...
 */
class UiMain3dLight extends React.Component {
  /**
   * Main component render func callback
   */
  constructor(props) {
    super(props);
    this.m_updateEnable = true;
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
  render() {
    // const store = this.props;
    // const vol = store.volume;
    const store = this.props;
    const modeViewIndex = store.modeView;

    const sliderBrightness = store.sliderBrightness;
    const sliderCut = store.sliderCut;
    const sliderQuality = store.sliderQuality;

    const wArrBrightness = [sliderBrightness];
    const wArrCut = [sliderCut];
    const wArrQuality = [sliderQuality];
    const jsx3dLight = <UiCtrl3dLight></UiCtrl3dLight>;
    const jsx3d = <UiCtrl3d></UiCtrl3d>;

    const jsxArray = new Array(ModeView.VIEW_COUNT);
    jsxArray[ModeView.VIEW_3D_LIGHT] = jsx3dLight ;
    jsxArray[ModeView.VIEW_3D] = jsx3d;
    const jsxRet = jsxArray[modeViewIndex];

    const MIN_HEIGHT = 882;
    const strMinHeight = {
      minHeight: MIN_HEIGHT.toString() + 'px'
    };


    const jsxMain3dLight = 
      <Container>
        <Row>
          <Col xs={12} sm={12} md lg xl="4">
            {jsxRet}
            <ListGroup as="ul" variant="flush">
              <ListGroup.Item>
                <p> Brightness </p>
                <Nouislider onSlide={this.onChangeSliderBrightness.bind(this)} ref={'sliderBrightness'}
                  range={{ min: 0.0, max: 1.0 }}
                  overflow-scroll={'true'}
                  start={wArrBrightness} connect={[false, false]} step={0.02} tooltips={true} />
              </ListGroup.Item>

              <ListGroup.Item>
                <p> Cut </p>
                <Nouislider onSlide={this.onChangeSliderCut.bind(this)} ref={'sliderCut'}
                  range={{ min: 0.0, max: 1.0 }}
                  overflow-scroll={'true'}
                  start={wArrCut} connect={[false, false]} step={0.01} tooltips={true} />
              </ListGroup.Item>

              <ListGroup.Item>
                <p> Quality </p>
                <Nouislider onSlide={this.onChangeSliderQuality.bind(this)} ref={'sliderQuality'}
                  range={{ min: 0.0, max: 1.0 }}
                  overflow-scroll={'true'}
                  start={wArrQuality} connect={[false, false]} step={0.02} tooltips={true} />
              </ListGroup.Item>

            </ListGroup>

          </Col>
          <Col xs={12} sm={12} md lg xl="8" style={strMinHeight} overflow={'hidden'} position={'fixed'} >
            <Graphics3d  />
          </Col>
        </Row>
      </Container>;
    
    return jsxMain3dLight;
  };
}

export default connect(store => store)(UiMain3dLight);
