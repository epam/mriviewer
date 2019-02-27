/**
 * @fileOverview UiFilterMenu
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiFilterMenu some text later...
 */
export default class UiFilterMenu extends React.Component {
  //constructor(props) {
  //  super(props);
  //}
  // invoked after render
  componentDidMount() {
  }
  render() {
    const isLoaded = this.props.isLoaded;
    const strClass = (isLoaded) ? 'btn-sm dropdown-toggle' : 'btn-sm dropdown-toggle disabled';

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

    return jsxFilterMenu;
  }
}
 