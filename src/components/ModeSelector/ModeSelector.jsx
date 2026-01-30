import { useRef, useCallback, useEffect } from 'react';
import styles from './ModeSelector.module.css';

function ModeSelector({ options, value, onChange, disabled = false }) {
  const containerRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (disabled) return;

    const currentIndex = options.findIndex(opt => opt.value === value);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentIndex === options.length - 1 ? 0 : currentIndex + 1;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
        break;
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = currentIndex + 2 < options.length ? currentIndex + 2 : currentIndex;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentIndex - 2 >= 0 ? currentIndex - 2 : currentIndex;
        break;
      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      onChange(options[nextIndex].value);
    }
  }, [options, value, onChange, disabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  const handleClick = useCallback((optionValue) => {
    if (!disabled) {
      onChange(optionValue);
    }
  }, [onChange, disabled]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      role="radiogroup"
      aria-label="Game mode selection"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`${styles.tile} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
            onClick={() => handleClick(option.value)}
            disabled={disabled}
            tabIndex={isSelected ? 0 : -1}
          >
            <span className={styles.label}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ModeSelector;
