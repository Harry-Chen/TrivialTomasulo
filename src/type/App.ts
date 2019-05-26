import { TomasuloStatus } from '../redux/tomasuloReducer';
import { Dispatch } from 'redux';

interface IDispatchableComponentProps {
  dispatch?: Dispatch<any>;
}

interface IAppProps extends IDispatchableComponentProps {
  state: TomasuloStatus;
  import: (s: string) => any;
}

export type AppProps = IAppProps;

interface IMyAppBarProps extends IDispatchableComponentProps {
  clock: number;
  stall: boolean;
  step: (step: number) => any;
  run: () => any;
  stop: () => any;
  toEnd: () => any;
  reset: () => any;
}

export type MyAppBarProps = IMyAppBarProps;
