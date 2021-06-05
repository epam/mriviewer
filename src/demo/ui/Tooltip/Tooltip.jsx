/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { usePopper } from 'react-popper';

import css from "./Tooltip.module.css";

export const Tooltip = ({ children, content }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [refEl, setRefEl] = useState(null);
    const [popperEl, setPopperEl] = useState(null);

    const { styles, attributes } = usePopper(refEl, popperEl, {
        modifiers: [
            {
                name: "offset",
                enabled: true,
                options: {
                    offset: [0, 10]
                }
            }
        ]
    });

    const hide = useCallback(() => setIsOpen(false), []);
    const show = useCallback(() => setIsOpen(true), [])

    return (
        <>
            <div
                ref={ setRefEl }
                onMouseLeave={ hide }
                onMouseEnter={ show }
                className={ css.wrapper }
            >
                { children }
            </div>
            {isOpen && (
                <div
                    ref={setPopperEl}
                    style={styles.popper}
                    {...attributes.popper}
                >
                    <div className={ css.body }>
                        { content }
                    </div>
                </div>
            )}
        </>
    );
};
