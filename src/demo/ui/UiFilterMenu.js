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
    const store = this.props.store;
    const isLoaded = store.isLoaded;
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

    return jsxFilterMenu;
  }
}
 
const mapStateToProps = function(storeIn) {
  const objProps = {
    store: storeIn
  };
  return objProps;
}

export default connect(mapStateToProps)(UiFilterMenu);

