import React from 'react';
import { connect } from 'react-redux';

import UiApp from './ui/UiApp';

import './App.css';

class App extends React.Component {
  render() {
    return <UiApp />
  }
}

export default connect(store => store)(App);
