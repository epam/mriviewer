import React from 'react';
import { useDispatch } from 'react-redux';

import { connect } from 'react-redux';
import StoreActionType from '../../store/ActionTypes';
import { Container } from '../Layout/Container';
import { Tooltip } from '../Tooltip/Tooltip';
import { UIButton } from '../Button/Button';

const PositionTool3D = () => {
  const dispatch = useDispatch();

  const positionReset = () => {
    dispatch({ type: StoreActionType.SET_DEFAULT_3D_POSITION, isDefault3dPosition: true });
  };

  return (
    <Container direction="vertical">
      <Tooltip content="Default position">
        <UIButton icon="position" handler={positionReset} />
      </Tooltip>
    </Container>
  );
};

export default connect((store) => store)(PositionTool3D);
