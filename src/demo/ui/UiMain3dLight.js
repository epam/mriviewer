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
import { Row, Col } from 'react-bootstrap';

import UiCtrl3dLight from './UiCtrl3dLight';
import Graphics3d from '../engine/Graphics3d';
import 'nouislider/distribute/nouislider.css';

import { ListGroup } from 'react-bootstrap';

import Nouislider from 'react-nouislider';

//import Modes3d from '../store/Modes3d';
import StoreActionType from '../store/ActionTypes';

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

    const sliderBrightness = store.sliderBrightness;
    const sliderCut = store.sliderCut;
    const sliderQuality = store.sliderQuality;

    const wArrBrightness = [sliderBrightness];
    const wArrCut = [sliderCut];
    const wArrQuality = [sliderQuality];

    const jsxMain3dLight = 
      <Row>
        <Col xs lg="4">
          <UiCtrl3dLight />
          <ListGroup as="ul" variant="flush">
            <ListGroup.Item>
              <p> Brightness </p>
              <Nouislider onSlide={this.onChangeSliderBrightness.bind(this)} ref={'sliderBrightness'}
                range={{ min: 0.0, max: 1.0 }}
                start={wArrBrightness} connect={[false, true]} step={0.02} tooltips={true} />
            </ListGroup.Item>

            <ListGroup.Item>
              <p> Cut </p>
              <Nouislider onSlide={this.onChangeSliderCut.bind(this)} ref={'sliderCut'}
                range={{ min: 0.0, max: 1.0 }}
                start={wArrCut} connect={[false, true]} step={0.01} tooltips={true} />
            </ListGroup.Item>

            <ListGroup.Item>
              <p> Quality </p>
              <Nouislider onSlide={this.onChangeSliderQuality.bind(this)} ref={'sliderQuality'}
                range={{ min: 0.0, max: 1.0 }}
                start={wArrQuality} connect={[false, true]} step={0.02} tooltips={true} />
            </ListGroup.Item>

          </ListGroup>

        </Col>
        <Col xs lg="8">
          <Graphics3d  />
        </Col>
      </Row>
    
    return jsxMain3dLight;
  };
}

export default connect(store => store)(UiMain3dLight);
