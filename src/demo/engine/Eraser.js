/**
 * @fileOverview Eraser
 * @author Epam
 * @version 1.0.0
 */
// ********************************************************
// Imports
// ********************************************************/**
import * as THREE from 'three';
// ********************************************************
// Class Eraser is used for erasing of volume data part
// ********************************************************
export default class Eraser {
  constructor() {
    this.bufferBF = null;
    this.bufferFF = null;
    this.bufferRenderToTexture = null;
    this.isoThreshold = 0;
    this.volTextureMask = null;
    this.geometry = null;
    this.lastSize = [];
    this.lastDepth = [];
    this.lastRotationVector = [];
    this.lastTarget = [];
    this.lastMode = [];
    this.lastBackDistance = [];
    this.resetflag = false;
    this.bufferTextureCPU = null;
  }
  createUpdatableVolumeMask(params, buff) {
    this.xDim = params.xDim;
    this.yDim = params.yDim;
    this.zDim = params.zDim;
    this.bufferBF = params.bufBF;
    this.bufferFF = params.bufFF;
    this.bufferRenderToTexture = params.bufTex;
    this.bufferMask = new Uint8Array(this.xDim * this.yDim * this.zDim);
    this.bufferTextureCPU = buff;
    for (let z = 0; z < this.zDim; z++) {
      for (let y = 0; y < this.yDim; y++) {
        for (let x = 0; x < this.xDim; x++) {
          this.bufferMask[x + y * this.xDim + z * this.xDim * this.yDim] = 255;
        }
      }
    }
    if (this.updatableTextureMask) {
      this.updatableTextureMask.dispose();
    }
    this.updatableTextureMask = new THREE.DataTexture3D(this.bufferMask, this.xDim, this.yDim, this.zDim);
    this.updatableTextureMask.format = THREE.RedFormat;
    this.updatableTextureMask.type = THREE.UnsignedByteType;
    this.updatableTextureMask.wrapS = THREE.ClampToEdgeWrapping;
    this.updatableTextureMask.wrapT = THREE.ClampToEdgeWrapping;
    this.updatableTextureMask.magFilter = THREE.LinearFilter;
    this.updatableTextureMask.minFilter = THREE.LinearFilter;
    this.updatableTextureMask.needsUpdate = true;
    return this.updatableTextureMask;
  }
  eraseStart(xx, yy, windowWidth, isoThreshold, startflag) {
    this.isoThreshold = isoThreshold;
    const x = Math.round(xx);
    const y = Math.round(yy);
    this.eraserMouseDown = true;
    const OFF0 = 0;
    const OFF1 = 1;
    const OFF2 = 2;
    const OFF3 = 3;
    const GPU_CELL_SIZE = 4;
    const cellInd = (y * windowWidth + x) * GPU_CELL_SIZE;
    const THREE3 = 3;
    const bigCellInd = (Math.floor(y / THREE3) * Math.floor(windowWidth / THREE3) +
      Math.floor(x / THREE3)) * GPU_CELL_SIZE;
    const dist = this.bufferRenderToTexture[bigCellInd + OFF3];
    const NO_MATERIAL = 2;
    if (dist === NO_MATERIAL) {
      return;
    }
    let vX = this.bufferBF[cellInd + OFF0] - this.bufferFF[cellInd + OFF0];
    let vY = this.bufferBF[cellInd + OFF1] - this.bufferFF[cellInd + OFF1];
    let vZ = this.bufferBF[cellInd + OFF2] - this.bufferFF[cellInd + OFF2];
    const vDir = new THREE.Vector3(vX, vY, vZ);
    const length = Math.sqrt(vX * vX + vY * vY + vZ * vZ);
    const COORD_SHIFT = 0.5;
    vX = vX / length * dist + COORD_SHIFT + this.bufferFF[cellInd + OFF0];
    vY = vY / length * dist + COORD_SHIFT + this.bufferFF[cellInd + OFF1];
    vZ = vZ / length * dist + COORD_SHIFT + this.bufferFF[cellInd + OFF2];
    this.erasePixels(vX, vY, vZ, vDir, startflag, dist);
    this.updatableTextureMask.needsUpdate = true;
  }
  onMouseUp() {
    this.orbitControl.onMouseUp();
    this.lockEraserBuffersUpdating = false;
    this.eraserMouseDown = false;
    this.renderState = this.RENDER_STATE.ONCE;
  }
  setEraserRadius(radius) {
    this.radius = radius;
  }
  setEraserDepth(depth) {
    this.depth = depth;
  }
  erasePixels(x_, y_, z_, vDir, startflag, length) {
    const targetX = Math.floor(x_ * this.xDim);
    const targetY = Math.floor(y_ * this.yDim);
    const targetZ = Math.floor(z_ * this.zDim);
    const normal = new THREE.Vector3();
    const normalGauss = new THREE.Vector3();
    const GAUSS_R = 2;
    const SIGMA = 1.4;
    const SIGMA2 = SIGMA * SIGMA;
    let nX = 0;
    let nY = 0;
    let nZ = 0;
    let normFactor = 0;
    let offDst = 0;
    const VAL_2 = 2; // getting normal of surface
    for (let k = -Math.min(GAUSS_R, targetZ); k <= Math.min(GAUSS_R, this.zDim - 1 - targetZ); k++) {
      for (let j = -Math.min(GAUSS_R, targetY); j <= Math.min(GAUSS_R, this.yDim - 1 - targetY); j++) {
        for (let i = -Math.min(GAUSS_R, targetX); i <= Math.min(GAUSS_R, this.xDim - 1 - targetX); i++) {
          // handling voxel: (targetX + i; ,targetY+ j; targetZ + k);
          const gX = targetX + i;
          const gY = targetY + j;
          const gZ = targetZ + k;
          offDst = gX + gY * this.xDim + gZ * this.xDim * this.yDim;
          const gauss = 1 - Math.exp(-(i * i + j * j + k * k) / (VAL_2 * SIGMA2));
          normFactor += gauss;
          const curVal = this.bufferTextureCPU[offDst];
          nX += curVal * gauss * (-i / SIGMA2);
          nY += curVal * gauss * (-j / SIGMA2);
          nZ += curVal * gauss * (-k / SIGMA2);
        }
      }
    }// end gauss summation
    normalGauss.set(nX / normFactor, nY / normFactor, nZ / normFactor);
    normal.copy(normalGauss);
    normal.normalize();
    const pi = 180;// pi (just for console output)
    const radiusRatio = this.xDim / this.zDim;
    const geometry = new THREE.CylinderGeometry(this.radius, this.radius, this.depth, pi, this.depth);
    const mesh = new THREE.Mesh(geometry, null);
    const axis = new THREE.Vector3(0, 0, 1);
    mesh.quaternion.setFromUnitVectors(axis, normal.clone().normalize().multiplyScalar(-1));
    mesh.position.copy(new THREE.Vector3(targetX, targetY, targetZ));

    if (startflag === true) {
      this.prevDistance = length;
      this.resetflag = false;
    }
    const radius = 0.05;
    if (this.resetflag === false) {
      if (Math.abs(this.prevDistance - length) < radius) {
        this.prevDistance = length;
        this.point = new THREE.Vector3(0, 0, 0);
        this.queue = [];
        this.queue.push(this.point);
        const normalBack = -5;
        let backZ = 0;
        backZ = normalBack;
        let deleteflag = false;
        while (this.queue.length > 0) {
          this.point = this.queue.pop();
          const RotPoint = this.point.clone();
          RotPoint.z *= radiusRatio;
          RotPoint.applyAxisAngle(new THREE.Vector3(1, 0, 0), -mesh.rotation.x);
          RotPoint.applyAxisAngle(new THREE.Vector3(0, 1, 0), -mesh.rotation.y);
          RotPoint.applyAxisAngle(new THREE.Vector3(0, 0, 1), mesh.rotation.z);
          if (Math.sqrt(RotPoint.x * RotPoint.x + RotPoint.y * RotPoint.y) > this.radius ||
            Math.abs(RotPoint.z) > this.depth || RotPoint.z < backZ) {
            continue;
          }
          for (let x = this.point.x - 1; x <= this.point.x + 1; x++) {
            for (let y = this.point.y - 1; y <= this.point.y + 1; y++) {
              for (let z = this.point.z - 1; z <= this.point.z + 1; z++) {
                const mainX = targetX + Math.round(x);
                const mainY = targetY + Math.round(y);
                const mainZ = targetZ + Math.round(z);
                offDst = mainX + mainY * this.xDim + mainZ * this.xDim * this.yDim;
                if (this.bufferMask[offDst] === 0) {
                  continue;
                }
                const bitconst = 255.0;
                const borderinclude = 0.01;
                const isoSurfaceBorder = this.isoThreshold * bitconst - borderinclude * bitconst;
                if (this.bufferTextureCPU[offDst] >= isoSurfaceBorder) {
                  deleteflag = true;
                  this.bufferMask[offDst] = 0;
                  this.queue.push(new THREE.Vector3(x, y, z));
                }
              }
            }
          }
        }
        if (deleteflag === true) {
          this.lastSize.push(this.radius);
          this.lastDepth.push(this.depth);
          this.lastRotationVector.push(new THREE.Vector3(-mesh.rotation.x, -mesh.rotation.y, mesh.rotation.z));
          this.lastTarget.push(new THREE.Vector3(targetX, targetY, targetZ));
          this.lastBackDistance.push(-Math.round(Math.abs(Math.tan(vDir.normalize().angleTo(normalGauss.normalize())))
            * (this.radius)));
        } 
        this.updatableTextureMask.needsUpdate = true;
        
      } else {
        this.resetflag = false;
      }
    }
  }
  undoLastErasing() {
    if (this.lastSize.length === 0) {
      return;
    }
    const targetLast = this.lastTarget.pop();
    const lastRotation = this.lastRotationVector.pop();
    const rxy = Math.round(this.lastSize.pop());
    const lastDepth = this.lastDepth.pop();
    const lastback = this.lastBackDistance.pop();
    const radiusRatio = this.xDim / this.zDim;
    this.point = new THREE.Vector3(0, 0, 0);
    this.queue = [];
    this.queue.push(this.point);
    while (this.queue.length > 0) {
      this.point = this.queue.pop();
      const RotPoint = this.point.clone();
      RotPoint.z *= radiusRatio;
      RotPoint.applyAxisAngle(new THREE.Vector3(1, 0, 0), lastRotation.x);
      RotPoint.applyAxisAngle(new THREE.Vector3(0, 1, 0), lastRotation.y);
      RotPoint.applyAxisAngle(new THREE.Vector3(0, 0, 1), lastRotation.z);
      if (Math.sqrt(RotPoint.x * RotPoint.x + RotPoint.y * RotPoint.y) > rxy ||
        RotPoint.z > lastDepth || RotPoint.z < lastback) {
        continue;
      }
      let offDst = 0;
      for (let x = this.point.x - 1; x <= this.point.x + 1; x++) {
        for (let y = this.point.y - 1; y <= this.point.y + 1; y++) {
          for (let z = this.point.z - 1; z <= this.point.z + 1; z++) {
            const mainX = targetLast.x + Math.round(x);
            const mainY = targetLast.y + Math.round(y);
            const mainZ = targetLast.z + Math.round(z);
            offDst = mainX + mainY * this.xDim + mainZ * this.xDim * this.xDim;
            if (this.bufferMask[offDst] === 0) {
              this.bufferMask[offDst] = 255.0;
              this.queue.push(new THREE.Vector3(x, y, z));
            }
          }
        }
      }
    }
    this.updatableTextureMask.needsUpdate = true;
  }
} // class Eraser
