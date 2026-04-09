import { MRIReader, mriReader } from './core/readers';
import { MRIEventsService } from './services';
import mriEventsService from './services/EventsService';

export class MRIViwer {
  public mriReader: MRIReader;
  public events: MRIEventsService;

  constructor() {
    this.events = mriEventsService;
    this.mriReader = mriReader;
  }

  read(data: File[] | string): void {
    this.mriReader.read(data);
  }
}

// Create the singleton instance and freeze it
const MriViwer = new MRIViwer();
Object.freeze(MriViwer);

export default MriViwer;
