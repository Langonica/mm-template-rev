import React, { useState } from 'react';
import styles from './HowToPlayScreen.module.css';
import FullBleedScreen from '../FullBleedScreen';
import TabBar from '../TabBar';
import InfoCard from '../InfoCard';
import DataCard from '../DataCard';

/**
 * HowToPlayScreen Component
 * 
 * Rules and instructions with back button
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

  const GoalContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.goalHighlight}>
        <span className={styles.goalIcon}>🏆</span>
        <h3>Fill all 8 foundations to win</h3>
      </div>
      <div className={styles.cardsGrid}>
        <DataCard value="7 → K" label="UP Foundations (4)" />
        <DataCard value="6 → A" label="DOWN Foundations (4)" />
      </div>
    </div>
  );

  const ColumnsContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.cardsGrid}>
        <InfoCard icon={<span className={styles.aceIcon}>A</span>} title="Ace Columns">
          Build ascending A→6 with alternating colors.
        </InfoCard>
        <InfoCard icon={<span className={styles.kingIcon}>K</span>} title="King Columns">
          Build descending K→7 with alternating colors.
        </InfoCard>
        <InfoCard icon={<span className={styles.emptyIcon}>□</span>} title="Empty Columns">
          Only Kings or Aces can start an empty column.
        </InfoCard>
      </div>
    </div>
  );

  const ControlsContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.cardsGrid}>
        <InfoCard icon={<span className={styles.controlIcon}>🖱️</span>} title="Drag & Drop">
          Click and drag cards to move them.
        </InfoCard>
        <InfoCard icon={<span className={styles.controlIcon}>👆</span>} title="Double Click">
          Double-click a card to auto-move to foundation.
        </InfoCard>
        <InfoCard icon={<span className={styles.controlIcon}>📱</span>} title="Touch">
          Touch to select, touch destination to move.
        </InfoCard>
        <InfoCard icon={<span className={styles.controlIcon}>⌨️</span>} title="Keyboard">
          Ctrl+Z to undo, Escape to pause.
        </InfoCard>
      </div>
    </div>
  );

  const ModesContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.cardsGrid}>
        <InfoCard icon={<span className={styles.modeIcon}>📘</span>} title="Classic">
          Standard rules with one pocket. Most balanced.
        </InfoCard>
        <InfoCard icon={<span className={styles.modeIcon}>📗</span>} title="Classic Double">
          Two pockets for easier card management.
        </InfoCard>
        <InfoCard icon={<span className={styles.modeIcon}>🎴</span>} title="Hidden">
          Face-down cards in columns. More challenging.
        </InfoCard>
        <InfoCard icon={<span className={styles.modeIcon}>🃏</span>} title="Hidden Double">
          Hidden cards with two pockets. Expert mode.
        </InfoCard>
      </div>
    </div>
  );

  const TipsContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.tipsGrid}>
        <InfoCard icon={<span className={styles.tipNumber}>1</span>} title="Empty Columns">
          Keep empty columns for Kings and Aces.
        </InfoCard>
        <InfoCard icon={<span className={styles.tipNumber}>2</span>} title="Hidden Cards">
          Prioritize revealing face-down cards early.
        </InfoCard>
        <InfoCard icon={<span className={styles.tipNumber}>3</span>} title="Pocket Usage">
          Use pocket strategically to free up moves.
        </InfoCard>
        <InfoCard icon={<span className={styles.tipNumber}>4</span>} title="Plan Ahead">
          Cards go UP (7→K) or DOWN (6→A).
        </InfoCard>
        <InfoCard icon={<span className={styles.tipNumber}>5</span>} title="Foundations">
          Move to foundations to free tableau space.
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
    <FullBleedScreen isOpen={isOpen}>
      <div className={styles.screen}>
        <button className={styles.backButton} onClick={onClose}>←</button>
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className={styles.tabBar} />
        <div className={styles.content}>
          {renderContent()}
        </div>
      </div>
    </FullBleedScreen>
  );
};

export default HowToPlayScreen;
