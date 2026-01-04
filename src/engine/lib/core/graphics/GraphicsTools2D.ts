import StoreActionType from '../../../../store/ActionTypes';
import Volume from '../../../Volume';
import ToolAngle from '../../../tools2d/ToolAngle';
import ToolArea from '../../../tools2d/ToolArea';
import ToolDelete from '../../../tools2d/ToolDelete';
import ToolDistance from '../../../tools2d/ToolDistance';
import ToolEdit from '../../../tools2d/ToolEdit';
import ToolPick from '../../../tools2d/ToolPick';
import ToolRect from '../../../tools2d/ToolRect';
import ToolText from '../../../tools2d/ToolText';
import Tools2dType from '../../../tools2d/ToolTypes';
import { MRIStoreService, mriStoreService } from '../../services';
import { GraphicsRenderer2D } from './GraphicsRenderer2D';

export class GraphicsTools2D {
  renderer: GraphicsRenderer2D;
  stateMouseDown = false;
  m_toolPick: ToolPick;
  m_toolDistance: ToolDistance;
  m_toolAngle: ToolAngle;
  m_toolArea: ToolArea;
  m_toolRect: ToolRect;
  m_toolText: ToolText;
  m_toolEdit: ToolEdit;
  m_toolDelete: ToolDelete;
  // Props
  startX: number = 0;
  startY: number = 0;
  // store
  store: MRIStoreService = mriStoreService;

  constructor(renderer: GraphicsRenderer2D) {
    this.renderer = renderer; // Reference to GraphicsRenderer2D instance
    this.m_toolPick = new ToolPick(renderer);
    this.m_toolDistance = new ToolDistance(renderer);
    this.m_toolAngle = new ToolAngle(renderer);
    this.m_toolArea = new ToolArea(renderer);
    this.m_toolRect = new ToolRect(renderer);
    this.m_toolText = new ToolText(renderer);
    this.m_toolEdit = new ToolEdit(renderer);
    this.m_toolDelete = new ToolDelete(renderer);
    // Initialize other properties as needed
  }

  render(): void {
    const ctx = this.renderer.canvas.getContext('2d');
    const store = this.store.getState();

    this.m_toolPick.render(ctx);
    this.m_toolDistance.render(ctx, store);
    this.m_toolAngle.render(ctx, store);
    this.m_toolArea.render(ctx, store);
    this.m_toolRect.render(ctx, store);
    this.m_toolText.render(ctx, store);
    this.m_toolEdit.render(ctx, store);
    this.m_toolDelete.render(ctx);
  }
  /**s
   * Invoke clear all tools
   */
  clear() {
    this.m_toolDistance.clear();
    this.m_toolAngle.clear();
    this.m_toolArea.clear();
    this.m_toolRect.clear();
    this.m_toolText.clear();
    this.m_toolEdit.clear();
    this.m_toolDelete.clear();
  }

  onMouseDown(evt: any) {
    const objCanvas = this.renderer.canvas;
    const box = objCanvas.getBoundingClientRect();
    const xContainer = evt.clientX - box.left;
    const yContainer = evt.clientY - box.top;
    const xScr = xContainer;
    const yScr = yContainer;
    const store = this.store.getState();
    const indexTools2d = store.indexTools2d;

    this.stateMouseDown = true;
    this.startX = evt.clientX;
    this.startY = evt.clientY;

    switch (indexTools2d) {
      case Tools2dType.INTENSITY:
        this.m_toolPick.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.DISTANCE:
        this.m_toolDistance.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.ANGLE:
        this.m_toolAngle.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.AREA:
        this.m_toolArea.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.RECT:
        this.m_toolRect.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.TEXT:
        this.m_toolText.onMouseDown(xScr, yScr, store);
        this.store.dispatch({ type: StoreActionType.SET_MODAL_TEXT, showModalText: true });
        break;
      case Tools2dType.EDIT:
        this.m_toolEdit.onMouseDown();
        break;
      case Tools2dType.DELETE:
        this.m_toolDelete.onMouseDown();
        break;
      case Tools2dType.HAND:
        objCanvas.classList.remove('cursor-hand');
        objCanvas.classList.add('cursor-grab');
        break;
      default:
    }
    // force update
    this.renderer.forceUpdate();
  }

  onMouseMove(evt: any) {
    const store = this.store.getState();
    const xPos = store.render2dxPos;
    const yPos = store.render2dyPos;
    const zoom = store.render2dZoom;
    const indexTools2d = store.indexTools2d;
    const box = this.renderer.canvas.getBoundingClientRect();
    const xContainer = evt.clientX - box.left;
    const yContainer = evt.clientY - box.top;
    const xScr = xContainer;
    const yScr = yContainer;

    if (indexTools2d === Tools2dType.DISTANCE) {
      this.m_toolDistance.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.ANGLE) {
      this.m_toolAngle.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.AREA) {
      this.m_toolArea.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.RECT) {
      this.m_toolRect.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.EDIT) {
      this.m_toolEdit.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.DELETE) {
      this.m_toolDelete.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.HAND && this.stateMouseDown) {
      const deltaX = evt.clientX - this.startX;
      const deltaY = evt.clientY - this.startY;
      const newXPos = xPos - deltaX * zoom;
      const newYPos = yPos - deltaY * zoom;

      this.store.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: newXPos });
      this.store.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: newYPos });

      this.startX = evt.clientX;
      this.startY = evt.clientY;
    }
    store.graphics2d.forceUpdate();
  }

  onMouseUp() {
    const objCanvas = this.renderer.canvas;
    const store = this.store.getState();
    const indexTools2d = store.indexTools2d;

    this.stateMouseDown = false;

    if (indexTools2d === Tools2dType.DISTANCE) {
      this.m_toolDistance.onMouseUp();
    }
    if (indexTools2d === Tools2dType.ANGLE) {
      this.m_toolAngle.onMouseUp();
    }
    if (indexTools2d === Tools2dType.AREA) {
      this.m_toolArea.onMouseUp();
    }
    if (indexTools2d === Tools2dType.RECT) {
      this.m_toolRect.onMouseUp();
    }
    if (indexTools2d === Tools2dType.EDIT) {
      this.m_toolEdit.onMouseUp();
    }
    if (indexTools2d === Tools2dType.DELETE) {
      this.m_toolDelete.onMouseUp();
    }
    if (store.indexTools2d === Tools2dType.HAND) {
      objCanvas.classList.remove('cursor-grab');
      objCanvas.classList.add('cursor-hand');
    }
  }

  onMouseWheel(evt: any) {
    const objCanvas = this.renderer.canvas;
    const canvasRect = objCanvas.getBoundingClientRect();
    let xPosNew;
    let yPosNew;
    const store = this.store.getState();
    const zoom = store.render2dZoom;
    const step = evt.deltaY * 2 ** -10;
    let newZoom = zoom + step;

    if (step < 0) {
      const mouseX = (evt.clientX - canvasRect.left) * zoom + store.render2dxPos;
      const mouseY = (evt.clientY - canvasRect.top) * zoom + store.render2dyPos;
      xPosNew = mouseX - (mouseX - store.render2dxPos) * (newZoom / zoom);
      yPosNew = mouseY - (mouseY - store.render2dyPos) * (newZoom / zoom);
    } else {
      const initialX = canvasRect.width * zoom + store.render2dxPos;
      const initialY = canvasRect.height * zoom + store.render2dyPos;
      xPosNew = initialX - (initialX - store.render2dxPos) * (newZoom / zoom);
      yPosNew = initialY - (initialY - store.render2dyPos) * (newZoom / zoom);
    }

    if (xPosNew < 0) {
      xPosNew = 0;
    }
    if (yPosNew < 0) {
      yPosNew = 0;
    }
    if (newZoom > 1) {
      newZoom = 1;
      xPosNew = 0;
      yPosNew = 0;
    }
    if (newZoom < 0.1) {
      return;
    }
    this.store.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: newZoom });
    this.store.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: xPosNew });
    this.store.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: yPosNew });

    store.graphics2d.forceUpdate();
  }

  setToolsScreenAndPixelSizes(wScreen: number, hScreen: number, xDim: number, yDim: number, vol: Volume) {
    // setup pixel size for 2d tools
    const xPixelSize = vol.m_boxSize.x / xDim;
    const yPixelSize = vol.m_boxSize.y / yDim;

    this.m_toolPick.setScreenDim(wScreen, hScreen);
    this.m_toolDistance.setScreenDim(wScreen, hScreen);
    this.m_toolAngle.setScreenDim(wScreen, hScreen);
    this.m_toolArea.setScreenDim(wScreen, hScreen);
    this.m_toolRect.setScreenDim(wScreen, hScreen);
    this.m_toolText.setScreenDim(wScreen, hScreen);
    this.m_toolEdit.setScreenDim(wScreen, hScreen);
    this.m_toolDelete.setScreenDim(wScreen, hScreen);
    this.m_toolDistance.setPixelSize(xPixelSize, yPixelSize);
    this.m_toolAngle.setPixelSize(xPixelSize, yPixelSize);
    this.m_toolArea.setPixelSize(xPixelSize, yPixelSize);
    this.m_toolRect.setPixelSize(xPixelSize, yPixelSize);
    this.m_toolText.setPixelSize(xPixelSize, yPixelSize);
    this.m_toolEdit.setPixelSize(xPixelSize, yPixelSize);
    this.m_toolDelete.setPixelSize(xPixelSize, yPixelSize);
  }

  checkHandTool(): void {
    const indexTools2d = this.store.getState().indexTools2d;

    if (indexTools2d === Tools2dType.HAND && !this.stateMouseDown) {
      this.renderer.canvas.classList.add('cursor-hand');
    } else {
      this.renderer.canvas.classList.remove('cursor-hand');
    }
  }
}
