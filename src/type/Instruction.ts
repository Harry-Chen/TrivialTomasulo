import { immerable } from 'immer';

export enum Operation {
  LD = 'LD',
  JUMP = 'JUMP',
  ADD = 'ADD',
  SUB = 'SUB',
  MUL = 'MUL',
  DIV = 'DIV',
}

export class Instruction {
  public [immerable] = true;
  public raw: string;
  public issueTime: number = 0;
  public executionTime: number = 0;
  public cost: number;
  public writeTime: number = 0;
  public operation: Operation;
}

export class ThreeRegisterInstruction extends Instruction {
  public dstReg: number;
  public srcReg1: number;
  public srcReg2: number;

  constructor(srcReg1: number, srcReg2: number, dstReg: number) {
    super();
    this.srcReg1 = srcReg1;
    this.srcReg2 = srcReg2;
    this.dstReg = dstReg;
  }
}

export class Ld extends Instruction {
  public cost: number = 3;
  public name: Operation = Operation.LD;
  public srcIm: number;
  public dstReg: number;

  constructor(srcIm: number, dstReg: number) {
    super();
    this.srcIm = srcIm;
    this.dstReg = dstReg;
  }
}

export class Jump extends Instruction {
  public cost: number = 1;
  public name: Operation = Operation.JUMP;
  public compareSrcReg: number;
  public compareDstIm: number;
  public offset: number;

  constructor(compareSrcReg: number, compareDstIm: number, offset: number) {
    super();
    this.compareSrcReg = compareSrcReg;
    this.compareDstIm = compareDstIm;
    this.offset = offset;
  }
}

export class Add extends ThreeRegisterInstruction {
  public cost: number = 3;
  public name: Operation = Operation.ADD;
}

export class Sub extends ThreeRegisterInstruction {
  public cost: number = 3;
  public name: Operation = Operation.SUB;
}

export class Mul extends ThreeRegisterInstruction {
  public cost: number = 12;
  public name: Operation = Operation.MUL;
}

export class Div extends ThreeRegisterInstruction {
  public cost: number = 40;
  public name: Operation = Operation.DIV;
}
