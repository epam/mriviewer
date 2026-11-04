import FloodFill from './floodfill';

describe('threshold flood fill', () => {
  it('fills connected voxels across x/y boundaries while preserving the three-slice margins', () => {
    const pixels = new Uint8Array(81);
    const fill = new FloodFill();

    fill.floodFill3dThreshold(3, 3, 9, pixels, { x: 1, y: 1, z: 4 }, 20);

    expect(Array.from(pixels)).toEqual([...Array(27).fill(0), ...Array(27).fill(255), ...Array(27).fill(0)]);
    expect(fill.m_numFilled3d).toBe(27);
  });

  it.each([0, 2])('does not cross a bright plane when seeded at x=%s', (seedX) => {
    const pixels = Uint8Array.from({ length: 54 }, (_, index) => (index % 3 === 1 ? 200 : 0));
    const fill = new FloodFill();

    fill.floodFill3dThreshold(3, 2, 9, pixels, { x: seedX, y: 0, z: 4 }, 20);

    const expected = Array.from({ length: 54 }, (_, index) => {
      if (index % 3 === 1) return 200;
      const z = Math.floor(index / 6);
      return z >= 3 && z <= 5 && index % 3 === seedX ? 255 : 0;
    });
    expect(Array.from(pixels)).toEqual(expected);
    expect(fill.m_numFilled3d).toBe(6);
  });

  it('includes voxels at the threshold and leaves brighter voxels unchanged', () => {
    const pixels = Uint8Array.from([0, 20, 21]);
    const fill = new FloodFill();

    fill.floodFill3dThreshold(3, 1, 1, pixels, { x: 0, y: 0, z: 0 }, 20);

    expect(Array.from(pixels)).toEqual([255, 255, 21]);
    expect(fill.m_numFilled3d).toBe(2);
  });
});
