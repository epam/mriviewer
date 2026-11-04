import MeshText2D from './meshtext2d';
import CanvasText from './canvastext';

describe('MeshText2D', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillRect: vi.fn(),
      fillText: vi.fn(),
      measureText: () => ({ width: 144 }),
    });
    vi.spyOn(CanvasText, 'getFontHeight').mockReturnValue(72);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates text and its background with valid face normals', () => {
    const warn = vi.spyOn(console, 'warn');
    const text = new MeshText2D('12 mm');

    text.updateText(0, 0, 0.1, MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP, 'white', 'black');

    expect(text.children).toHaveLength(2);
    for (const mesh of text.children) {
      expect(mesh.geometry.faces).toHaveLength(2);
      for (const face of mesh.geometry.faces) {
        expect(face.normal.toArray()).toEqual([0, 0, 1]);
      }
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it('replaces the background and disposes its resources when text is updated', () => {
    const text = new MeshText2D('12 mm');
    const update = () => text.updateText(0, 0, 0.1, MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP, 'white', 'black');
    update();
    const geometryDispose = vi.spyOn(text.m_boxGeometry, 'dispose');
    const materialDispose = vi.spyOn(text.m_boxMaterial, 'dispose');
    const textureDispose = vi.spyOn(text.m_matTextureBox.m_uniforms.texture1.value, 'dispose');

    update();

    expect(text.children).toHaveLength(2);
    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(materialDispose).toHaveBeenCalledOnce();
    expect(textureDispose).toHaveBeenCalledOnce();
  });
});
