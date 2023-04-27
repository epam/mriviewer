import React, { useCallback, useState } from 'react';
import css from '../Main.module.css';
import { DnDItemTypes } from '../Constants/DnDItemTypes';
import { useDrag } from 'react-dnd';

export const DragAndDropContainer = ({ children }) => {
  const [position, setPosition] = useState({ top: 100, left: null });
  const [isCanDrag, setIsCanDrag] = useState(false);

  const checkEventTagName = useCallback(
    (e) => {
      e.target.tagName === 'DIV' ? setIsCanDrag(true) : setIsCanDrag(false);
    },
    [isCanDrag, setIsCanDrag]
  );

  const getLeftPositionSettings = useCallback(
    (e) => {
      if (position.left === null) {
        setPosition({
          top: position.top,
          left: window.innerWidth - e.currentTarget.offsetWidth - 25,
        });
      }
    },
    [position]
  );

  const [{ isDragging }, drag, dragPreview] = useDrag(
    () => ({
      type: DnDItemTypes.SETTINGS,
      item: { left: position.left, top: position.top, isCanDrag },
      options: {
        dropEffect: 'move',
      },
      end: (item, monitor) => {
        const { x, y } = monitor.getDropResult();
        const top = Math.round(item.top + y);
        const left = Math.round(item.left + x);
        setPosition({ top, left });
      },
      canDrag: () => {
        return isCanDrag;
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [position.left, position.top, isCanDrag]
  );

  return isDragging ? (
    <div style={{ display: 'none' }} ref={dragPreview}>
      {children}
    </div>
  ) : (
    <div
      ref={drag}
      onMouseDown={getLeftPositionSettings}
      onMouseMove={checkEventTagName}
      style={{
        cursor: isCanDrag ? 'move' : 'default',
        top: position.top,
        left: position.left,
      }}
      className={css.settings}
    >
      {children}
    </div>
  );
};
