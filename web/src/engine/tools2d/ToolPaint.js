import ToolDistance from './ToolDistance';
import PointerChecker from '../utils/PointerChecker';

class ToolPaint {
  constructor(objGra) {
    this.m_objGraphics2d = objGra;
    this.m_wScreen = 0;
    this.m_hScreen = 0;
    this.m_lines = [];
    this.m_mouseDown = false;
    this.m_objEdit = null;
  }

  setScreenDim(wScr, hScr) {
    this.m_wScreen = wScr;
    this.m_hScreen = hScr;
  }

  getEditPoint(vScr, store) {
    const numLines = this.m_lines.length;
    for (let i = 0; i < numLines; i++) {
      const objLine = this.m_lines[i];

      if (objLine.points.length >= 2) {
        for (let j = 1; j < objLine.points.length; j++) {
          const vScrS = ToolDistance.textureToScreen(
            objLine.points[j - 1].x,
            objLine.points[j - 1].y,
            this.m_wScreen,
            this.m_hScreen,
            store
          );
          const vScrE = ToolDistance.textureToScreen(objLine.points[j].x, objLine.points[j].y, this.m_wScreen, this.m_hScreen, store);

          if (PointerChecker.isPointerOnLine(vScrS, vScrE, vScr)) {
            this.m_objEdit = objLine;
            return objLine.points[j - 1];
          }
        }
      }
    }
    return null;
  }

  deleteObject() {
    if (this.m_objEdit != null) {
      const ind = this.m_lines.indexOf(this.m_objEdit);
      if (ind >= 0) {
        this.m_lines.splice(ind, 1);
      }
    }
  }

  onMouseDown(xScr, yScr, store) {
    const vTex = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
    const newLine = {
      points: [{ x: vTex.x, y: vTex.y }],
      distMm: 0.0,
      color: store.selectedColor,
    };
    this.m_lines.push(newLine);
    this.m_mouseDown = true;
  }

  onMouseMove(xScr, yScr, store) {
    if (!this.m_mouseDown) {
      return;
    }
    const vTex = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
    const numLines = this.m_lines.length;
    if (numLines > 0) {
      const currentLine = this.m_lines[numLines - 1];
      currentLine.points.push({ x: vTex.x, y: vTex.y });
      this.m_objGraphics2d.forceUpdate();
    }
  }

  onMouseUp() {
    this.m_mouseDown = false;
  }

  clear() {
    this.m_lines = [];
  }

  render(ctx, store) {
    const numLines = this.m_lines.length;
    ctx.lineWidth = 2;

    for (let i = 0; i < numLines; i++) {
      const objLine = this.m_lines[i];
      const points = objLine.points;

      if (points.length > 1) {
        ctx.strokeStyle = objLine.color;
        for (let j = 1; j < points.length; j++) {
          const vsTex = points[j - 1];
          const veTex = points[j];

          const vs = ToolDistance.textureToScreen(vsTex.x, vsTex.y, this.m_wScreen, this.m_hScreen, store);
          const ve = ToolDistance.textureToScreen(veTex.x, veTex.y, this.m_wScreen, this.m_hScreen, store);

          ctx.beginPath();
          ctx.moveTo(vs.x, vs.y);
          ctx.lineTo(ve.x, ve.y);
          ctx.stroke();
        }
      }
    }
  }
}
export default ToolPaint;
