/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

// import { gzip, ungzip } from 'node-gzip';
// import UiModalDicomSeries from './UiModalDicomSeries';

import React from 'react';
import { connect } from 'react-redux';
import UiModalDemo from '../Modals/ModalDemo';
import UIModalUrl from '../Modals/ModalUrl';
import UiModalWindowCenterWidth from '../Modals/UiModalWinCW';
import { UIButton } from '../Button/Button';
import css from './UiOpenMenu.module.css';
import { UiSaveMenu } from './UiSaveMenu';
import { UiReportMenu } from './UiReportMenu';
import { Tooltip } from '../Tooltip/Tooltip';
import { Container } from '../Layout/Container';
import FileReader from '../../engine/loaders/FileReader';

/** Need to have demo menu */
const NEED_DEMO_MENU = true;

class UiOpenMenu extends FileReader {
  // render
  render() {
    this.m_fileNameOnLoad = this.props.fileNameOnLoad;

    return (
      <>
        <Container>
          <Tooltip content="Open file or folder">
            <UIButton icon="folder" handler={(evt) => this.onButtonOpenLocalFileClick(evt)} />
          </Tooltip>
          <Tooltip content="Open external URL">
            <UIButton icon="link" handler={this.onModalUrlShow} />
          </Tooltip>
          {NEED_DEMO_MENU && (
            <Tooltip content="Open demo data">
              <UIButton icon="grid" handler={this.onModalDemoOpenShow} />
            </Tooltip>
          )}
        </Container>

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

        {/*<UiModalGoogle stateVis={this.state.showModalGoogle}*/}
        {/*               onHide={this.onModalGoogleHide} onSelectDemo={this.onGoogleSelected}*/}
        {/*               arrMenu={config.arrMenuGoogle}/>*/}
      </>
    );
  }
}

export default connect((store) => store)(UiOpenMenu);
