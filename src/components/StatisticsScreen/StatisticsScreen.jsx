import React, { useState } from 'react';
import styles from './StatisticsScreen.module.css';
import FullBleedScreen from '../FullBleedScreen';
import TabBar from '../TabBar';
import DataCard from '../DataCard';
import TertiaryButton from '../TertiaryButton';

/**
 * StatisticsScreen Component
 * 
 * Game statistics with back button
 */
const StatisticsScreen = ({
  isOpen,
  onClose,
  stats,
  session,
  winRate,
  perfectGameRate,
  sessionWinRate,
  formatTime,
  formatNumber,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'session', label: 'Today' },
    { id: 'records', label: 'Records' },
    { id: 'byMode', label: 'By Mode' },
  ];

  const modeLabels = {
    classic: 'Classic',
    classic_double: 'Classic Double',
    hidden: 'Hidden',
    hidden_double: 'Hidden Double',
  };

  const OverviewContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.grid4}>
        <DataCard value={stats.totalGames} label="Games Played" />
        <DataCard value={stats.wins} label="Wins" />
        <DataCard value={`${winRate}%`} label="Win Rate" />
        <DataCard value={stats.perfectGames || 0} label="Perfect Games" />
      </div>
      
      <div className={styles.sectionTitle}>Activity Metrics</div>
      <div className={styles.grid4}>
        <DataCard value={formatNumber(stats.totalCardsMoved || 0)} label="Cards Moved" />
        <DataCard value={formatNumber(stats.totalMoves)} label="Total Moves" />
        <DataCard value={stats.foundationsCompleted || 0} label="Foundations Done" />
        <DataCard value={stats.totalUndosUsed || 0} label="Undos Used" />
      </div>
      
      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Total Play Time</span>
          <span className={styles.value}>{formatTime(stats.totalPlayTime)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Losses / Forfeits</span>
          <span className={styles.value}>{stats.losses} / {stats.forfeits || 0}</span>
        </div>
      </div>
      
      <div className={styles.resetSection}>
        {showResetConfirm ? (
          <div className={styles.resetConfirm}>
            <span className={styles.resetWarning}>Reset all stats?</span>
            <TertiaryButton onClick={onReset}>Yes</TertiaryButton>
            <TertiaryButton onClick={() => setShowResetConfirm(false)}>No</TertiaryButton>
          </div>
        ) : (
          <TertiaryButton onClick={() => setShowResetConfirm(true)}>Reset Statistics</TertiaryButton>
        )}
      </div>
    </div>
  );

  const SessionContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.sessionDate}>{session?.date || new Date().toDateString()}</div>
      <div className={styles.grid4}>
        <DataCard value={session?.gamesPlayed || 0} label="Games Played" />
        <DataCard value={session?.gamesWon || 0} label="Games Won" />
        <DataCard value={`${sessionWinRate}%`} label="Win Rate" />
        <DataCard value={formatNumber(session?.cardsMoved || 0)} label="Cards Moved" />
      </div>
      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Total Moves Today</span>
          <span className={styles.value}>{formatNumber(session?.totalMoves || 0)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Time Played Today</span>
          <span className={styles.value}>{formatTime(session?.totalTime || 0)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Undos Used Today</span>
          <span className={styles.value}>{session?.undosUsed || 0}</span>
        </div>
      </div>
    </div>
  );

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
        <div className={`${styles.recordCard} ${styles.highlight}`}>
          <div className={styles.recordIcon}>💎</div>
          <div className={styles.recordValue}>{stats.perfectGames || 0}</div>
          <div className={styles.recordLabel}>Perfect Games</div>
          {stats.wins > 0 && <div className={styles.recordSubtext}>{perfectGameRate}% of wins</div>}
        </div>
        <div className={styles.recordCard}>
          <div className={styles.recordIcon}>🎮</div>
          <div className={styles.recordValue}>{formatNumber(stats.totalCardsMoved || 0)}</div>
          <div className={styles.recordLabel}>Cards Moved</div>
        </div>
      </div>
    </div>
  );

  const ByModeContent = () => (
    <div className={styles.tabContent}>
      <div className={styles.modeTable}>
        <div className={styles.modeHeader}>
          <span>Mode</span>
          <span>Played</span>
          <span>Won</span>
          <span>Perfect</span>
          <span>Best</span>
        </div>
        {Object.entries(stats.byMode).map(([mode, modeStats]) => (
          <div key={mode} className={styles.modeRow}>
            <span className={styles.modeName}>{modeLabels[mode]}</span>
            <span>{modeStats.games}</span>
            <span>{modeStats.wins}</span>
            <span>{modeStats.perfectGames || 0}</span>
            <span>{modeStats.bestMoves ?? '--'}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewContent />;
      case 'session': return <SessionContent />;
      case 'records': return <RecordsContent />;
      case 'byMode': return <ByModeContent />;
      default: return <OverviewContent />;
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

export default StatisticsScreen;
