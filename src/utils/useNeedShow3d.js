import { useMemo } from 'react';

const FOUR = 4;

export function useNeedShow3d(volumeSet, volumeIndex) {
  return useMemo(() => {
    const volume = volumeSet.getVolume(volumeIndex);
    if (volume !== null) {
      if (volume.m_bytesPerVoxel !== FOUR) {
        return true;
      }
    }
    return false;
  }, [volumeSet, volumeIndex]);
}
