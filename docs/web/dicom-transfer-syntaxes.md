# DICOM transfer-syntax support (web engine)

Covers which DICOM transfer syntaxes the web engine loads. Every DICOM read
(single- and multi-file) is dispatched through the **daikon** wrapper
(`web/src/engine/loaders/LoaderDcmDaikon.js`), and `daikon.Image.getRawData()`
auto-decompresses the encapsulated pixel data. The loader trusts that
decompressed output and copies it according to `bitsAllocated`,
`samplesPerPixel`, and planar configuration.

Related work: issues #202 and #232 (compressed DICOM failed to load with
`ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED`).

## Supported

"Tested" means a test in `web/src/engine/loaders/` loads a file of that syntax and checks the result.
Rows marked "not tested" are handed to daikon and expected to work, but nothing in this repo
proves it.

| Transfer syntax | UID | Coverage | Notes |
|---|---|---|---|
| Implicit VR Little Endian | `1.2.840.10008.1.2` | not tested | Uncompressed |
| Explicit VR Little Endian | `1.2.840.10008.1.2.1` | tested: synthetic buffers and a real file | Uncompressed |
| Explicit VR Big Endian | `1.2.840.10008.1.2.2` | not tested | Uncompressed; 8-bit only, 16-bit byte order unverified (see follow-ups) |
| JPEG Baseline (8-bit) | `1.2.840.10008.1.2.4.50` | not tested | Lossy |
| JPEG Baseline (12-bit) | `1.2.840.10008.1.2.4.51` | not tested | Lossy |
| JPEG Lossless | `1.2.840.10008.1.2.4.57` | not tested | Lossless |
| JPEG Lossless, SV1 | `1.2.840.10008.1.2.4.70` | tested: real fixture `jpeg_lossless_sel1.dcm` | Lossless |
| JPEG 2000 Lossless | `1.2.840.10008.1.2.4.90` | not tested | |
| JPEG 2000 | `1.2.840.10008.1.2.4.91` | tested: real fixture `jpeg_2000.dcm` | |
| RLE Lossless | `1.2.840.10008.1.2.5` | tested: synthetic 8/16-bit grayscale and 8-bit RGB | Run-length encapsulated |
| Deflated Explicit VR Little Endian | `1.2.840.10008.1.2.1.99` | tested: a real file, deflated by the test | daikon inflates the data set (`pako.inflateRaw`) while parsing; see `LoaderDcmDaikon.deflate.realfile.test.js` |

`LoaderDicom.js` recognizes the deflate UID (it sets `m_needsDeflate`) but never reads that flag
and never inflates. Deflated files work only because every read goes through daikon; do not feed
a deflated file to `LoaderDicom.readFromBuffer` directly.

Decompression is handled by daikon; the engine adds no new decoders.

## Present in daikon, not verified here

| Transfer syntax | UID | Notes |
|---|---|---|
| JPEG-LS Lossless | `1.2.840.10008.1.2.4.80` | daikon bundles a JPEG-LS decoder and selects it for this UID; no fixture, so unverified in this app |
| JPEG-LS Near-Lossless | `1.2.840.10008.1.2.4.81` | same as above |

The JPEG-LS UIDs have no constants in `LoaderDicom.js`; like every syntax the buffer is handed
to daikon. If decoding fails or returns too few bytes the loader returns
`ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED`.

## Rejected (explicit, no silent misload)

These decode through daikon but do not fit the single-plane, single-frame pixel
copy, so the loader returns `ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED` rather than
render partial or garbled data:

| Case | Why | Detection |
|---|---|---|
| Multiframe | Only frame 0 would be copied | `NumberOfFrames > 1` |
| Palette color | daikon expands to RGB while `SamplesPerPixel` stays 1 | `PhotometricInterpretation` contains `PALETTE` |

## Status of the linked issues

- **#202** (compressed images failed with `ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED`): addressed
  for the syntaxes in the Supported table.
- **#232** (3D view fails for some DICOM datasets): only partly addressed. Multiframe and
  palette color are rejected rather than loaded, and the remaining 3D issues are tracked
  separately. Do not treat #232 as closed by this change.

## Follow-ups

- **Multiframe**: currently rejected; full support needs per-frame validation, a
  multi-slice volume mapping, and fixtures.
- **Palette color**: currently rejected; full support needs consuming daikon's
  RGB-expanded buffer (samples-per-pixel derived from the buffer, not the tag).
- **Planar RGB**: for `SamplesPerPixel = 3` the loader always treats the buffer as
  interleaved (`R G B R G B ...`) and averages each consecutive triple. It never reads
  `PlanarConfiguration` (0028,0006). If daikon hands back color-by-plane data
  (`PlanarConfiguration = 1`: all R, then all G, then all B) the averages mix neighbouring
  pixels of one channel and the image is silently wrong; the loader does not detect this.
  Whether daikon re-interleaves for each syntax is not verified. Needs fixtures for
  planar configuration 1, then either a de-planarizing copy or an explicit rejection.
- **Big Endian 16-bit**: the pixel copy reads samples via a native little-endian
  `Uint16Array`, so 16-bit Explicit VR Big Endian data would be byte-swapped; needs an
  endianness-aware read plus a real fixture.
- **JPEG-LS (`.4.80`/`.4.81`)**: needs real fixtures to move from "present in daikon" to
  supported.
