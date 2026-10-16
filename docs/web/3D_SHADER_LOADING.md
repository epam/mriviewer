# 3D shader loading

The 3D renderer builds nine `THREE.ShaderMaterial`s (`web/src/engine/gfx/mat*.js`) from the
GLSL files in `web/src/engine/shaders/`. Readiness (`sceneReadyCounter === 5` in
`VolumeRenderer3d.js`) waits on five of them: back face, front face, render-to-texture,
interpolation and volume render. If any of those five is never created the 3D canvas stays black.
The other four (clip plane, ambient occlusion, blur, SSAO) are created elsewhere and do not gate
readiness; a failure there would lose an effect, not blank the scene.

## What was wrong

Each material imported its shader (`import X from '../shaders/x.frag'`) and then passed the
import to `THREE.FileLoader.load(...)`, which treats its argument as a URL. That works when
the bundler turns the import into a file URL. With Vite and `vite-plugin-glsl` (see
`web/vite.config.mjs`) the import is the shader **source text** itself, so the app sent HTTP
requests whose URL was the GLSL code (`GET /precision highp float;...`). They never produced
a shader, no material was created, the ready counter never reached its value and 3D showed
nothing, with no error in the UI.

This reproduces in both `vite` (dev server) and `vite build` + `vite preview` (production bundle),
on a fully capable context (WebGL2, `EXT_color_buffer_float`,
`OES_texture_float_linear`, Apple M1 in Chrome) on unmodified `develop`, and it explains why
the checked-in e2e baseline for the 3D viewer is a black canvas.

## The fix

`gfx/shaderSourceLoader.js` is a drop-in for the `FileLoader` calls: `load(source, onLoad)`
hands the source straight to the callback (asynchronously, like the old loader, so callers still
get the material after `create()` returns). No request is made.

## Tests

`web/src/engine/gfx/shaderMaterials.test.js` builds every one of the nine materials through its
real `create()` and checks that `ShaderMaterial` receives exactly the imported vertex and
fragment source, and that no `XMLHttpRequest` or `fetch` is issued. With the old `FileLoader`
all ten tests fail with "material callback was not called".

## Not covered

The e2e screenshot baseline for the 3D viewer (`...should-check-the-3D-viewer-1-chromium-linux.png`)
is a black canvas captured with the bug. It has to be regenerated in the e2e container after this
change.
