# DICOM transfer-syntax support (web engine)

Covers which DICOM transfer syntaxes the web engine loads. Every DICOM read
(single- and multi-file) is dispatched through the **daikon** wrapper
(`web/src/engine/loaders/LoaderDcmDaikon.js`), and `daikon.Image.getRawData()`
auto-decompresses the encapsulated pixel data. The loader trusts that
decompressed output and copies it according to `bitsAllocated`,
`samplesPerPixel`, and planar configuration. The same copy applies the in-plane
row/column flip derived from `ImageOrientationPatient` (#250), so orientation
handling is shared by the compressed and uncompressed single-file paths.

Multiframe datasets are supported: every frame becomes its own slice. Frames are
assumed to be evenly spaced along the slice normal by `SpacingBetweenSlices`
(0018,0088), falling back to `SliceThickness` (0018,0050) and then to 1 mm.
Whether the pixel data is encapsulated is derived from the transfer syntax
(`1.2.840.10008.1.2`, `.1`, `.2` are native; anything else is compressed and
decoded by daikon), so the same frame splitting works for both.

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
| JPEG Baseline (8-bit) | `1.2.840.10008.1.2.4.50` | tested: real 96-frame fixture `jpeg_baseline_8bit.dcm` | Lossy, multiframe |
| JPEG Baseline (12-bit) | `1.2.840.10008.1.2.4.51` | not tested | Lossy |
| JPEG Lossless | `1.2.840.10008.1.2.4.57` | not tested | Lossless |
| JPEG Lossless, SV1 | `1.2.840.10008.1.2.4.70` | tested: real fixture `jpeg_lossless_sel1.dcm` | Lossless |
| JPEG 2000 Lossless | `1.2.840.10008.1.2.4.90` | not tested | |
| JPEG 2000 | `1.2.840.10008.1.2.4.91` | tested: real fixture `jpeg_2000.dcm` | |
| JPEG-LS Near-Lossless | `1.2.840.10008.1.2.4.81` | tested: real fixture `jpeg_ls.dcm` | daikon's bundled charls decoder |
| JPEG-LS Lossless | `1.2.840.10008.1.2.4.80` | manual check only, no bundled fixture | pydicom `MR_small_jpeg_ls_lossless.dcm` loads; not in CI |
| RLE Lossless | `1.2.840.10008.1.2.5` | tested: synthetic 8/16-bit grayscale and 8-bit RGB | Run-length encapsulated |
| Deflated Explicit VR Little Endian | `1.2.840.10008.1.2.1.99` | tested: a real file, deflated by the test | daikon inflates the data set (`pako.inflateRaw`) while parsing; see `LoaderDcmDaikon.deflate.realfile.test.js` |

`LoaderDicom.js` recognizes the deflate UID (it sets `m_needsDeflate`) but never reads that flag
and never inflates. Deflated files work only because every read goes through daikon; do not feed
a deflated file to `LoaderDicom.readFromBuffer` directly.

Decompression is handled by daikon; the engine adds no new decoders.

Neither JPEG-LS UID has a constant in `LoaderDicom.js`; like every syntax the buffer is handed
to daikon. If decoding fails or returns too few bytes the loader returns
`ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED`.

## Rejected (explicit, no silent misload)

Palette color decodes through daikon but does not fit the pixel copy, so the
loader returns `ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED` rather than render
garbage: daikon expands to RGB while `SamplesPerPixel` stays 1, which is
detected through `PhotometricInterpretation`.

Nothing else is rejected for being multiframe anymore.

## Public datasets used for manual checks

The committed tests use the fixtures bundled with the `daikon` package
(`node_modules/daikon/tests/data`, fetched by `npm install`). Cases with no
bundled fixture were checked against these public files:

- RLE 8-bit RGB, RLE 16-bit gray, JPEG-LS lossless: [pydicom test files](https://github.com/pydicom/pydicom/tree/main/src/pydicom/data/test_files)
  (`SC_rgb_rle.dcm`, `MR_small_RLE.dcm`, `MR_small_jpeg_ls_lossless.dcm`).
- RLE 16-bit RGB and 32-bit RLE, both refused by daikon: `SC_rgb_rle_16bit.dcm`,
  `rtdose_rle.dcm` from the same folder.
- JPEG Baseline RGB without `BitsAllocated`, now an error code instead of a crash:
  `SC_rgb_jpeg.dcm`.

## Status of the linked issues

- **#202** (compressed images failed with `ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED`): the
  reported symptom came from multiframe datasets, not from compression alone — the loader
  copied only frame 0 and rejected the rest. Multiframe now loads frame by frame; a real
  96-frame JPEG Baseline fixture and a packed 74-slice CBCT file both produce full volumes.
- **#232** (3D view fails for some DICOM datasets): multiframe is no longer rejected, which
  covers the common cone-beam case. Per-frame functional groups and palette color remain
  open, so this is still a partial fix.

## Follow-ups

- **Enhanced multiframe**: frames are placed on a uniform grid from
  `SpacingBetweenSlices`/`SliceThickness`. Enhanced CT/MR store per-frame positions
  (functional group sequences) instead; those datasets load but the frame spacing can be
  wrong. Needs per-frame position parsing.
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
- **JPEG-LS lossless (`.4.80`)**: `.4.81` is covered by a real fixture; a lossless-mode
  fixture is still missing.
- **RLE 16-bit RGB and 32-bit RLE**: daikon's RLE decoder rejects those segment layouts
  (it expects a different segment count than 6 or 4) and throws; the loader turns that into
  `ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED`. Checked against the public pydicom files
  `SC_rgb_rle_16bit.dcm` and `rtdose_rle.dcm`. Supporting them needs an RLE decoder that
  handles per-channel segments or 32-bit samples.
