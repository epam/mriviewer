/**
 * @fileOverview Graphics2d.test
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import ToolArea from './tools2d/ToolArea';
import Graphics2d from './Graphics2d';
import VolumeSet from './VolumeSet';
import Volume from './Volume';

// ********************************************************
// Tests
// ********************************************************

describe('ToolArea. test line intersect', () => {
  it('ToolArea. test line intersect no 0', () => {
    // const gra = new Graphics2d();
    // const toolArea = new ToolArea(gra);

    const v0 = {
      x: 0.0,
      y: 0.0
    };
    const v1 = {
      x: 1.0,
      y: 0.0
    };
    const v2 = {
      x: 2.0,
      y: -1.0
    };
    const v3 = {
      x: 2.0,
      y: 1.0
    };
    const vInter = ToolArea.getLineIntersection(v0, v1, v2, v3);
    expect(vInter === null).toBeTruthy();
  });
  it('ToolArea. test line intersect yes 0', () => {
    // const gra = new Graphics2d();
    // const toolArea = new ToolArea(gra);

    const v0 = {
      x: 0.0,
      y: 0.0
    };
    const v1 = {
      x: 1.0,
      y: 0.0
    };
    const v2 = {
      x: 0.5,
      y: -1.0
    };
    const v3 = {
      x: 0.5,
      y: 1.0
    };
    const vInter = ToolArea.getLineIntersection(v0, v1, v2, v3);
    expect(vInter !== null).toBeTruthy();
    expect(vInter.x === 0.5).toBeTruthy();
    expect(vInter.y === 0.0).toBeTruthy();
  });
  it('ToolArea. test line intersect no paralel', () => {
    // const gra = new Graphics2d();
    // const toolArea = new ToolArea(gra);

    const v0 = {
      x: 0.0,
      y: 0.0
    };
    const v1 = {
      x: 1.0,
      y: 0.0
    };
    const v2 = {
      x: 0.0,
      y: 1.0
    };
    const v3 = {
      x: 1.0,
      y: 1.0
    };
    const vInter = ToolArea.getLineIntersection(v0, v1, v2, v3);
    expect(vInter === null).toBeTruthy();
  });
  it('ToolArea. hasSelfIntersectionsRect', () => {
    const points = [
      { x: 0.0, y: 0.0 },
      { x: 1.0, y: 0.0 },
      { x: 1.0, y: 1.0 },
      { x: 0.0, y: 1.0 },
    ];
    const bHas = ToolArea.hasSelfIntersection(points);
    expect(bHas === false).toBeTruthy();
  });
  it('ToolArea. hasSelfIntersectionsPentaHasClue', () => {
    const points = [
      { x: 0.0, y: 0.0 },
      { x: 1.0, y: 0.0 },
      { x: 1.0, y: 1.0 },
      { x: 0.5, y: 0.0 },
      { x: 0.0, y: 1.0 },
    ];
    const bHas = ToolArea.hasSelfIntersection(points);
    expect(bHas === true).toBeTruthy();
  });
  it('ToolArea. hasSelfIntersectionsPentaHasInter', () => {
    const points = [
      { x: 0.0, y: 0.0 },
      { x: 1.0, y: 0.0 },
      { x: 1.0, y: 1.0 },
      { x: 0.5, y: -3.0 },
      { x: 0.0, y: 1.0 },
    ];
    const bHas = ToolArea.hasSelfIntersection(points);
    expect(bHas === true).toBeTruthy();
  });

  it('ToolArea. test check area', () => {
    const vol = new Volume();
    vol.m_xDim = vol.m_yDim = vol.m_zDim = 100.0;
    vol.m_boxSize.x = vol.m_boxSize.y = vol.m_boxSize.z = 10.0; 
    const volSet = new VolumeSet();
    volSet.addVolume(vol);
    const store = {
      volumeSet: volSet,
      volumeIndex: 0,
    };
    const gra = new Graphics2d(store);
    const toolArea = new ToolArea(gra);
    toolArea.setScreenDim(100.0, 100.0);

    const points = [];
    points.push({ x: 0.0, y: 0.0 });
    points.push({ x: 0.0, y: 100.0 });
    points.push({ x: 100.0, y: 100.0 });
    points.push({ x: 100.0, y: 0.0 });

    const area = toolArea.getPolyArea(points, store);
    // console.log(`test area = ${area}`);
    expect(area === 100.0).toBeTruthy();
  });

});
