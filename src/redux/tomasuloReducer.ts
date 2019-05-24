import {
  AddSubStation,
  ArithmeticStation,
  FunctionType,
  FunctionUnit,
  FunctionUnitType,
  JumpStation,
  LoadBuffer,
  MulDivStation,
  ReservationStation,
} from '../type/ReservationStation';
import { ActionType, TomasuloAction } from './action';
import { Add, Div, Instruction, Jump, Ld, Mul, Operation, Sub } from '../type/Instruction';
import { Register } from '../type/Register';

import produce from 'immer';
import { parseInstructions } from '../utils/InstructionParser';

interface IReservationStationStatus {
  addSubStation: AddSubStation[];
  mulDivStation: MulDivStation[];
  loadBuffer: LoadBuffer[];
  addSubUnit: FunctionUnit[];
  mulDivUnit: FunctionUnit[];
  loadUnit: FunctionUnit[];
  jumpStation: JumpStation;
}

export type ReservationStationStatus = IReservationStationStatus;

interface ITomasuloStatus {
  clock: number;
  pc: number;
  stall: boolean;
  instructions: Instruction[];
  registers: Register[];
  station: ReservationStationStatus;
}

export type TomasuloStatus = ITomasuloStatus;

// initialize empty reservation stations
const initialStationStatus: ReservationStationStatus = {
  addSubStation: [],
  mulDivStation: [],
  loadBuffer: [],
  addSubUnit: [],
  mulDivUnit: [],
  loadUnit: [],
  jumpStation: new JumpStation(),
};

// FIXME: hardcoded numbers of stations
for (let i = 0; i < 6; ++i) {
  const s = new AddSubStation();
  s.num = i + 1;
  s.type = FunctionType.ADDSUB;
  initialStationStatus.addSubStation.push(s);
}

for (let i = 0; i < 3; ++i) {
  const s = new MulDivStation();
  s.type = FunctionType.MULDIV;
  s.num = i + 1;
  initialStationStatus.mulDivStation.push(s);

  const l = new LoadBuffer();
  l.type = FunctionType.LOAD;
  l.num = i + 1;
  initialStationStatus.loadBuffer.push(l);

  const a = new FunctionUnit();
  a.type = FunctionUnitType.ADD;
  a.num = i + 1;
  initialStationStatus.addSubUnit.push(a);
}

for (let i = 0; i < 2; ++i) {
  const s = new FunctionUnit();
  s.type = FunctionUnitType.MULT;
  s.num = i + 1;
  initialStationStatus.mulDivUnit.push(s);

  const l = new FunctionUnit();
  l.type = FunctionUnitType.LOAD;
  l.num = i + 1;
  initialStationStatus.loadUnit.push(l);
}

const initialState: TomasuloStatus = {
  clock: 0,
  pc: 0,
  stall: false,
  instructions: [],
  registers: [],
  station: initialStationStatus,
};

for (let i = 0; i < 31; ++i) {
  initialState.registers.push(new Register(i));
}

function broadcast(result: number, rs: ReservationStation, dstReg: number, state: TomasuloStatus) {
  // write to registers if needed
  for (const s of state.registers) {
    if (s.source && s.source.getName() === rs.getName()) {
      s.source = undefined;
      s.content = result;
    }
  }
  // write to reservation stations
  for (const s of state.station.addSubStation) {
    if (s.Vj && s.Vj.getName() === rs.getName()) {
      s.Vj = undefined;
      s.Qj = result;
    }
    if (s.Vk && s.Vk.getName() === rs.getName()) {
      s.Vk = undefined;
      s.Qk = result;
    }
  }
  for (const s of state.station.mulDivStation) {
    if (s.Vj && s.Vj.getName() === rs.getName()) {
      s.Vj = undefined;
      s.Qj = result;
    }
    if (s.Vk && s.Vk.getName() === rs.getName()) {
      s.Vk = undefined;
      s.Qk = result;
    }
  }
  const j = state.station.jumpStation;
  if (j.Qj && j.Qj.getName() === rs.getName()) {
    j.Qj = undefined;
    j.Vj = result;
  }
}

// the main reducer
export default function tomasuloReducer(
  state: TomasuloStatus = initialState,
  action: TomasuloAction,
): TomasuloStatus {
  switch (action.type) {
    case ActionType.RESET:
      // reset to initial state with imported instructions
      return produce(state, draft => {
        const newState = {
          ...initialState,
          instructions: [] as Instruction[],
        };
        for (const i of state.instructions) {
          // make a new copy
          const j = Object.assign(Object.create(Object.getPrototypeOf(i)), i) as Instruction;
          j.issueTime = 0;
          j.executionTime = 0;
          j.writeTime = 0;
          newState.instructions.push(j);
        }
        return newState;
      });

    case ActionType.IMPORT_INSTRUCTIONS:
      // import new instructions
      return produce(state, draft => {
        return {
          ...initialState,
          instructions: parseInstructions(action.instructions),
        };
      });

    case ActionType.CLOCK_FORWARD:
      return produce(state, draft => {
        draft.clock += 1;
      });

    case ActionType.INSTRUCTION_ISSUE:
      // issue an instruction (when reservation station is free)
      return produce(state, draft => {
        const ins = draft.instructions[action.instructionNumber];

        if (ins.issueTime === 0) {
          ins.issueTime = draft.clock;
          ins.executionTime = 0;
          ins.writeTime = 0;
        }

        if (ins instanceof Add || ins instanceof Sub || ins instanceof Mul || ins instanceof Div) {
          // fill in the ops field, Q can be undefined if no need to wait
          let rs: ArithmeticStation;
          if (ins instanceof Add || ins instanceof Sub) {
            rs = draft.station.addSubStation[action.stationNumber];
          } else {
            rs = draft.station.mulDivStation[action.stationNumber];
          }
          // station status
          rs.busy = true;
          rs.issueTime = draft.clock;
          rs.op = ins.operation;
          rs.instructionNumber = action.instructionNumber;
          // mark the source operands (some may be undefined if not applicable)
          rs.Vj = draft.registers[ins.srcReg1].source;
          rs.Qj = draft.registers[ins.srcReg1].content;
          rs.Vk = draft.registers[ins.srcReg2].source;
          rs.Qk = draft.registers[ins.srcReg2].content;
          // mark the register to be written
          draft.registers[ins.dstReg].source = rs;
          // move forward
          if (draft.pc < draft.instructions.length - 1) {
            draft.pc += 1;
          } else {
            draft.stall = true;
          }
        } else if (ins instanceof Ld) {
          const rs = draft.station.loadBuffer[action.stationNumber];
          // station status
          rs.busy = true;
          rs.issueTime = draft.clock;
          rs.op = ins.operation;
          rs.instructionNumber = action.instructionNumber;
          // source operands
          rs.imm = ins.srcIm;
          // register to write
          draft.registers[ins.dstReg].source = rs;
          // move forward
          if (draft.pc < draft.instructions.length - 1) {
            draft.pc += 1;
          } else {
            draft.stall = true;
          }
        } else if (ins instanceof Jump) {
          const rs = draft.station.jumpStation;
          // station status
          rs.busy = true;
          rs.issueTime = draft.clock;
          rs.op = Operation.JUMP;
          rs.instructionNumber = action.instructionNumber;
          // source operands
          rs.Qj = draft.registers[ins.compareSrcReg].source;
          rs.Vj = draft.registers[ins.compareSrcReg].content;
          rs.target = ins.compareDstIm;
          rs.offset = ins.offset;
          // no register to write
          // block further instruction fetching
          draft.stall = true;
        }
      });

    case ActionType.INSTRUCTION_EXECUTE_BEGIN:
      // begin execution of an instruction (at first execution cycle)
      return produce(state, draft => {
        const ins = draft.instructions[action.instructionNumber];
        if (ins.executionTime === 0) {
          ins.executionTime = draft.clock;
        }

        if (ins instanceof Add || ins instanceof Sub) {
          // occupy given function unit
          draft.station.addSubUnit[action.funcUnitNumber].busy = true;
          draft.station.addSubStation[action.stationNumber].unit =
            draft.station.addSubUnit[action.funcUnitNumber];
          draft.station.addSubStation[action.stationNumber].executionTime = draft.clock;
        } else if (ins instanceof Mul || ins instanceof Div) {
          // occupy given function unit
          draft.station.mulDivUnit[action.funcUnitNumber].busy = true;
          draft.station.mulDivStation[action.stationNumber].unit =
            draft.station.mulDivUnit[action.funcUnitNumber];
          draft.station.mulDivStation[action.stationNumber].executionTime = draft.clock;
        } else if (ins instanceof Ld) {
          // occupy given function unit
          draft.station.loadUnit[action.funcUnitNumber].busy = true;
          draft.station.loadBuffer[action.stationNumber].unit =
            draft.station.loadUnit[action.funcUnitNumber];
          draft.station.loadBuffer[action.stationNumber].executionTime = draft.clock;
        } else if (ins instanceof Jump) {
          // change pc
          const s = draft.station.jumpStation;
          if (s.Vj === s.target) {
            draft.pc += s.offset;
            draft.stall = false;
          } else {
            if (draft.pc < draft.instructions.length - 1) {
              draft.pc += 1;
              draft.stall = false;
            } else {
              draft.stall = true;
            }
          }
          // clear station
          s.busy = false;
          s.target = undefined;
          s.Qj = undefined;
          s.offset = undefined;
          s.instructionNumber = undefined;
          s.executionTime = 0;
          // prevent negative numbers
          if (ins.writeTime === 0) {
            ins.writeTime = draft.clock;
          }
        }
      });

    case ActionType.INSTRUCTION_EXECUTE_FINISH:
      // end execution of an instruction (at last execution cycle)
      return produce(state, draft => {
        const ins = draft.instructions[action.instructionNumber];

        if (ins instanceof Add || ins instanceof Sub) {
          // release given function unit
          draft.station.addSubUnit[action.funcUnitNumber].busy = false;
          draft.station.addSubStation[action.stationNumber].unit = undefined;
        } else if (ins instanceof Mul || ins instanceof Div) {
          // release given function unit
          draft.station.mulDivUnit[action.funcUnitNumber].busy = false;
          draft.station.mulDivStation[action.stationNumber].unit = undefined;
        } else if (ins instanceof Ld) {
          // release given function unit
          draft.station.loadUnit[action.funcUnitNumber].busy = false;
          draft.station.loadBuffer[action.stationNumber].unit = undefined;
        } else if (ins instanceof Jump) {
          throw Error('Jump instruction has no finish stage!');
        }
      });

    case ActionType.INSTRUCTION_WRITE:
      // write back the result of an instruction (when no WAR hazards)

      return produce(state, draft => {
        const ins = draft.instructions[action.instructionNumber];
        if (ins.writeTime === 0) {
          ins.writeTime = draft.clock;
        }

        if (ins instanceof Add || ins instanceof Sub || ins instanceof Mul || ins instanceof Div) {
          let rs: ArithmeticStation;
          let result = 0;

          if (ins instanceof Add || ins instanceof Sub) {
            rs = draft.station.addSubStation[action.stationNumber];
            result =
              ins instanceof Add ? (rs.Qj + rs.Qk) & 0xfffffffff : (rs.Qj - rs.Qk) & 0xfffffffff;
          } else {
            rs = draft.station.mulDivStation[action.stationNumber];
            // black magic to mimic integer division of C
            result = ins instanceof Mul ? (rs.Qj * rs.Qk) & 0xffffffff : ~~(rs.Qj / rs.Qk);
          }

          // clear the state of reservation station
          rs.busy = false;
          rs.op = undefined;
          rs.Qj = undefined;
          rs.Qk = undefined;
          rs.instructionNumber = undefined;
          rs.executionTime = 0;
          // do CDB broadcast
          broadcast(result, rs, ins.dstReg, draft);
        } else if (ins instanceof Ld) {
          const rs = draft.station.loadBuffer[action.stationNumber];
          rs.imm = undefined;
          rs.busy = false;
          rs.op = undefined;
          rs.instructionNumber = undefined;
          rs.executionTime = 0;
          broadcast(ins.srcIm, rs, ins.dstReg, draft);
        } else if (ins instanceof Jump) {
          throw Error('Jump instruction has no writeback stage!');
        }
      });

    default:
      return state;
  }
}
