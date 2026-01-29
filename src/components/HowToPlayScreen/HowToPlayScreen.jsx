import React, { useState } from 'react';
import styles from './HowToPlayScreen.module.css';
import FullBleedScreen from '../FullBleedScreen';
import TabBar from '../TabBar';
import InfoCard from '../InfoCard';
import DataCard from '../DataCard';

/**
 * HowToPlayScreen Component
 *
 * Full-bleed screen displaying game rules and instructions.
 * Replaces RulesModal with unified design.
 *
 * @param {boolean} isOpen - Whether screen is visible
 * @param {function} onClose - Close handler
 */
const HowToPlayScreen = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('goal');

  const tabs = [
    { id: 'goal', label: 'Goal' },
    { id: 'columns', label: 'Columns' },
    { id: 'controls', label: 'Controls' },
    { id: 'modes', label: 'Modes' },
    { id: 'tips', label: 'Tips' },
  ];

  // Goal Tab Content
  const GoalContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.goalHighlight}>
        <span className={styles.goalIcon}>🏆</span>
        <h3>Fill all 8 foundations to win</h3>
      </div>
      <div className={styles.cardsGrid}>
        <DataCard
          value="7 → K"
          label="UP Foundations (4)"
        />
        <DataCard
          value="6 → A"
          label="DOWN Foundations (4)"
        />
      </div>
    </div>
  );

  // Columns Tab Content
  const ColumnsContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.cardsGrid}>
        <InfoCard
          icon={<span className={styles.aceIcon}>A</span>}
          title="Ace Columns"
        >
          Build ascending A→6 with alternating colors.
          Gold highlight indicates ace column.
        </InfoCard>
        <InfoCard
          icon={<span className={styles.kingIcon}>K</span>}
          title="King Columns"
        >
          Build descending K→7 with alternating colors.
          Silver highlight indicates king column.
        </InfoCard>
        <InfoCard
          icon={<span className={styles.emptyIcon}>?</span>}
          title="Empty Columns"
        >
          Only Kings or Aces can start a new column.
          First card determines the column type.
        </InfoCard>
      </div>
    </div>
  );

  // Controls Tab Content
  const ControlsContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.cardsGrid}>
        <InfoCard
          icon={<span className={styles.controlIcon}>🖱</span>}
          title="Drag & Drop"
        >
          Click and drag cards to move them between columns and foundations.
        </InfoCard>
        <InfoCard
          icon={<span className={styles.controlIcon}>⚡</span>}
          title="Double Click"
        >
          Double-click a card to auto-move it to the best available foundation.
        </InfoCard>
        <InfoCard
          icon={<span className={styles.controlIcon}>↶</span>}
          title="Undo / Redo"
        >
          Use Ctrl+Z to undo and Ctrl+Y to redo moves. Limited to last 100 moves.
        </InfoCard>
        <InfoCard
          icon={<span className={styles.controlIcon}>👆</span>}
          title="Touch Controls"
        >
          Long-press to drag on touch devices. Tap to select, tap destination to move.
        </InfoCard>
      </div>
    </div>
  );

  // Modes Tab Content
  const ModesContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.cardsGrid}>
        <InfoCard
          icon={<span className={styles.modeIcon}>1</span>}
          title="Classic"
        >
          <strong>1 Pocket</strong> — All cards face-up.
          Traditional gameplay with complete visibility.
        </InfoCard>
        <InfoCard
          icon={<span className={styles.modeIcon}>2</span>}
          title="Classic Double"
        >
          <strong>2 Pockets</strong> — All cards face-up.
          More storage space for strategic play.
        </InfoCard>
        <InfoCard
          icon={<span className={styles.modeIcon}>🔒</span>}
          title="Hidden"
        >
          <strong>1 Pocket</strong> — Face-down cards.
          Challenge mode with concealed tableau cards.
        </InfoCard>
        <InfoCard
          icon={<span className={styles.modeIcon}>🔒🔒</span>}
          title="Hidden Double"
        >
          <strong>2 Pockets</strong> — Face-down cards.
          Maximum challenge with limited information.
        </InfoCard>
      </div>
    </div>
  );

  // Tips Tab Content
  const TipsContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.tipsList}>
        <InfoCard
          icon={<span className={styles.tipNumber}>1</span>}
          title="Manage Empty Columns"
        >
          Keep empty columns available for Kings and Aces to maximize flexibility.
        </InfoCard>
        <InfoCard
          icon={<span className={styles.tipNumber}>2</span>}
          title="Uncover Hidden Cards"
        >
          In Hidden modes, prioritize revealing face-down cards early in the game.
        </InfoCard>
        <InfoCard
          icon={<span className={styles.tipNumber}>3</span>}
          title="Use Pockets Wisely"
        >
          The pocket can temporarily hold any card — use it strategically to free up moves.
        </InfoCard>
        <InfoCard
          icon={<span className={styles.tipNumber}>4</span>}
          title="Plan Ahead"
        >
          Remember: some cards need to go UP (7→K), others DOWN (6→A) to foundations.
        </InfoCard>
        <InfoCard
          icon={<span className={styles.tipNumber}>5</span>}
          title="Foundation Priority"
        >
          Move cards to foundations when possible to free up tableau space.
        </InfoCard>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'goal': return <GoalContent />;
      case 'columns': return <ColumnsContent />;
      case 'controls': return <ControlsContent />;
      case 'modes': return <ModesContent />;
      case 'tips': return <TipsContent />;
      default: return <GoalContent />;
    }
  };

  return (
    <FullBleedScreen
      isOpen={isOpen}
      onClose={onClose}
      title="How to Play"
    >
      <div className={styles.container}>
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          className={styles.tabBar}
        />
        <div className={styles.content}>
          {renderContent()}
        </div>
      </div>
    </FullBleedScreen>
  );
};

export default HowToPlayScreen;
