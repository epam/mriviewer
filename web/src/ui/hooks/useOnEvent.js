import { useEffect, useRef } from 'react';
import MriViewer from '../../engine/lib/MRIViewer';

export function useOnEvent(event, callback) {
  const mriViewer = useRef(MriViewer).current;

  useEffect(() => {
    mriViewer.events.on(event, callback);

    return () => {
      mriViewer.events.off(event, callback);
    };
  }, [callback]);
}
