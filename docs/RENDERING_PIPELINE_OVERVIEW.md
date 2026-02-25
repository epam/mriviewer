# 3D Medical Image Rendering Pipeline

A high-level overview of how volumetric medical images are processed and rendered in 3D.

---

## 1. File Ingestion

The application accepts standard medical imaging formats (DICOM, NIfTI). File headers are inspected to determine the format and route to the appropriate parser.

---

## 2. Metadata Extraction

Each image slice is parsed to extract critical metadata: pixel dimensions, physical spacing between pixels, slice position in 3D space, and patient orientation vectors.

---

## 3. Multi-Series Handling

Medical studies often contain multiple scans (e.g., different anatomical views or time points). Slices are grouped by shared geometric properties to separate distinct series for individual viewing.

---

## 4. Volume Assembly

Slices within a series are sorted by their physical position along the scan axis. The ordered 2D images are stacked to form a 3D voxel grid representing the patient's anatomy.

---

## 5. GPU Transfer

The 3D voxel data is uploaded to graphics memory as a volumetric texture. A lookup table (Transfer Function) is also uploaded, which maps intensity values to colors and transparency levels.

---

## 6. Volume Rendering (Ray Casting)

For each screen pixel, a virtual ray is cast through the 3D volume. The ray samples intensity values at regular intervals, converting each sample to a color/opacity via the Transfer Function. Samples are blended front-to-back until the ray exits the volume.

---

## 7. Final Display

The accumulated color and opacity values are composited into the final image and displayed on screen.

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Transfer Function** | A mapping from scalar intensity to visual appearance. Enables selective visualization of tissues (e.g., bone vs. soft tissue). |
| **Ray Casting** | A direct volume rendering technique that samples the 3D data along viewing rays to produce an image without intermediate geometry. |
| **Voxel** | A 3D pixel; the fundamental unit of volumetric data. |

---

## Why Ray Casting for Medical Imaging?

Unlike surface-based rendering (meshes), ray casting preserves the full volumetric density field. This allows clinicians to interactively adjust visualization parameters—highlighting different tissue types—without reprocessing the underlying data. It is the standard approach for CT, MRI, and PET visualization.
