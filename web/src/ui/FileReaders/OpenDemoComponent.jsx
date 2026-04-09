import { useState } from 'react';
import { UIButton } from '../Button/Button';
import UiModalDemo from '../Modals/ModalDemo';
import config from '../../config/config';
import MriViwer from '../../engine/lib/MRIViewer';

export const OpenDemoComponent = ({ cx }) => {
  const [showModalDemo, setShowModalDemo] = useState(false);

  const onModalDemoOpenShow = () => {
    setShowModalDemo(true);
  };

  const onModalDemoOpenHide = () => {
    setShowModalDemo(false);
  };

  const onDemoSelected = (index) => {
    const fileUrl = config.demoUrls[index];
    MriViwer.read(fileUrl);
  };

  return (
    <>
      <UIButton icon="grid" text="Demo Data" handler={onModalDemoOpenShow} cx={cx} />
      {showModalDemo && <UiModalDemo stateVis={showModalDemo} onHide={onModalDemoOpenHide} onSelectDemo={onDemoSelected} />}
    </>
  );
};
