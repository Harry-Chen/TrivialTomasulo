import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';

import CloucUploadIcon from '@material-ui/icons/CloudUpload';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import SlowMotionVideoIcon from '@material-ui/icons/SlowMotionVideo';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import FastForwardIcon from '@material-ui/icons/FastForward';
import PauseIcon from '@material-ui/icons/Pause';
import UndoIcon from '@material-ui/icons/Undo';

import styles from '../styles.css';
import { TomasuloStatus } from '../redux/tomasuloReducer';
import { MyAppBarProps } from '../type/App';
import { nextStep, reset } from '../redux/action';
import { connect } from 'react-redux';

class MyAppBar extends React.PureComponent<MyAppBarProps, {}> {

  public render() {
    return (
      <div className={styles.appbar}>
        <AppBar position="static">
          <Toolbar>
            <Tooltip title="Import">
            <IconButton className={styles.appbar_menu} color="inherit" aria-label="Menu">
              <CloucUploadIcon />
            </IconButton>
            </Tooltip>
            <Typography variant="h6" className={styles.appbar_title}>
              TrivialTomasulo Simulator
            </Typography>
            <IconButton className={styles.appbar_menu} color="inherit" aria-label="Step">
              <AccessTimeIcon/> {this.props.clock}
            </IconButton>
            <Tooltip title="Step">
            <IconButton
              className={styles.appbar_menu}
              color="inherit"
              onClick={() => this.props.step(1)}
            >
              <PlayArrowIcon/>
            </IconButton>
            </Tooltip>
            <Tooltip title="Multiple Steps">
            <IconButton
              className={styles.appbar_menu}
              color="inherit"
              onClick={() => this.props.step(1)}
            >
              <FastForwardIcon/>
            </IconButton>
            </Tooltip>
            <Tooltip title="Run">
            <IconButton
              className={styles.appbar_menu}
              color="inherit"
              onClick={this.props.run}
            >
              <SlowMotionVideoIcon/>
            </IconButton>
            </Tooltip>
            <Tooltip title="Stop">
            <IconButton
              className={styles.appbar_menu}
              color="inherit"
              onClick={this.props.stop}
            >
              <PauseIcon/>
            </IconButton>
            </Tooltip>
            <Tooltip title="Run to End">
            <IconButton
              className={styles.appbar_menu}
              color="inherit"
              onClick={this.props.toEnd}
            >
              <SkipNextIcon/>
            </IconButton>
            </Tooltip>
            <Tooltip title="Reset">
            <IconButton
              className={styles.appbar_menu}
              color="inherit"
              onClick={this.props.reset}
            >
              <UndoIcon/>
            </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
      </div>
    );
  }

}

const mapStateToProps = (state: TomasuloStatus): Partial<MyAppBarProps> => {
  return {
    clock: state.clock,
    stall: state.stall,
  };
};

const mapDispatchToProps = (dispatch: any): Partial<MyAppBarProps> => {
  return {
    step: (step) => {
      for (let i = 0; i < step; ++i) dispatch(nextStep());
    },
    run: () => {

    },
    stop: () => {

    },
    toEnd: () => {

    },
    reset: () => {
      dispatch(reset());
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MyAppBar);
