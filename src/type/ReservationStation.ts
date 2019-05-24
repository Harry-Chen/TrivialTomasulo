import { Operation } from './Instruction';
import { immerable } from 'immer';

export enum FunctionType {
  ADDSUB = 'ARS',
  MULDIV = 'MRS',
  LOAD = 'LB',
  JUMP = 'JRS',
}

export class ReservationStation {
  public [immerable] = true;
  public busy: boolean = false;
  public op: Operation = null;
  public type: FunctionType;
  public unit: FunctionUnit = null;
  public num: number;

  public getName(): string {
    return `${this.type}${this.num}`;
  }
}

export class ArithmeticStation extends ReservationStation {
  public Vj: number = undefined;
  public Vk: number = undefined;
  public Qj: ReservationStation = undefined;
  public Qk: ReservationStation = undefined;
}

export class AddSubStation extends ArithmeticStation {
  public type: FunctionType = FunctionType.ADDSUB;
}

export class MulDivStation extends ArithmeticStation {
  public type: FunctionType = FunctionType.MULDIV;
}

export class LoadBuffer extends ReservationStation {
  public type: FunctionType = FunctionType.LOAD;
  public imm: number = undefined;
}

export class JumpStation extends ReservationStation {
  public type: FunctionType = FunctionType.JUMP;
  public Vj: number = undefined;
  public Qj: ReservationStation = undefined;
  public target: number = undefined;
  public offset: number = undefined;
}

export class FunctionUnit {
  public [immerable] = true;
  public num: number;
  public busy: boolean = false;
}
