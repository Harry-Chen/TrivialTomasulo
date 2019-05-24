import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import logger from 'redux-logger';

import reducer from './tomasuloReducer';

const createStoreWithMiddleware = applyMiddleware(thunk, logger)(createStore);

export { createStoreWithMiddleware as createStore, reducer };
