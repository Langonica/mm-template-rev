import React, { useState } from 'react';
import styles from './StatisticsScreen.module.css';
import FullBleedScreen from '../FullBleedScreen';
import TabBar from '../TabBar';
import DataCard from '../DataCard';
import TertiaryButton from '../TertiaryButton';

/**
 * StatisticsScreen Component
 *
 * Full-bleed screen displaying game statistics.
 * Replaces StatsModal with unified design.
 *
 * @param {boolean} isOpen - Whether screen is visible
 * @param {function} onClose - Close handler
 * @param {object} stats - Game statistics object
 * @param {number} winRate - Win rate percentage
 * @param {function} formatTime - Time formatting function
 * @param {function} onReset - Reset statistics handler
 */
const StatisticsScreen = ({
  isOpen,
  onClose,
  stats,
  winRate,
  formatTime,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'records', label: 'Records' },
    { id: 'byMode', label: 'By Mode' },
  ];

  const modeLabels = {
    classic: 'Classic',
    classic_double: 'Classic Double',
    hidden: 'Hidden',
    hidden_double: 'Hidden Double',
  };

  // Reset button for header
  const headerRight = showResetConfirm ? (
    <div className={styles.resetConfirm}>
      <span className={styles.resetWarning}>Reset all stats?</span>
      <TertiaryButton onClick={onReset}>Yes</TertiaryButton>
      <TertiaryButton onClick={() => setShowResetConfirm(false)}>No</TertiaryButton>
    </div>
  ) : (
    <TertiaryButton onClick={() => setShowResetConfirm(true)}>
      Reset
    </TertiaryButton>
  );

  // Overview Tab
  const OverviewContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.overviewGrid}>
        <DataCard value={stats.totalGames} label="Games Played" />
        <DataCard value={stats.wins} label="Wins" />
        <DataCard value={stats.losses} label="Losses" />
        <DataCard value={`${winRate}%`} label="Win Rate" />
        <DataCard value={stats.forfeits || 0} label="Forfeits" />
        <DataCard value={stats.totalMoves.toLocaleString()} label="Total Moves" />
      </div>
      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Total Play Time</span>
          <span className={styles.summaryValue}>{formatTime(stats.totalPlayTime)}</span>
        </div>
      </div>
    </div>
  );

  // Records Tab
  const RecordsContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.recordsGrid}>
        <div className={styles.recordCard}>
          <div className={styles.recordIcon}>🔥</div>
          <div className={styles.recordValue}>{stats.currentStreak}</div>
          <div className={styles.recordLabel}>Current Streak</div>
        </div>
        <div className={styles.recordCard}>
          <div className={styles.recordIcon}>⭐</div>
          <div className={styles.recordValue}>{stats.bestStreak}</div>
          <div className={styles.recordLabel}>Best Streak</div>
        </div>
        <div className={styles.recordCard}>
          <div className={styles.recordIcon}>🎯</div>
          <div className={styles.recordValue}>{stats.bestWinMoves ?? '--'}</div>
          <div className={styles.recordLabel}>Best Win (Moves)</div>
        </div>
        <div className={styles.recordCard}>
          <div className={styles.recordIcon}>⚡</div>
          <div className={styles.recordValue}>{formatTime(stats.bestWinTime)}</div>
          <div className={styles.recordLabel}>Best Win (Time)</div>
        </div>
      </div>
    </div>
  );

  // By Mode Tab
  const ByModeContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.modeTable}>
        <div className={styles.modeHeader}>
          <span>Mode</span>
          <span>Played</span>
          <span>Won</span>
          <span>Forfeit</span>
          <span>Best Moves</span>
        </div>
        {Object.entries(stats.byMode).map(([mode, modeStats]) => (
          <div key={mode} className={styles.modeRow}>
            <span className={styles.modeName}>{modeLabels[mode]}</span>
            <span>{modeStats.games}</span>
            <span>{modeStats.wins}</span>
            <span>{modeStats.forfeits || 0}</span>
            <span>{modeStats.bestMoves ?? '--'}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewContent />;
      case 'records': return <RecordsContent />;
      case 'byMode': return <ByModeContent />;
      default: return <OverviewContent />;
    }
  };

  return (
    <FullBleedScreen
      isOpen={isOpen}
      onClose={onClose}
      title="Statistics"
      headerRight={headerRight}
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

export default StatisticsScreen;
