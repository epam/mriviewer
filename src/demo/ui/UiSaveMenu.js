/**
 * @fileOverview UiSaveMenu
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
 * Class UiSaveMenu some text later...
 */
export default class UiSaveMenu extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onSaveNifti = this.onSaveNifti.bind(this);
  }
  // invoked after render
  componentDidMount() {
  }
  onSaveNifti() {

  }
  render() {
    const isLoaded = this.props.isLoaded;
    const strClass = (isLoaded) ? 'btn dropdown-toggle' : 'btn dropdown-toggle disabled';

    const jsxSaveMenu =
      <div className="dropdown">
        <button className={strClass} type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i className="fas fa-save"></i>
          Save
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <button className="dropdown-item" type="button" onClick={evt => this.onSaveNifti(evt)} >
            <i className="fas fa-globe"></i>
            Save to Nifti
          </button>
        </div>
      </div>

    return jsxSaveMenu;
  }
}
