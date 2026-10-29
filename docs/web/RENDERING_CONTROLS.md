# 3D Rendering Controls & Settings

A detailed guide to the visualization tools available in the 3D viewing mode, explaining their purpose, medical application, and underlying technology.

---

## 1. Isosurface (Thresholding)

**Description:**  
Renders a 3D surface representing a specific density value. Only tissues matching exactly this density are visible, creating a "skin" extraction effect.

**Medical Discovery:**  
Crucial for segmentation. It allows clinicians to isolate specific structures with distinct densities, such as bone surfaces, contrast-filled vessels, or skin boundaries, hiding everything else.

**Under the Hood:**  
The ray marching shader checks each sampled voxel's intensity. If it crosses the user-defined threshold, a surface point is calculated using gradient-based lighting (Phong shading) to simulate depth and texture.

---

## 2. Ambient Occlusion

**Description:**  
Adds soft shadows to crevices and deep areas of the 3D model, making the shape and depth much easier to perceive.

**Medical Discovery:**  
Enhances spatial relationships between complex anatomical structures (e.g., sulci in the brain, folding of the colon). Without it, 3D structures can look flat and featureless.

**Under the Hood:**  
Implemented as a screen-space effect (SSAO) or pre-calculated volume shadowing. It estimates how exposed each surface point is to "ambient" light; recessed areas receive less light and appear darker.

---

## 3. Maximum Intensity Projection (MIP)

**Description:**  
Instead of accumulating color/opacity along a ray, this mode displays only the *brightest* voxel encountered along each viewing ray.

**Medical Discovery:**  
The gold standard for vascular imaging (angiography). It allows blood vessels (which are bright with contrast agent) to be clearly visualized through surrounding soft tissue, even if they are deep inside the volume.

**Under the Hood:**  
The ray caster traverses the volume and keeps track of the maximum intensity value found. The final pixel color corresponds directly to this maximum value, effectively "flattening" the brightest structures onto the screen.

---

## 4. Opacity (Transfer Function Alpha)

**Description:**  
Controls the transparency of the volume. Lower opacity makes the volume more "ghost-like," allowing you to see internal structures through outer layers.

**Medical Discovery:**  
Useful for visualizing overlapping structures, such as a tumor inside an organ or the position of an implant relative to surrounding bone.

**Under the Hood:**  
Modifies the Alpha channel in the Transfer Function. During ray compositing, this value determines how much each sample contributes to obstructing the background.

---

## 5. Cut (Clipping Plane)

**Description:**  
A virtual knife that slices through the 3D volume, removing one side to reveal the interior cross-section.

**Medical Discovery:**  
Essential for virtually dissecting organs to inspect internal pathologies (e.g., inside heart chambers) without obstructions from the chest wall or ribs.

**Under the Hood:**  
The shader discards any fragments or ray samples that lie on the "negative" side of a user-defined mathematical plane equation ($Ax + By + Cz + D = 0$).

---

## 6. Brightness & Contrast

**Description:**  
**Brightness** shifts the overall image intensity.  
**Contrast** expands or shrinks the range of displayed visible intensities (window width/level).

**Medical Discovery:**  
Standard for all radiology reading. Adjusting these helps differentiate tissues with very subtle density differences (e.g., gray matter vs. white matter in the brain).

**Under the Hood:**  
Applied as a post-processing step or directly during ray sample mapping. It linearly transforms the input voxel intensity $I$ before looking up the color: $I_{final} = (I - \text{Level}) \times \text{Width} + \text{Brightness}$.

---

## 7. Quality (Step Size)

**Description:**  
Adjusts the fidelity of the rendering. High quality is sharper but may be slower; low quality is faster but may look "layered" or blurry.

**Medical Discovery:**  
Allows the user to balance performance vs. detail. High quality is needed for final diagnosis; low quality is useful for smooth rotation and manipulation on slower computers.

**Under the Hood:**  
Controls the **step size** of the ray marching algorithm. A smaller step size means more samples per ray (higher precision, higher GPU load). A larger step size misses fine details but renders much faster.

---

## 8. Volume Eraser

**Description:**  
Manual tool to "paint" over parts of the volume to permanently hide them from the 3D view.

**Medical Discovery:**  
Used to manually remove artifacts, skull stripping (removing bone to see brain), or removing table/headrest structures that clutter the view.

**Under the Hood:**  
Uses a secondary 3D texture (Mask Volume). When the user "erases," the tool writes zeros into this mask texture at the corresponding 3D coordinates. The shader checks this mask; if the value is 0, the voxel is skipped during rendering.


---

## 9. Set (Transfer Function Histogram/Sliders)

**Description:**
A set of three sliders overlaying a density histogram (shown in the screenshot).
*   **Left Slider (Min):** Hides everything below this density (noise, air, low-density tissue).
*   **Middle Slider (Peak/Mid):** Defines the density range that should be most visible or opaque.
*   **Right Slider (Max):** Hides everything above this density or defines the upper limit of the contrast window.

**Medical Discovery:**
This IS the primary tool for "windowing" in 3D. It allows the user to dynamically tune the visible tissue range.
*   *Example:* Slide left to see skin, slide middle to see muscle/organs, slide right to see only bone and contrast dye.

**Under the Hood:**
These sliders define the **control points** of the Transfer Function.
*   The system creates a piecewise linear function (a ramp or a curve) based on these three positions.
*   Voxel intensities map to this function to determine their Opacity (Alpha) and Color.
*   The histogram in the background shows the distribution of tissue densities in the dataset, helping the user know where to place the sliders (e.g., placing the middle slider on a tall peak to highlight that specific tissue).

---

## 10. ROI (Region of Interest) Selection

**Description:**  
Allows highlighting or isolating specific segmented regions (e.g., "Lung", "Heart", "Tumor") if the dataset contains pre-calculated segmentation masks.

**Medical Discovery:**  
Focuses the view on a specific organ or pathology while ghosting out the rest of the anatomy for context.

**Under the Hood:**  
The dataset includes an additional byte-map where each voxel holds an ID. The renderer creates a specific color map assigned to each ID, allowing selective visibility rendering based on the voxel's integer ID.
