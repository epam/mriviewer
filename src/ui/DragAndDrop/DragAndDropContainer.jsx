import React, { useState } from 'react';
import css from '../Main.module.css';

export const DragAndDropContainer = ({ children }) => {
  const [position, setPosition] = useState({ top: 100, left: 900 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const startDrag = (e) => {
    if (e.target.tagName.toLowerCase() !== 'span') {
      setIsDragging(true);
      setOffset({
        x: e.clientX - position.left,
        y: e.clientY - position.top,
      });
    }
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const handleDrag = (e) => {
    if (isDragging) {
      const x = e.clientX - offset.x;
      const y = e.clientY - offset.y;
      setPosition({ left: x, top: y });
    }
  };

  return (
    <div
      onMouseDown={startDrag}
      onMouseUp={stopDrag}
      onMouseMove={handleDrag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        top: position.top,
        left: position.left,
      }}
      className={css.settings}
    >
      {children}
    </div>
  );
};
