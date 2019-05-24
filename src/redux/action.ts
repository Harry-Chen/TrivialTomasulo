import { AnyAction } from 'redux';

export enum ActionType {
  IMPORT,
  RESET,
  CLOCK_FORWARD,
  CLOCK_BACKWARD,
  INSTRUCTION_ISSUE,
  INSTRUCTION_EXECUTE,
  INSTRUCTION_WRITE,
}

interface ITomasuloAction extends AnyAction {
  instructionNumber ?: number;
  stationNumber ?: number;
  funcUnitNumber ?: number;
}

export type TomasuloAction = ITomasuloAction;
