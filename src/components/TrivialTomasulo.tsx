import React from 'react';
import { connect } from 'react-redux';
import { TomasuloStatus } from '../redux/tomasuloReducer';
import { importInstructions, nextStep, reset } from '../redux/action';
import { AppProps } from '../type/App';

import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import Button from '@material-ui/core/Button';

class TrivialTomasulo extends React.PureComponent<AppProps, never> {
  public render() {
    return (
      <>
        <span>{`Clock: ${this.props.state.clock}`}</span>

        <Button onClick={this.props.reset}>重置</Button>

        <Button onClick={this.props.nextStep}>下一步</Button>

        <Table padding={'dense'}>
          <TableHead>
            <TableRow>
              <TableCell>指令</TableCell>
              <TableCell>当前指令</TableCell>
              <TableCell>Issue</TableCell>
              <TableCell>Exec Comp</TableCell>
              <TableCell>Write Result</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {this.props.state.instructions.map(i => (
              <TableRow>
                <TableCell>{i.raw.replace(/,/g, '\t')}</TableCell>
                <TableCell>{this.props.state.pc === i.num ? 'Yes' : 'No'}</TableCell>
                <TableCell>{i.issueTime === 0 ? '' : i.issueTime}</TableCell>
                <TableCell>{i.executionTime === 0 ? '' : i.executionTime}</TableCell>
                <TableCell>{i.writeTime === 0 ? '' :
                  i.writeTime === -1 ? 'N/A' : i.writeTime}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Table padding={'dense'}>
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell>Busy</TableCell>
              <TableCell>剩余周期</TableCell>
              <TableCell>FU</TableCell>
              <TableCell>Immediate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {this.props.state.station.loadBuffer.map(i => (
              <TableRow>
                <TableCell>{i.getName()}</TableCell>
                <TableCell>{i.busy ? 'Yes' : 'No'}</TableCell>
                <TableCell>{i.remainingClock(this.props.state.clock)}</TableCell>
                <TableCell>{i.unit ? i.unit.getName() : ''}</TableCell>
                <TableCell>{i.imm}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Table padding={'dense'}>
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell>Busy</TableCell>
              <TableCell>剩余周期</TableCell>
              <TableCell>FU</TableCell>
              <TableCell>Operation</TableCell>
              <TableCell>Vj</TableCell>
              <TableCell>Vk</TableCell>
              <TableCell>Qj</TableCell>
              <TableCell>Qk</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {this.props.state.station.addSubStation.map(i => (
              <TableRow>
                <TableCell>{i.getName()}</TableCell>
                <TableCell>{i.busy ? 'Yes' : 'No'}</TableCell>
                <TableCell>{i.remainingClock(this.props.state.clock)}</TableCell>
                <TableCell>{i.unit ? i.unit.getName() : ''}</TableCell>
                <TableCell>{i.op ? i.op : ''}</TableCell>
                <TableCell>{i.Vj === undefined ? i.Qj : ''}</TableCell>
                <TableCell>{i.Vk === undefined ? i.Qk : ''}</TableCell>
                <TableCell>{i.Vj ? i.Vj.getName() : ''}</TableCell>
                <TableCell>{i.Vk ? i.Vk.getName() : ''}</TableCell>
              </TableRow>
            ))}
            {this.props.state.station.mulDivStation.map(i => (
              <TableRow>
                <TableCell>{i.getName()}</TableCell>
                <TableCell>{i.busy ? 'Yes' : 'No'}</TableCell>
                <TableCell>{i.remainingClock(this.props.state.clock)}</TableCell>
                <TableCell>{i.unit ? i.unit.getName() : ''}</TableCell>
                <TableCell>{i.op ? i.op : ''}</TableCell>
                <TableCell>{i.Vj === undefined ? i.Qj : ''}</TableCell>
                <TableCell>{i.Vk === undefined ? i.Qk : ''}</TableCell>
                <TableCell>{i.Vj ? i.Vj.getName() : ''}</TableCell>
                <TableCell>{i.Vk ? i.Vk.getName() : ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Table padding={'dense'}>
          <TableHead>
            <TableRow>
              {this.props.state.registers.map(r => (
                <TableCell>{`Reg${r.num}`}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {this.props.state.registers.map(r => (
                <TableCell>{r.source ? r.source.getName() : r.content}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              {this.props.state.registers.map(r => (
                <TableCell>{r.content}</TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </>
    );
  }
}

const mapStateToProps = (state: TomasuloStatus): Partial<AppProps> => {
  return {
    state,
  };
};

const mapDispatchToProps = (dispatch: any): Partial<AppProps> => {
  return {
    import: (s: string) => {
      dispatch(importInstructions(s));
    },
    reset: () => {
      dispatch(reset());
    },
    nextStep: () => {
      dispatch(nextStep());
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TrivialTomasulo);
