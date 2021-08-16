/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

import { Container } from "./Container";
import { UIButton } from "../Button/Button";
import { Tooltip } from "../Tooltip/Tooltip";


const FullScreen = ({ isFullMode, handler }) => {
    return (
        <Container>
            <Tooltip content={`${isFullMode ? "Disable" : "Enable"} full mode`}>
                <UIButton
                    icon="expand"
                    handler={ handler }
                    active={ isFullMode }
                />
            </Tooltip>
        </Container>
    );
};

export default FullScreen;