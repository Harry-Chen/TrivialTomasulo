import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, reducer } from './redux/store';

import TrivialTomasulo from './components/TrivialTomasulo';
import { importInstructions } from './redux/action';
import { parseInstructions } from './utils/InstructionParser';

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

const SAMPLE = `
LD,F1,0x2
LD,F2,0x1
LD,F3,0xFFFFFFFF
SUB,F1,F1,F2
DIV,F4,F3,F1
JUMP,0x0,F1,0x2
JUMP,0xFFFFFFFF,F3,0xFFFFFFFD
MUL,F3,F1,F4
`;

store.dispatch(importInstructions(parseInstructions(SAMPLE)));
