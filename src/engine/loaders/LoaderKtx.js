/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import LoadResult from "../../ui/OpenFile/LoadResult";

export const KtxHeader = {
    KTX_GL_RED: 0x1903,
    KTX_GL_RGB: 0x1907,
    KTX_GL_RGBA: 0x1908,
    KTX_GL_R8_EXT: 0x8229,
    KTX_GL_RGB8_OES: 0x8051,
    KTX_GL_RGBA8_OES: 0x8058,
};

export const LoadKtxFromBuffer = (arrBuf) => {
    const m_header = {
        m_id: '',
        m_endianness: 0,
        m_glType: 0,
        m_glTypeSize: 0,
        m_glFormat: 0,
        m_glInternalFormat: 0,
        m_glBaseInternalFormat: 0,
        m_pixelWidth: 0,
        m_pixelHeight: 0,
        m_pixelDepth: 0,
        m_numberOfArrayElements: 0,
        m_numberOfFaces: 0,
        m_numberOfMipmapLevels: 0,
        m_bytesOfKeyValueData: 0
    };
    const m_boxSize = {
        x: 0.0,
        y: 0.0,
        z: 0.0
    };

    function readInt(bufBytes, bufOff) {
        let iVal = 0;
        const BYTES_IN_INT = 4;
        const BITS_IN_BYTE = 8;
        const LAST_INDEX = 3;
        for (let i = 0; i < BYTES_IN_INT; i++) {
            const iShifted = iVal << BITS_IN_BYTE;
            iVal = iShifted + bufBytes[bufOff + LAST_INDEX - i];
        }
        return iVal;
    }

    function readFloat(buf, off) {
        const BYTES_IN_FLOAT = 4;
        const arBuf = new ArrayBuffer(BYTES_IN_FLOAT);
        const dataArray = new DataView(arBuf);
        const OFF_0 = 0;
        const OFF_1 = 1;
        const OFF_2 = 2;
        const OFF_3 = 3;
        dataArray.setUint8(OFF_0, buf[off + OFF_0]);
        dataArray.setUint8(OFF_1, buf[off + OFF_1]);
        dataArray.setUint8(OFF_2, buf[off + OFF_2]);
        dataArray.setUint8(OFF_3, buf[off + OFF_3]);
        const IS_LITTLE_ENDIAN = true;
        return dataArray.getFloat32(0, IS_LITTLE_ENDIAN);
    }

    const bufBytes = new Uint8Array(arrBuf);
    let bufOff = 0;
    if (bufBytes.length === 0) {
        return LoadResult.BAD_HEADER;
    }

    const arrayHeaderSign = [0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A];
    const lenHeaderSign = arrayHeaderSign.length;
    let isHeaderSignCorrect = true;
    let i;
    // for (i = 0; i < lenHeaderSign; i++) {
    //   console.log(`${bufBytes[i]}`);
    // }
    for (i = 0; i < lenHeaderSign; i++) {
        if (bufBytes[bufOff] !== arrayHeaderSign[i]) {
            isHeaderSignCorrect = false;
            break;
        }
        m_header.m_id += String.fromCharCode(bufBytes[bufOff]);
        bufOff += 1;
    }
    if (!isHeaderSignCorrect) {
        console.log('KTX HEADER IS WRONG');
        return LoadResult.BAD_HEADER;
    }
    const SIZE_DWORD = 4;
    const ENDIANNESS_16 = 16;
    const ENDIAN_CONST = 0x04030201;
    // read endianess
    m_header.m_endianness = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    if (m_header.m_endianness !== ENDIAN_CONST) {
        const strFoundEndns = m_header.m_endianness.toString(ENDIANNESS_16);
        // eslint-disable-next-line
        console.log(`ENDIANNESS IS WRONG. Found = ${strFoundEndns} , but should be = ${ENDIAN_CONST.toString(16)}`);
        return LoadResult.UNSUPPORTED_ENDIANNESS;
    }

    // read
    m_header.m_glType = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    m_header.m_glTypeSize = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    m_header.m_glFormat = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;

    if (
        (m_header.m_glFormat !== KtxHeader.KTX_GL_RED) &&
        (m_header.m_glFormat !== KtxHeader.KTX_GL_RGB) &&
        (m_header.m_glFormat !== KtxHeader.KTX_GL_RGBA)) {
        console.log('KTX header.m_glFormat is WRONG');
        return LoadResult.UNSUPPORTED_COLOR_FORMAT;
    }
    m_header.m_glInternalFormat = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    m_header.m_glBaseInternalFormat = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    m_header.m_pixelWidth = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    m_header.m_pixelHeight = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    m_header.m_pixelDepth = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;


    // check dim
    const head = m_header;
    // console.log(`check dim: ${head.m_pixelWidth} * ${head.m_pixelHeight} * ${head.m_pixelDepth}`);
    const MIN_DIM = 4;
    const MAX_DIM = (1024 * 8);
    if ((head.m_pixelWidth < MIN_DIM) || (head.m_pixelHeight < MIN_DIM)
        || (head.m_pixelDepth < MIN_DIM)) {
        console.log(`KTX dims too small: ${head.m_pixelWidth} * ${head.m_pixelHeight} * ${head.m_pixelDepth}`);
        return LoadResult.WRONG_IMAGE_DIM_X;
    }
    if (head.m_pixelWidth > MAX_DIM || head.m_pixelHeight > MAX_DIM || head.m_pixelDepth > MAX_DIM) {
        console.log(`KTX dims too large: ${head.m_pixelWidth} * ${head.m_pixelHeight} * ${head.m_pixelDepth}`);
        return LoadResult.WRONG_IMAGE_DIM_X;
    }

    m_header.m_numberOfArrayElements = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    m_header.m_numberOfFaces = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    m_header.m_numberOfMipmapLevels = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    m_header.m_bytesOfKeyValueData = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;

    let bytesPerVoxel = 0;
    const SIZE_BYTE = 1;
    const SIZE_COLOR3 = 3;
    const SIZE_COLOR4 = 4;
    if (m_header.m_glFormat === KtxHeader.KTX_GL_RED) {
        bytesPerVoxel = SIZE_BYTE;
    } else if (m_header.m_glFormat === KtxHeader.KTX_GL_RGB) {
        bytesPerVoxel = SIZE_COLOR3;
    } else if (m_header.m_glFormat === KtxHeader.KTX_GL_RGBA) {
        bytesPerVoxel = SIZE_COLOR4;
    }

    // read user data
    if (m_header.m_bytesOfKeyValueData > 0) {
        let udataOff = bufOff;
        bufOff += m_header.m_bytesOfKeyValueData;

        let xMin, yMin, zMin, xMax, yMax, zMax;
        while (udataOff < bufOff) {
            // read pair len
            // const pairLen = KtxLoader.readInt(bufBytes, udataOff);
            udataOff += SIZE_DWORD;

            // read string until 0
            let str = '';
            let b;
            for (b = bufBytes[udataOff]; b !== 0; udataOff++) {
                b = bufBytes[udataOff];
                if (b !== 0) {
                    str = str.concat(String.fromCharCode(b));
                }
            }

            if (str === 'fBoxMin') {
                xMin = readFloat(bufBytes, udataOff);
                udataOff += SIZE_DWORD;
                yMin = readFloat(bufBytes, udataOff);
                udataOff += SIZE_DWORD;
                zMin = readFloat(bufBytes, udataOff);
                udataOff += SIZE_DWORD;
                console.log(`vBoxMix = ${xMin} * ${yMin} * ${zMin}`);
            } else if (str === 'fBoxMax') {
                xMax = readFloat(bufBytes, udataOff);
                udataOff += SIZE_DWORD;
                yMax = readFloat(bufBytes, udataOff);
                udataOff += SIZE_DWORD;
                zMax = readFloat(bufBytes, udataOff);
                udataOff += SIZE_DWORD;
                m_boxSize.x = xMax - xMin;
                m_boxSize.y = yMax - yMin;
                m_boxSize.z = zMax - zMin;
                console.log(`vBox = ${m_boxSize.x} * ${m_boxSize.y} * ${m_boxSize.z}`);
                break;
            } // if fbox max
        } // while udata not ended
    } // if have key data
    // read image data size
    const m_dataSize = readInt(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const m_dataArray = new Uint8Array(m_dataSize);
    // get power of 2 for data size
    let pwr2;
    let pwrFinish = false;
    const MAX_POWER = 29;
    for (pwr2 = MAX_POWER; (pwr2 >= 0) && (!pwrFinish); pwr2--) {
        const val = 1 << pwr2;
        if (val < m_dataSize) {
            pwrFinish = true;
        }
    }
    pwr2++;
    // build mask for progress update
    const SOME_POWER_MIN = 3;
    pwr2 -= SOME_POWER_MIN;
    if (pwr2 <= 0) {
        pwr2 = 1;
    }

    for (let i = 0; i < m_dataSize; i++) {
        m_dataArray[i] = bufBytes[bufOff];
        bufOff += 1;
    }
    // update box, if not read
    if (m_boxSize.x === 0.0) {
        // Some artificial size: just proportional to pixels dimension
        const MM_PER_PIXEL = 0.3;
        m_boxSize.x = MM_PER_PIXEL * m_header.m_pixelWidth;
        m_boxSize.x = MM_PER_PIXEL * m_header.m_pixelWidth;
        m_boxSize.y = MM_PER_PIXEL * m_header.m_pixelHeight;
        m_boxSize.z = MM_PER_PIXEL * m_header.m_pixelDepth;
        console.log(`vBox = ${m_boxSize.x} * ${m_boxSize.y} * ${m_boxSize.z}`);
    }

    return {
        m_xDim: m_header.m_pixelWidth,
        m_yDim: m_header.m_pixelHeight,
        m_zDim: m_header.m_pixelDepth,
        m_bytesPerVoxel: bytesPerVoxel,
        m_dataArray,
        m_dataSize,
        m_boxSize,
    }
}
