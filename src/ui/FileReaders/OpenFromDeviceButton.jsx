import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { UIButton } from '../Button/Button';
import ModalSelectFile from '../Modals/ModalSelectFile';
import { useOnEvent } from '../hooks/useOnEvent';
import { MriEvents } from '../../engine/lib/enums';
import StoreActionType from '../../store/ActionTypes';

export const OpenFromDeviceButtonComponent = ({ cx }) => {
  const [showOpenFromDeviceModal, setShowOpenFromDeviceModal] = useState(false);
  const dispatch = useDispatch();
  const { showModalSelectFiles } = useSelector((state) => state);

  const onHide = () => {
    setShowOpenFromDeviceModal(false);
  };

  useOnEvent(MriEvents.FILE_READ_SUCCESS, onHide);

  const onButtonOpenLocalFileClick = () => {
    setShowOpenFromDeviceModal(true);
    dispatch({ type: StoreActionType.SET_SHOW_MODAL_SELECT_FILES, showModalSelectFiles: true });
  };

  return (
    <>
      <UIButton icon="folder" text="Open From Device" cx={cx} handler={onButtonOpenLocalFileClick} />
      {showOpenFromDeviceModal && <ModalSelectFile stateVis={showModalSelectFiles} onHide={onHide} />}
    </>
  );
};
