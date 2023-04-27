import React from 'react';
import css from './RecentlyFiles.module.css';
const RecentlyFiles = () => {
  return (
    <div className={css.files_container}>
      <div className={css.header}>Recently opened files:</div>
      <div className={css.files}>
        <div className={css.left}>
          <div className={css.element}>29 minutes ago</div>
          <div className={css.element}>Mar 28 2023, 10:55 AM</div>
        </div>
        <div>
          <div className={css.element}>demo_file.dicom</div>
          <div className={css.element}>lunk.ktx</div>
        </div>
      </div>
    </div>
  );
};

export default RecentlyFiles;
