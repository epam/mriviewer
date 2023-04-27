/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useContext, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import StoreActionType from '../../store/ActionTypes';
import { useInterval } from '../../utils/useInterval';

const AppContext = React.createContext(null);

export const AppContextProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [isRunning, setIsRunning] = useState(false);

  const runningJob = useRef(null);
  const onFinishJob = useRef(null);

  useInterval(
    () => {
      const isFinished = runningJob.current.run();

      if (isFinished) {
        onFinishJob.current();
        setIsRunning(false);
        dispatch({ type: StoreActionType.SET_PROGRESS, progress: 0 });
      } else {
        const progress = runningJob.current.getProgress();
        const titleProgressBar = 'Please wait, applying filter...';
        dispatch({ type: StoreActionType.SET_PROGRESS, progress });
        dispatch({ type: StoreActionType.SET_PROGRESS_INFO, titleProgressBar });
      }
    },
    isRunning ? 200 : null
  );

  const startJob = (job, onFinish) => {
    setIsRunning(true);
    runningJob.current = job;
    onFinishJob.current = onFinish;
  };

  return <AppContext.Provider value={{ startJob }}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  const contextName = 'AppContext';

  if (!context) {
    throw new Error(`Used outside of "${contextName}"`);
  }

  return context;
};
