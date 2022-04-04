/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useContext, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import StoreActionType from '../../store/ActionTypes';
import { useInterval } from '../../utils/useInterval';

const JobContext = React.createContext(null);

export const JobContextProvider = ({ children }) => {
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
        dispatch({ type: StoreActionType.SET_PROGRESS, progress: runningJob.current.getProgress() });
      }
    },
    isRunning ? 200 : null
  );

  const startJob = (job, onFinish) => {
    setIsRunning(true);
    runningJob.current = job;
    onFinishJob.current = onFinish;
  };

  return <JobContext.Provider value={{ startJob }}>{children}</JobContext.Provider>;
};

export const useJobContext = () => {
  const context = useContext(JobContext);
  const contextName = 'JobContext';

  if (!context) {
    throw new Error(`Used outside of "${contextName}"`);
  }

  return context;
};
