/**
 * @fileOverview UiViewMode
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************


import React from 'react';
import { connect } from 'react-redux';
import { ButtonToolbar, Button, ButtonGroup } from 'react-bootstrap';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

import ModeView from '../store/ModeView';
import StoreActionType from '../store/ActionTypes';

// ********************************************************
// Class
// ********************************************************



/**
 * Class UiViewMode some text later...
 */
class UiViewMode extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);

    // main view configuration
    // setup true, where you want to see mode renderer
    //
    this.m_needModeMpr = true;
    this.m_needMode2d = true;
    this.m_needMode3dLight = true;
    this.m_needMode3d = true;

    this.onModeMpr = this.onModeMpr.bind(this);
    this.onMode2d = this.onMode2d.bind(this);
    this.onMode3dLight = this.onMode3dLight.bind(this);
    this.onMode3d = this.onMode3d.bind(this);
    this.onTool3d = this.onTool3d.bind(this);
    this.onView3d = this.onView3d.bind(this);
  }
  onMode(indexMode) {
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_MODE_VIEW, modeView: indexMode });
  }
  onTool_View(isOn) {
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_IS_TOOL3D, isTool3D: isOn });
    store.dispatch({ type: StoreActionType.SET_SLIDER_Contrast3D, sliderContrast3D: 0 });    
  }
  onModeMpr() {
    this.onMode(ModeView.VIEW_MPR);
  }
  onMode2d() {
    this.onMode(ModeView.VIEW_2D);
  }
  onMode3dLight() {
    this.onMode(ModeView.VIEW_3D_LIGHT);
  }
  onMode3d() {
    this.onMode(ModeView.VIEW_3D);
  }
  onTool3d() {
    this.onTool_View(true);
  }
  onView3d() {
    this.onTool_View(false);
  }
  logObject(strTitle, obj) {
    let str = '';
    for (let prp in obj) {
      if (str.length > 0) {
        str += '\n';
      }
      str += prp + ' = ' + obj[prp];
    }
    console.log(`${strTitle}\n${str}`);
  }
  render() {
    const store = this.props;
    // this.logObject('UiViewMode this props: ', store);
    let viewMode = store.modeView;
    let isTool3D = store.isTool3D;
    if ((viewMode === ModeView.VIEW_MPR) && (!this.m_needModeMpr)) {
      viewMode = ModeView.VIEW_2D;
    }
    if ((viewMode === ModeView.VIEW_3D_LIGHT) && (!this.m_needMode3dLight)) {
      viewMode = ModeView.VIEW_2D;
    }
    if ((viewMode === ModeView.VIEW_3D) && (!this.m_needMode3d)) {
      viewMode = ModeView.VIEW_2D;
    }
    if ((viewMode === ModeView.VIEW_2D) && (!this.m_needMode2d)) {
      viewMode = ModeView.VIEW_3D;
    }

    // const strMpr = (viewMode === ModeView.VIEW_MPR) ? 'primary' : 'secondary';
    const str2d = (viewMode === ModeView.VIEW_2D) ? 'primary' : 'secondary';
    const str3dLight = (viewMode === ModeView.VIEW_3D_LIGHT) ? 'primary' : 'secondary';
    const str3d = (viewMode === ModeView.VIEW_3D) ? 'primary' : 'secondary';

    const strTool3Don = (viewMode === ModeView.VIEW_3D_LIGHT && isTool3D === true) ? 'primary' : 'secondary';
    const strTool3Doff = (viewMode === ModeView.VIEW_3D_LIGHT && isTool3D === false) ? 'primary' : 'secondary';

    const jsx3d =
    <OverlayTrigger key="3d" placement="bottom" overlay={
      <Tooltip>
        Show volume in 3d mode with old rendering
      </Tooltip>
    }>
      <Button variant={str3d} onClick={this.onMode3d} >
        3D
      </Button>
    </OverlayTrigger>
      
    const jsxViewTool =
    <ButtonGroup className="mr-2" aria-label="Top group">
      <OverlayTrigger key="view" placement="bottom" overlay={
        <Tooltip>
          Show volume in 3d mode with fast rendering
        </Tooltip>
      }>
        <Button variant={strTool3Doff} onClick={this.onView3d} >
          View
        </Button>
      </OverlayTrigger>
      <OverlayTrigger key="tool" placement="bottom" overlay={
        <Tooltip>
          Show volume in 2d mode per slice on selected orientation
        </Tooltip>
      }>
        <Button variant={strTool3Don} onClick={this.onTool3d} >
          Tool
        </Button>
      </OverlayTrigger>
    </ButtonGroup>

    const FOUR = 4;
    let needShow3d = false;

    const volSet = store.volumeSet;
    if (volSet.getNumVolumes() > 0) {
      const volIndex = store.volumeIndex;
      const vol = volSet.getVolume(volIndex);
      if (vol !== null) {
        if (vol.m_bytesPerVoxel !== FOUR) {
          needShow3d = true;
        }
      }
    } // if more 0 volumes
    const test = true;
    const jsxOut = 
      <ButtonToolbar ria-label="Toolbar with button groups">
        <ButtonGroup className="mr-2" aria-label="Top group">
 
          <OverlayTrigger key="2d" placement="bottom" overlay={
            <Tooltip>
              Show volume in 2d mode per slice on selected orientation
            </Tooltip>
          }>

            <Button variant={str2d} onClick={this.onMode2d} >
              2D
            </Button>
          </OverlayTrigger>  

          <OverlayTrigger key="3dLight" placement="bottom" overlay={
            <Tooltip>
              Show volume in 3d mode with fast rendering
            </Tooltip>
          }>

            <Button variant={str3dLight} onClick={this.onMode3dLight} >
              3D
              <span className="fa fa-bolt"></span>
            </Button>

          </OverlayTrigger>  
          {(needShow3d) ? jsx3d : ''}
        </ButtonGroup>
        {(viewMode === ModeView.VIEW_3D_LIGHT && test) ? jsxViewTool : ''}
      </ButtonToolbar>

    return jsxOut;
  }
}

export default connect(store => store)(UiViewMode);
