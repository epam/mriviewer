import React, { useState, useEffect, useRef } from 'react';
import css from './MobileSettings.module.css';
import { UIButton } from '../Button/Button';
import { SVG } from '../Button/SVG';
import { TopToolbar } from '../TopToolbar/TopToolbar';
import { LeftToolbar } from '../LeftToolbar/LeftToolbar';
import { Mode2dSettingsPanel } from '../Panels/Mode2dSettingsPanel';

export const MobileSettings = () => {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [is2DMenuOpen, setIs2DMenuOpen] = useState(false);
  const [isCursorMenuOpen, setIsCursorMenuOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.matchMedia('(max-width: 768px)').matches);
  const [isMenuHidden, setIsMenuHidden] = useState(false);

  const containerRef = useRef(null);
  const pressTimer = useRef(null);
  const toggleSettingsMenu = () => {
    setIsSettingsMenuOpen(!isSettingsMenuOpen);
    setIs2DMenuOpen(false);
    setIsCursorMenuOpen(false);
  };
  const toggle2DMenu = () => {
    setIs2DMenuOpen(!is2DMenuOpen);
    setIsSettingsMenuOpen(false);
    setIsCursorMenuOpen(false);
  };
  const toggleCursorMenu = () => {
    setIsCursorMenuOpen(!isCursorMenuOpen);
    setIsSettingsMenuOpen(false);
    setIs2DMenuOpen(false);
  };
  const closeAllMenu = () => {
    setIsSettingsMenuOpen(false);
    setIs2DMenuOpen(false);
    setIsCursorMenuOpen(false);
  };

  useEffect(() => {
    const onLongPress = () => {
      setIsMenuHidden((current) => !current);
      closeAllMenu();
    };
    const startPress = () => {
      pressTimer.current = setTimeout(() => {
        onLongPress();
      }, 1000);
    };
    const endPress = () => {
      clearTimeout(pressTimer.current);
    };
    document.addEventListener('touchstart', startPress);
    document.addEventListener('touchend', endPress);

    return () => {
      document.removeEventListener('touchstart', startPress);
      document.removeEventListener('touchend', endPress);
    };
  }, []);
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.matchMedia('(max-width: 768px)').matches);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  return isSmallScreen ? (
    <div className={`${css.settings__menu} ${isMenuHidden ? css.hidden : css.settings__menu}`} ref={containerRef}>
      <div className={css.buttons__container}>
        <UIButton icon="settings-linear" cx={css['settings__menu__button']} handler={toggleSettingsMenu} testId={'buttonSettingsLinear'}>
          <SVG name="settings-linear" width={42} height={42} />
        </UIButton>
        <UIButton icon="2D" cx={`${css['settings__menu__button']} ${css.hide}`} handler={toggle2DMenu} testId={'button2D'}>
          <SVG name="2D" width={42} height={42} />
        </UIButton>
        <UIButton icon="cursor" cx={css['settings__menu__button']} handler={toggleCursorMenu} testId={'buttonCursor'}>
          <SVG name="cursor" width={42} height={42} />
        </UIButton>
      </div>
      {isSettingsMenuOpen && (
        <div className={css.settings__menu_block + ' ' + css.flex}>
          <Mode2dSettingsPanel />
        </div>
      )}
      {(is2DMenuOpen || !isSmallScreen) && (
        <div className={css.settings__menu_block}>
          <LeftToolbar />
        </div>
      )}
      {isCursorMenuOpen && (
        <div className={css.settings__menu_block + ' ' + css.horizontal}>
          <TopToolbar />
        </div>
      )}
    </div>
  ) : (
    <div className={`${css.settings__menu} ${isMenuHidden ? css.hidden : css.settings__menu}`} ref={containerRef}>
      <div className={css.buttons__container}>
        <UIButton icon="settings-linear" cx={css['settings__menu__button']} handler={toggleSettingsMenu} testId={'buttonSettingsLinear'}>
          <SVG name="settings-linear" width={42} height={42} />
        </UIButton>
        <UIButton icon="cursor" cx={css['settings__menu__button']} handler={toggleCursorMenu} testId={'buttonCursor'}>
          <SVG name="cursor" width={42} height={42} />
        </UIButton>
      </div>
      {isSettingsMenuOpen && (
        <div className={css.settings__menu_block + ' ' + css.flex}>
          <Mode2dSettingsPanel />
        </div>
      )}
      {isCursorMenuOpen && (
        <div className={css.settings__menu_block + ' ' + css.horizontal}>
          <TopToolbar />
        </div>
      )}
    </div>
  );
};
/*
    <div className={`${css.settings__menu} ${isMenuHidden ? css.hidden : css.settings__menu}`} ref={containerRef}>
      <div className={css.buttons__container}>
        <UIButton icon="settings-linear" cx={css['settings__menu__button']} handler={toggleSettingsMenu} testId={'buttonSettingsLinear'}>
          <SVG name="settings-linear" width={42} height={42} />
        </UIButton>
        {isSmallScreen && (
          <UIButton icon="2D" cx={`${css['settings__menu__button']} ${css.hide}`} handler={toggle2DMenu} testId={'button2D'}>
            <SVG name="2D" width={42} height={42} />
          </UIButton>
        )}
        <UIButton icon="cursor" cx={css['settings__menu__button']} handler={toggleCursorMenu} testId={'buttonCursor'}>
          <SVG name="cursor" width={42} height={42} />
        </UIButton>
      </div>
      {isSettingsMenuOpen && (
        <div className={css.settings__menu_block + ' ' + css.flex}>
          <Mode2dSettingsPanel />
        </div>
      )}
      {(is2DMenuOpen || !isSmallScreen) && (
        <div className={css.settings__menu_block}>
          <LeftToolbar />
        </div>
      )}
      {isCursorMenuOpen && (
        <div className={css.settings__menu_block + ' ' + css.horizontal}>
          <TopToolbar />
        </div>
      )}
    </div>
  );*/
