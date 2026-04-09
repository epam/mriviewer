import { Modal, ModalBody, ModalHeader } from './ModalBase';
import { OpenFromDeviceComponent, DragAndDropComponent } from '../FileReaders';
import css from './Modals.module.css';
import buttonCss from '../Button/Button.module.css';

export const ModalSelectFile = (props) => {
  const { stateVis, onHide } = props;

  return (
    <Modal isOpen={stateVis} close={onHide}>
      <ModalHeader title="Select MRI files from local" close={onHide} />
      <ModalBody>
        <div className={css.select_file_wrapper}>
          <DragAndDropComponent />

          <div className={css.select_file_row}>
            <OpenFromDeviceComponent text="Open File" type="file" cx={buttonCss.button_select_file} />
            <OpenFromDeviceComponent text="Open Folder" type="folder" cx={buttonCss.button_select_file} />
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default ModalSelectFile;
