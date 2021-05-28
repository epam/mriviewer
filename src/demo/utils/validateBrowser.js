/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import BrowserDetector from "../engine/utils/BrowserDetector";

export function validateBrowser() {
    const browserDetector = new BrowserDetector();
    const isWebGl20supported = browserDetector.checkWebGlSupported();

    if (!isWebGl20supported) {
        return {
            alert: {
                title: 'Browser compatibility problem detected',
                text: 'This browser not supported WebGL 2.0. Application functinality is decreased and app can be unstable'
            }
        }
    } else {
        const isValidBro = browserDetector.checkValidBrowser();
        if (!isValidBro) {
            return {
                alert: {
                    title: 'Browser compatibility problem detected',
                    text: 'App is specially designed for Chrome/Firefox/Opera/Safari browsers'
                }
            }
        }
    }
}
