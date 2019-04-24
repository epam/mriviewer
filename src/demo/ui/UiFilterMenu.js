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
  }
  onButtonLungsSeg() {
    //evt.preventDefault();
    const store = this.props;
    const lungsFiller = new LungsFillTool(store.volume);
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

