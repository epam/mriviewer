/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useEffect, useRef, useState } from 'react';

import Texture3D from '../../demo/engine/Texture3D';

import { ReactComponent as OpenLocalFolderIcon } from "../icons/folder.svg";
import { ReactComponent as OpenLinkIcon } from "../icons/link.svg";
import { ReactComponent as OpenDemoIcon } from "../icons/demo.svg";
import { ReactComponent as DownloadIcon } from "../icons/download.svg";
import { ReactComponent as GetFileIcon } from "../icons/getfile.svg";

import css from './UiOpenMenu.module.css';
import { Context } from "../../context/Context";
import { unzipGzip } from "./ungzip";
import { UIButton } from "../Button/Button";
import { Volume } from "../../demo/engine/Volume";
import { LoadKtxFromBuffer } from "../../demo/engine/loaders/LoaderKtx";

export const UiOpenMenu = () => {
    const fileInput = useRef(null)
    const { context, setContext } = useContext(Context)
    const [fileName, setFileName] = useState('')
    const [file, setFile] = useState()

    const onFileLoad = async (arrayBuffer) => {
        if (fileName.endsWith('.gz')) {
            const unzippedFile = await unzipGzip(file);
            await onFileLoad(unzippedFile)
        }

        if (fileName.endsWith('.ktx')) {
            const ktxVolume = { ...(new Volume()), ...LoadKtxFromBuffer(arrayBuffer, context) }

            setContext({
                ...context,
                volumeSet: [ktxVolume],
                texture3d: (new Texture3D()).createFromRawVolume(ktxVolume)
            })
        }
    }

    const onFileSelected = (evt) => {
        if (evt.target.files === undefined) return;

        const { files } = evt.target;
        setFile(files[0])
        setFileName(files[0].name.toLowerCase())
    }

    useEffect( () => {
        if (file) {
            const fileReader = new FileReader();
            fileReader.addEventListener('load', async (e) => {
                await onFileLoad(e.target.result);
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
                <UIButton icon="file" handler={() => fileInput.current.click()}/>
                <span className="filename">{fileName}</span>
            </div>
            <div className="right">
                <OpenLocalFolderIcon/>
                <OpenLinkIcon/>
                <OpenDemoIcon onClick={() => {
                }}/>
            </div>
        </div>
        <div className={css["save-file__area"]}>
            <DownloadIcon/>
            <GetFileIcon/>
        </div>
    </>
}
