import React, { useState, useEffect } from 'react';
import css from './RecentlyFiles.module.css';

const RECENT_FILES_KEY = 'recentFiles';
const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < MINUTE) {
    return `${seconds} seconds ago`;
  } else if (seconds < HOUR) {
    const minutes = Math.floor(seconds / MINUTE);
    return `${minutes} minutes ago`;
  } else if (seconds < DAY) {
    const hours = Math.floor(seconds / HOUR);
    return `${hours} hours ago`;
  } else {
    const date = new Date(timestamp);
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleString('en-US', options);
  }
};

const RecentlyFiles = () => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    setFiles(JSON.parse(localStorage.getItem(RECENT_FILES_KEY)) || []);
  }, []);

  const timestamps = files.map((file) => file.timestamp);

  const fileNames = files.map((file) => file.fileName);

  return files.length ? (
    <div className={css.files_container}>
      <div className={css.header}>Recently opened files:</div>
      <div className={css.files}>
        <div className={css.left}>
          {timestamps.map((timestamp, idx) => (
            <div key={timestamp + `_${idx}`} className={css.element}>
              {formatRelativeTime(timestamp)}
            </div>
          ))}
        </div>
        <div className={css.right}>
          {fileNames.map((fileName, idx) => (
            <div key={fileName + `_${idx}`} className={css.element}>
              {fileName}
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;
};

export default RecentlyFiles;
