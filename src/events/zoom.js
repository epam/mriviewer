/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

window.onwheel = zoom;

function zoom(event) {
  event.preventDefault();
  console.log(event);
}
