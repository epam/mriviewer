import { NiftiValidator } from './NiftiValidator';
import LoadResult from '../../LoadResult';

describe('NiftiValidatorTests', () => {
  it('reportError delivers the resolved numeric code, not undefined', () => {
    const validator = new NiftiValidator();
    let received = 'unset';
    const ret = validator.reportError(LoadResult.WRONG_HEADER_MAGIC, (code) => {
      received = code;
    });

    expect(ret).toBe(false);
    expect(received).toBe(LoadResult.WRONG_HEADER_MAGIC);
    expect(received).not.toBeUndefined();
  });

  it('validateDataType rejects unsupported data type with WRONG_HEADER_DATA_TYPE', () => {
    const validator = new NiftiValidator();
    let received = 'unset';
    const ret = validator.validateDataType(999, (code) => {
      received = code;
    });

    expect(ret).toBe(false);
    expect(received).toBe(LoadResult.WRONG_HEADER_DATA_TYPE);
  });

  it('validateBitPix rejects unsupported bitPix with WRONG_HEADER_BITS_PER_PIXEL', () => {
    const validator = new NiftiValidator();
    let received = 'unset';
    const ret = validator.validateBitPix(7, (code) => {
      received = code;
    });

    expect(ret).toBe(false);
    expect(received).toBe(LoadResult.WRONG_HEADER_BITS_PER_PIXEL);
  });

  it('validateMagic rejects a bad magic with WRONG_HEADER_MAGIC', () => {
    const validator = new NiftiValidator();
    const bytes = new Uint8Array(348);
    let received = 'unset';
    const ret = validator.validateMagic(bytes, (code) => {
      received = code;
    });

    expect(ret).toBe(false);
    expect(received).toBe(LoadResult.WRONG_HEADER_MAGIC);
  });

  it('validateBufferSize rejects a too-small buffer with ERROR_TOO_SMALL_DATA_SIZE', () => {
    const validator = new NiftiValidator();
    let received = 'unset';
    const ret = validator.validateBufferSize(4, (code) => {
      received = code;
    });

    expect(ret).toBe(false);
    expect(received).toBe(LoadResult.ERROR_TOO_SMALL_DATA_SIZE);
  });

  it('accepts valid inputs and returns true', () => {
    const validator = new NiftiValidator();
    expect(validator.validateDataType(2, () => {})).toBe(true);
    expect(validator.validateBitPix(8, () => {})).toBe(true);
    expect(validator.validateBufferSize(348, () => {})).toBe(true);
  });
});
