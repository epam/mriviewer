/**
 * @fileOverview UiMain
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';

import UiControls from './UiControls';
import UiRenderView from './UiRenderView';
import UiHistogram from './UiHistogram';


// ********************************************************
// Const
// ********************************************************

export const Modes2d = {
  NA: -1,
  SAGGITAL: 0,
  CORONAL: 1,
  TRANSVERSE: 2
};

export const Modes3d = {
  NA: -1,
  ISO: 0,
  RAYCAST: 1,
  RAYFAST: 2
};

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiMain some text later...
 */
export default class UiMain extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onMode2d = this.onMode2d.bind(this);
    this.onSliderSlice = this.onSliderSlice.bind(this);
    this.state = {
      mode2d: Modes2d.TRANSVERSE,
      slider2d: 0.5,
      mode3d: Modes3d.RAYCAST,
      slider3d_r: 0.1,
      slider3d_g: 0.3,
      slider3d_b: 0.8,
    };
  }
  onSliderSlice(val) {
    this.setState({ slider2d: val });
  }
  onMode2d(ind) {
    this.setState({ mode2d: ind });
  }
  onMode3d(ind) {
    this.setState({ mode3d: ind });
  }
  onSliderSlice3dr(val) {
    this.setState({ slider3d_r: val });
  }
  onSliderSlice3dg(val) {
    this.setState({ slider3d_g: val });
  }
  onSliderSlice3db(val) {
    this.setState({ slider3d_b: val });
  }
  /**
   * Main component render func callback
   */
  render() {
    const modeViewIndex = this.props.modeView;

    const sliceVal = this.state.slider2d;
    const mode2d = this.state.mode2d;
    const mode3d = this.state.mode3d;
    const slider3dr = this.state.slider3d_r;
    const slider3dg = this.state.slider3d_g;
    const slider3db = this.state.slider3d_b;

    const vol = this.props.volume;
    const tex3d = this.props.texture3d;
    const jsxRenderMain =
    <div className="row">
      <div className="col-md-4">
        <UiControls
          onSliderSlice={this.onSliderSlice.bind(this)} sliderValue={sliceVal}
          onMode2d={this.onMode2d.bind(this)} mode2d={mode2d} modeView={modeViewIndex}
          onMode3d={this.onMode3d.bind(this)} mode3d={mode3d}
          onSlider3dr={this.onSliderSlice3dr.bind(this)}
          onSlider3dg={this.onSliderSlice3dg.bind(this)}
          onSlider3db={this.onSliderSlice3db.bind(this)}
          slider3dr={slider3dr} slider3dg={slider3dg} slider3db={slider3db}
        />
        <UiHistogram modeView={modeViewIndex} volume={vol} />
      </div>

      <div className="col-md-8">
        <UiRenderView modeView={modeViewIndex} mode2d={mode2d} sliderValue={sliceVal}
          volume={vol} texture3d={tex3d}
          mode3d={mode3d} slider3dr={slider3dr} slider3dg={slider3dg} slider3db={slider3db}/>
      </div>
    </div>
    return jsxRenderMain;
  };
}

