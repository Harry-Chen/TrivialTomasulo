import {
  Add,
  Div,
  Instruction,
  Je,
  Jg,
  Jge,
  Jl,
  Jle,
  Jne,
  Ld, Move,
  Mul,
  Sub,
} from '../type/Instruction';

function parseRegister(name: string): number {
  if (name[0] !== 'F') {
    throw Error('illegal register name');
  }
  const num = Number(name.substr(1));
  if (isNaN(num)) {
    throw Error('invalid register index format');
  }
  if (num < 0 || num > 31) {
    throw Error('register index out of range');
  }
  return num;
}

function parseImmediate(im: string): number {
  if (!im.startsWith('0x')) {
    throw Error('immediate not start with 0x');
  }
  if (im.length < 3 || im.length > 10) {
    throw Error('invalid immediate format');
  }
  let imm = Number(im);
  if (isNaN(imm)) {
    throw Error('invalid immediate format');
  }
  // convert 2's complement
  if (imm >>> 31 === 1) {
    imm = -(~imm + 1);
  }
  return imm;
}

export function parseInstructions(raw: string): Instruction[] {
  const instructions: Instruction[] = [];

  for (let line of raw.split('\n')) {
    line = line.trim();
    if (line === '') continue;
    // trim strange spaces
    const elements = line.split(',').map(s => s.trim());
    switch (elements[0]) {
      case 'LD':
        instructions.push(new Ld(parseImmediate(elements[2]), parseRegister(elements[1])));
        break;
      case 'JUMP':
      // for compatibility, fallthrough
      case 'JE':
        instructions.push(
          new Je(
            parseRegister(elements[2]),
            parseImmediate(elements[1]),
            parseImmediate(elements[3]),
          ),
        );
        break;
      case 'JNE':
        instructions.push(
          new Jne(
            parseRegister(elements[2]),
            parseImmediate(elements[1]),
            parseImmediate(elements[3]),
          ),
        );
        break;
      case 'JG':
        instructions.push(
          new Jg(
            parseRegister(elements[2]),
            parseImmediate(elements[1]),
            parseImmediate(elements[3]),
          ),
        );
        break;
      case 'JGE':
        instructions.push(
          new Jge(
            parseRegister(elements[2]),
            parseImmediate(elements[1]),
            parseImmediate(elements[3]),
          ),
        );
        break;
      case 'JL':
        instructions.push(
          new Jl(
            parseRegister(elements[2]),
            parseImmediate(elements[1]),
            parseImmediate(elements[3]),
          ),
        );
        break;
      case 'JLE':
        instructions.push(
          new Jle(
            parseRegister(elements[2]),
            parseImmediate(elements[1]),
            parseImmediate(elements[3]),
          ),
        );
        break;
      case 'ADD':
        instructions.push(
          new Add(
            parseRegister(elements[2]),
            parseRegister(elements[3]),
            parseRegister(elements[1]),
          ),
        );
        break;
      case 'SUB':
        instructions.push(
          new Sub(
            parseRegister(elements[2]),
            parseRegister(elements[3]),
            parseRegister(elements[1]),
          ),
        );
        break;
      case 'MUL':
        instructions.push(
          new Mul(
            parseRegister(elements[2]),
            parseRegister(elements[3]),
            parseRegister(elements[1]),
          ),
        );
        break;
      case 'DIV':
        instructions.push(
          new Div(
            parseRegister(elements[2]),
            parseRegister(elements[3]),
            parseRegister(elements[1]),
          ),
        );
        break;
      case 'MOVE':
        instructions.push(
          new Move(
            parseRegister(elements[2]),
            parseRegister(elements[1]),
          ),
        );
        break;
      default:
        throw Error(`Unrecognized instruction: ${line}`);
    }
    instructions[instructions.length - 1].raw = line;
  }

  let i = 0;
  for (const ins of instructions) {
    ins.num = i++;
  }

  return instructions;
}
