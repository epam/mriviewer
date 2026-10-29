/**
 * Class to manage NIFTI volume dimensions and voxel sizes
 */
export class NiftiVolumeManager {
  constructor() {
    this.m_xDim = 0;
    this.m_yDim = 0;
    this.m_zDim = 0;
    this.m_boxSize = { x: 0.0, y: 0.0, z: 0.0 };
  }

  setVolumeDimensions(header) {
    this.m_xDim = header.xDim;
    this.m_yDim = header.yDim;
    this.m_zDim = header.zDim;
  }

  setVoxelSize(header) {
    const TOO_SMALL_SIZE = 1.0e-5;
    this.m_boxSize.x = this.m_xDim * header.pixdim1;
    this.m_boxSize.y = this.m_yDim * header.pixdim2;
    this.m_boxSize.z = this.m_zDim * header.pixdim3;
    if (this.m_boxSize.x < TOO_SMALL_SIZE) {
      const fallback = 312.0;
      this.m_boxSize.x = this.m_boxSize.y = this.m_boxSize.z = fallback;
    }
    console.log(`Physic volume size: ${this.m_boxSize.x} * ${this.m_boxSize.y} * ${this.m_boxSize.z}`);
  }

  getVolumeDimensions() {
    return { xDim: this.m_xDim, yDim: this.m_yDim, zDim: this.m_zDim };
  }

  getBoxSize() {
    return this.m_boxSize;
  }
}
