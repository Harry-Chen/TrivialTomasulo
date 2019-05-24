import {
  AddSubStation,
  ArithmeticStation,
  FunctionType,
  FunctionUnit,
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
  initialStationStatus.mulDivUnit.push(s);
  const l = new LoadBuffer();
  l.type = FunctionType.LOAD;
  l.num = i + 1;
  initialStationStatus.loadBuffer.push(l);
  const a = new FunctionUnit();
  a.num = i + 1;
  initialStationStatus.addSubUnit.push(a);
}

for (let i = 0; i < 2; ++i) {
  const s = new FunctionUnit();
  s.num = i + 1;
  initialStationStatus.mulDivUnit.push(s);
  const l = new FunctionUnit();
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
  initialState.registers.push(new Register());
}

function broadcast(result: number, rs: ReservationStation, dstReg: number, state: TomasuloStatus) {
  // write to registers if needed
  for (const s of state.registers) {
    if (s.source && s.source.op === rs.op && s.source.num === rs.num) {
      s.source = undefined;
      s.content = result;
    }
  }
  // write to reservation stations
  for (const s of state.station.addSubStation) {
    if (s.Qj && s.Qj.op === rs.op && s.Qj.num === rs.num) {
      s.Qj = undefined;
      s.Vj = result;
    }
    if (s.Qk && s.Qk.op === rs.op && s.Qk.num === rs.num) {
      s.Qk = undefined;
      s.Vk = result;
    }
  }
  for (const s of state.station.mulDivStation) {
    if (s.Qj && s.Qj.op === rs.op && s.Qj.num === rs.num) {
      s.Qj = undefined;
      s.Vj = result;
    }
    if (s.Qk && s.Qk.op === rs.op && s.Qk.num === rs.num) {
      s.Qk = undefined;
      s.Vk = result;
    }
  }
  const j = state.station.jumpStation;
  if (j.Qj && j.Qj.op === rs.op && j.Qj.num === rs.num) {
    j.Qj = undefined;
    j.Vj = result;
  }
}

// the main reducer
export default function tomasuloReducer(state: TomasuloStatus = initialState,
                                        action: TomasuloAction): TomasuloStatus {
  switch (action.type) {
    case ActionType.RESET:
      // reset to initial state with imported instructions
      return produce(state, draft => {
        const newState = {
          ...initialState,
          instructions: state.instructions,
        };
        for (const i of newState.instructions) {
          i.issueTime = i.writeTime = i.executionTime = 0;
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
        ins.issueTime = draft.clock;

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
          rs.op = ins.operation;
          rs.instructionNumber = action.instructionNumber;
          // mark the source operands (some may be undefined if not applicable)
          rs.Qj = draft.registers[ins.srcReg1].source;
          rs.Vj = draft.registers[ins.srcReg1].content;
          rs.Qk = draft.registers[ins.srcReg2].source;
          rs.Vk = draft.registers[ins.srcReg2].content;
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
        ins.executionTime = draft.clock;

        if (ins instanceof Add || ins instanceof Sub) {
          // occupy given function unit
          draft.station.addSubUnit[action.funcUnitNumber].busy = true;
          draft.station.addSubStation[action.stationNumber].executionTime = draft.clock;
        } else if (ins instanceof Mul || ins instanceof Div) {
          // occupy given function unit
          draft.station.mulDivUnit[action.funcUnitNumber].busy = true;
          draft.station.mulDivStation[action.stationNumber].executionTime = draft.clock;
        } else if (ins instanceof Ld) {
          // occupy given function unit
          draft.station.loadUnit[action.funcUnitNumber].busy = true;
          draft.station.loadBuffer[action.stationNumber].executionTime = draft.clock;
        } else if (ins instanceof Jump) {
          // do nothing at all
        }
      });

    case ActionType.INSTRUCTION_EXECUTE_FINISH:
      // end execution of an instruction (at last execution cycle)
      return produce(state, draft => {
        const ins = draft.instructions[action.instructionNumber];

        if (ins instanceof Add || ins instanceof Sub) {
          // release given function unit
          draft.station.addSubUnit[action.funcUnitNumber].busy = false;
        } else if (ins instanceof Mul || ins instanceof Div) {
          // release given function unit
          draft.station.mulDivUnit[action.funcUnitNumber].busy = false;
        } else if (ins instanceof Ld) {
          // release given function unit
          draft.station.loadUnit[action.funcUnitNumber].busy = false;
        } else if (ins instanceof Jump) {
          // change pc
          const s = draft.station.jumpStation;
          if (s.Vj === s.target) {
            draft.pc += s.offset;
          } else {
            if (draft.pc < draft.instructions.length - 1) {
              draft.pc += 1;
            } else {
              draft.stall = true;
            }
          }
          // clear station
          s.target = undefined;
          s.Vj = undefined;
          s.offset = undefined;
          s.instructionNumber = undefined;
          // allow instruction fetching
          draft.stall = false;
        }
      });

    case ActionType.INSTRUCTION_WRITE:
      // write back the result of an instruction (when no WAR hazards)

      return produce(state, draft => {
        const ins = draft.instructions[action.instructionNumber];
        ins.writeTime = draft.clock;

        if (ins instanceof Add || ins instanceof Sub || ins instanceof Mul || ins instanceof Div) {

          let rs: ArithmeticStation;
          let result = 0;

          if (ins instanceof Add || ins instanceof Sub) {
            rs = draft.station.addSubStation[action.stationNumber];
            result = (ins instanceof Add) ? (rs.Vj + rs.Vk) & 0xFFFFFFFFF : (rs.Vj - rs.Vk) & 0xFFFFFFFFF;
          } else {
            rs = draft.station.mulDivStation[action.stationNumber];
            // black magic to mimic integer division of C
            result = (ins instanceof Mul) ? (rs.Vj * rs.Vk) & 0xFFFFFFFF : ~~(rs.Vj / rs.Vk);
          }

          // clear the state of reservation station
          rs.busy = false;
          rs.op = undefined;
          rs.Vj = undefined;
          rs.Vk = undefined;
          rs.instructionNumber = undefined;
          // do CDB broadcast
          broadcast(result, rs, ins.dstReg, draft);

        }  else if (ins instanceof Ld) {
          const rs = draft.station.loadBuffer[action.stationNumber];
          rs.imm = undefined;
          rs.busy = false;
          rs.op = undefined;
          rs.instructionNumber = undefined;
          broadcast(ins.srcIm, rs, ins.dstReg, draft);
        } else if (ins instanceof Jump) {
          throw Error('Jump instruction has no writeback stage!');
        }
      });

    default: return state;
  }
}
