import { TomasuloStatus } from '../redux/tomasuloReducer';
import {
  AddSubStation,
  JumpStation,
  LoadBuffer,
  MulDivStation,
  ReservationStation,
} from '../type/ReservationStation';
import {
  beginExecuteInstruction,
  finishExecuteInstruction,
  writeInstructionResult,
} from '../redux/action';

// check if all instruction are completed
export function checkEnd(state: TomasuloStatus): boolean {
  if (!state.fetchEnd) return false;

  if (state.station.addSubStation.filter(s => s.busy).length !== 0) return false;

  if (state.station.mulDivStation.filter(s => s.busy).length !== 0) return false;

  if (state.station.loadBuffer.filter(s => s.busy).length !== 0) return false;

  if (state.station.jumpStation.busy) return false;

  return true;
}

export enum StationOperation {
  BEGIN_EXECUTION,
  FINISH_EXECUTION,
  WRITE_BACK,
}

export function checkStation(
  rs: ReservationStation,
  state: TomasuloStatus,
  dispatch,
  operation: StationOperation,
): boolean {
  if (!rs.busy) return;
  const ins = state.instructions[rs.instructionNumber];
  const finishClock = rs.executionTime + rs.cost;

  switch (operation) {
    case StationOperation.BEGIN_EXECUTION:
      if (rs.executionTime === 0) {
        if (rs instanceof AddSubStation || rs instanceof MulDivStation) {
          if (rs.Qj === undefined && rs.Qk === undefined) {
            // ready to execute, try to find a free function unit
            const units =
              rs instanceof AddSubStation ? state.station.addSubUnit : state.station.mulDivUnit;
            const freeUnits = units.filter(u => !u.busy);
            if (freeUnits.length > 0) {
              dispatch(
                beginExecuteInstruction(rs.instructionNumber, rs.num - 1, freeUnits[0].num - 1),
              );
            }
          }
        } else if (rs instanceof LoadBuffer) {
          if (rs.source === undefined) {
            const freeUnits = state.station.loadUnit.filter(u => !u.busy);
            if (freeUnits.length > 0) {
              dispatch(
                beginExecuteInstruction(rs.instructionNumber, rs.num - 1, freeUnits[0].num - 1),
              );
            }
          }
        } else if (rs instanceof JumpStation) {
          if (rs.Qj === undefined) {
            dispatch(beginExecuteInstruction(rs.instructionNumber, rs.num - 1, 0));
          }
        }
      }
      break;
    case StationOperation.FINISH_EXECUTION:
      if (rs.executionFinished(state.clock)) {
        // the last clock, finish execution
        dispatch(
          finishExecuteInstruction(rs.instructionNumber, rs.num - 1, rs.unit ? rs.unit.num - 1 : 0),
        );
      }
      break;
    case StationOperation.WRITE_BACK:
      if (rs.writeFinished(state.clock)) {
        // execution finished, write back
        dispatch(writeInstructionResult(rs.instructionNumber, rs.num - 1));
      }
      break;
  }
}

export function checkAllStations(getState: () => TomasuloStatus, dispatch, op: StationOperation) {
  // iterate over all reservation stations in issue time order
  // add-sub station
  let stationMap = {};
  for (const s of getState().station.addSubStation) {
    stationMap[s.issueTime] = s;
  }
  Object.keys(stationMap)
    .sort()
    .forEach(key => {
      checkStation(stationMap[key], getState(), dispatch, op);
    });

  // mul-div station
  stationMap = {};
  for (const s of getState().station.mulDivStation) {
    stationMap[s.issueTime] = s;
  }
  Object.keys(stationMap)
    .sort()
    .forEach(key => {
      checkStation(stationMap[key], getState(), dispatch, op);
    });

  // load buffer
  stationMap = {};
  for (const s of getState().station.loadBuffer) {
    stationMap[s.issueTime] = s;
  }
  Object.keys(stationMap)
    .sort()
    .forEach(key => {
      checkStation(stationMap[key], getState(), dispatch, op);
    });

  // jump station
  checkStation(getState().station.jumpStation, getState(), dispatch, op);
}
