/**
 * @fileOverview UiFilterMenu
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';
import { NavDropdown } from 'react-bootstrap';
import LungsFillTool from '../engine/actvolume/lungsfill/lft';
// import ModeView from '../store/ModeView';


// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiFilterMenu some text later...
 */
class UiFilterMenu extends React.Component {
  // invoked after render
  constructor(props) {
    super(props);
    this.onButtonLungsSeg = this.onButtonLungsSeg.bind(this);
    //this.callbackProgressFun = this.callbackProgressFun.bind(this);
  }
  /*
  callbackProgressFun(ratio01) {
    // console.log(`callbackReadProgress = ${ratio01}`);
    const store = this.props;
    const uiapp = store.uiApp;
    const ratioPrc = Math.floor(ratio01 * 100);
    if (ratioPrc === 0) {
      uiapp.doShowProgressBar();
    }
    if (ratioPrc >= 99) {
      // console.log(`callbackReadProgress. hide on = ${ratio01}`);
      uiapp.doHideProgressBar();
    } else {
      uiapp.doSetProgressBarRatio(ratioPrc);
    }
  } // callback progress
  */
  onButtonLungsSeg() {
    //evt.preventDefault();
    const store = this.props;
    const lungsFiller = new LungsFillTool(store.volume);
    //const callbackProgress = this.callbackProgressFun;
    //lungsFiller.run(callbackProgress);
    lungsFiller.run();
    store.graphics2d.renderScene();
    //store.volumeRenderer.volumeUpdater.createUpdatableVolumeTex(store.volume, false, null);
  }
  componentDidMount() {
  }
  render() {
    const store = this.props;
    const isLoaded = store.isLoaded;

    const strDisabled = (isLoaded) ? false : true;
    const jsxFilterMenu =
      <NavDropdown id="save-nav-dropdown" 
        disabled={strDisabled}
        title={
          <div style={{ display: 'inline-block' }}> 
            <i className="fas fa-broom"></i>
            Filter
          </div>
        } >
        <NavDropdown.Item href="#actionLungsSeg" onClick={evt => this.onButtonLungsSeg(evt)}>
          <i className="fas fa-cloud"></i>
          Lungs segmentation
        </NavDropdown.Item>
      </NavDropdown>;

    /*
        <NavDropdown.Item>
          <i className="fas fa-brain"></i>
            Auto detect brain
        </NavDropdown.Item>
        <NavDropdown.Item>
          <i className="fas fa-arrows-alt"></i>
          Active volume enlarge (seed sphere)
        </NavDropdown.Item>
        <NavDropdown.Item>
          <i className="fas fa-circle"></i>
          Sphere evolve with clip
        </NavDropdown.Item>
        <NavDropdown.Item>
          <i className="fas fa-circle"></i>
          Sphere evolve no clipping
        </NavDropdown.Item>
        <NavDropdown.Item href="#actionLungsSeg" onClick={evt => this.onButtonLungsSeg(evt)}>
          <i className="fas fa-cloud"></i>
          Lungs segmentation
        </NavDropdown.Item>
        <NavDropdown.Item>
          <i className="fas fa-dungeon"></i>
          FCMeans segmentation
        </NavDropdown.Item>
    */
    return jsxFilterMenu;
  }
}
 
export default connect(store => store)(UiFilterMenu);

