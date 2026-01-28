import { useState, useEffect } from 'react';
import styles from './OrientationBlocker.module.css';

const OrientationBlocker = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    // Check on mount
    checkOrientation();

    // Listen for orientation and resize changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="12" height="16" rx="2" />
            <path d="M18 12h2" />
            <path d="M22 12l-3-3" />
            <path d="M22 12l-3 3" />
          </svg>
        </div>
        <h2 className={styles.message}>Please rotate your device</h2>
        <p className={styles.subtext}>This game is best played in landscape mode</p>
      </div>
    </div>
  );
};

export default OrientationBlocker;
