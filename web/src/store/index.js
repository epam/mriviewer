import { createStore } from 'redux';
import rootReducer from './Store';

export const store = createStore(rootReducer);
