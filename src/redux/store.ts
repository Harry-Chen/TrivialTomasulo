import { applyMiddleware, createStore } from 'redux';
import logger from 'redux-logger';

import reducers from './tomasuloReducer';

const createStoreWithMiddleware = applyMiddleware(logger)(createStore);

export { createStoreWithMiddleware as createStore, reducers };
