import fs from 'fs';
import path from 'path';
import pako from 'pako';
import LoaderDicom from './LoaderDicom';
import LoaderDcmDaikon from './LoaderDcmDaikon';

const FIXTURE = path.resolve(__dirname, '../../../e2e-tests/tests/test-data/dcm/1-01.dcm');
const DIM = 320;
const PREAMBLE_AND_MAGIC = 132;
const GROUP_LENGTH_ELEMENT_AT = 132;
const GROUP_LENGTH_VALUE_AT = 140;
const DATA_SET_AFTER_GROUP_LENGTH = 144;
const TRANSFER_SYNTAX_TAG = [0x02, 0x00, 0x10, 0x00, 0x55, 0x49];
const GROUP_LENGTH_TAG = [0x02, 0x00, 0x00, 0x00, 0x55, 0x4c];
const DEFLATE_UID = '1.2.840.10008.1.2.1.99';

const toArrayBuffer = (buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const metaEndOf = (bytes) => {
  if (!GROUP_LENGTH_TAG.every((b, k) => bytes[GROUP_LENGTH_ELEMENT_AT + k] === b)) {
    throw new Error('file meta group length element not found at the expected position');
  }
  return DATA_SET_AFTER_GROUP_LENGTH + bytes.readUInt32LE(GROUP_LENGTH_VALUE_AT);
};

const findTransferSyntax = (bytes, metaEnd) => {
  for (let i = PREAMBLE_AND_MAGIC; i < metaEnd; i++) {
    if (TRANSFER_SYNTAX_TAG.every((b, k) => bytes[i + k] === b)) {
      return i;
    }
  }
  throw new Error('transfer syntax tag not found');
};

const toDeflated = (bytes) => {
  const metaEnd = metaEndOf(bytes);
  const at = findTransferSyntax(bytes, metaEnd);
  const oldLength = bytes.readUInt16LE(at + 6);
  const head = Buffer.from(bytes.subarray(0, at + 6));
  const lengthBytes = Buffer.alloc(2);
  lengthBytes.writeUInt16LE(DEFLATE_UID.length, 0);
  const meta = Buffer.concat([head, lengthBytes, Buffer.from(DEFLATE_UID, 'latin1'), bytes.subarray(at + 8 + oldLength, metaEnd)]);
  meta.writeUInt32LE(meta.length - DATA_SET_AFTER_GROUP_LENGTH, GROUP_LENGTH_VALUE_AT);
  const dataset = Buffer.from(pako.deflateRaw(bytes.subarray(metaEnd)));
  return Buffer.concat([meta, dataset]);
};

const readWithDaikon = (arrBuf) => {
  const loader = new LoaderDicom(1);
  const ret = new LoaderDcmDaikon().readSingleSlice({ dispatch: () => {} }, loader, 0, 'fixture.dcm', arrBuf);
  return { ret, image: ret === 0 ? Array.from(loader.m_slicesVolume.m_series[0].m_slices[0].m_image) : null };
};

const firstDifference = (a, b) => (a.length !== b.length ? -2 : a.findIndex((v, i) => v !== b[i]));

describe('Deflated Explicit VR Little Endian on a real DICOM file', () => {
  const plain = fs.readFileSync(FIXTURE);
  const deflated = toDeflated(plain);

  it('builds a smaller file that declares the deflate transfer syntax', () => {
    expect(deflated.length).toBeLessThan(plain.length);
    expect(deflated.toString('latin1').includes(DEFLATE_UID)).toBe(true);
  });

  it('loads with the same pixels as the uncompressed file', () => {
    const reference = readWithDaikon(toArrayBuffer(plain));
    const result = readWithDaikon(toArrayBuffer(deflated));

    expect(reference.ret).toBe(0);
    expect(result.ret).toBe(0);
    expect(result.image.length).toBe(DIM * DIM);
    expect(firstDifference(result.image, reference.image)).toBe(-1);
  });
});
