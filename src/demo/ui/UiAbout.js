/**
 * @fileOverview UiAbout
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************


import React from 'react';

// ********************************************************
// Class
// ********************************************************



/**
 * Class UiAbout some text later...
 */
export default class UiAbout extends React.Component {
  //constructor(props) {
  //  super(props);
  //}
  render() {
    
    const strAbout = 
    <li className="nav-item">
      <button type="button" className="btn text-center" data-toggle="modal" data-target="#exampleModal">
        <i className="fa fa-question-circle"  ></i>
        About
      </button>
      <div className="modal fade" id="exampleModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                Title: some words about this app
              </h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body text-center">
              <img src="images/app_icon.svg" alt="app_icon" height="400px" />
              <p>
                Med3web is unique 2d/3d medical volume data web viewer application. You can inspect data both in 2d and 3d modes.
              </p>
              <p>
                <b>Version: </b> 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
    return strAbout;
  }
}

