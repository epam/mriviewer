import { connect } from 'react-redux';
import { OpenFromDeviceButtonComponent, DragAndDropComponent, OpenFromURLComponent, OpenDemoComponent } from '../../FileReaders';
import RecentlyFiles from '../RecentlyFiles/RecentlyFiles';

import css from './SmartContainer.module.css';
import buttonCss from '../../Button/Button.module.css';

const SmartContainer = () => {
  return (
    <div className={css.smart_container}>
      <DragAndDropComponent />
      <p className={css.text}>Drag and drop files here</p>
      <p className={css.text}>OR</p>
      <div className={css.buttons_toolbar}>
        <OpenFromDeviceButtonComponent cx={buttonCss.button_start_screen} />
        <OpenFromURLComponent cx={buttonCss.button_start_screen} />
        <OpenDemoComponent cx={buttonCss.button_start_screen} />
      </div>
      <RecentlyFiles />
    </div>
  );
};

export default connect((store) => store)(SmartContainer);
