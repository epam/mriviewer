import Modes2d from '../../../../store/Modes2d';
import { MriEvents } from '../../enums';
import { MRIEventsService, MRIStoreService, mriEventsService, mriStoreService } from '../../services';
import { GraphicsRenderer2D } from './GraphicsRenderer2D';

export class ActiveViewService {
  coronalView: GraphicsRenderer2D;
  sagittalView: GraphicsRenderer2D;
  transverseView: GraphicsRenderer2D;
  activeView: GraphicsRenderer2D;
  store: MRIStoreService = mriStoreService;
  events: MRIEventsService = mriEventsService;

  constructor() {
    this.activeView = null; // Initially, no active view

    // Bind methods
    this.setActiveView = this.setActiveView.bind(this);
    this.getActiveView = this.getActiveView.bind(this);

    this.events.on(MriEvents.VOLUME_LOAD_SUCCESS, this.handleVolumeLoadSuccess.bind(this));
  }

  // Method to set the active view
  setActiveView(view: GraphicsRenderer2D) {
    this.activeView = view;
  }

  setAllViews(coronal: GraphicsRenderer2D, sagittal: GraphicsRenderer2D, transverse: GraphicsRenderer2D) {
    this.coronalView = coronal;
    this.sagittalView = sagittal;
    this.transverseView = transverse;

    this.coronalView.m_mode2d = Modes2d.CORONAL;
    this.sagittalView.m_mode2d = Modes2d.SAGGITAL;
    this.transverseView.m_mode2d = Modes2d.TRANSVERSE;

    this.setActiveVolume();
  }

  // Method to get the active view
  getActiveView(): GraphicsRenderer2D {
    return this.activeView;
  }

  // Method to get the active view
  getActiveMode(): string {
    return '3_AXIS';
  }

  setActiveVolume(): void {
    const { volumeSet, volumeIndex } = this.store.getState();
    const volume = volumeSet.getVolume(volumeIndex);

    this.coronalView.volume = volume;
    this.sagittalView.volume = volume;
    this.transverseView.volume = volume;

    if (this.coronalView.container) {
      this.updateAllViews();
    }
  }

  handleVolumeLoadSuccess() {
    if (this.coronalView && this.sagittalView && this.transverseView) {
      this.setActiveVolume();
    }
  }

  updateActiveView() {
    this.activeView.forceUpdate();
  }

  updateAllViews() {
    this.coronalView.forceUpdate();
    this.sagittalView.forceUpdate();
    this.transverseView.forceUpdate();
  }

  setDataWindow(value: number) {
    this.coronalView.setDataWindow(value);
    this.sagittalView.setDataWindow(value);
    this.transverseView.setDataWindow(value);

    if (this.coronalView.container) {
      this.updateAllViews();
    }
  }
}

export const activeViewService = new ActiveViewService();
