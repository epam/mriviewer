import React from 'react';

import ModeView from '../store/ModeView';
import StoreActionType from '../store/ActionTypes';
import connect from "react-redux/lib/connect/connect";

class UiViewMode extends React.Component {
  constructor(props) {
    super(props);
    // main view configuration
    // setup true, where you want to see mode renderer
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
  render() {
    const store = this.props;
    let viewMode = store.modeView;
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

    const jsx3d =
      <button onClick={this.onMode3d} >
        3D
      </button>
      
    const jsxViewTool = <div>
      <button onClick={this.onView3d} >
          View
      </button>
      <button onClick={this.onTool3d} >
          Tool
      </button>
    </div>

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
    return <div>
      <button onClick={this.onMode2d}>
        2D
      </button>
      <button onClick={this.onMode3dLight}>
        3D
        <span className="fa fa-bolt"></span>
      </button>
      {(needShow3d) ? jsx3d : ''}
      {(viewMode === ModeView.VIEW_3D_LIGHT && test) ? jsxViewTool : ''}
    </div>;
  }
}

export default connect(store => store)(UiViewMode);
