import React from 'react';
import css from './StartScreen.module.css';
import SmartContainer from './SmartContainer/SmartContainer';
import { SVG } from '../Button/SVG';
import { GithubLink } from '../GithubLink/GithubLink';

const StartScreen = () => {
  return (
    <div className={css.screen}>
      <SVG name="logo2" width={120} height={115} />
      <h1 className={css.header_text}>MRI Viewer</h1>
      <div className={css.subheader}>
        <GithubLink width={25} height={25} />
        <h3 className={css.subheader_text}>Open Source 2D/3D viewer developed by EPAM Systems. Supports DICOM, NIFTI, KTX, HDR.</h3>
      </div>

      <div className={css.container}>
        <SmartContainer />
      </div>
    </div>
  );
};

export default StartScreen;
