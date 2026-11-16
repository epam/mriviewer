import { useState } from 'react';
import { UIButton } from '../Button/Button';
import ModalUrl from '../Modals/ModalUrl';
import MriViewer from '../../engine/lib/MRIViewer';

export const OpenFromURLComponent = ({ cx }) => {
  const [showModalUrl, setShowModalUrl] = useState(false);

  const onModalUrlShow = () => {
    setShowModalUrl(true);
  };

  const onModalUrlHide = () => {
    setShowModalUrl(false);
  };

  const onClickLoadUrl = (url) => {
    setShowModalUrl(false);
    MriViewer.read(url);
  };

  return (
    <>
      <UIButton icon="link" text="Open From URL" cx={cx} handler={onModalUrlShow} />
      {showModalUrl && <ModalUrl stateVis={showModalUrl} onHide={onModalUrlHide} loadUrl={onClickLoadUrl} />}
    </>
  );
};
