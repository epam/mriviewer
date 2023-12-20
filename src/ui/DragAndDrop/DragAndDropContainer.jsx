import React, { useState } from 'react';
import css from '../Main.module.css';

export const DragAndDropContainer = ({ children }) => {
  const [position, setPosition] = useState({ top: 15, right: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const startDrag = (e) => {
    if (e.target.tagName.toLowerCase() !== 'span') {
      const rect = e.currentTarget.getBoundingClientRect();
      setIsDragging(true);
      setOffset({
        x: e.clientX - rect.right,
        y: e.clientY - rect.top,
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
      setPosition({ top: (y / window.innerHeight) * 100, right: ((window.innerWidth - x) / window.innerWidth) * 100 });
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
        top: `${position.top}%`,
        right: `${position.right}%`,
      }}
      className={css.settings}
    >
      {children}
    </div>
  );
};
