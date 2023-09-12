import React, { useState } from 'react';
import css from './MobileSettings.module.css';
import { Tooltip } from '../Tooltip/Tooltip';
import { UIButton } from '../Button/Button';
import { SVG } from '../Button/SVG';
import { LeftToolbar } from '../LeftToolbar/LeftToolbar';
import { RightPanel } from '../Panels/RightPanel';
import { TopToolbar } from '../TopToolbar/TopToolbar';

export const MobileSettings = () => {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [is2DMenuOpen, setIs2DMenuOpen] = useState(false);
  const [isCursorMenuOpen, setIsCursorMenuOpen] = useState(false);

  const toggleSettingsMenu = () => {
    setIsSettingsMenuOpen(!isSettingsMenuOpen);
    setIs2DMenuOpen(false); // Закрываем другие меню при открытии этого
    setIsCursorMenuOpen(false);
  };

  const toggle2DMenu = () => {
    setIs2DMenuOpen(!is2DMenuOpen);
    setIsSettingsMenuOpen(false); // Закрываем другие меню при открытии этого
    setIsCursorMenuOpen(false);
  };

  const toggleCursorMenu = () => {
    setIsCursorMenuOpen(!isCursorMenuOpen);
    setIsSettingsMenuOpen(false); // Закрываем другие меню при открытии этого
    setIs2DMenuOpen(false);
  };
  return (
    <div className={css.settings__menu}>
      <Tooltip>
        <UIButton icon="settings-linear" cx={css['settings__menu__button']} onClick={toggleSettingsMenu}>
          <SVG name="settings-linear" width={42} height={42} />
        </UIButton>
      </Tooltip>
      <Tooltip>
        <UIButton icon="2D" cx={css['settings__menu__button']} onClick={toggle2DMenu}>
          <SVG name="2D" width={42} height={42} />
        </UIButton>
      </Tooltip>
      <Tooltip>
        <UIButton icon="cursor" cx={css['settings__menu__button']} onClick={toggleCursorMenu}>
          <SVG name="cursor" width={42} height={42} />
        </UIButton>
      </Tooltip>
      {isSettingsMenuOpen && <LeftToolbar />}
      {is2DMenuOpen && <RightPanel />}
      {isCursorMenuOpen && <TopToolbar />}
    </div>
  );
};
