import { useSelector } from 'react-redux';
import css from './UISpinner.module.css';

const Spinner = () => {
  const { spinnerProgress, spinnerTitle } = useSelector((state) => state);

  return (
    <div className={css.spinner}>
      <div className={css.loader}></div>
      <div className={css.overlay}></div>
      <div className={css.progress_overlay}></div>
      <div className={css.progress}>{spinnerProgress}</div>
      <div className={css.text}>{spinnerTitle}</div>
    </div>
  );
};

export default Spinner;
