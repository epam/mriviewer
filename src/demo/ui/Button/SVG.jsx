/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

const DEFAULT_FILL = "#ffffff";
const DEFAULT_SIZE = 24;


export const SVG = ({ name, fill = DEFAULT_FILL, size = DEFAULT_SIZE, title }) => {
    return (
        <svg
            fill={ fill }
            viewBox="0 0 24 24"
            width={ size }
            height={ size }
            { ...title ? { "aria-labelledby": "title" } : { "aria-hidden": "true" } }
        >
            {title && <title>{title}</title>}
            <use xlinkHref={`/sprite.svg#${name}`} />
        </svg>
    );
};
