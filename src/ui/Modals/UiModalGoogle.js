/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview UiModalGoogle
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';
import { Modal, ModalHeader } from './ModalBase';

class UiModalGoogle extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onModalShow = this.onModalShow.bind(this);
    this.onModalHide = this.onModalHide.bind(this);
    this.onClick = this.onClick.bind(this);

    this.onDemo = this.onDemo.bind(this);
    this.state = {
      showModalDemo: false,
    };
  }

  onModalShow() {
    this.setState({ showModalDemo: true });
  }

  onModalHide() {
    this.setState({ showModalDemo: false });
  }

  onDemo(index) {
    const onSelectFunc = this.props.onSelectDemo;
    const onHideFunc = this.props.onHide;
    onHideFunc();
    onSelectFunc(index);
  }

  logObject(strTitle, obj) {
    let str = '';
    for (let prp in obj) {
      if (str.length > 0) {
        str += '\n';
      }
      str += prp + ' = ' + obj[prp];
    }
    console.log(`${strTitle}\n${str}`);
  }

  static getIndex(arrMenu, strElem) {
    const len = arrMenu.length;
    for (let i = 0; i < len; i++) {
      if (arrMenu[i].text === strElem) {
        return i;
      }
    }
    return -1;
  }

  onClick(evt) {
    this.m_onHideFunc();
    const strTextMenu = evt.target.innerHTML;
    const ind = UiModalGoogle.getIndex(this.m_arrMenu, strTextMenu);
    if (ind >= 0 && this.m_funcDemo !== undefined) {
      // perform action on cliked demo index
      //console.log(`onClick: element = ${ind}`);
      this.m_funcDemo(ind);
    }
  }

  render() {
    const arrMenu = this.props.arrMenu;
    this.m_arrMenu = arrMenu;
    const stateVis = this.props.stateVis;
    this.m_onHideFunc = this.props.onHide;
    this.m_funcDemo = this.props.onSelectDemo;

    const jsxModalDemo = (
      <Modal show={stateVis} onHide={this.m_onHideFunc}>
        <ModalHeader title="Load from Google cloud" />
        <ModalBody>
          {arrMenu.map((d, i) => {
            const strId = `id_${i}`;
            const strTooltip = d.tooltip;
            return (
              <OverlayTrigger
                key={strId}
                placement="top"
                delay={{ show: 150, hide: 300 }}
                overlay={<Tooltip id={strId}>{strTooltip}</Tooltip>}
              >
                <p key={strId} onClick={this.onClick}>
                  {d.text}
                </p>
              </OverlayTrigger>
            );
          })}
        </ModalBody>
      </Modal>
    );

    return jsxModalDemo;
  } // end render
} // end class

export default connect((store) => store)(UiModalGoogle);
