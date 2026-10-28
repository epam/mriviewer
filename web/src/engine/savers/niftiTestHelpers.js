export const voxelIndex = (x, y, z, xDim, yDim) => z * xDim * yDim + y * xDim + x;

export const makePositionCodedVolume = (xDim, yDim, zDim) => {
  const data = new Uint8Array(xDim * yDim * zDim);
  for (let z = 0; z < zDim; z++) {
    for (let y = 0; y < yDim; y++) {
      for (let x = 0; x < xDim; x++) {
        data[voxelIndex(x, y, z, xDim, yDim)] = 21 + ((x * 3 + y * 5 + z * 11) % 200);
      }
    }
  }
  return data;
};

export const interiorIndices = (xDim, yDim, zDim) => {
  const out = [];
  for (let z = 1; z < zDim - 1; z++) {
    for (let y = 1; y < yDim - 1; y++) {
      for (let x = 1; x < xDim - 1; x++) {
        out.push(voxelIndex(x, y, z, xDim, yDim));
      }
    }
  }
  return out;
};

export const isStrictlyIncreasingMapping = (input, output, indices) => {
  const mapped = new Map();
  for (const i of indices) {
    const known = mapped.get(input[i]);
    if (known !== undefined && known !== output[i]) {
      return false;
    }
    mapped.set(input[i], output[i]);
  }
  const keys = Array.from(mapped.keys()).sort((a, b) => a - b);
  for (let k = 1; k < keys.length; k++) {
    if (mapped.get(keys[k]) <= mapped.get(keys[k - 1])) {
      return false;
    }
  }
  return true;
};
