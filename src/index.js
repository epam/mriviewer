// Imports bootstrap related
import 'bootstrap/dist/css/bootstrap.min.css';
// import $ from 'jquery';
// import Popper from 'popper.js';
// import 'bootstrap/dist/js/bootstrap.bundle.min';


// Imports
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';

// Imports from redux
import { Provider } from 'react-redux'

import { createStore } from 'redux';
import rootReducer from './demo/store/Store';

// Imports from app
import App from './demo/App';

const rootElement = document.getElementById('root');

// create global store
const store = createStore(rootReducer);

ReactDOM.render(<Provider store={store}>
  <App />
</Provider>,
rootElement);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
