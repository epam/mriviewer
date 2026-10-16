import * as THREE from 'three';

import MaterialAO from './matAO';
import MaterialBF from './matbackface';
import MaterialBlur from './matblur';
import MaterialClipPlane from './matclipplane';
import MaterialFF from './matfrontface';
import MaterialInterpolation from './matinterpolation';
import MaterialRenderToTexture from './matrendertotexture';
import MaterialSSAO from './matssao';
import MaterialVolumeRender from './matvolumerender';

import AO_VERT from '../shaders/createAO.vert';
import AO_FRAG from '../shaders/createAO.frag';
import BF_VERT from '../shaders/backface.vert';
import BF_FRAG from '../shaders/backface.frag';
import BLUR_VERT from '../shaders/blur.vert';
import BLUR_FRAG from '../shaders/blur.frag';
import CLIP_VERT from '../shaders/clipplane.vert';
import CLIP_FRAG from '../shaders/clipplane.frag';
import FF_VERT from '../shaders/frontface.vert';
import FF_FRAG from '../shaders/frontface.frag';
import INTERP_VERT from '../shaders/interpolation.vert';
import INTERP_FRAG from '../shaders/interpolation.frag';
import RTT_VERT from '../shaders/rendertotexture.vert';
import RTT_FRAG from '../shaders/rendertotexture.frag';
import SSAO_VERT from '../shaders/ssao.vert';
import SSAO_FRAG from '../shaders/ssao.frag';
import VOL_VERT from '../shaders/volumerender.vert';
import VOL_FRAG from '../shaders/volumerender.frag';

const tex = () => new THREE.Texture();
const vec2 = () => new THREE.Vector2(1, 1);
const offsets = () => new Float32Array(96);

const CASES = [
  ['MaterialAO', (cb) => new MaterialAO().create(tex(), vec2(), tex(), vec2(), 0.5, cb), AO_VERT, AO_FRAG],
  ['MaterialBF', (cb) => new MaterialBF().create(cb), BF_VERT, BF_FRAG],
  ['MaterialBlur', (cb) => new MaterialBlur().create(tex(), tex(), vec2(), tex(), tex(), cb), BLUR_VERT, BLUR_FRAG],
  ['MaterialClipPlane', (cb) => new MaterialClipPlane().create(tex(), cb), CLIP_VERT, CLIP_FRAG],
  ['MaterialFF', (cb) => new MaterialFF().create(tex(), cb), FF_VERT, FF_FRAG],
  ['MaterialInterpolation', (cb) => new MaterialInterpolation().create(tex(), cb), INTERP_VERT, INTERP_FRAG],
  [
    'MaterialRenderToTexture',
    (cb) => new MaterialRenderToTexture().create(tex(), tex(), tex(), tex(), tex(), tex(), offsets(), cb),
    RTT_VERT,
    RTT_FRAG,
  ],
  ['MaterialSSAO', (cb) => new MaterialSSAO().create(tex(), tex(), tex(), tex(), tex(), cb), SSAO_VERT, SSAO_FRAG],
  [
    'MaterialVolumeRender',
    (cb) => new MaterialVolumeRender().create(tex(), tex(), tex(), tex(), tex(), tex(), tex(), offsets(), cb),
    VOL_VERT,
    VOL_FRAG,
  ],
];

const createMaterial = (create) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('material callback was not called')), 2000);
    create((material) => {
      clearTimeout(timer);
      resolve(material);
    });
  });

describe('shader materials are built from the imported shader source', () => {
  it.each(CASES)('%s passes the imported vertex and fragment source to ShaderMaterial', async (_name, create, vertex, fragment) => {
    const material = await createMaterial(create);

    expect(material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(vertex.length).toBeGreaterThan(20);
    expect(fragment.length).toBeGreaterThan(20);
    expect(material.vertexShader).toBe(vertex);
    expect(material.fragmentShader).toBe(fragment);
    expect(material.vertexShader).toContain('void main');
    expect(material.fragmentShader).toContain('void main');
  });

  it('does not issue any network request while building materials', async () => {
    const open = vi.spyOn(XMLHttpRequest.prototype, 'open');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await Promise.all(CASES.map(([, create]) => createMaterial(create)));

    expect(open).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    open.mockRestore();
    vi.unstubAllGlobals();
  });
});
