import React from 'react';
import RecentlyFiles from '../RecentlyFiles/RecentlyFiles';
import { UIButton } from '../../Button/Button';

import { connect } from 'react-redux';
import css from './SmartContainer.module.css';
import { SVG } from '../../Button/SVG';
import UiModalDemo from '../../Modals/ModalDemo';
import FileReader from '../../../engine/loaders/FileReader';
import { UiSaveMenu } from '../../OpenFile/UiSaveMenu';
import { UiReportMenu } from '../../OpenFile/UiReportMenu';

const IMG_DROPZONE_SIZE = 49;

class SmartContainer extends FileReader {
  render() {
    return (
      <div className={css.smart_container}>
        <SVG name="dropzone" width={IMG_DROPZONE_SIZE} height={IMG_DROPZONE_SIZE} />
        <p className={css.text}>Drag and drop files here</p>
        <p className={css.text}>OR</p>
        <div className={css.buttons_toolbar}>
          <UIButton icon="folder" text="Open file or folder" handler={(evt) => this.onButtonOpenLocalFileClick(evt)} />
          <UIButton icon="link" text="Open external URL" handler={this.onModalUrlShow} />
          <UIButton icon="grid" text="Open demo data" handler={this.onModalDemoOpenShow} />
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
