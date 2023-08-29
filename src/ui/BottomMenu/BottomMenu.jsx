import React from 'react';
import { UIButton } from '../Button/Button';
import { Tooltip } from '../Tooltip/Tooltip';
import css from './BottomMenu.module.css';

export const BottomMenu = () => {
  return (
    <div className={css.bottomMenu}>
      <Tooltip content="Download">
        <UIButton cx={css.button} text="Download" icon="download" />
      </Tooltip>
      <Tooltip content="Export report">
        <UIButton cx={css.button} text="Export report" icon="report" />
      </Tooltip>
      <Tooltip content="Open">
        <UIButton cx={css.button} text="Open" icon="folder" />
      </Tooltip>
      <Tooltip content="Close">
        <UIButton cx={css.button} text="Close" icon="clear" />
      </Tooltip>
    </div>
  );
};
