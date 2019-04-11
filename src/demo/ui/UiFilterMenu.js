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
        <NavDropdown.Item>
          <i className="fas fa-cloud"></i>
          Lungs segmentation
        </NavDropdown.Item>
        <NavDropdown.Item>
          <i className="fas fa-dungeon"></i>
          FCMeans segmentation
        </NavDropdown.Item>

      </NavDropdown>;


    /*
    const strClass = (isLoaded) ? 'btn dropdown-toggle' : 'btn dropdown-toggle disabled';
    const jsxFilterMenu =
      <div className="dropdown">
        <button className={strClass} type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i className="fas fa-broom"></i>
          Filter
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">

          <button className="dropdown-item" type="button"  >
            <i className="fas fa-brain"></i>
            Auto detect brain
          </button>

          <button className="dropdown-item" type="button"  >
            <i className="fas fa-arrows-alt"></i>
            Active volume enlarge (seed sphere)
          </button>
          <button className="dropdown-item" type="button"  >
            <i className="fas fa-circle"></i>
            Sphere evolve with clip
          </button>
          <button className="dropdown-item" type="button"  >
            <i className="fas fa-circle"></i>
            Sphere evolve no clipping
          </button>
          <button className="dropdown-item" type="button"  >
            <i className="fas fa-cloud"></i>
            Lungs segmentation
          </button>
          <button className="dropdown-item" type="button"  >
            <i className="fas fa-dungeon"></i>
            FCMeans segmentation
          </button>

        </div>
      </div>
    */
    return jsxFilterMenu;
  }
}
 
export default connect(store => store)(UiFilterMenu);

