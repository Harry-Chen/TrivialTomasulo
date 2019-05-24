import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, reducer } from './redux/store';

import TrivialTomasulo from './components/TrivialTomasulo';
import { importInstructions } from './redux/action';

const store = createStore(reducer);

const loadApp = () => {
  ReactDOM.render(
    <Provider store={store}>
        <TrivialTomasulo />
    </Provider>,
    document.querySelector('#main'),
  );
};

loadApp();

const TEST1 = `
LD,F1,0x1
LD,F2,0x2
JUMP,0x1,F1,0xFFFFFFFF
`;

store.dispatch(importInstructions(TEST1));
