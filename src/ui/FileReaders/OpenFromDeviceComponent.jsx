import { useState } from 'react';
import { UIButton } from '../Button/Button';
import { useOnEvent } from '../hooks/useOnEvent';
import UiModalWindowCenterWidth from '../Modals/UiModalWinCW';
import MriViwer from '../../engine/lib/MRIViewer';
import { MriEvents } from '../../engine/lib/enums';

export const OpenFromDeviceComponent = ({ cx, text, type }) => {
  const [showModalWindowCW, setShowModalWindowCW] = useState(false);

  const onHide = () => {
    setShowModalWindowCW(false);
  };

  useOnEvent(MriEvents.FILE_READ_SUCCESS, onHide);

  const onFileSelect = (evt) => {
    MriViwer.read(evt.target.files);
  };

  const onButtonOpenLocalFileClick = (e) => {
    e.preventDefault();
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('hidden', 'true');
    fileSelector.setAttribute('accept', '*');
    fileSelector.setAttribute('multiple', 'true');

    if (type === 'folder') {
      fileSelector.setAttribute('webkitdirectory', 'true');
    }

    document.body.appendChild(fileSelector);

    fileSelector.onchange = onFileSelect;
    fileSelector.click();
  };

  return (
    <>
      <UIButton icon="folder" text={text} cx={cx} handler={onButtonOpenLocalFileClick} />
      {showModalWindowCW && <UiModalWindowCenterWidth stateVis={showModalWindowCW} onHide={onHide} />}
    </>
  );
};
