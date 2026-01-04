import React from 'react';
import { MultiAxisRenderer } from '../engine/lib/core/graphics/MultiAxisRenderer';
import css from './Graphics2d.module.css';

class Graphics2d extends React.Component {
  constructor() {
    super();
    this.graphicsRenderer = new MultiAxisRenderer();
  }

  componentDidMount() {
    this.graphicsRenderer.initializeAndRender('canvas-container');
  }

  render() {
    return (
      <div id="canvas-container" className={css.wrapper3axis}>
        {/* Canvas will be inserted here by GraphicsRenderer2D */}
      </div>
    );
  }
}

export default Graphics2d;
