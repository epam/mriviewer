import { useDispatch, useSelector } from 'react-redux';
import StoreActionType from '../../../store/ActionTypes';
import { UiVolIcon } from './UiVolIcon';
import { activeViewService } from '../../../engine/lib/core/graphics/ActiveViewService';

import css from './SelectVolumeProperty.module.css';

const SelectVolumeProperty = (props) => {
  const cssClass = props.className;
  const dispatch = useDispatch();
  const { volumeSet, volumeIndex } = useSelector((store) => store);

  const onClickRow = (volumeIndex) => {
    dispatch({ type: StoreActionType.SET_VOLUME_INDEX, volumeIndex });
    activeViewService.setActiveVolume();
  };

  return (
    <div className={`${css.selectVolumeWrapper} ${cssClass}`}>
      <h2 className={css.selectVolumeTitle}>Select previously uploaded volume</h2>
      {volumeSet.m_volumes.map((_, i) => {
        return i !== volumeIndex ? (
          <p className={css.selectVolumeItem} key={i} onClick={() => onClickRow(i)}>
            <UiVolIcon index={i} />
            <span>Volume number {i + 1}</span>
          </p>
        ) : null;
      })}
    </div>
  );
};

export default SelectVolumeProperty;
