import styles from './BackButton.module.css';
import { ArrowLeft } from '../Icon';

export default function BackButton({ onClick, className = '' }) {
  return (
    <button
      className={`${styles.backButton} ${className}`}
      onClick={onClick}
      aria-label="Go back"
      type="button"
    >
      <ArrowLeft size={20} />
    </button>
  );
}
