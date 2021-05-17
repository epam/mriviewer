/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext } from "react";
import { Context } from "../../context/Context";

export const unzipGzip = (file) => {
  const { context, setContext } = useContext(Context)
  let m_unzippedBuffer = null;
  const zlib = require('zlib');
  const createReadStream = require('filereader-stream');
  const gunzip = zlib.createGunzip();
  createReadStream(file).pipe(gunzip);
  
  gunzip.on('data', (data) => {
    // progress
    if (m_unzippedBuffer === null) {
      setContext({
        ...context, progress: {
          text: 'Read gzip...',
          value: 0,
          show: true
        }
      })
    } else {
      const readSize = m_unzippedBuffer.length;
      const allSize = file.size;
      const KOEF_DEFLATE = 0.28;
      setContext({
        ...context, progress: {
          text: 'Read gzip...',
          value: Math.floor(readSize * KOEF_DEFLATE / allSize),
          show: true
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
    setContext({
      ...context, progress: {
        text: '',
        value: 100,
        show: false
      }
    })
  });
}
