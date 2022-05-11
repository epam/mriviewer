import React, { useState } from 'react';
import css from './ImplementStartScreen.module.css';
import { SVG } from '../Button/SVG';

const ImplementStartScreen = () => {
  const [fileList, setFileList] = useState([]);

  const onFileDrop = (e) => {
    setFileList([...fileList, e.dataTransfer.files]);
  };
  console.log(fileList);
  return (
    <div className={css.startScreen}>
      <svg className={css.svg} width="120" height="115" viewBox="0 0 120 115" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M31.2463 51.4078V0H33.9341V52.5211L1.24401 85.2113L0 82.6541L31.2463 51.4078Z" fill="white" />
        <path d="M15.3184 114.142L54.6494 74.8109H120L118.692 72.1231H53.5361L14.0744 111.585L15.3184 114.142Z" fill="white" />
        <path d="M11.7998 106.909L51.0657 67.6434H116.513L115.206 64.9556H49.9523L10.5558 104.352L11.7998 106.909Z" fill="white" />
        <path
          d="M8.28121 99.6766L47.4819 60.4759H113.026L111.719 57.7881H48.2692V0H45.5813V58.5753L7.03719 97.1195L8.28121 99.6766Z"
          fill="white"
        />
        <path d="M4.76261 92.4439L41.1016 56.1049V0H38.4138V54.9916L3.5186 89.8868L4.76261 92.4439Z" fill="white" />
        <path d="M109.539 53.3084L108.232 50.6206H55.4367V0H52.7489V53.3084H109.539Z" fill="white" />
        <path d="M106.052 46.1409L104.745 43.453H62.6042V0H59.9164V46.1409H106.052Z" fill="white" />
      </svg>
      <h1>Med3Web DICOM viewer</h1>
      <div className={css.container}>
        <svg width="49" height="49" viewBox="0 0 49 49" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 7V3H1V1H3V0H7V1H13V0H17V1H23V0H27V1H33V0H37V1H39V3H40V7H39V13H40V17H39V23H40V27H39V33H40V37H39V39H37V40H33V39H27V40H23V39H17V40H13V39H7V40H3V39H1V37H0V33H1V27H0V23H1V17H0V13H1V7H0Z"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <path d="M10 10H48V48H10V10Z" stroke="white" strokeWidth="2" />
        </svg>
        <span className={css.span}>Drag and Drop files here</span>
        <span className={css.span}>OR</span>
        <div className={css.rowButtons}>
          <div className={css.ButtonWrapper}>
            <SVG name="folder" />
            Open file...
          </div>
          <div className={css.ButtonWrapper}>
            <SVG name="link" />
            Open link...
          </div>
          <div className={css.ButtonWrapper}>
            <SVG name="grid" />
            Open model...
          </div>
        </div>
        <div className={css.rowHistory}>
          <span className={css.historyTitle}>Recently opened files:</span>
          <div>
            <span className={css.historyDescription}>29 minute ago</span>
            <span className={css.historyDescriptionFile}>login.jpg</span>
          </div>
          <div>
            <span className={css.historyDescription}>30 minute ago</span>
            <span className={css.historyDescriptionFile}>login.jpg</span>
          </div>
        </div>
        <input type="file" onDrop={onFileDrop} />
      </div>
    </div>
  );
};

export default ImplementStartScreen;
