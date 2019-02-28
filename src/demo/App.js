/**
 * @fileOverview Main App component
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import UiApp from './ui/UiApp';
import Texture3D from './engine/Texture3D';

import './App.css';



// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class App implements all application functionality. This is root class.
 */
export default class App extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onNewFile = this.onNewFile.bind(this);
    this.state = {
      isLoaded: false,
      fileName: 'brain.ktx',
      volume: null,
      texture3d: null,
    };
  }
  onNewFile(fileNameIn, volIn) {
    this.setState({ fileName: fileNameIn });
    this.setState({ volume: volIn });
    this.setState({ isLoaded: true });
    const tex3d = new Texture3D();
    tex3d.createFromRawVolume(volIn);
    this.setState({ texture3d: tex3d });
  }
  /**
   * Main component render func callback
   */
  render() {
    const jsxRender = <UiApp isLoaded={this.state.isLoaded}
      fileName={this.state.fileName} onNewFile={this.onNewFile}
      volume={this.state.volume} texture3d={this.state.texture3d} />;
    return jsxRender;
  } // end render
} // end class
