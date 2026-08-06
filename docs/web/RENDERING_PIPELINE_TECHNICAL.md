# MRI-Viewer 3D Rendering Pipeline

This document outlines the step-by-step process from file upload to 3D volume rendering.

---

## 1. File Upload & Format Detection

User selects DICOM files via the `OpenFromDeviceComponent`. The `MRIReaderFactory` inspects file headers to determine the format (DICOM, NIfTI, HDR, KTX) and instantiates the appropriate loader.

---

## 2. DICOM Parsing

`LoaderDicom` reads each file's binary data using the Daikon library. Key DICOM tags are extracted: pixel data, image dimensions, slice position, spacing, and orientation vectors.

### DICOM Orientation Handling (`ImageOrientationPatient`, tag `0020,0037`)

`ImageOrientationPatient` supplies six floats — the row (`Xr Yr Zr`) and column (`Xc Yc Zc`) direction cosines. Some cone-beam acquisitions (e.g. TrophyPan / CS 8100 3D) encode negative cosines, which caused slices to render mirrored versus other viewers (issue #221).

The loaders apply a **targeted sign-flip** (Approach A):

- The six direction cosines are parsed alongside `ImagePositionPatient (0020,0032)`.
- Per-axis flip flags are derived from the row and column direction cosines: the X axis flips only when the row cosine is dominated by its X component and that component is negative; the Y axis flips only when the column cosine is dominated by its Y component and that component is negative.
- The flip is **gated on axis-dominant negative cosines**: identity (`1,0,0,0,1,0`), the tag being absent, and any non-axis-aligned (in-plane rotated or non-axial primary) orientation all take the original code path and produce a byte-for-byte unchanged voxel buffer. Restricting the flip to axis-dominant components avoids spuriously mirroring rotated acquisitions and avoids a double-flip against the renderer's X-negation in `VolumeRenderer3d.js`, guaranteeing no regression for standard axial series.
- The same flip helper is shared by the multi-file series path (`LoaderDicom.js`) and the single-file daikon path (`LoaderDcmDaikon.js`) so both behave identically.

This is intentionally **not** a general oblique-reorientation engine — it corrects sign-flipped axis-aligned acquisitions only.

**Deferred follow-ups:**

- Full oblique / canonical reslicing (Approach B) for arbitrary non-axis-aligned orientations.
- qform/sform-equivalent handling (NIfTI orientation matrices, issue #11) — tracked as a separate plan/PR.
- 3D black-screen issues #208 / #238 are unrelated to orientation and remain out of scope.

---

## 3. Series Grouping

Slices are grouped into series based on a hash of their orientation and spacing (`DicomSlicesVolume`). This handles multi-series datasets where different scans (e.g., different anatomical views) are stored together.

---

## 4. Volume Reconstruction

Slices within a series are sorted by their 3D position (calculated from `ImagePositionPatient` and `ImageOrientationPatient` tags). The sorted 2D slices are stacked to form a contiguous 3D voxel array (`Uint8Array` or `Float32Array`).

---

## 5. Texture Upload to GPU

The 3D voxel array is uploaded to the GPU as a WebGL **3D texture** (`THREE.Data3DTexture`). A separate 1D **Transfer Function texture** (256 RGBA values) maps voxel intensity to color and opacity.

---

## 6. Ray Marching (Volume Rendering)

The `volumerender.frag` shader performs **ray marching** through the 3D texture. For each pixel, a ray is cast from the camera into the volume. The ray samples the texture at regular intervals, accumulating color and opacity based on the Transfer Function until it exits the volume or reaches full opacity.

---

## 7. Compositing & Display

Front-to-back alpha compositing blends samples along each ray. The final RGBA value is written to the framebuffer and displayed on a full-screen quad via `THREE.WebGLRenderer`.

---

## Key Rendering Parameters

| Parameter | Description |
|-----------|-------------|
| **Transfer Function** | Maps scalar intensity → RGBA. Controls tissue visibility (e.g., bone=white, soft tissue=red). |
| **Step Size** | Distance between ray samples. Smaller = higher quality, slower render. |
| **ISO Value** | Threshold for isosurface rendering mode. |
| **Brightness / Contrast** | Post-process adjustments applied in the shader. |

---

## Domain Relevance

Volumetric ray casting is the standard technique for medical imaging because it preserves the full 3D density field (unlike mesh-based rendering). This allows clinicians to adjust the Transfer Function in real-time to highlight specific tissues (bone, blood vessels, tumors) without re-processing the data.
