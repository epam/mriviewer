import { useState } from 'react';
import { UIButton } from '../Button/Button';
import ModalSelectFile from '../Modals/ModalSelectFile';
import { useOnEvent } from '../hooks/useOnEvent';
import { MriEvents } from '../../engine/lib/enums';

export const OpenFromDeviceButtonComponent = ({ cx }) => {
  const [showOpenFromDeviceModal, setShowOpenFromDeviceModal] = useState(false);

  const onHide = () => {
    setShowOpenFromDeviceModal(false);
  };

  useOnEvent(MriEvents.FILE_READ_SUCCESS, onHide);

  const onButtonOpenLocalFileClick = () => {
    setShowOpenFromDeviceModal(true);
  };

  return (
    <>
      <UIButton icon="folder" text="Open From Device" cx={cx} handler={onButtonOpenLocalFileClick} />
      {showOpenFromDeviceModal && <ModalSelectFile stateVis={showOpenFromDeviceModal} onHide={onHide} />}
    </>
  );
};
