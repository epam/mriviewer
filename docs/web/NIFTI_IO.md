# NIfTI read/save (web engine)

Covers the web app's NIfTI-1 loader and saver under `web/src/engine/`. It reflects
the read/save round-trip fix delivered for issue **#11**.

## Files

| Path | Role |
|---|---|
| `web/src/engine/savers/SaverNifti.js` | Writes a volume to a NIfTI-1 `ArrayBuffer`. |
| `web/src/engine/loaders/loaderNifti/LoaderNifti.js` | Parses a NIfTI-1 buffer into a `Volume`. |
| `web/src/engine/loaders/loaderNifti/NiftiHeaderReader.js` | Reads the 348-byte header fields. |
| `web/src/engine/loaders/loaderNifti/NiftiValidator.js` | Validates buffer/header and delivers error codes. |
| `web/src/engine/loaders/loaderNifti/NiftiDataProcessor.js` | Histogram, scaling, voxel fill. |

## On-disk layout (NIfTI-1, single `.nii`)

```
byte 0    sizeof_hdr (int32) = 348
byte 108  vox_offset (float32) — where voxel data starts
byte 344  magic "n+1\0"  (110, 43, 49, 0)
byte 348  zero padding (348..351)
byte 352  voxel data (vox_offset = 352, spec minimum)
```

- `sizeof_hdr` is always 348. The header ends at byte 348, but the spec minimum
  data offset is **352**, so bytes 348–351 are zero padding.
- `vox_offset` in the header is authoritative for where voxel data begins.

## Saver behavior

- Allocates `352 + N*2` bytes (`DATA_OFFSET = 352`, 16-bit voxels), writes voxel
  data starting at byte **352**, and stores `vox_offset = 352`. Header and file
  size agree — no off-by-4 "left-right wrap" for spec-compliant tools
  (FSL / SPM / MRIcroGL).
- 8-bit input intensities are up-scaled to 16-bit by `4095/255` (8-bit → ~12-bit
  range, common in medical imaging).
- Invalid input (non-positive dims, dimension mismatch, degenerate grid spacing)
  is warned about but still produces a structurally valid header — the saver does
  not throw.

## Loader behavior

- Reads `vox_offset` from the header and uses it as the data offset. Values are
  clamped to `>= 348` and validated to stay within the buffer; an offset past the
  end of the buffer yields a `BAD_HEADER` error code instead of a crash.
- Backward compatible: files saved by the app *before* this fix declared
  `vox_offset = 352` in the header but wrote voxel data at byte **348** in a buffer
  only `348 + N*2` bytes long. When the declared offset (`<= 352`) overruns the
  buffer but the data fits at byte 348, the loader falls back to 348, so these
  legacy files still load correctly.
- Intensities are normalized to 8-bit via a histogram-based last-max-peak, which
  recovers the full range from the saver's `4095/255` up-scale. The save→read
  round-trip preserves dimensions and relative voxel intensities (not exact 8-bit
  equality — assert on the `4095/255` scale).

## Error codes

`NiftiValidator.reportError` passes the resolved numeric `LoadResult.*` code
straight to the completion callback. `WRONG_HEADER_MAGIC`,
`WRONG_HEADER_DATA_TYPE`, and `WRONG_HEADER_DIMENSIONS` paths each deliver their
intended code (previously a double-index bug delivered `undefined`).

## Known limitations / follow-ups

Out of scope for #11 — tracked as future work:

- `.nii.gz` (gzip) decompression is not supported — only uncompressed `.nii`.
- `scl_slope` / `scl_inter` are not applied on read (the loader normalizes via
  histogram instead).
- NIfTI-2 is not supported (NIfTI-1 348-byte header only).
- RGB / RGBA and datatypes outside the supported set (`UINT8`, `INT16`,
  `FLOAT32`, `INT8`, `UINT16`) are not supported. 32-bit float (`dataType = 16`,
  `bitpix = 32`) **is** read on load, though the saver only ever writes 16-bit.
- `qform` / `sform` orientation is not honored — no re-orientation on load/save.
- DICOM orientation (#221) is tracked separately.

## Tests

- `web/src/engine/savers/SaverNifti.test.js`
- `web/src/engine/loaders/loaderNifti/LoaderNifti.test.js`
- `web/src/engine/loaders/loaderNifti/NiftiValidator.test.js`

Run with `vitest src` (from `web/`).
