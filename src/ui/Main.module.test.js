import fs from 'fs';
import path from 'path';

const REM_TO_PX = 16;
const LOGO_AREA_BOTTOM_PX = 101;
const VIEWPORT_HEIGHTS_PX = [600, 720, 768, 900, 1032, 1080, 1440];

function resolveLengthToPx(token, viewportHeightPx) {
  const value = token.trim();
  const asMax = value.match(/^max\((.*)\)$/i);
  if (asMax) {
    return Math.max(...asMax[1].split(',').map((part) => resolveLengthToPx(part, viewportHeightPx)));
  }
  if (value.endsWith('rem')) {
    return parseFloat(value) * REM_TO_PX;
  }
  if (value.endsWith('px')) {
    return parseFloat(value);
  }
  if (value.endsWith('%')) {
    return (parseFloat(value) / 100) * viewportHeightPx;
  }
  throw new Error(`Unsupported length in .left top: "${value}"`);
}

function collectLeftToolbarTops() {
  const css = fs.readFileSync(path.join(__dirname, 'Main.module.css'), 'utf8');
  const leftRule = /\.left\s*\{([^}]*)\}/g;
  const tops = [];
  let match;
  while ((match = leftRule.exec(css)) !== null) {
    const top = match[1].match(/top:\s*([^;]+);/);
    if (top) {
      tops.push(top[1].trim());
    }
  }
  return tops;
}

describe('Main layout: left toolbar vs app logo (issue #237)', () => {
  const tops = collectLeftToolbarTops();

  it('declares a vertical offset for the left toolbar', () => {
    expect(tops.length).toBeGreaterThan(0);
  });

  it('keeps the left toolbar below the logo on every tested viewport height', () => {
    tops.forEach((top) => {
      VIEWPORT_HEIGHTS_PX.forEach((viewportHeightPx) => {
        expect(resolveLengthToPx(top, viewportHeightPx)).toBeGreaterThanOrEqual(LOGO_AREA_BOTTOM_PX);
      });
    });
  });
});
