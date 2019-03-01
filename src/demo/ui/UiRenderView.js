/**
 * @fileOverview UiRenderView
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

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
class UiRenderView extends React.Component {
  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const modeViewIndex = store.modeView;

    const jsxRenderMpr = <p>MPR is not implemenmted yet</p>;
    const jsxRender2d = <Graphics2d 
      wScreen={W_RENDER} hScreen={H_RENDER} />;
    const jsxRender3dLight = <Graphics3d 
      wScreen={W_RENDER} hScreen={H_RENDER} />;
    const jsxRender3d = <p>3d is not implemenmted yet</p>;
    const jsxArr = [jsxRenderMpr, jsxRender2d, jsxRender3dLight, jsxRender3d];
    const jsxRet = jsxArr[modeViewIndex];
    return jsxRet;
  }
}

export default connect(store => store)(UiRenderView);
