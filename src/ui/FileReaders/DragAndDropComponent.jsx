import { useState } from 'react';
import css from './DragAndDrop.module.css';
import { SVG } from '../Button/SVG';
import MriViwer from '../../engine/lib/MRIViewer';

const IMG_DROPZONE_SIZE = 49;

export const DragAndDropComponent = () => {
  const [isActiveDnd, setIsActiveDnd] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsActiveDnd(false);

    const files = e.dataTransfer.files;
    MriViwer.read(files);
  };

  return (
    <>
      <SVG name="dropzone" width={IMG_DROPZONE_SIZE} height={IMG_DROPZONE_SIZE} />
      <div
        className={isActiveDnd ? `${css.dropzone} ${css.dropzone_active}` : css.dropzone}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsActiveDnd(true)}
        onDragLeave={() => setIsActiveDnd(false)}
        onDrop={handleDrop}
      ></div>
    </>
  );
};
