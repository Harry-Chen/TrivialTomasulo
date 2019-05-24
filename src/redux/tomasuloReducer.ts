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

// XXX: hardcoded numbers
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
      return initialState;

    case ActionType.INSTRUCTION_ISSUE:
      // issue an instruction
      return produce(state, draft => {
        const ins = draft.instructions[action.instructionNumber];
        ins.issueTime = state.clock;

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
          // mark the source operands (some may be undefined if not applicable)
          rs.Qj = draft.registers[ins.srcReg1].source;
          rs.Vj = draft.registers[ins.srcReg1].content;
          rs.Qk = draft.registers[ins.srcReg2].source;
          rs.Vk = draft.registers[ins.srcReg2].content;
          // mark the register to be written
          draft.registers[ins.dstReg].source = rs;
          // move forward
          draft.pc += 1;

        } else if (ins instanceof Ld) {
          const rs = draft.station.loadBuffer[action.stationNumber];
          // station status
          rs.busy = true;
          rs.op = ins.operation;
          // source operands
          rs.imm = ins.srcIm;
          // register to write
          draft.registers[ins.dstReg].source = rs;
          // move forward
          draft.pc += 1;

        } else if (ins instanceof Jump) {
          const rs = draft.station.jumpStation;
          // station status
          rs.busy = true;
          rs.op = Operation.JUMP;
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

    case ActionType.INSTRUCTION_EXECUTE:
      // begin execution of an instruction
      return produce(state, draft => {
        const ins = draft.instructions[action.instructionNumber];
        ins.executionTime = state.clock;

        if (ins instanceof Add || ins instanceof Sub || ins instanceof Mul || ins instanceof Div) {
          // no need to do anything
        }  else if (ins instanceof Ld) {
          // no need to do anything
        } else if (ins instanceof Jump) {
          // change pc
          const s = state.station.jumpStation;
          if (s.Vj === s.target) {
            draft.pc += s.offset;
          } else {
            draft.pc += 1;
          }
          // clear station
          s.target = undefined;
          s.Vj = undefined;
          s.offset = undefined;
          // allow instruction fetching
          draft.stall = false;
        }
      });

    case ActionType.INSTRUCTION_WRITE:
      // write back the result of an instruction

      return produce(state, draft => {
        const ins = draft.instructions[action.instructionNumber];
        ins.writeTime = state.clock;

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
          // do CDB broadcast
          broadcast(result, rs, ins.dstReg, state);

        }  else if (ins instanceof Ld) {
          const rs = draft.station.loadBuffer[action.stationNumber];
          rs.imm = undefined;
          rs.busy = false;
          rs.op = undefined;
          broadcast(ins.srcIm, rs, ins.dstReg, state);
        } else if (ins instanceof Jump) {
          throw Error('Jump instruction has no writeback stage!');
        }
      });

    default: return state;
  }
}
