/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useEffect, useRef, useState } from 'react';

import Texture3D from '../../engine/Texture3D';

import ViewModes from '../../store/ViewModes';
import Modes3d from '../../store/Modes3d';

import { ReactComponent as OpenLocalFolderIcon } from "../icons/folder.svg";
import { ReactComponent as OpenLinkIcon } from "../icons/link.svg";
import { ReactComponent as OpenDemoIcon } from "../icons/demo.svg";
import { ReactComponent as OpenLocalFileIcon } from "../icons/file.svg";
import { ReactComponent as DownloadIcon } from "../icons/download.svg";
import { ReactComponent as GetFileIcon } from "../icons/getfile.svg";

import css from './UiOpenMenu.module.css';
import { Context } from "../../context/Context";
import { unzipGzip } from "./ungzip";
import LoadResult from "./LoadResult";
import { FileLoader } from "three";

export const UiOpenMenu = () => {
  const fileInput = useRef(null)
  const { context, setContext } = useContext(Context)
  const [fileName, setFileName] = useState('')
  const [file, setFile] = useState()

  const onFileLoad = (arrayBuffer) => {
    if (fileName.endsWith('.gz')) {
      unzipGzip(file, onFileLoad);
    }
    
    const texture3d = new Texture3D();
    
    texture3d.createFromRawVolume(context.volumeSet[0]);
    
    setContext({
      ...context,
      texture3d,
      viewMode: ViewModes.VIEW_2D,
      mode3d: Modes3d.RAYCAST
    });

    if (fileName.endsWith('.ktx')) {
      return setContext({ ...context, volumeSet: [{ m_dataArray: arrayBuffer }] })
    }
  }

  const onFileSelected = (evt) => {
    if (evt.target.files === undefined) return;

    const { files } = evt.target;
    setFile(files[0])
    setFileName(files[0].name.toLowerCase())
  }

  useEffect(() => {
    if (file) {
      const fileReader = new FileReader();
      fileReader.addEventListener('load', (e) => {
        onFileLoad(e.target.result);
        
      });
      fileReader.readAsArrayBuffer(file);
    }
  }, [file])

  return <>
    <input
      type='file'
      accept='.ktx,.gz'
      onChange={onFileSelected}
      style={{ 'display': 'none' }}
      ref={fileInput}
    />
    <div className={css["open-file__area"]}>
      <div className="left">
        <OpenLocalFileIcon onClick={() => fileInput.current.click()}/>
        <span className="filename">{fileName || 'file_name_displayed_here.dicom'}</span>
      </div>
      <div className="right">
        <OpenLocalFolderIcon/>
        <OpenLinkIcon/>
        <OpenDemoIcon onClick={() => {}}/>
      </div>
    </div>
    <div className={css["save-file__area"]}>
      <DownloadIcon/>
      <GetFileIcon/>
    </div>
  </>
}
