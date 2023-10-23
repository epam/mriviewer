/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * This is a tool for checking whether a pointer is on the line
 * @module demo/engine/utils/tool
 */
// absolute imports
/**
 * Class PointerChecker to check if the point is on the line
 * @class PointerChecker
 */
class PointerChecker {
  static isPointerOnLine(vs, ve, vScr) {
    // Define the center point of the line by "y" coordinate
    const centerLineY = (vs.y + ve.y) / 2;
    // Define the angle slope of the line
    const m = (ve.y - vs.y) / (ve.x - vs.x);
    // Define the intercept of the line
    const b = vs.y - m * vs.x;
    // Define the length of the line by "y"
    const widthY = Math.abs(ve.y - vs.y);
    // Define the distance to the line by "y"
    const MIN_DIST_Y = 10;
    // Check if the point is on the border of the line
    if (
      vs.x != ve.x &&
      (vs.x < ve.x ? vScr.x >= vs.x && vScr.x <= ve.x : vScr.x <= vs.x && vScr.x >= ve.x) &&
      Math.floor(vScr.y) >= Math.floor(m * vScr.x + b) - MIN_DIST_Y &&
      Math.floor(vScr.y) <= Math.floor(m * vScr.x + b) + MIN_DIST_Y
    ) {
      return true;
    }
    // Check if the point is on the border of the vertical line
    if (
      vs.x === ve.x &&
      vScr.x <= vs.x + 10 &&
      vScr.x >= vs.x - 10 &&
      vScr.y >= centerLineY - widthY / 2 &&
      vScr.y <= centerLineY + widthY / 2
    ) {
      return true;
    }
  }
}

export default PointerChecker;
