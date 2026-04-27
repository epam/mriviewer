import React, { useRef, useState } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ModalBase';
import { UIButton } from '../Button/Button';

import css from './Modals.module.css';
import buttonCss from '../Button/Button.module.css';

export const ModalUrl = (props) => {
  const { stateVis, onHide, loadUrl } = props;
  const inputRef = useRef();

  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const validateUrl = (url) => {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?' + // port
        '(\\/[-a-z\\d%_.~+]*)*' + // path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i'
    ); // fragment locator

    return !!pattern.test(url);
  };

  const handleSubmit = () => {
    const url = inputRef.current.value;

    if (validateUrl(url)) {
      setIsValid(true);
      setErrorMessage('');
      loadUrl(url);
    } else {
      setIsValid(false);
      setErrorMessage('Invalid URL. Please enter a valid URL.');
    }
  };

  return (
    <Modal isOpen={stateVis} close={onHide}>
      <ModalHeader title="Load MRI from external source via URL" close={onHide} />
      <ModalBody>
        <div className={css.body_wrapper}>
          <label htmlFor="input-url" className={css.label}>
            <p className={css.label_text}>Please provide direct extension-ended URL to the file.</p>
            <p className={css.label_text}>Example: "https://domain.com/file.dcm".</p>
          </label>
          <input id="input-url" ref={inputRef} placeholder="Enter URL" className={`${css.input} ${!isValid ? css.invalid : ''}`} />
          {!isValid && <p className={css.error}>{errorMessage}</p>}
        </div>
      </ModalBody>
      <ModalFooter>
        <UIButton caption="Submit" cx={buttonCss.apply} handler={handleSubmit} />
      </ModalFooter>
    </Modal>
  );
};

export default ModalUrl;
