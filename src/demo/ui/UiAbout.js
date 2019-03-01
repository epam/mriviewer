/**
 * @fileOverview UiAbout
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************


import React from 'react';
import packageJson from '../../../package.json';

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

    const strVer = packageJson.version;
    const strName = packageJson.name;
    const strDescription = packageJson.description;
    const strAuthor = packageJson.author;
    
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
                {strName}
              </h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body text-center">
              <img src="images/app_icon.svg" alt="app_icon" height="400px" />
              <p>
                {strDescription}
              </p>
              <p>
                <b>Version: </b> {strVer}
              </p>
              <p>
                <b>Made by: </b> {strAuthor}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
    return strAbout;
  }
}

