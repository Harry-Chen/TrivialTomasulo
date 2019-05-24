import { parseInstructions } from './utils/InstructionParser';

const TEST1 = `LD,F1,0x3
LD,F2,0x0
LD,F3,0xFFFFFFFF
ADD,F2,F1,F2
ADD,F1,F1,F3
JUMP,0x0,F1,0xFFFFFFFE
`;

const TEST2 = `
LD,F1,0xC
LD,F2,0xFFFF3C6F
LD,F3,0xFFFFFFFA
LD,F4,0x0
ADD,F2,F4,F2
DIV,F4,F2,F3
MUL,F4,F3,F3
LD,F5,0xFFFFFF32
LD,F18,0x1
SUB,F5,F4,F2
SUB,F1,F1,F18
JUMP,0x0,F1,0xFFFFFFF9
`;

const instructions = parseInstructions(TEST2);
for (const ins of instructions) {
  console.log(ins);
}
