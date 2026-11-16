import { UIButton } from '../Button/Button';
// import { useOnEvent } from '../hooks/useOnEvent';
import MriViewer from '../../engine/lib/MRIViewer';
import { TEST_IDS } from '../../utils/testIds.js';
// import { MriEvents } from '../../engine/lib/enums';

export const OpenFromDeviceComponent = ({ cx, text, type, testId }) => {
  const onFileSelect = (evt) => {
    MriViewer.read(evt.target.files);
  };

  const onButtonOpenLocalFileClick = (e) => {
    e.preventDefault();
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('hidden', 'true');
    fileSelector.setAttribute('accept', '*');
    fileSelector.setAttribute('multiple', 'true');
    fileSelector.setAttribute('data-testid', TEST_IDS.OPEN_FROM_DEVICE_INPUT);

    if (type === 'folder') {
      fileSelector.setAttribute('webkitdirectory', 'true');
    }

    document.body.appendChild(fileSelector);

    fileSelector.onchange = onFileSelect;
    fileSelector.click();
  };

  return (
    <>
      <UIButton icon="folder" text={text} testId={testId} cx={cx} handler={onButtonOpenLocalFileClick} />
    </>
  );
};
