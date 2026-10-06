/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import { TRANSFER_SYNTAX_COMPRESSION_JPEG_BASELINE_12BIT } from './LoaderDicom';

describe('LoaderDicom transfer-syntax constants', () => {
  it('exposes the canonical JPEG baseline 12-bit UID without stray characters', () => {
    expect(TRANSFER_SYNTAX_COMPRESSION_JPEG_BASELINE_12BIT).toBe('1.2.840.10008.1.2.4.51');
  });

  it('does not carry a leading quote regression', () => {
    expect(TRANSFER_SYNTAX_COMPRESSION_JPEG_BASELINE_12BIT.startsWith('"')).toBe(false);
    expect(TRANSFER_SYNTAX_COMPRESSION_JPEG_BASELINE_12BIT).toMatch(/^[0-9.]+$/);
  });
});
