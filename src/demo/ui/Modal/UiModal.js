/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import ReactDOM from "react-dom";

import './UiModal.css';

const UiModal = () => {
  return ReactDOM.createPortal(<div
      className="modal"
      style={{ background: "rgba(0,0,0,0.8)" }}
    >
      <div
        style={{
          background: 'white',
          position: 'relative',
          padding: '5px',
        }
        }>
        <button
          style={
            {
              position: 'absolute',
              top: 0,
              right: 0,
              marginTop: '-12px'
            }
          }
          onClick={() => {
          }}
        >
          &times;
        </button>
        <p>
          {props.children}
        </p>
      </div>
    </div>,
    document.querySelector("#modal-root"));
};

export default UiModal;
