import { TomasuloStatus } from '../redux/tomasuloReducer';
import { Dispatch } from 'redux';
import { ReactNode } from 'react';

interface IDispatchableComponentProps {
  dispatch?: Dispatch<any>;
}

interface IAppProps extends IDispatchableComponentProps {
  state: TomasuloStatus;
  import: (s: string) => any;
  step: (s: string) => any;
  cancelImport: () => any;
  cancelStep: () => any;
}

export type AppProps = IAppProps;

interface IMyAppBarProps extends IDispatchableComponentProps {
  clock: number;
  stall: boolean;
  finished: boolean;
  step: () => any;
  multipleStep: () => any;
  run: () => any;
  stop: () => any;
  toEnd: () => any;
  reset: () => any;
  import: () => any;
}

export type MyAppBarProps = IMyAppBarProps;

type AnyFunc = (...args: any[]) => any;

export interface ICommonDialogProps {
  open: boolean;
  title: ReactNode;
  content: ReactNode;
  firstButton: ReactNode;
  firstButtonOnClick: AnyFunc;
  secondButton?: ReactNode;
  secondButtonOnClick?: AnyFunc;
  thirdButton?: ReactNode;
  thirdButtonOnClick?: AnyFunc;
}

export type CommonDialogProps = ICommonDialogProps;
