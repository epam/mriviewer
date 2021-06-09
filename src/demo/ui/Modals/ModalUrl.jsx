/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./ModalBase";
import { UIButton } from "../Button/Button";

import css from "./Modals.module.css";

export const ModalUrl = (props) => {
    const { stateVis, onHide, loadUrl } = props;
    const inputRef = useRef();

    return (
        <Modal isOpen={ stateVis } close={ onHide }>
            <ModalHeader title="Load data from external source" close={ onHide } />
            <ModalBody>
                <div className={ css.row }>
                    <label
                        htmlFor="input-url"
                        className={ css.label }
                    >
                        Input URL to open
                    </label>
                    <input
                        id="input-url"
                        ref={inputRef}
                        placeholder="Enter URL here"
                        className={ css.input }
                    />
                    {/* TODO: add validation for Url */}
                </div>
            </ModalBody>
            <ModalFooter>
                <UIButton
                    caption="Submit"
                    cx={ css.button }
                    handler={() => loadUrl(inputRef.current.value)}
                />
            </ModalFooter>
        </Modal>
    );
}

export default ModalUrl;
