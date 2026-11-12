import fs from 'fs';
import path from 'path';
import LoaderDicom from './LoaderDicom';
import LoaderDcmDaikon from './LoaderDcmDaikon';

const FIXTURE = path.resolve(__dirname, '../../../e2e-tests/tests/test-data/dcm/1-01.dcm');
const DIM = 320;
const DICOM_PREAMBLE = 132;
const ORIENTATION_TAG = [0x20, 0x00, 0x37, 0x00, 0x44, 0x53];
const VALUE_LENGTH_OFFSET = 6;
const VALUE_OFFSET = 8;

const loadFixture = () => fs.readFileSync(FIXTURE);

const findOrientationTag = (bytes) => {
  for (let i = DICOM_PREAMBLE; i < bytes.length - VALUE_OFFSET; i++) {
    if (ORIENTATION_TAG.every((b, k) => bytes[i + k] === b)) {
      return i;
    }
  }
  throw new Error('orientation tag not found in fixture');
};

const withOrientation = (bytes, value) => {
  const padded = value.length % 2 === 0 ? value : `${value} `;
  const at = findOrientationTag(bytes);
  const oldLength = bytes.readUInt16LE(at + VALUE_LENGTH_OFFSET);
  const head = Buffer.from(bytes.subarray(0, at + VALUE_LENGTH_OFFSET));
  const lengthBytes = Buffer.alloc(2);
  lengthBytes.writeUInt16LE(padded.length, 0);
  const tail = bytes.subarray(at + VALUE_OFFSET + oldLength);
  const out = Buffer.concat([head, lengthBytes, Buffer.from(padded, 'latin1'), tail]);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
};

const withoutOrientation = (bytes) => {
  const at = findOrientationTag(bytes);
  const oldLength = bytes.readUInt16LE(at + VALUE_LENGTH_OFFSET);
  const out = Buffer.concat([bytes.subarray(0, at), bytes.subarray(at + VALUE_OFFSET + oldLength)]);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
};

const readWithLoaderDicom = (arrBuf) => {
  const loader = new LoaderDicom(1);
  const ret = loader.readFromBuffer(
    0,
    'fixture.dcm',
    1,
    arrBuf,
    () => {},
    () => {}
  );
  expect(ret).toBe(0);
  return Array.from(loader.m_slicesVolume.m_series[0].m_slices[0].m_image);
};

const readWithDaikon = (arrBuf) => {
  const loader = new LoaderDicom(1);
  const ret = new LoaderDcmDaikon().readSingleSlice({ dispatch: () => {} }, loader, 0, 'fixture.dcm', arrBuf);
  expect(ret).toBe(0);
  return Array.from(loader.m_slicesVolume.m_series[0].m_slices[0].m_image);
};

const mirror = (image, flipX, flipY) => {
  const out = new Array(image.length);
  for (let y = 0; y < DIM; y++) {
    for (let x = 0; x < DIM; x++) {
      const sx = flipX ? DIM - 1 - x : x;
      const sy = flipY ? DIM - 1 - y : y;
      out[y * DIM + x] = image[sy * DIM + sx];
    }
  }
  return out;
};

const firstDifference = (a, b) => {
  if (a.length !== b.length) {
    return -2;
  }
  return a.findIndex((v, i) => v !== b[i]);
};

const IDENTITY = '1\\0\\0\\0\\1\\0';
const SUPPORTED = [
  { name: 'axial, row axis negated', value: '-1\\0\\0\\0\\1\\0', flipX: true, flipY: false },
  { name: 'axial, column axis negated', value: '1\\0\\0\\0\\-1\\0', flipX: false, flipY: true },
  { name: 'axial, both axes negated', value: '-1\\0\\0\\0\\-1\\0', flipX: true, flipY: true },
];
const UNCHANGED = [
  { name: 'the fixture own sagittal orientation', value: null },
  { name: 'coronal with negated row axis', value: '-1\\0\\0\\0\\0\\-1' },
  { name: 'in-plane rotation of 150 degrees', value: '-0.866\\0.5\\0\\-0.5\\-0.866\\0' },
  { name: 'in-plane rotation of 170 degrees', value: '-0.985\\0.17\\0\\-0.17\\-0.985\\0' },
  { name: 'negated axial rotated by 2 degrees in-plane', value: '-0.99939\\0.0349\\0\\-0.0349\\-0.99939\\0' },
  { name: 'a malformed value with 5 components', value: '1\\0\\0\\0\\1' },
  { name: 'a non-numeric value', value: 'a\\b\\c\\d\\e\\f' },
  { name: 'the orientation tag being absent', value: undefined },
];

describe.each([
  ['LoaderDicom.readFromBuffer', readWithLoaderDicom],
  ['LoaderDcmDaikon.readSingleSlice', readWithDaikon],
])('%s orientation handling on a real DICOM file', (_name, read) => {
  const reference = read(withOrientation(loadFixture(), IDENTITY));

  it('has a reference image that a mirror would visibly change', () => {
    expect(reference.length).toBe(DIM * DIM);
    expect(firstDifference(mirror(reference, true, false), reference)).toBeGreaterThanOrEqual(0);
    expect(firstDifference(mirror(reference, false, true), reference)).toBeGreaterThanOrEqual(0);
  });

  it.each(SUPPORTED)('mirrors the image for $name', ({ value, flipX, flipY }) => {
    const image = read(withOrientation(loadFixture(), value));
    expect(firstDifference(image, mirror(reference, flipX, flipY))).toBe(-1);
  });

  it.each(UNCHANGED)('leaves the image untouched for $name', ({ value }) => {
    const bytes = loadFixture();
    const own = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const source = value === null ? own : value === undefined ? withoutOrientation(bytes) : withOrientation(bytes, value);
    expect(firstDifference(read(source), reference)).toBe(-1);
  });
});
