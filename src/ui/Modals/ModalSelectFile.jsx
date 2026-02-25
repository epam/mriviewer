import { Modal, ModalBody, ModalHeader } from './ModalBase';
import { OpenFromDeviceComponent, DragAndDropComponent } from '../FileReaders';
import css from './Modals.module.css';
import buttonCss from '../Button/Button.module.css';
import { TEST_IDS } from '../../utils/testIds.js';

export const ModalSelectFile = (props) => {
  const { stateVis, onHide } = props;

  return (
    <Modal isOpen={stateVis} close={onHide} testId={TEST_IDS.OPEN_FROM_DEVICE_MODAL}>
      <ModalHeader title="Select MRI files from local" close={onHide} />
      <ModalBody>
        <div className={css.select_file_wrapper}>
          <DragAndDropComponent />

          <div className={css.select_file_row}>
            <OpenFromDeviceComponent
              text="Open File"
              type="file"
              testId={TEST_IDS.OPEN_FILE_FROM_DEVICE_BUTTON}
              cx={buttonCss.button_select_file}
            />
            <OpenFromDeviceComponent text="Open Folder" type="folder" cx={buttonCss.button_select_file} />
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default ModalSelectFile;
