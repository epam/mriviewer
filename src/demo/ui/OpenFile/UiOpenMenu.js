/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import VolumeSet from '../../engine/VolumeSet';
import Texture3D from '../../engine/Texture3D';

import StoreActionType from '../../store/ActionTypes';
import ViewModes from '../../store/ViewModes';
import Modes3d from '../../store/Modes3d';

import LoadResult from '../../engine/LoadResult';
import LoaderDicom from '../../engine/loaders/LoaderDicom';

import { ReactComponent as OpenLocalFolderIcon } from "../icons/folder.svg";
import { ReactComponent as OpenLinkIcon } from "../icons/link.svg";
import { ReactComponent as OpenDemoIcon } from "../icons/demo.svg";
import { ReactComponent as OpenLocalFileIcon } from "../icons/file.svg";
import { ReactComponent as DownloadIcon } from "../icons/download.svg";
import { ReactComponent as GetFileIcon } from "../icons/getfile.svg";

import LoaderDcmDaikon from "../../engine/loaders/LoaderDcmDaikon";

import './UiOpenMenu.css';
import { Context } from "../../context/Context";
import Volume from "../../engine/Volume";
import UiDemoMenu from "../UiModalDemo";

const UiOpenMenu = () => {
  const fileInput = useRef(null)
  const dispatch = useDispatch()
  const { context, setContext } = useContext(Context)
  const [fileName, setFileName] = useState('')
  const [file, setFile] = useState()

  const [state, setState] = useState({
    strUrl: '',
    showModalUrl: false,
    showModalDemo: false,
    showModalWindowCW: false,
    onLoadCounter: 1,
    isLoaded: false,
  })

  const finalizeSuccessLoadedVolume = (volumeSet, fileName) => {
    const vol = volumeSet.getVolume(0);
    const texture3d = new Texture3D();

    if (vol.m_dataArray !== null) {
      vol.makeDimensions4x();
      setState({
        ...state,
        isLoaded: true,
        fileName
      })
      texture3d.createFromRawVolume(vol);

      setContext({
        ...context,
        volumeSet,
        texture3d,
        viewMode: ViewModes.VIEW_2D,
        mode3d: Modes3d.RAYCAST
      });
    }
  }

  const setErrorString = (strErr) => {
    dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: false });
    dispatch({ type: StoreActionType.SET_ERR_ARRAY, arrErrors: [strErr] });
    dispatch({ type: StoreActionType.SET_VOLUME_SET, volume: null });
  }

  const hideProgressBar = () => {
    setContext({ ...context, progress: { show: false } });
  }

  const showProgressBar = (ratio, text) => {
    setContext({
      progress: {
        value: ratio,
        text: text
      }
    })
  }

  const finalizeFailedLoadedVolume = (_, fileName, arrErrors) => {
    setState({
      ...state,
      isLoaded: true,
      file: {
        name: fileName,
      }
    })
    setContext({
      ...context,
      volumeSet: {},
      arrErrors
    })
    hideProgressBar();
  }

  const finalizeCallback = (resultCode) => {
    if (resultCode !== LoadResult.SUCCESS) {
      setErrorString(LoadResult.getResultString(resultCode));
    } else if (resultCode === LoadResult.SUCCESS) {
      finalizeSuccessLoadedVolume(context.volumeSet, fileName);
    } else {
      const arrErr = [];
      arrErr.push(LoadResult.getResultString(resultCode));
      finalizeFailedLoadedVolume(context.volumeSet, fileName, arrErr);
    }
  }

  const readSingleDicomCallback = (errCode, volumeSet) => {
    if (errCode === LoadResult.SUCCESS) {
      setContext({
        ...context,
        volumeSet
      })
      setState({ ...state, showModalWindowCW: true });
    }
    finalizeCallback(errCode);
  }

  const onFileReadSingleBuffer = (fileContent) => {
    if (fileName.endsWith('.dcm')) {
      const loaderDcm = new LoaderDcmDaikon();
      const loader = new LoaderDicom(1);
      const ret = loaderDcm.readSingleSlice({ dispatch }, loader, 0, fileName, fileContent);
      readSingleDicomCallback(ret);
      return ret;
    }

    setContext({ ...context, volumeSet: new VolumeSet() });
    context.volumeSet.addVolume(new Volume());

    // add empty [0]-th volume in set to read single file
    // context.volumeSet.addVolume(new Volume())
    if (fileName.endsWith('.ktx')) {
      context.volumeSet.readFromKtx(fileContent, showProgressBar, finalizeCallback);
    } else if (fileName.endsWith('.nii')) {
      context.volumeSet.readFromNifti(fileContent, showProgressBar, finalizeCallback);
    } else if (fileName.endsWith('.dcm')) {
      const m_loader = new LoaderDicom();
      m_loader.m_zDim = 1;
      m_loader.m_numFiles = 1;
      context.volumeSet.readFromDicom(m_loader, fileContent, showProgressBar, readSingleDicomCallback);
      const dicomInfo = m_loader.m_dicomInfo;
      const sliceInfo = dicomInfo.m_sliceInfo[0];
      sliceInfo.fileName = fileName;
      sliceInfo.m_sliceName = 'Slice 0';
      dispatch({ type: StoreActionType.SET_DICOM_INFO, dicomInfo: dicomInfo });
    }
  }

  const unzipGzip = (file, cb) => {
    let m_unzippedBuffer = null;
    setFileName(fileName.slice(0, -3).toLowerCase())
    const zlib = require('zlib');
    const createReadStream = require('filereader-stream');
    const gunzip = zlib.createGunzip();
    createReadStream(file).pipe(gunzip);

    gunzip.on('data', (data) => {
      // progress
      if (m_unzippedBuffer == null) {
        setContext({
          ...context, progress: {
            text: 'Read gzip...',
            value: 0
          }
        })
      } else {
        const readSize = m_unzippedBuffer.length;
        const allSize = file.size;
        const KOEF_DEFLATE = 0.28;
        setContext({
          ...context, progress: {
            text: 'Read gzip...',
            value: Math.floor(readSize * KOEF_DEFLATE / allSize)
          }
        })
      }
      const dataSize = data.length;
      if (m_unzippedBuffer) {
        const dataCollectedSize = m_unzippedBuffer.length;
        const arrNew = new Uint8Array(dataCollectedSize + dataSize);
        arrNew.set(m_unzippedBuffer, 0);
        arrNew.set(data, dataCollectedSize);
        m_unzippedBuffer = arrNew;
      } else {
        m_unzippedBuffer = new Uint8Array(dataSize);
        m_unzippedBuffer.set(data, 0);
      }
    });

    gunzip.on('end', () => {
      hideProgressBar();

      // now all chunks are read. Need to check raw ungzipped buffer
      const sizeBuffer = m_unzippedBuffer.length;
      if (sizeBuffer < 128) {
        console.error('Too small ungzipped data: ' + sizeBuffer.toString() + ' bytes. canat read volume data');
        return;
      }
      // check correct nifti header after extract raw bytes from gzip
      const headTemplate = [0x00, 0x00, 0x01, 0x5c];
      let correctHead0 = true;
      for (let i = 0; i < 4; i++) {
        if (m_unzippedBuffer[i] !== headTemplate[i]) {
          correctHead0 = false;
        }
      }
      let correctHead1 = true;
      for (let i = 0; i < 4; i++) {
        if (m_unzippedBuffer[i] !== headTemplate[3 - i]) {
          correctHead1 = false;
        }
      }
      if (!correctHead0 && !correctHead1) {
        console.error('Wrong nifi header, cant read gzipped file');
        return;
      }
      cb(m_unzippedBuffer);
    });
  }
  useEffect(() => {
    if (file) {
      const fileReader = new FileReader();
      fileReader.addEventListener('load', (e) => {
        onFileReadSingleBuffer(e.target.result);
      });
      fileReader.readAsArrayBuffer(file);
    }
  }, [file])
  const onFileSelected = (evt) => {
    if (evt.target.files === undefined) return;

    const { files } = evt.target;
    setFile(files[0])
    setFileName(files[0].name.toLowerCase())
    if (files.length === 1) {
      if (fileName.endsWith('.gz')) {
        unzipGzip(file, onFileReadSingleBuffer);
      }
    } else {
      if (fileName.endsWith(".dcm")) {
        // const dcmOnlyFiles = files.filter(({ name }) => (name.endsWith(".dcm"));
        // fileReader.onloadend = onFileContentReadMultipleDicom;
      } else if ((fileName.endsWith(".hdr")) || (fileName.endsWith(".img"))) {
        // m_loader = new LoaderHdr();
        // fileReader.onloadend = onFileContentReadMultipleHdr;
      }
    }
  }

  const toggleDemoModal = () => {
    setState({ ...state, showModalDemo: !state.showModalDemo });
  }

  const loadDemo = () => {
    console.error('load demo')
  }
  useEffect(() => {
    console.log(state);
  });
  return <>
    <input
      type='file'
      accept='.ktx,.dcm,.nii,.hdr,.h,.img,.gz'
      multiple
      onChange={onFileSelected}
      style={{ 'display': 'none' }}
      ref={fileInput}
    />
    <div className="open-file__area">
      <div className="left">
        <OpenLocalFileIcon onClick={() => fileInput.current.click()}/>
        <span className="filename">{fileName || 'file_name_displayed_here.dicom'}</span>
      </div>
      <div className="right">
        <OpenLocalFolderIcon/>
        <OpenLinkIcon/>
        <OpenDemoIcon onClick={toggleDemoModal}/>
      </div>
    </div>
    <div className="save-file__area">
      <DownloadIcon/>
      <GetFileIcon/>
    </div>
    {/*<UiDemoMenu onDemo={loadDemo}/>*/}
  </>;

}

export default UiOpenMenu;
