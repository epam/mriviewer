import { ActiveViewService, activeViewService } from './ActiveViewService';
import { GraphicsRenderer2D } from './GraphicsRenderer2D';

export class MultiAxisRenderer {
  // Three instances of GraphicsRenderer2D for each axis
  coronalView: GraphicsRenderer2D;
  sagittalView: GraphicsRenderer2D;
  transverseView: GraphicsRenderer2D;
  activeViewService: ActiveViewService;

  constructor() {
    // Initialize the three renderers
    this.coronalView = new GraphicsRenderer2D();
    this.sagittalView = new GraphicsRenderer2D();
    this.transverseView = new GraphicsRenderer2D();
    this.activeViewService = activeViewService;

    // Set the view basic properties
    this.activeViewService.setAllViews(this.coronalView, this.sagittalView, this.transverseView);
  }

  // Function to initialize and render each axis view
  initializeAndRender(containerId: string) {
    this.coronalView.render(containerId);
    this.sagittalView.render(containerId);
    this.transverseView.render(containerId);

    this.coronalView.canvas.addEventListener('mouseenter', () => this.activeViewService.setActiveView(this.coronalView));
    this.sagittalView.canvas.addEventListener('mouseenter', () => this.activeViewService.setActiveView(this.sagittalView));
    this.transverseView.canvas.addEventListener('mouseenter', () => this.activeViewService.setActiveView(this.transverseView));
  }
}
