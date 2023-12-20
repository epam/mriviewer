import { useEffect, useRef } from 'react';
import MriViwer from '../../engine/lib/MRIViewer';

export function useOnEvent(event, callback) {
  const mriViwer = useRef(MriViwer).current;

  useEffect(() => {
    mriViwer.events.on(event, callback);

    return () => {
      mriViwer.events.off(event, callback);
    };
  }, [callback]);
}
