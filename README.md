# TrivialTomasulo

TrivialTomasulo 是使用 TypeScript 开发的 Tomasulo 算法模拟器。

## 模拟环境

它支持由下面语法定义的 NEL 语言：

```
DIGIT = ([0-9])
HEX_DIGIT = ([0-9A-F])
DEC_INTEGER = ({DIGIT}+)
HEX_INTEGER = (0x{HEX_DIGIT}+)
INTEGER = {HEX_INTEGER}
REGISTER = (F{DEC_INTEGER})
Keywords = "ADD", "MUL", "SUB", "DIV", "LD", "JUMP”
```

```
Program  := InstList
InstList := Inst
InstList := Inst '\n' InstList
Inst     := OPR ',' REGISTER ',' REGISTER ',' REGISTER
Inst     := "LD" ',' REGISTER ',' INTEGER
Inst     := "JUMP” ',' INTEGER ',' REGISTER ',' INTEGER
OPR      := "ADD" | "MUL" | "SUB" | "DIV"
```

模拟的硬件包含的功能组件有：

* 3 个加减法器（Add1, Add2, Add3）
* 2 个乘除法器（Mult1, Mult2）
* 2 个Load 部件（Load1, Load2）

并有如下保留站：

* 6 个加减法保留站（Ars1, Ars2, ..., Ars6）
* 3 个乘除法保留站（Mrs1, Mrs2, Mrs3）
* 3 个LoadBuffer（LB1, LB2, LB3）

每当功能部件空闲时，从保留站选择编号较小的就绪命令进入功能组件执行。各个命令在执行阶段所需的时间为：

* LD：3
* JUMP：1
* ADD/SUB：3
* MUL：12
* DIV：40

## 编译运行

安装 `yarn` 后运行以下命令:

```shell
yarn install
yarn build
```

即可在 `dist` 目录中找到生成的文件，打开 `index.html` 即可执行本程序。
