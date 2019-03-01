/**
 * @fileOverview Main App component
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import UiApp from './ui/UiApp';

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
class App extends React.Component {
  /**
   * Main component render func callback
   */
  render() {
    const jsxRender = <UiApp />;
    return jsxRender;
  } // end render
} // end class

// export default App;
export default connect(store => store)(App);
