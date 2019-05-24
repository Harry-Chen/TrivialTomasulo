import { AnyAction } from 'redux';
import { TomasuloStatus } from './tomasuloReducer';
import { AddSubStation, JumpStation, LoadBuffer, MulDivStation, ReservationStation } from '../type/ReservationStation';
import { Add, Div, Jump, Ld, Mul, Sub } from '../type/Instruction';

export enum ActionType {
  RESET = 'reset',
  IMPORT_INSTRUCTIONS = 'import_instruction',
  CLOCK_FORWARD = 'clock_forward',
  INSTRUCTION_ISSUE = 'instruction_issue',
  INSTRUCTION_EXECUTE_BEGIN = 'instruction_execute_begin',
  INSTRUCTION_EXECUTE_FINISH = 'instruction_execute_finish',
  INSTRUCTION_WRITE = 'instruction_write',
}

interface ITomasuloAction extends AnyAction {
  instructions ?: string;
  instructionNumber ?: number;
  stationNumber ?: number;
  funcUnitNumber ?: number;
}

export type TomasuloAction = ITomasuloAction;

export function reset(): TomasuloAction {
  return {
    type: ActionType.RESET,
  };
}

export function importInstructions(instructions: string): TomasuloAction {
  return {
    instructions,
    type: ActionType.IMPORT_INSTRUCTIONS,
  };
}

function checkStation(rs: ReservationStation, state: TomasuloStatus, dispatch) {
  if (!rs.busy) return;
  const ins = state.instructions[rs.instructionNumber];

  // the instruction is already executing
  if (rs.executionTime > 0) {
    const finishClock = rs.executionTime + ins.cost;
    if (finishClock - 1 === state.clock) {
      // the last clock, finish execution
      dispatch(finishExecuteInstruction(rs.instructionNumber, rs.num - 1, rs.unit.num - 1));
    } else if (finishClock === state.clock) {
      // execution finished, write back
      dispatch(writeInstructionResult(rs.instructionNumber, rs.num - 1));
    }
  } else {
    // see if can execution (after a write back)
    if (rs instanceof AddSubStation || rs instanceof MulDivStation) {
      if (rs.Vj !== undefined && rs.Vk !== undefined) {
        // ready to execute, try to find a free function unit
        const units = rs instanceof AddSubStation ?
          state.station.addSubUnit : state.station.mulDivUnit;
        const freeUnits = units.filter(u => !u.busy);
        if (freeUnits.length > 0) {
          dispatch(beginExecuteInstruction(rs.instructionNumber, rs.num - 1, freeUnits[0].num - 1));
        }
      }
    } else if (rs instanceof LoadBuffer) {
      const freeUnits = state.station.loadUnit.filter(u => !u.busy);
      if (freeUnits.length > 0) {
        dispatch(beginExecuteInstruction(rs.instructionNumber, rs.num - 1, freeUnits[0].num - 1));
      }
    } else if (rs instanceof JumpStation) {
      if (rs.Vj !== undefined) {
        dispatch(beginExecuteInstruction(rs.instructionNumber, rs.num - 1, 0));
      }
    }
  }
}

export function nextStep() {
  return (dispatch, getState: () => TomasuloStatus) => {
    dispatch(clockForward());

    // iterate over all reservation stations (which are prone to change)
    let len = getState().station.addSubStation.length;
    for (let i = 0; i < len; ++i) {
      checkStation(getState().station.addSubStation[i], getState(), dispatch);
    }

    len = getState().station.mulDivStation.length;
    for (let i = 0; i < len; ++i) {
      checkStation(getState().station.mulDivStation[i], getState(), dispatch);
    }

    len = getState().station.loadBuffer.length;
    for (let i = 0; i < len; ++i) {
      checkStation(getState().station.loadBuffer[i], getState(), dispatch);
    }

    checkStation(getState().station.jumpStation, getState(), dispatch);

    // see if we can issue current instruction
    if (!getState().stall) {
      const nextIns = getState().instructions[getState().pc];
      if (nextIns instanceof Add || nextIns instanceof Sub
        || nextIns instanceof Mul || nextIns instanceof Div) {
        const stations = (nextIns instanceof Add || nextIns instanceof Sub) ?
          getState().station.addSubStation : getState().station.mulDivStation;
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

function beginExecuteInstruction(instructionNumber: number, stationNumber: number,
                                        funcUnitNumber: number): TomasuloAction {
  return {
    instructionNumber,
    stationNumber,
    funcUnitNumber,
    type: ActionType.INSTRUCTION_EXECUTE_BEGIN,
  };
}

function finishExecuteInstruction(instructionNumber: number, stationNumber: number,
                                        funcUnitNumber: number): TomasuloAction {
  return {
    instructionNumber,
    stationNumber,
    funcUnitNumber,
    type: ActionType.INSTRUCTION_EXECUTE_FINISH,
  };
}

function writeInstructionResult(instructionNumber: number, stationNumber: number): TomasuloAction {
  return {
    instructionNumber,
    stationNumber,
    type: ActionType.INSTRUCTION_WRITE,
  };
}
