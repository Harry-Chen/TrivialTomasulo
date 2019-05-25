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
LD,F1,0xC
LD,F2,0xFFFF3C6F
LD,F3,0xFFFFFFFA
LD,F4,0x0
ADD,F2,F4,F2
DIV,F4,F2,F3
MUL,F4,F3,F3
LD,F5,0xFFFFFF32
LD,F18,0x1
SUB,F5,F4,F2
SUB,F1,F1,F18
JNE,0x0,F1,0xFFFFFFF9
`;

store.dispatch(importInstructions(TEST1));
