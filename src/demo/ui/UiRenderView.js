/**
 * @fileOverview UiRenderView
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';

import Graphics2d from '../engine/Graphics2d';
import Graphics3d from '../engine/Graphics3d';

// ********************************************************
// Const
// ********************************************************

const W_RENDER = 800;
const H_RENDER = 600;


// ********************************************************
// Class
// ********************************************************

/**
 * Class UiRenderView some text later...
 */
export default class UiRenderView extends React.Component {
  /**
   * Main component render func callback
   */
  render() {
    const modeViewIndex = this.props.modeView;
    const vol = this.props.volume;
    const tex3d = this.props.texture3d;
    const sliderVal = this.props.sliderValue;
    const mode2d = this.props.mode2d;

    const mode3d = this.props.mode3d;
    const slider3dr = this.props.slider3dr;
    const slider3dg = this.props.slider3dg;
    const slider3db = this.props.slider3db;

    const jsxRenderMpr = <p>MPR is not implemenmted yet</p>;
    const jsxRender2d = <Graphics2d volume={vol} texture3d={tex3d}
      wScreen={W_RENDER} hScreen={H_RENDER} mode2d={mode2d} sliderValue={sliderVal} />;
    const jsxRender3dLight = <Graphics3d volume={vol} texture3d={tex3d}
      wScreen={W_RENDER} hScreen={H_RENDER}
      mode3d={mode3d} slider3dr={slider3dr} slider3dg={slider3dg} slider3db={slider3db} />;
    const jsxRender3d = <p>3d is not implemenmted yet</p>;
    const jsxArr = [jsxRenderMpr, jsxRender2d, jsxRender3dLight, jsxRender3d];
    const jsxRet = jsxArr[modeViewIndex];
    return jsxRet;
  }
}

 