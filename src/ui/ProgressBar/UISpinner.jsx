import React from 'react';
import css from './UISpinner.module.css';

const Spinner = () => {
  return (
    <div className={css.spinner}>
      <div className={css.overlay}></div>
      <div className={css.loader}>Loading...</div>
    </div>
  );
};

export default Spinner;
