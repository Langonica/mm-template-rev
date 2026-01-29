import React from 'react';
import styles from './StalemateModal.module.css';
import FullBleedScreen from '../FullBleedScreen';
import DataCard from '../DataCard';
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton';
import TertiaryButton from '../TertiaryButton';
import ProgressBar from '../ProgressBar';
import { CircleX } from '../Icon';

/**
 * StalemateModal Component (Redesigned)
 *
 * Displayed when the game is in an unwinnable state.
 * Uses unified component library and FullBleedScreen pattern.
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {object} stats - Game statistics
 * @param {function} onNewDeal - Handler for new random deal
 * @param {function} onRestart - Handler for restart level
 * @param {function} onUndo - Handler for undo moves
 * @param {number} undoMoves - Number of moves to undo (default 5)
 * @param {function} onClose - Handler to close modal
 */
const StalemateModal = ({
  isOpen,
  stats,
  onNewDeal,
  onRestart,
  onUndo,
  undoMoves = 5,
  onClose,
}) => {
  if (!isOpen) return null;

  const { moveCount, currentTime, foundationCards, totalCards = 52 } = stats || {};

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.round((foundationCards / totalCards) * 100);

  return (
    <FullBleedScreen isOpen={isOpen}>
      <div className={styles.screen}>
        {/* Stalemate Message */}
        <div className={styles.messageBox}>
          <span className={styles.icon}><CircleX size={48} /></span>
          <h2 className={styles.heading}>No Moves Available</h2>
          <p className={styles.subtext}>
            This game has reached a stalemate. You cannot make any more moves.
          </p>
        </div>

        {/* Final Stats */}
        <div className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>Final Statistics</h3>
          <div className={styles.statsGrid}>
            <DataCard value={moveCount || 0} label="Moves Made" />
            <DataCard value={formatTime(currentTime)} label="Time Elapsed" />
            <DataCard value={`${progressPercentage}%`} label="Completion" />
            <DataCard value={`${foundationCards}/${totalCards}`} label="Cards Placed" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressSection}>
          <ProgressBar
            current={foundationCards}
            total={totalCards}
            showPercentage={false}
            label={`${foundationCards}/${totalCards} cards`}
          />
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <PrimaryButton onClick={onNewDeal}>
            New Deal
          </PrimaryButton>
          
          <SecondaryButton onClick={onRestart}>
            Restart Level
          </SecondaryButton>
          
          <TertiaryButton onClick={onUndo}>
            Undo Last {undoMoves} Moves
          </TertiaryButton>
        </div>
      </div>
    </FullBleedScreen>
  );
};

export default StalemateModal;
