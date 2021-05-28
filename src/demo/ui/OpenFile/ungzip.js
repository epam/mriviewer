/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

function setProgress(progress = 0) {
    console.log('loading progress: ' + progress);
}

export const unzipGzip = (file) => {
    let m_unzippedBuffer = null;
    const zlib = require('zlib');
    const createReadStream = require('filereader-stream');
    const gunzip = zlib.createGunzip();
    createReadStream(file).pipe(gunzip);
    let dataSize = 0;
    m_unzippedBuffer = new Uint8Array(dataSize);
    m_unzippedBuffer.set([], 0);

    return new Promise((resolve, reject) => {
        gunzip
            .on('data', (data) => {
                const allSize = file.size;
                const KOEF_DEFLATE = 0.28;
                const dataCollectedSize = m_unzippedBuffer.length;
                setProgress(Math.floor(dataCollectedSize * KOEF_DEFLATE / allSize))
                dataSize = data.length;
                const arrNew = new Uint8Array(dataCollectedSize + dataSize);
                arrNew.set(m_unzippedBuffer, 0);
                arrNew.set(data, dataCollectedSize);
                m_unzippedBuffer = arrNew;
            })
            .on('end', () => {
                resolve(m_unzippedBuffer);
            })
            .on('error', (err) => {
                reject(err);
            })

    });
}
