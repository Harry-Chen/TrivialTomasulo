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
LD,F1,0x3
LD,F2,0x0
LD,F3,0xFFFFFFFF
ADD,F2,F1,F2
ADD,F1,F1,F3
JUMP,0x0,F1,0xFFFFFFFE
`;

store.dispatch(importInstructions(TEST1));
