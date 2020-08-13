/**
 * @fileOverview UiSmartBrush
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import 'nouislider/distribute/nouislider.css'

import React from 'react';
import { connect } from 'react-redux';

import Nouislider from 'react-nouislider';

// ********************************************************
// Class
// ********************************************************
class UiSmartBrush extends React.Component {
  constructor(props) {
    super(props);

    // TODO: move this to tool implementation
    this.modeType = {
      FILL: 0,
      ERASE: 1
    }
    this.mode = this.modeType.FILL

    this.onChangeRadiusSlider = this.onChangeRadiusSlider.bind(this)
    this.onChangeSensetivitySlider = this.onChangeSensetivitySlider.bind(this)
    this.onModeChange = this.onModeChange.bind(this)
  }
  onChangeRadiusSlider() {

  }
  onChangeSensetivitySlider() {

  }
  onModeChange() {
    if(this.mode === this.modeType.FILL) {
      this.mode = this.modeType.ERASE
    } else {
      this.mode = this.modeType.FILL
    }
    // TODO: forceUpdate is bad, refactor with proper state update
    this.forceUpdate()
  }
  //TODO: move tool parameters to implementation and remove hardcoded numbers
  render() {
    const btnName = ((this.mode === this.modeType.FILL) ? "Erase" : "Fill")
    const jsx = 
    <div className="card">
      <div className="card-header">
        Smart Brush
      </div >
      <div className="card-body">
        <div className="card-text" style={{ paddingTop: 10, paddingBottom: 15}}> 
          Radius
          <Nouislider onSlide={this.onChangeRadiusSlider} ref={"radiusSlider"}
            range={{min: 10, max: 50}} start={[30]} step={1} tooltips={true} /> 
        </div>
        <div className="card-text" style={{ paddingTop: 15, paddingBottom: 10}}> 
          Sensetivity
          <Nouislider onSlide={this.onChangeSensetivitySlider} ref={"sensetivitySlider"}
            range={{min: 0.0, max: 1.0}} start={[0.5]} step={0.01} tooltips={true} />
        </div>
        <button type="button" className="btn btn-secondary active" style={{ width: 100 }} onClick={this.onModeChange} >
          {btnName}
        </button>
      </div>
    </div>
    return jsx
  }
}

export default connect(store => store)(UiSmartBrush);
