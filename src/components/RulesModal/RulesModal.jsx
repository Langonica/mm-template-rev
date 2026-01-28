import React, { useEffect, useState } from 'react';
import styles from './RulesModal.module.css';

/**
 * RulesModal Component
 *
 * Full-bleed tabbed modal displaying game rules and how to play instructions.
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 */
const RulesModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('goal');

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset to first tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab('goal');
    }
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const tabs = [
    { id: 'goal', label: 'Goal' },
    { id: 'columns', label: 'Columns' },
    { id: 'controls', label: 'Controls' },
    { id: 'modes', label: 'Modes' },
    { id: 'tips', label: 'Tips' }
  ];

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={styles.modal} role="dialog" aria-labelledby="rules-title">
        {/* Header */}
        <div className={styles.header}>
          <h2 id="rules-title" className={styles.title}>How to Play</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tab Bar */}
        <div className={styles.tabBar} role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Goal Tab */}
          {activeTab === 'goal' && (
            <div role="tabpanel" id="panel-goal" className={styles.tabPanel}>
              <div className={styles.goalContainer}>
                <div className={styles.goalHighlight}>
                  <h3>Fill all 8 foundations to win</h3>
                </div>
                <div className={styles.foundationGrid}>
                  <div className={styles.foundationCard}>
                    <div className={styles.foundationIcon}>↑</div>
                    <h4>UP Foundations (4)</h4>
                    <p>Build from 7 to King by suit</p>
                    <div className={styles.sequence}>7 → 8 → 9 → 10 → J → Q → K</div>
                  </div>
                  <div className={styles.foundationCard}>
                    <div className={styles.foundationIcon}>↓</div>
                    <h4>DOWN Foundations (4)</h4>
                    <p>Build from 6 to Ace by suit</p>
                    <div className={styles.sequence}>6 → 5 → 4 → 3 → 2 → A</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Columns Tab */}
          {activeTab === 'columns' && (
            <div role="tabpanel" id="panel-columns" className={styles.tabPanel}>
              <div className={styles.columnsContainer}>
                <div className={styles.columnCard}>
                  <div className={styles.columnBadge} data-type="ace">A</div>
                  <h4>Ace Columns</h4>
                  <p>Build ascending with alternating colors</p>
                  <div className={styles.columnSequence}>A → 2 → 3 → 4 → 5 → 6</div>
                  <div className={styles.columnNote}>Gold highlight indicates ace column</div>
                </div>
                <div className={styles.columnCard}>
                  <div className={styles.columnBadge} data-type="king">K</div>
                  <h4>King Columns</h4>
                  <p>Build descending with alternating colors</p>
                  <div className={styles.columnSequence}>K → Q → J → 10 → 9 → 8 → 7</div>
                  <div className={styles.columnNote}>Silver highlight indicates king column</div>
                </div>
                <div className={styles.columnCard}>
                  <div className={styles.columnBadge} data-type="empty">?</div>
                  <h4>Empty Columns</h4>
                  <p>Only Kings or Aces can start a new column</p>
                  <div className={styles.columnNote}>The first card determines the column type</div>
                </div>
              </div>
            </div>
          )}

          {/* Controls Tab */}
          {activeTab === 'controls' && (
            <div role="tabpanel" id="panel-controls" className={styles.tabPanel}>
              <div className={styles.controlsContainer}>
                <div className={styles.controlCard}>
                  <div className={styles.controlIcon}>🖱️</div>
                  <h4>Drag</h4>
                  <p>Move cards between columns</p>
                </div>
                <div className={styles.controlCard}>
                  <div className={styles.controlIcon}>⚡</div>
                  <h4>Double-click</h4>
                  <p>Auto-move card to foundation</p>
                </div>
                <div className={styles.controlCard}>
                  <div className={styles.controlIcon}>↶</div>
                  <h4>Ctrl+Z</h4>
                  <p>Undo last move</p>
                </div>
                <div className={styles.controlCard}>
                  <div className={styles.controlIcon}>↷</div>
                  <h4>Ctrl+Y</h4>
                  <p>Redo move</p>
                </div>
                <div className={styles.controlCard}>
                  <div className={styles.controlIcon}>👆</div>
                  <h4>Long-press</h4>
                  <p>Drag on touch devices</p>
                </div>
              </div>
            </div>
          )}

          {/* Modes Tab */}
          {activeTab === 'modes' && (
            <div role="tabpanel" id="panel-modes" className={styles.tabPanel}>
              <div className={styles.modesGrid}>
                <div className={styles.modeCard}>
                  <h4>Classic</h4>
                  <div className={styles.modeDetails}>
                    <div className={styles.modeFeature}>1 Pocket</div>
                    <div className={styles.modeFeature}>All cards face-up</div>
                  </div>
                  <p>Traditional gameplay with complete visibility</p>
                </div>
                <div className={styles.modeCard}>
                  <h4>Classic Double</h4>
                  <div className={styles.modeDetails}>
                    <div className={styles.modeFeature}>2 Pockets</div>
                    <div className={styles.modeFeature}>All cards face-up</div>
                  </div>
                  <p>More storage, same visibility</p>
                </div>
                <div className={styles.modeCard}>
                  <h4>Hidden</h4>
                  <div className={styles.modeDetails}>
                    <div className={styles.modeFeature}>1 Pocket</div>
                    <div className={styles.modeFeature}>Face-down cards</div>
                  </div>
                  <p>Challenge mode with hidden tableau cards</p>
                </div>
                <div className={styles.modeCard}>
                  <h4>Hidden Double</h4>
                  <div className={styles.modeDetails}>
                    <div className={styles.modeFeature}>2 Pockets</div>
                    <div className={styles.modeFeature}>Face-down cards</div>
                  </div>
                  <p>Maximum challenge with hidden cards</p>
                </div>
              </div>
            </div>
          )}

          {/* Tips Tab */}
          {activeTab === 'tips' && (
            <div role="tabpanel" id="panel-tips" className={styles.tabPanel}>
              <div className={styles.tipsContainer}>
                <div className={styles.tipCard}>
                  <div className={styles.tipNumber}>1</div>
                  <h4>Manage Empty Columns</h4>
                  <p>Keep empty columns available for Kings and Aces to maximize flexibility</p>
                </div>
                <div className={styles.tipCard}>
                  <div className={styles.tipNumber}>2</div>
                  <h4>Uncover Hidden Cards</h4>
                  <p>In Hidden modes, prioritize revealing face-down cards early in the game</p>
                </div>
                <div className={styles.tipCard}>
                  <div className={styles.tipNumber}>3</div>
                  <h4>Use Pockets Wisely</h4>
                  <p>The pocket can temporarily hold any card - use it strategically to free up moves</p>
                </div>
                <div className={styles.tipCard}>
                  <div className={styles.tipNumber}>4</div>
                  <h4>Plan Ahead</h4>
                  <p>Remember: some cards need to go UP (7→K), others DOWN (6→A) to foundations</p>
                </div>
                <div className={styles.tipCard}>
                  <div className={styles.tipNumber}>5</div>
                  <h4>Foundation Priority</h4>
                  <p>Move cards to foundations when possible to free up tableau space</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
