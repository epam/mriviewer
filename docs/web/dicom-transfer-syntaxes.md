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
| Explicit VR Big Endian | `1.2.840.10008.1.2.2` | Uncompressed |
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

## Follow-ups

- **DEFLATE (`.1.2.1.99`)** — still unsupported; requires an inflate pass
  before parsing the data set.
- **Multiframe** — pixel copy currently handles the common single-frame case;
  multiframe encapsulated data needs per-frame validation and fixtures.
- **Planar RGB edge cases** — RGB is copied as interleaved; planar
  configuration `1` (color-by-plane) paths need dedicated fixtures/coverage.
- **JPEG-LS** — the UIDs are recognized but lack real-fixture regression tests.
