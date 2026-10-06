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

| Transfer syntax | UID | Notes |
|---|---|---|
| Implicit VR Little Endian | `1.2.840.10008.1.2` | Uncompressed |
| Explicit VR Little Endian | `1.2.840.10008.1.2.1` | Uncompressed |
| Explicit VR Big Endian | `1.2.840.10008.1.2.2` | Uncompressed; 8-bit only — 16-bit byte order unverified (see follow-ups) |
| JPEG Baseline (8-bit) | `1.2.840.10008.1.2.4.50` | Lossy |
| JPEG Baseline (12-bit) | `1.2.840.10008.1.2.4.51` | Lossy |
| JPEG Lossless | `1.2.840.10008.1.2.4.57` | Lossless |
| JPEG Lossless, SV1 | `1.2.840.10008.1.2.4.70` | Lossless |
| JPEG 2000 Lossless | `1.2.840.10008.1.2.4.90` | |
| JPEG 2000 | `1.2.840.10008.1.2.4.91` | |
| RLE Lossless | `1.2.840.10008.1.2.5` | Run-length encapsulated |

Decompression is handled by daikon; the engine adds no new decoders.

## Not supported

| Transfer syntax | UID | Notes |
|---|---|---|
| Deflated Explicit VR Little Endian | `1.2.840.10008.1.2.1.99` | DEFLATE — out of scope |
| JPEG-LS Lossless | `1.2.840.10008.1.2.4.80` | Untested against real fixtures |
| JPEG-LS Near-Lossless | `1.2.840.10008.1.2.4.81` | Untested against real fixtures |

## Rejected (explicit, no silent misload)

These decode through daikon but do not fit the single-plane, single-frame pixel
copy, so the loader returns `ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED` rather than
render partial or garbled data:

| Case | Why | Detection |
|---|---|---|
| Multiframe | Only frame 0 would be copied | `NumberOfFrames > 1` |
| Palette color | daikon expands to RGB while `SamplesPerPixel` stays 1 | `PhotometricInterpretation` contains `PALETTE` |

## Follow-ups

- **DEFLATE (`.1.2.1.99`)** — still unsupported; requires an inflate pass
  before parsing the data set.
- **Multiframe** — currently rejected; full support needs per-frame validation,
  a multi-slice volume mapping, and fixtures.
- **Palette color** — currently rejected; full support needs consuming daikon's
  RGB-expanded buffer (samples-per-pixel derived from the buffer, not the tag).
- **Planar RGB edge cases** — RGB is copied as interleaved; planar
  configuration `1` (color-by-plane) paths need dedicated fixtures/coverage.
- **Big Endian 16-bit** — the pixel copy reads samples via a native
  little-endian `Uint16Array`, so 16-bit Explicit VR Big Endian data would be
  byte-swapped; needs an endianness-aware read plus a real fixture.
- **JPEG-LS (`.4.80`/`.4.81`)** — not explicitly recognized in `LoaderDicom.js`
  (no UID constants); like every syntax the buffer is still handed to daikon's
  decoder, but decoding is untested and unverified against real fixtures.
