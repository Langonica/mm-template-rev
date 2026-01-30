import { useRef, useCallback } from 'react';
import styles from './TileSelector.module.css';

/**
 * TileSelector - Multi-option selector displayed as a row of tiles
 *
 * A visual alternative to dropdown selects, displaying options as tiles
 * with optional icons and descriptions. Uses radio group semantics for accessibility.
 *
 * @component
 * @example
 * <TileSelector
 *   label="Theme"
 *   options={[
 *     { value: 'blue-casino', label: 'Blue Casino' },
 *     { value: 'classic-green', label: 'Classic Green' },
 *   ]}
 *   value={theme}
 *   onChange={setTheme}
 * />
 */
function TileSelector({
  options = [],
  value,
  onChange,
  label,
  size = 'md',
  disabled = false
}) {
  const groupRef = useRef(null);

  const handleKeyDown = useCallback((e, currentIndex) => {
    if (disabled) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % options.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) nextIndex = options.length - 1;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = options.length - 1;
        break;
      default:
        return;
    }

    // Focus the next radio button
    const radios = groupRef.current?.querySelectorAll('input[type="radio"]');
    if (radios?.[nextIndex]) {
      radios[nextIndex].focus();
      radios[nextIndex].click();
    }
  }, [disabled, options.length]);

  const handleTileClick = useCallback((optionValue) => {
    if (disabled) return;
    onChange?.(optionValue);
  }, [disabled, onChange]);

  if (!options.length) {
    return null;
  }

  return (
    <div className={styles.container}>
      {label && (
        <div className={styles.groupLabel}>
          {label}
        </div>
      )}

      <div
        ref={groupRef}
        role="radiogroup"
        aria-label={label}
        className={`${styles.tilesContainer} ${styles[`size-${size}`]}`}
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;
          const tileId = `tile-${option.value}-${index}`;

          return (
            <label
              key={option.value}
              htmlFor={tileId}
              className={`
                ${styles.tile}
                ${isSelected ? styles.selected : ''}
                ${disabled ? styles.disabled : ''}
              `.trim()}
            >
              <input
                id={tileId}
                type="radio"
                name={label || 'tile-selector'}
                value={option.value}
                checked={isSelected}
                onChange={() => handleTileClick(option.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={disabled}
                className={styles.radioInput}
                tabIndex={isSelected ? 0 : -1}
              />

              <div className={styles.tileContent}>
                {option.icon && (
                  <div className={styles.icon}>
                    {option.icon}
                  </div>
                )}

                <div className={styles.textContent}>
                  <div className={styles.tileLabel}>
                    {option.label}
                  </div>

                  {option.description && (
                    <div className={styles.description}>
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default TileSelector;
