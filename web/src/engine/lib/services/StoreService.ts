import { Store } from 'redux';
import { store } from '../../../store';
import StoreActionType from '../../../store/ActionTypes';
import Modes3d from '../../../store/Modes3d';
import ViewMode from '../../../store/ViewMode';
import VolumeSet from '../../VolumeSet';
import LoaderDicom from '../../loaders/LoaderDicom';
import LoaderHdr from '../../loaders/LoaderHdr';

export class MRIStoreService {
  private store: Store;
  public dispatch: Function;

  constructor() {
    this.store = store;
    this.dispatch = store.dispatch;

    this.getState = this.getState.bind(this);
    this.setVolume = this.setVolume.bind(this);
    this.dispatchActions = this.dispatchActions.bind(this);
    this.setLoadingProgress = this.setLoadingProgress.bind(this);
  }

  public getState(): any {
    return this.store.getState();
  }

  public dispatchActions(actions: any): void {
    actions.forEach(this.dispatch);
  }

  public startLoadingSpinner(spinnerTitle: string): void {
    this.setLoadingProgress(0);
    this.dispatchActions([
      { type: StoreActionType.SET_SPINNER, spinner: true },
      { type: StoreActionType.SET_SPINNER_TITLE, spinnerTitle },
    ]);
  }

  public setLoadingProgress(value: number): void {
    this.dispatch({
      type: StoreActionType.SET_SPINNER_PROGRESS,
      spinnerProgress: value,
    });
  }

  public setVolume(volumeSet: VolumeSet, volumeIndex: number, fileName: string): void {
    const actions = [
      { type: StoreActionType.SET_FILENAME, fileName },
      { type: StoreActionType.SET_VOLUME_SET, volumeSet },
      { type: StoreActionType.SET_VOLUME_INDEX, volumeIndex },
      { type: StoreActionType.SET_MODE_3D, mode3d: Modes3d.RAYCAST },
      { type: StoreActionType.SET_MODE_VIEW, viewMode: ViewMode.VIEW_2D },
      { type: StoreActionType.SET_PROGRESS, progress: 0 },
      { type: StoreActionType.SET_SPINNER, spinner: false },
      { type: StoreActionType.SET_IS_LOADED, isLoaded: true },
      { type: StoreActionType.SET_ERR_ARRAY, arrErrors: [] },
    ];

    this.dispatchActions(actions);
  }

  public setSingleDicom(volumeSet: VolumeSet, volumeIndex: number, loaderDicom: LoaderDicom | LoaderHdr | undefined): void {
    const actions = [
      { type: StoreActionType.SET_VOLUME_SET, volumeSet },
      { type: StoreActionType.SET_LOADER_DICOM, loaderDicom },
      { type: StoreActionType.SET_VOLUME_INDEX, volumeIndex },
      { type: StoreActionType.SET_SPINNER, spinner: false },
      { type: StoreActionType.SET_IS_16_BIT, is16bit: true },
      { type: StoreActionType.SET_SHOW_MODAL_CONFIRMATION, showModalConfirmation: true },
    ];

    this.dispatchActions(actions);
  }

  public setDicomLoader(loaderDicom: LoaderDicom): void {
    const actions = [
      { type: StoreActionType.SET_LOADER_DICOM, loaderDicom },
      { type: StoreActionType.SET_DICOM_INFO, dicomInfo: loaderDicom.m_dicomInfo },
    ];

    this.dispatchActions(actions);
  }

  public setVolumeLoadFailed(fileName: string): void {
    const actions = [
      { type: StoreActionType.SET_VOLUME_SET, volume: null },
      { type: StoreActionType.SET_FILENAME, fileName },
      { type: StoreActionType.SET_PROGRESS, progress: 0 },
      { type: StoreActionType.SET_SPINNER, spinner: false },
      { type: StoreActionType.SET_IS_LOADED, isLoaded: false },
    ];

    this.dispatchActions(actions);
  }
}

// Create the singleton instance and freeze it
const mriStoreService = new MRIStoreService();
Object.freeze(mriStoreService);

export default mriStoreService;
