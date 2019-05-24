import { TomasuloStatus } from '../redux/tomasuloReducer';
import { Dispatch } from 'redux';

interface IDispatchableComponentProps {
  dispatch?: Dispatch<any>;
}

interface IAppProps extends IDispatchableComponentProps {
  state: TomasuloStatus;
  import: (s: string) => any;
  reset: () => any;
  nextStep: () => any;
}

export type AppProps = IAppProps;
