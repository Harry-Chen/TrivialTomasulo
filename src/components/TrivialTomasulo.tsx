import React from 'react';
import { connect } from 'react-redux';
import { TomasuloStatus } from '../redux/tomasuloReducer';
import { importInstructions, nextStep, toggleImportDialog, toggleStepDialog } from '../redux/action';
import { AppProps } from '../type/App';

import CssBaseline from '@material-ui/core/CssBaseline';
import Table from '@material-ui/core/Table';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TextField from '@material-ui/core/TextField';

import MyAppBar from './MyAppBar';

import styles from '../styles.css';
import CommonDialog from './CommonDialog';
import { Instruction } from '../type/Instruction';
import { parseInstructions } from '../utils/InstructionParser';

const initialState = {
  instruction: 'LD,F1,0x23333333',
  step: '1',
};

class TrivialTomasulo extends React.PureComponent<AppProps, typeof initialState> {

  constructor(props) {
    super(props);
    this.state = initialState;
  }

  public render() {
    return (
      <>
        <CssBaseline/>
        <CommonDialog
          open={this.props.state.importDialogOpen}
          title={'Import Instructions'}
          content={(
            <>
              <p>
                Please input NEL instructions below. <br/>
                The dialog will close only if your input is valid.
              </p>
              <TextField
                id="input-instruction"
                label="Instructions"
                multiline
                rows="10"
                value={this.state.instruction}
                className={styles.import_dialog_input}
                margin="normal"
                onChange={e => {
                  this.setState({
                    ...this.state,
                    instruction: e.target.value,
                  });
                }}
              />
            </>
          )}
          firstButton={'Import'}
          firstButtonOnClick={() => {
            this.props.import(this.state.instruction);
          }}
          secondButton={'Cancel'}
          secondButtonOnClick={this.props.cancelImport}
        />
        <CommonDialog
          open={this.props.state.stepDialogOpen}
          title={'Run Multiple Steps'}
          content={(
            <>
              <p>
                If you specify a large number, the simulator might not response in a while. <br />
                The dialog will close after steps of given number are simulated.
              </p>
              <TextField
                id="input-step"
                label="Steps"
                value={this.state.step}
                className={styles.import_dialog_input}
                margin="normal"
                type="number"
                onChange={e => {
                  this.setState({
                    ...this.state,
                    step: e.target.value,
                  });
                }}
              />
            </>
          )}
          firstButton={'Run'}
          firstButtonOnClick={() => {
            this.props.step(this.state.step);
          }}
          secondButton={'Cancel'}
          secondButtonOnClick={this.props.cancelStep}
        />
        <div className={styles.pane_content}>
          <MyAppBar/>
          <div className={styles.pane_upper}>

            <div className={styles.pane_upper_left}>
              <div className={styles.table_title}>
                <Typography variant="h6" id="tableTitle">
                  Instructions
                </Typography>
              </div>
              <Paper className={styles.pane_upper_inside}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Content</TableCell>
                      {/*<TableCell>Current</TableCell>*/}
                      <TableCell>Issue</TableCell>
                      <TableCell>Exec Comp</TableCell>
                      <TableCell>Write Result</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {this.props.state.instructions.map(i => (
                      <TableRow>
                        <TableCell>{i.raw.replace(/,/g, '\t')}</TableCell>
                        {/*<TableCell>{this.props.state.pc !== i.num ? 'No' : 'Yes'}</TableCell>*/}
                        <TableCell>{i.issueTime === 0 ? '' : i.issueTime}</TableCell>
                        <TableCell>{i.executionTime === 0 ? '' : i.executionTime}</TableCell>
                        <TableCell>{i.writeTime === 0 ? '' : i.writeTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </div>

            <div className={styles.pane_upper_right}>
              <div className={styles.table_title}>
                <Typography variant="h6" id="tableTitle">
                  Reservation Stations
                </Typography>
              </div>
              <Paper className={styles.pane_upper_inside}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Busy</TableCell>
                      <TableCell>Remaining</TableCell>
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

                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Busy</TableCell>
                      <TableCell>Remaining</TableCell>
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
                        <TableCell>{i.Qj === undefined ? i.Vj : ''}</TableCell>
                        <TableCell>{i.Qk === undefined ? i.Vk : ''}</TableCell>
                        <TableCell>{i.Qj ? i.Qj.getName() : ''}</TableCell>
                        <TableCell>{i.Qk ? i.Qk.getName() : ''}</TableCell>
                      </TableRow>
                    ))}
                    {this.props.state.station.mulDivStation.map(i => (
                      <TableRow>
                        <TableCell>{i.getName()}</TableCell>
                        <TableCell>{i.busy ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{i.remainingClock(this.props.state.clock)}</TableCell>
                        <TableCell>{i.unit ? i.unit.getName() : ''}</TableCell>
                        <TableCell>{i.op ? i.op : ''}</TableCell>
                        <TableCell>{i.Qj === undefined ? i.Vj : ''}</TableCell>
                        <TableCell>{i.Qk === undefined ? i.Vk : ''}</TableCell>
                        <TableCell>{i.Qj ? i.Qj.getName() : ''}</TableCell>
                        <TableCell>{i.Qk ? i.Qk.getName() : ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </div>

          </div>

          <div className={styles.pane_lower}>
            <div className={styles.table_title}>
              <Typography variant="h6" id="tableTitle">
                Registers
              </Typography>
            </div>
            <Paper className={styles.pane_lower_inside}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell/>
                    {this.props.state.registers.map(r => (
                      <TableCell>{`F${r.num}`}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableHead>
                      <TableCell>Status</TableCell>
                    </TableHead>
                    {this.props.state.registers.map(r => (
                      <TableCell>{r.source ? r.source.getName() : r.content}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableHead>
                      <TableCell>Value</TableCell>
                    </TableHead>
                    {this.props.state.registers.map(r => (
                      <TableCell>{r.content}</TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </div>

        </div>
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
      let ins: Instruction[];
      try {
        ins = parseInstructions(s);
      } catch (e) {
        // do nothing
      }
      if (ins) {
        dispatch(toggleImportDialog(false));
        dispatch(importInstructions(ins));
      }

    },
    step: (s: string) => {
      const steps = parseInt(s, 10);
      if (!isNaN(steps) && steps >= 1) {
        for (let i = 0; i < steps; ++i) {
          dispatch(nextStep());
        }
        dispatch(toggleStepDialog(false));
      }
    },
    cancelImport: () => {
      dispatch(toggleImportDialog(false));
    },
    cancelStep: () => {
      dispatch(toggleStepDialog(false));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TrivialTomasulo);
