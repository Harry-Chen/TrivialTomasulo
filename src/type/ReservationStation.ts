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
  public op: Operation = undefined;
  public type: FunctionType;
  public unit: FunctionUnit = undefined;
  public num: number;
  public instructionNumber: number = undefined;

  public issueTime: number = 0;
  public executionTime: number = 0;
  public cost: number = 0;

  public getName(): string {
    return `${this.type}${this.num}`;
  }

  public executionFinished(clock: number): boolean {
    if (this.executionTime === 0) return false;
    const finishTime = this.executionTime + this.cost - 1;

    // the instruction is executed and finished at the same time
    if (this.cost === 0) {
      return finishTime + 1 === clock;
    } else {
      return finishTime === clock;
    }
  }

  public writeFinished(clock: number): boolean {
    return this.executionTime !== 0 && this.executionTime + this.cost === clock;
  }

  public remainingClock(clock: number): string {
    const remain = this.executionTime + this.cost - clock - 1;
    if (this.executionTime === 0 || remain < 0) {
      return '';
    } else {
      return `${remain}`;
    }
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
  public source: ReservationStation = undefined;
  public imm: number = undefined;
}

export class JumpStation extends ReservationStation {
  public type: FunctionType = FunctionType.JUMP;
  public Vj: number = undefined;
  public Qj: ReservationStation = undefined;
  public target: number = undefined;
  public offset: number = undefined;
}

export enum FunctionUnitType {
  ADD = 'Add',
  MULT = 'Mult',
  LOAD = 'Load',
}

export class FunctionUnit {
  public [immerable] = true;
  public num: number;
  public busy: boolean = false;
  public type: FunctionUnitType;

  public getName(): string {
    return `${this.type}${this.num}`;
  }
}
