# TrivialTomasulo

TrivialTomasulo 是使用 TypeScript 基于 React 与 Material-UI 框架开发的 Tomasulo 算法模拟器，是清华大学《计算机系统结构》课程的项目之一。本项目以 MIT 协议开放源代码。

可在 [这里](https://tomasulo.harrychen.xyz) 访问部署在 GitHub Pages 上的 Demo，但其未必是最新的。

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
Inst     := "MOVE" ',' REGISTER ',' REGISTER
Inst     := "LD" ',' REGISTER ',' INTEGER
Inst     := Jump ',' INTEGER ',' REGISTER ',' INTEGER
OPR      := "ADD" | "MUL" | "SUB" | "DIV"
Jump     := "JUMP" | "JE" | "JNE" | "JG" | "JGE" | "JL" | "JLE"
```

各条指令的语义与字面相同，其中有写入的命令，第一个参数为目标寄存器，剩余参数为源寄存器/立即数；`Jump` 类指令语义为：

```
COND,0x1,F1,0xFFFFFFFF -> if condition(F1, 0x1) PC += -1
```

其中 `condition` 表示对应的判断条件。

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
* MOVE：0（就绪后直接写入）
* Jump 类：1
* ADD/SUB：3
* MUL：12
* DIV：40

需要特别说明的是，LD 与 MOVE都使用 Load 保留站和功能组件，而 Jump 类指令有自身的保留站和运算器件，没有列出。

## 编译运行

安装 `yarn` 后运行以下命令:

```shell
yarn install
yarn build
```

即可在 `dist` 目录中找到生成的文件，打开 `index.html` 即可执行本程序。

## 功能帮助

程序工具栏上各个图标都带有 Tooltip 提示，悬停即可查看。各个按钮对应的功能为：

* Import：导入指令序列并清空状态，如果格式不正确，则什么都不做。
* 时钟图标：当前的时钟周期，如果已经执行完成，则显示带斜杠的时钟。
* Step：计算下一个周期的状态，如果已经执行完成，则什么都不做。
* Multiple Steps：执行多个周期（可能导致页面停止响应），如果中途执行完毕，则停止。
* Run：每 0.2 秒自动计算下一个周期直到被停止或指令全部完成。
* Stop：停止上述的自动执行。
* Run to End：执行到指令全部完成（为了防止无穷循环，如果一次执行了超过500个周期，也会停止）。
* Reset：重置当前指令序列的状态。
* About：查看关于程序对话框。