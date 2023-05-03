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
      isMobile: false,
      isActiveDnd: false,
    };
  }

  componentDidMount() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.setState({ isMobile });
  }

  handleDrag(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if ((e.type === 'dragenter' || e.type === 'dragover') && this.state.isActiveDnd !== true) {
      this.setState({ isActiveDnd: true });
    } else if (e.type === 'dragleave' && this.state.isActiveDnd === true) {
      this.setState({ isActiveDnd: false });
    }
  }

  handleDrop(e) {
    e.preventDefault();
    this.setState({ isActiveDnd: false });
    this.handleFileSelected(e);
  }

  render() {
    const { isMobile } = this.state;

    return (
      <div
        onDragEnter={(e) => this.handleDrag(e)}
        onDragLeave={(e) => this.handleDrag(e)}
        onDragOver={(e) => this.handleDrag(e)}
        onDrop={(e) => this.handleDrop(e)}
        className={this.state.isActiveDnd && !isMobile ? `${css.smart_container} ${css.smart_container__active}` : css.smart_container}
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
