import React from 'react';
import { UIButton } from '../Button/Button';
import { Tooltip } from '../Tooltip/Tooltip';

export const BottomMenu = () => {
  return (
    <div className="bottomMenu">
      <Tooltip content="Open file or folder">
        <UIButton icon="folder" />
      </Tooltip>
      <Tooltip content="Open external URL">
        <UIButton icon="link" />
      </Tooltip>
      <Tooltip content="Open demo data">
        <UIButton icon="grid" />
      </Tooltip>
    </div>
  );
};
