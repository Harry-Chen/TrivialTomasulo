import { AnyAction } from 'redux';
import { TomasuloStatus } from './tomasuloReducer';
import { Add, Div, Instruction, Jump, Ld, Mul, Sub } from '../type/Instruction';
import { checkAllStations, checkEnd, StationOperation } from '../utils/StatusChecker';

export enum ActionType {
  RESET = 'reset',
  IMPORT_INSTRUCTIONS = 'import_instruction',
  CLOCK_FORWARD = 'clock_forward',
  INSTRUCTION_ISSUE = 'instruction_issue',
  INSTRUCTION_EXECUTE_BEGIN = 'instruction_execute_begin',
  INSTRUCTION_EXECUTE_FINISH = 'instruction_execute_finish',
  INSTRUCTION_WRITE = 'instruction_write',
  TOGGLE_IMPORT_DIALOG = 'toggle_import_dialog',
  TOGGLE_STEP_DIALOG = 'toggle_step_dialog',
  TOGGLE_INFO_DIALOG = 'toggle_info_dialog',
}

interface ITomasuloAction extends AnyAction {
  dialogOpen?: boolean;
  instructions?: Instruction[];
  instructionNumber?: number;
  stationNumber?: number;
  funcUnitNumber?: number;
}

export type TomasuloAction = ITomasuloAction;

export function toggleImportDialog(dialogOpen: boolean): TomasuloAction {
  return {
    dialogOpen,
    type: ActionType.TOGGLE_IMPORT_DIALOG,
  };
}

export function toggleStepDialog(dialogOpen: boolean): TomasuloAction {
  return {
    dialogOpen,
    type: ActionType.TOGGLE_STEP_DIALOG,
  };
}

export function toggleInfoDialog(dialogOpen: boolean): TomasuloAction {
  return {
    dialogOpen,
    type: ActionType.TOGGLE_INFO_DIALOG,
  };
}

export function reset(): TomasuloAction {
  return {
    type: ActionType.RESET,
  };
}

export function runToEnd() {
  return (dispatch, getState: () => TomasuloStatus) => {
    let count = 0;
    while (!checkEnd(getState()) && count < 500) {
      // force it to stop after 500 steps, avoid infinity loop
      dispatch(nextStep());
      ++count;
    }
  };
}

export function importInstructions(instructions: Instruction[]): TomasuloAction {
  return {
    instructions,
    type: ActionType.IMPORT_INSTRUCTIONS,
  };
}

export function nextStep() {
  return (dispatch, getState: () => TomasuloStatus) => {
    // refuse to run any further steps if execution has ended
    if (checkEnd(getState())) return;

    dispatch(clockForward());

    // wait for jump station or no more instructions
    const tryIssue = !(getState().stall || getState().fetchEnd);

    // begin execution (first cycle)
    checkAllStations(getState, dispatch, StationOperation.BEGIN_EXECUTION);
    // end execution (last cycle)
    checkAllStations(getState, dispatch, StationOperation.FINISH_EXECUTION);
    // write back results
    checkAllStations(getState, dispatch, StationOperation.WRITE_BACK);

    // see if we can issue current instruction, by using old state before checking jumping station
    // which is equivalent to insert a delay after a jump calculation
    if (tryIssue) {
      const nextIns = getState().instructions[getState().pc];
      if (
        nextIns instanceof Add ||
        nextIns instanceof Sub ||
        nextIns instanceof Mul ||
        nextIns instanceof Div
      ) {
        const stations =
          nextIns instanceof Add || nextIns instanceof Sub
            ? getState().station.addSubStation
            : getState().station.mulDivStation;
        const freeStations = stations.filter(s => !s.busy);
        if (freeStations.length > 0) {
          dispatch(issueInstruction(getState().pc, freeStations[0].num - 1));
        }
      } else if (nextIns instanceof Ld) {
        const freeStations = getState().station.loadBuffer.filter(s => !s.busy);
        if (freeStations.length > 0) {
          dispatch(issueInstruction(getState().pc, freeStations[0].num - 1));
        }
      } else if (nextIns instanceof Jump) {
        if (!getState().station.jumpStation.busy) {
          dispatch(issueInstruction(getState().pc, 0));
        }
      }
    }
  };
}

function clockForward(): TomasuloAction {
  return {
    type: ActionType.CLOCK_FORWARD,
  };
}

function issueInstruction(instructionNumber: number, stationNumber: number): TomasuloAction {
  return {
    instructionNumber,
    stationNumber,
    type: ActionType.INSTRUCTION_ISSUE,
  };
}

export function beginExecuteInstruction(
  instructionNumber: number,
  stationNumber: number,
  funcUnitNumber: number,
): TomasuloAction {
  return {
    instructionNumber,
    stationNumber,
    funcUnitNumber,
    type: ActionType.INSTRUCTION_EXECUTE_BEGIN,
  };
}

export function finishExecuteInstruction(
  instructionNumber: number,
  stationNumber: number,
  funcUnitNumber: number,
): TomasuloAction {
  return {
    instructionNumber,
    stationNumber,
    funcUnitNumber,
    type: ActionType.INSTRUCTION_EXECUTE_FINISH,
  };
}

export function writeInstructionResult(
  instructionNumber: number,
  stationNumber: number,
): TomasuloAction {
  return {
    instructionNumber,
    stationNumber,
    type: ActionType.INSTRUCTION_WRITE,
  };
}
