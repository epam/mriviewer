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
  const containerRef = useRef(null);
  const toggleSettingsMenu = () => {
    setIsSettingsMenuOpen(!isSettingsMenuOpen);
    console.log('Toggle Settings Menu');
    setIs2DMenuOpen(false); // Закрываем другие меню при открытии этого
    setIsCursorMenuOpen(false);
  };

  const toggle2DMenu = () => {
    setIs2DMenuOpen(!is2DMenuOpen);
    console.log('Toggle Settings Menu');
    setIsSettingsMenuOpen(false); // Закрываем другие меню при открытии этого
    setIsCursorMenuOpen(false);
  };

  const toggleCursorMenu = () => {
    setIsCursorMenuOpen(!isCursorMenuOpen);
    console.log('Toggle Settings Menu');
    setIsSettingsMenuOpen(false); // Закрываем другие меню при открытии этого
    setIs2DMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      console.log('click');
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsSettingsMenuOpen(false);
        setIs2DMenuOpen(false);
        setIsCursorMenuOpen(false);
        console.log(is2DMenuOpen, isCursorMenuOpen, isSettingsMenuOpen);
      }
    };

    const containerElement = containerRef.current; // Сохраните ссылку на контейнер

    // Добавьте слушателя события click к контейнеру
    containerElement.addEventListener('click', handleClickOutside);

    return () => {
      // Удалите слушателя события click при размонтировании компонента
      containerElement.removeEventListener('click', handleClickOutside);
    };
  }, []);
  return (
    <div className={css.settings__menu} ref={containerRef}>
      <div className={css.buttons__container}>
        <UIButton icon="settings-linear" cx={css['settings__menu__button']} handler={toggleSettingsMenu}>
          <SVG name="settings-linear" width={42} height={42} />
        </UIButton>
        <UIButton icon="2D" cx={css['settings__menu__button']} handler={toggle2DMenu}>
          <SVG name="2D" width={42} height={42} />
        </UIButton>
        <UIButton icon="cursor" cx={css['settings__menu__button']} handler={toggleCursorMenu}>
          <SVG name="cursor" width={42} height={42} />
        </UIButton>
      </div>
      {isSettingsMenuOpen && (
        <div className={css.settings__menu_block + ' ' + css.flex}>
          <Mode2dSettingsPanel />
        </div>
      )}
      {is2DMenuOpen && (
        <div className={css.settings__menu_block}>
          <LeftToolbar />
        </div>
      )}
      {isCursorMenuOpen && (
        <div className={css.settings__menu_block}>
          <TopToolbar />
        </div>
      )}
    </div>
  );
};
