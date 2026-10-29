import { MRIReader, mriReaderInstance } from './core/readers';
import { MRIEventsService } from './services';
import mriEventsService from './services/EventsService';

export class MRIViewer {
  public mriReader: MRIReader;
  public events: MRIEventsService;

  constructor() {
    this.events = mriEventsService;
    this.mriReader = mriReaderInstance;
  }

  read(data: File[] | string): void {
    this.mriReader.read(data);
  }
}

// Create the singleton instance and freeze it
const MriViewerInstance = new MRIViewer();
Object.freeze(MriViewerInstance);

export default MriViewerInstance;
