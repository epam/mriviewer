export class MRIConfigService {
  get config(): any {
    return {};
  }
}

// Create the singleton instance and freeze it
const mriEventsService = new MRIConfigService();
Object.freeze(mriEventsService);

// Export the MRIEventsService singleton instance
export default mriEventsService;
