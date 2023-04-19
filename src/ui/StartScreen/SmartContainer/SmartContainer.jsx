import React from 'react';
import RecentlyFiles from '../RecentlyFiles/RecentlyFiles';
import { UIButton } from '../../Button/Button';

import { connect } from 'react-redux';
import css from './SmartContainer.module.css';
import { SVG } from '../../Button/SVG';
import UiModalDemo from '../../Modals/ModalDemo';
import UiModalWindowCenterWidth from '../../Modals/UiModalWinCW';
import FileReader from '../../../engine/loaders/FileReader';
import { UiSaveMenu } from '../../OpenFile/UiSaveMenu';
import { UiReportMenu } from '../../OpenFile/UiReportMenu';
import UIModalUrl from '../../Modals/ModalUrl';

const IMG_DROPZONE_SIZE = 49;

// This component cannot be refactor to FC yet, as we need to extend it from FileReader for now
class SmartContainer extends FileReader {
  constructor(props) {
    super(props);
    this.state = {
      windowDimensions: this.getWindowDimensions(),
    };
    this.handleResize = this.handleResize.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height,
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    this.setState({
      windowDimensions: this.getWindowDimensions(),
    });
  }

  handleDrag(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (e.type === 'dragenter' || e.type === 'dragover') {
      this.setState({ isActiveDnd: true });
    } else if (e.type === 'dragleave') {
      this.setState({ isActiveDnd: false });
    }
  }

  handleDrop(e) {
    e.preventDefault();
    this.setState({ isActiveDnd: false });
    this.handleFileSelected(e);
  }

  render() {
    const { windowDimensions } = this.state;
    const isMobile = windowDimensions.width < 900;

    return (
      <div
        onDragEnter={(e) => this.handleDrag(e)}
        onDragLeave={(e) => this.handleDrag(e)}
        onDragOver={(e) => this.handleDrag(e)}
        onDrop={(e) => this.handleDrop(e)}
        className={css.smart_container}
      >
        {!isMobile && (
          <>
            <SVG name="dropzone" width={IMG_DROPZONE_SIZE} height={IMG_DROPZONE_SIZE} />
            <p className={css.text}>Drag and drop files here</p>
            <p className={css.text}>OR</p>
          </>
        )}
        <div className={css.buttons_toolbar}>
          <UIButton
            icon="folder"
            text="Open From Device"
            handler={(evt) => this.onButtonOpenLocalFileClick(evt)}
            cx={css.button_start_screen}
          />
          <UIButton icon="link" text="Open From URL" handler={this.onModalUrlShow} cx={css.button_start_screen} />
          <UIButton icon="grid" text="Demo Data" handler={this.onModalDemoOpenShow} cx={css.button_start_screen} />
        </div>
        <RecentlyFiles />
        {this.props.isLoaded && (
          <div className={css['save-file__area']}>
            <UiSaveMenu />
            <UiReportMenu />
          </div>
        )}

        {this.state.showModalUrl && (
          <UIModalUrl stateVis={this.state.showModalUrl} onHide={this.onModalUrlHide} loadUrl={this.onClickLoadUrl} />
        )}

        {this.state.showModalDemo && (
          <UiModalDemo stateVis={this.state.showModalDemo} onHide={this.onModalDemoOpenHide} onSelectDemo={this.onDemoSelected} />
        )}
        {this.state.showModalWindowCW && (
          <UiModalWindowCenterWidth stateVis={this.state.showModalWindowCW} volSet={this.m_volumeSet} onHide={this.onModalWindowCWHide} />
        )}
      </div>
    );
  }
}

export default connect((store) => store)(SmartContainer);
