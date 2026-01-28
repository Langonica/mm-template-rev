import React, { useState } from 'react';
import styles from './StatsModal.module.css';

const StatsModal = ({ isOpen, onClose, stats, winRate, formatTime, onReset }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    onReset();
    setShowResetConfirm(false);
  };

  const modeLabels = {
    classic: 'Classic',
    classic_double: 'Classic Double',
    hidden: 'Hidden',
    hidden_double: 'Hidden Double',
    // Legacy mode names for backwards compatibility with saved stats
    double_pocket: 'Classic Double',
    traditional: 'Hidden',
    expert: 'Hidden Double'
  };

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Statistics</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {/* Tab Bar */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'records' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('records')}
          >
            Records
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'byMode' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('byMode')}
          >
            By Mode
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.tabPanel}>
              <div className={styles.overviewGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{stats.totalGames}</span>
                  <span className={styles.statLabel}>Games Played</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{stats.wins}</span>
                  <span className={styles.statLabel}>Wins</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{stats.losses}</span>
                  <span className={styles.statLabel}>Losses</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{stats.forfeits || 0}</span>
                  <span className={styles.statLabel}>Forfeits</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{winRate}%</span>
                  <span className={styles.statLabel}>Win Rate</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{stats.totalMoves.toLocaleString()}</span>
                  <span className={styles.statLabel}>Total Moves</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{formatTime(stats.totalPlayTime)}</span>
                  <span className={styles.statLabel}>Total Play Time</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className={styles.tabPanel}>
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
          )}

          {activeTab === 'byMode' && (
            <div className={styles.tabPanel}>
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
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {!showResetConfirm ? (
            <button
              className={styles.resetButton}
              onClick={() => setShowResetConfirm(true)}
            >
              Reset Statistics
            </button>
          ) : (
            <div className={styles.resetConfirm}>
              <p className={styles.resetWarning}>Are you sure? This cannot be undone.</p>
              <div className={styles.resetButtons}>
                <button
                  className={styles.resetConfirmButton}
                  onClick={handleReset}
                >
                  Yes, Reset
                </button>
                <button
                  className={styles.resetCancelButton}
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
