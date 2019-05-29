import { immerable } from 'immer';

export enum Operation {
  LD = 'LD',
  JUMP = 'JUMP',
  JE = 'JE',
  JNE = 'JNE',
  JGE = 'JGE',
  JG = 'JG',
  JLE = 'JLE',
  JL = 'JL',
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
  public num: number = 0;
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

  public evaluate(a: number, b: number): number {
    throw Error('Not implemented');
  }
}

export class Ld extends Instruction {
  public cost: number = 3;
  public operation: Operation = Operation.LD;
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
  public operation: Operation = Operation.JUMP;
  public compareSrcReg: number;
  public compareDstIm: number;
  public offset: number;

  constructor(compareSrcReg: number, compareDstIm: number, offset: number) {
    super();
    this.compareSrcReg = compareSrcReg;
    this.compareDstIm = compareDstIm;
    this.offset = offset;
  }

  public evaluate(a: number, b: number): boolean {
    throw Error('Not implemented');
  }
}

export class Je extends Jump {
  public operation: Operation = Operation.JE;
  public evaluate(a: number, b: number): boolean {
    return a === b;
  }
}

export class Jne extends Jump {
  public operation: Operation = Operation.JNE;
  public evaluate(a: number, b: number): boolean {
    return a !== b;
  }
}

export class Jg extends Jump {
  public operation: Operation = Operation.JG;
  public evaluate(a: number, b: number): boolean {
    return a > b;
  }
}

export class Jge extends Jump {
  public operation: Operation = Operation.JGE;
  public evaluate(a: number, b: number): boolean {
    return a >= b;
  }
}

export class Jl extends Jump {
  public operation: Operation = Operation.JL;
  public evaluate(a: number, b: number): boolean {
    return a < b;
  }
}

export class Jle extends Jump {
  public operation: Operation = Operation.JLE;
  public evaluate(a: number, b: number): boolean {
    return a <= b;
  }
}

export class Add extends ThreeRegisterInstruction {
  public cost: number = 3;
  public operation: Operation = Operation.ADD;
  public evaluate(a: number, b: number): number {
    return (a + b) & 0xffffffff;
  }
}

export class Sub extends ThreeRegisterInstruction {
  public cost: number = 3;
  public operation: Operation = Operation.SUB;
  public evaluate(a: number, b: number): number {
    return (a - b) & 0xffffffff;
  }
}

export class Mul extends ThreeRegisterInstruction {
  public cost: number = 12;
  public operation: Operation = Operation.MUL;
  public evaluate(a: number, b: number): number {
    return (a * b) & 0xffffffff;
  }
}

export class Div extends ThreeRegisterInstruction {
  public cost: number = 40;
  public operation: Operation = Operation.DIV;
  public evaluate(a: number, b: number): number {
    return ~~(a / b);
  }
}
