import Volume from '../../Volume';
import VolumeSet from '../../VolumeSet';

export class MRIVolumeService {
  // VolumeData
  volumeSet = new VolumeSet();
  volumeIndex: number = 0;

  addNewVolume(): void {
    if (this.volumeSet.getNumVolumes() !== 0) {
      this.volumeIndex = this.volumeIndex + 1;
    }
    this.volumeSet.addVolume(new Volume());
  }

  getActiveVolume(): Volume {
    return this.volumeSet.getVolume(this.volumeIndex);
  }
}

// Create the singleton instance and freeze it
const mriVolumeService = new MRIVolumeService();

// Export the MRIEventsService singleton instance
export default mriVolumeService;
