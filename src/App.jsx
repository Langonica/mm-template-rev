import React, { useState, useEffect, useCallback, useRef } from 'react'
import GameStage from './components/GameStage/GameStage'
import GameMenu from './components/GameMenu'
import ConfirmDialog from './components/ConfirmDialog'
import StatsModal from './components/StatsModal'
import HomeScreen from './components/HomeScreen'
import RulesModal from './components/RulesModal'
import CampaignScreen from './components/CampaignScreen'
import PauseOverlay from './components/PauseOverlay'
import OrientationBlocker from './components/OrientationBlocker'
import GearButton from './components/GearButton'
import StalemateModal from './components/StalemateModal'
import AutoCompleteButton from './components/AutoCompleteButton'
import HintDisplay from './components/HintDisplay'
import { useCardGame } from './hooks/useCardGame'
import { useGameStats } from './hooks/useGameStats'
import { useCampaignProgress } from './hooks/useCampaignProgress'
import { useViewportScale } from './hooks/useViewportScale'
import { useHighDPIAssets } from './hooks/useHighDPIAssets'
import { useNotification, Notification, NOTIFICATION_MESSAGES } from './hooks/useNotification.jsx'
import { generateRandomDeal, getGameModes } from './utils/dealGenerator'
import './styles/App.css'

function App() {
  const {
    config,
    currentSnapshot,
    currentStockCards,
    currentWasteCards,
    gameState,
    moveCount,
    animatingCard,
    autoMoveAnimation,
    setMode,
    setVariant,
    toggleStyle,
    simulateStockDraw,
    loadSnapshot,
    loadGameState,
    startDrag,
    endDrag,
    handleDrop,
    isValidTarget,
    dragState,
    handleAutoMove,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    gameStatus,
    availableMoves,
    circularPlayState,
    canAutoComplete,
    isAutoCompleting,
    executeAutoComplete,
    cancelAutoComplete,
    currentHint,
    hintsRemaining,
    showHint,
    clearHint
  } = useCardGame()

  const {
    notification,
    showSuccess,
    showError,
    showInfo,
    clearNotification
  } = useNotification()

  const {
    stats,
    currentGameTime,
    isPaused,
    recordGameStart,
    recordGameEnd,
    recordForfeit,
    resetStats,
    pauseTimer,
    resumeTimer,
    getWinRate,
    formatTime
  } = useGameStats(showError)

  const {
    progress: campaignProgress,
    isLevelUnlocked,
    isLevelCompleted,
    getLevelStats,
    getLevelBySnapshotId,
    getLevelByNumber,
    recordAttempt: recordCampaignAttempt,
    recordCompletion: recordCampaignCompletion,
    getTierProgress,
    getCampaignProgress,
    resetProgress: resetCampaignProgress,
  } = useCampaignProgress(showError)

  // Dynamic viewport scaling - ensures game fits without cropping
  // Now supports scaling up to 2× for larger viewports (requires 2× assets)
  const { scale, scaledWidth, scaledHeight, devicePixelRatio } = useViewportScale()

  // High-DPI asset loading - selects @2x sprites on Retina/high-DPI displays
  useHighDPIAssets(scale, devicePixelRatio)

  const [selectedSnapshotId, setSelectedSnapshotId] = useState('classic_normal_easy_01')
  const [selectedMode, setSelectedMode] = useState('classic')
  const [statsModalOpen, setStatsModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showHomeScreen, setShowHomeScreen] = useState(true)
  const [showCampaignScreen, setShowCampaignScreen] = useState(false)
  const [rulesModalOpen, setRulesModalOpen] = useState(false)
  const [stalemateModalOpen, setStalemateModalOpen] = useState(false)
  const [lastGameResult, setLastGameResult] = useState(null) // Stores result for game-over display
  const [currentCampaignLevel, setCurrentCampaignLevel] = useState(null) // Track active campaign level
  const gameEndedRef = useRef(false) // Prevent double-recording
  
  // Refs for stats values to avoid excessive useEffect dependencies (Performance fix - Phase 1)
  const statsRef = useRef(stats)
  statsRef.current = stats

  // Mode options for GameMenu
  const GAME_MODES = getGameModes()
  const modeOptions = GAME_MODES.map(mode => ({
    value: mode.id,
    label: mode.name
  }))

  // Menu handlers
  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen(prev => !prev)
  }, [])

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  // Pause handlers (basic ones - others defined after handleNewGame/handleGoHome)
  const handlePause = useCallback(() => {
    if (!gameStatus?.isGameOver) {
      pauseTimer()
    }
  }, [pauseTimer, gameStatus])

  const handleResume = useCallback(() => {
    resumeTimer()
  }, [resumeTimer])

  // Calculate foundation progress for pause overlay
  const getFoundationProgress = useCallback(() => {
    if (!currentSnapshot) return { up: 0, down: 0 }
    const upCards = currentSnapshot.foundations?.UP?.length || 0
    const downCards = currentSnapshot.foundations?.DOWN?.length || 0
    return { up: upCards, down: downCards }
  }, [currentSnapshot])

  // Check if there's a game in progress that can be continued
  const hasGameInProgress = moveCount > 0 && !gameStatus?.isGameOver

  // Home screen handlers
  const handleContinueGame = useCallback(() => {
    // Simply hide home screen to resume the paused game
    setShowHomeScreen(false)
  }, [])

  const handleNewGameFromHome = useCallback(() => {
    // If there's a game in progress, record it as a forfeit
    if (hasGameInProgress) {
      recordForfeit(moveCount, selectedMode)
      gameEndedRef.current = true // Prevent double-recording
    }

    // Generate a new game in selected mode
    const newDeal = generateRandomDeal(selectedMode)
    if (newDeal) {
      loadGameState(newDeal)
      gameEndedRef.current = false // Reset for new game
    }
    setShowHomeScreen(false)
  }, [selectedMode, loadGameState, hasGameInProgress, moveCount, recordForfeit])

  const handleGoHome = useCallback(() => {
    // Just show home screen - game state is preserved (paused)
    setShowHomeScreen(true)
    setShowCampaignScreen(false)
    setCurrentCampaignLevel(null)
    setIsMenuOpen(false)
  }, [])

  // Campaign screen handlers
  const handleShowCampaign = useCallback(() => {
    setShowCampaignScreen(true)
  }, [])

  const handleBackFromCampaign = useCallback(() => {
    setShowCampaignScreen(false)
  }, [])

  const handlePlayCampaignLevel = useCallback((level) => {
    // Load the snapshot for this campaign level
    loadSnapshot(level.id)
    setCurrentCampaignLevel(level)
    recordCampaignAttempt(level.id)
    setShowCampaignScreen(false)
    setShowHomeScreen(false)
    gameEndedRef.current = false
  }, [loadSnapshot, recordCampaignAttempt])

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'default'
  })

  // Close confirm dialog
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false, onConfirm: null }))
  }, [])

  // Show confirmation if game in progress (moveCount > 0)
  const showConfirmationIfNeeded = useCallback((action, title, message) => {
    if (moveCount > 0) {
      setConfirmDialog({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          closeConfirmDialog()
          action()
        },
        variant: 'warning'
      })
    } else {
      action()
    }
  }, [moveCount, closeConfirmDialog])

  // Handle snapshot change (with confirmation if mid-game)
  const handleSnapshotChange = useCallback((snapshotId) => {
    const action = () => {
      setSelectedSnapshotId(snapshotId)
      loadSnapshot(snapshotId)
      showInfo(NOTIFICATION_MESSAGES.GAME_LOADED)
    }

    showConfirmationIfNeeded(
      action,
      'Load Snapshot?',
      'You have a game in progress. Loading a new snapshot will discard your current game. Continue?'
    )
  }, [loadSnapshot, showInfo, showConfirmationIfNeeded])

  // Handle mode change (with confirmation if mid-game)
  const handleModeChange = useCallback((mode) => {
    const action = () => {
      setSelectedMode(mode)
      // Generate a new random deal in the new mode
      const newDeal = generateRandomDeal(mode)
      if (newDeal) {
        loadGameState(newDeal)
        showInfo(`Started new ${mode.replace('_', ' ')} game`)
      }
    }

    if (mode !== selectedMode) {
      showConfirmationIfNeeded(
        action,
        'Change Game Mode?',
        `You have a game in progress. Switching to ${mode.replace('_', ' ').toUpperCase()} mode will start a new game. Continue?`
      )
    }
  }, [selectedMode, loadGameState, showInfo, showConfirmationIfNeeded])

  // Handle new game (with confirmation if mid-game, but not if game is over)
  const handleNewGame = useCallback(() => {
    const action = () => {
      // Clear campaign level when starting a new quick play game
      setCurrentCampaignLevel(null)
      const newDeal = generateRandomDeal(selectedMode)
      if (newDeal) {
        loadGameState(newDeal)
        showInfo(NOTIFICATION_MESSAGES.GAME_LOADED)
      }
    }

    // Skip confirmation if game is already over (no progress to save)
    if (gameStatus?.isGameOver) {
      action()
    } else {
      showConfirmationIfNeeded(
        action,
        'Start New Game?',
        'You have a game in progress. Starting a new game will discard your current progress. Continue?'
      )
    }
  }, [selectedMode, loadGameState, showInfo, showConfirmationIfNeeded, gameStatus])

  // Pause handlers that depend on handleNewGame/handleGoHome
  const handleNewGameFromPause = useCallback(() => {
    resumeTimer() // Resume first to reset pause state
    handleNewGame() // Will show confirmation dialog if needed
  }, [resumeTimer, handleNewGame])

  const handleHomeFromPause = useCallback(() => {
    resumeTimer() // Resume timer state (it will be stopped by going home anyway)
    handleGoHome()
  }, [resumeTimer, handleGoHome])

  // Restart current campaign level
  const handleRestartLevel = useCallback(() => {
    if (currentCampaignLevel) {
      resumeTimer() // Resume first to reset pause state
      loadSnapshot(currentCampaignLevel.id)
      recordCampaignAttempt(currentCampaignLevel.id)
      gameEndedRef.current = false
    }
  }, [currentCampaignLevel, resumeTimer, loadSnapshot, recordCampaignAttempt])

  const handleDropWithNotification = (target) => {
    const success = handleDrop(target)
    if (!success) {
      showError(NOTIFICATION_MESSAGES.INVALID_MOVE)
    }
  }

  const handleAutoMoveWithNotification = (cardStr) => {
    const success = handleAutoMove(cardStr)
    if (!success) {
      showError(NOTIFICATION_MESSAGES.FOUNDATION_ERROR)
    }
  }

  const handleUndoWithNotification = () => {
    const success = handleUndo()
    if (success) {
      showInfo(NOTIFICATION_MESSAGES.UNDONE)
    } else {
      showError(NOTIFICATION_MESSAGES.NO_UNDO)
    }
  }

  const handleRedoWithNotification = () => {
    const success = handleRedo()
    if (success) {
      showInfo(NOTIFICATION_MESSAGES.REDONE)
    } else {
      showError(NOTIFICATION_MESSAGES.NO_REDO)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Escape to toggle pause (only when game is active)
      if (e.key === 'Escape' && !showHomeScreen && !gameStatus?.isGameOver) {
        e.preventDefault()
        if (isPaused) {
          handleResume()
        } else {
          handlePause()
        }
        return
      }

      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndoWithNotification()
      }
      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        handleRedoWithNotification()
      }
      // Ctrl+Y or Cmd+Y for redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        handleRedoWithNotification()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleUndo, handleRedo, isPaused, handlePause, handleResume, showHomeScreen, gameStatus])

  // Show touch hint on first load for touch devices
  useEffect(() => {
    if (config.isTouchDevice) {
      const hasSeenHint = localStorage.getItem('touchHintSeen')
      if (!hasSeenHint) {
        setTimeout(() => {
          showInfo(NOTIFICATION_MESSAGES.LONG_PRESS_HINT, 5000)
          localStorage.setItem('touchHintSeen', 'true')
        }, 1000)
      }
    }
  }, [config.isTouchDevice, showInfo])

  // Start game timer when game loads/resets
  useEffect(() => {
    if (currentSnapshot && moveCount === 0) {
      recordGameStart()
      gameEndedRef.current = false
      setLastGameResult(null)
    }
  }, [currentSnapshot, moveCount, recordGameStart])

  // Record game end when status changes to won or stalemate
  // Uses statsRef to avoid excessive dependencies (Performance fix - Phase 1)
  useEffect(() => {
    if (gameStatus?.isGameOver && !gameEndedRef.current) {
      gameEndedRef.current = true
      const won = gameStatus.status === 'won'
      const result = recordGameEnd(won, moveCount, selectedMode)

      // Record campaign completion if this was a campaign level
      if (won && currentCampaignLevel) {
        recordCampaignCompletion(currentCampaignLevel.id, moveCount, result.duration)
      }

      // Calculate if this is a new personal best (using ref to avoid dep array issues)
      const currentStats = statsRef.current
      const isNewBestMoves = won && (currentStats.bestWinMoves === null || moveCount < currentStats.bestWinMoves || moveCount === currentStats.bestWinMoves)
      const isNewBestTime = won && (currentStats.bestWinTime === null || result.duration < currentStats.bestWinTime || result.duration === currentStats.bestWinTime)

      setLastGameResult({
        ...result,
        isNewBestMoves: isNewBestMoves && currentStats.wins > 0, // Only show if not first win
        isNewBestTime: isNewBestTime && currentStats.wins > 0,
        previousBestMoves: currentStats.bestWinMoves,
        previousBestTime: currentStats.bestWinTime,
        campaignLevel: currentCampaignLevel // Include level info for display
      })
    }
  }, [gameStatus, moveCount, selectedMode, recordGameEnd, currentCampaignLevel, recordCampaignCompletion])

  // Show stalemate modal when game is in stalemate
  useEffect(() => {
    if (gameStatus?.status === 'stalemate' && !stalemateModalOpen) {
      setStalemateModalOpen(true)
    }
  }, [gameStatus, stalemateModalOpen])

  // Calculate foundation cards for stalemate modal stats
  const getFoundationCardCount = useCallback(() => {
    if (!currentSnapshot?.foundations) return 0
    let count = 0
    const zones = ['up', 'down']
    const suits = ['h', 'd', 'c', 's']
    for (const zone of zones) {
      for (const suit of suits) {
        count += currentSnapshot.foundations[zone]?.[suit]?.length || 0
      }
    }
    return count
  }, [currentSnapshot])

  // Handle new deal from stalemate modal
  const handleStalemateNewDeal = useCallback(() => {
    setStalemateModalOpen(false)
    handleNewGame()
  }, [handleNewGame])

  // Handle restart from stalemate modal
  const handleStalemateRestart = useCallback(() => {
    setStalemateModalOpen(false)
    if (currentCampaignLevel) {
      handlePlayCampaignLevel(currentCampaignLevel)
    } else {
      loadSnapshot(selectedSnapshotId)
    }
  }, [currentCampaignLevel, handlePlayCampaignLevel, loadSnapshot, selectedSnapshotId])

  // Handle undo from stalemate modal
  const handleStalemateUndo = useCallback(() => {
    setStalemateModalOpen(false)
    // Undo up to 5 moves or as many as available
    // Undo up to 5 moves
    for (let i = 0; i < 5; i++) {
      handleUndo()
    }
  }, [handleUndo])

  return (
    <div
      className="game-wrapper"
      style={{
        width: scaledWidth,
        height: scaledHeight,
      }}
    >
      <OrientationBlocker />
      <div
        className={`game-container ${dragState?.isDragging ? 'dragging' : ''}`}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <Notification
        notification={notification}
        onClose={clearNotification}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Yes, Continue"
        cancelText="Cancel"
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        variant={confirmDialog.variant}
      />

      {/* Stats Modal */}
      <StatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        stats={stats}
        winRate={getWinRate()}
        formatTime={formatTime}
        onReset={resetStats}
      />

      {/* Rules Modal */}
      <RulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />

      {/* Stalemate Modal */}
      <StalemateModal
        isOpen={stalemateModalOpen}
        onClose={() => setStalemateModalOpen(false)}
        stats={{
          moveCount,
          currentTime: currentGameTime,
          foundationCards: getFoundationCardCount(),
          totalCards: 52
        }}
        onNewDeal={handleStalemateNewDeal}
        onRestart={handleStalemateRestart}
        onUndo={handleStalemateUndo}
        undoMoves={5}
      />

      {/* Home Screen */}
      {showHomeScreen && !showCampaignScreen && (
        <HomeScreen
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          modeOptions={getGameModes().map(m => ({ value: m.id, label: m.name }))}
          onNewGame={handleNewGameFromHome}
          onContinue={handleContinueGame}
          hasGameInProgress={hasGameInProgress}
          onShowRules={() => setRulesModalOpen(true)}
          onShowStats={() => setStatsModalOpen(true)}
          onShowCampaign={handleShowCampaign}
          campaignProgress={campaignProgress}
        />
      )}

      {/* Campaign Screen */}
      {showCampaignScreen && (
        <CampaignScreen
          progress={campaignProgress}
          isLevelUnlocked={isLevelUnlocked}
          isLevelCompleted={isLevelCompleted}
          getLevelStats={getLevelStats}
          getTierProgress={getTierProgress}
          getCampaignProgress={getCampaignProgress}
          onPlayLevel={handlePlayCampaignLevel}
          onBack={handleBackFromCampaign}
          formatTime={formatTime}
        />
      )}

      {/* Game UI - only render when not on home screen */}
      {!showHomeScreen && (
        <>
          {/* Game Over Overlay */}
          {gameStatus?.isGameOver && (
            <div className={`game-over-overlay ${gameStatus.status}`}>
              <div className="game-over-content">
                <div className="game-over-icon">
                  {gameStatus.status === 'won' ? 'VICTORY' : 'GAME OVER'}
                </div>
                <h1 className="game-over-title">
                  {gameStatus.status === 'won' ? 'You Win!' : 'No Moves Left'}
                </h1>

                {/* Campaign level indicator */}
                {currentCampaignLevel && (
                  <div className="game-over-level">
                    Campaign Level {currentCampaignLevel.levelNumber}
                  </div>
                )}

                {/* New Personal Best badges */}
                {lastGameResult?.isNewBestMoves && (
                  <div className="game-over-badge">New Best Moves!</div>
                )}
                {lastGameResult?.isNewBestTime && (
                  <div className="game-over-badge">New Best Time!</div>
                )}

                <p className="game-over-message">
                  {gameStatus.status === 'won'
                    ? currentCampaignLevel
                      ? `Level ${currentCampaignLevel.levelNumber} Complete!`
                      : 'Congratulations! You completed the game!'
                    : 'No more moves available.'}
                </p>

                {(() => {
                  const levelStats = currentCampaignLevel ? getLevelStats(currentCampaignLevel.id) : null
                  const isNewLevelBestMoves = levelStats && gameStatus.status === 'won' && (!levelStats.bestMoves || moveCount < levelStats.bestMoves)
                  const isNewLevelBestTime = levelStats && gameStatus.status === 'won' && lastGameResult?.duration && (!levelStats.bestTime || lastGameResult.duration < levelStats.bestTime)

                  return (
                    <div className="game-over-stats">
                      {currentCampaignLevel ? (
                        // Campaign mode stats
                        <>
                          <div className="stat">
                            <span className="stat-label">Moves</span>
                            <span className="stat-value">{moveCount}</span>
                            {levelStats?.bestMoves && gameStatus.status === 'won' && (
                              <span className="stat-compare">
                                {isNewLevelBestMoves ? 'New Best!' : `Best: ${levelStats.bestMoves}`}
                              </span>
                            )}
                          </div>
                          <div className="stat">
                            <span className="stat-label">Time</span>
                            <span className="stat-value">{formatTime(lastGameResult?.duration || currentGameTime)}</span>
                            {levelStats?.bestTime && gameStatus.status === 'won' && (
                              <span className="stat-compare">
                                {isNewLevelBestTime ? 'New Best!' : `Best: ${formatTime(levelStats.bestTime)}`}
                              </span>
                            )}
                          </div>
                          <div className="stat">
                            <span className="stat-label">Attempts</span>
                            <span className="stat-value">{levelStats?.attempts || 1}</span>
                          </div>
                        </>
                      ) : (
                        // Quick Play mode stats
                        <>
                          <div className="stat">
                            <span className="stat-label">Moves</span>
                            <span className="stat-value">{moveCount}</span>
                            {stats.bestWinMoves && gameStatus.status === 'won' && (
                              <span className="stat-compare">Best: {stats.bestWinMoves}</span>
                            )}
                          </div>
                          <div className="stat">
                            <span className="stat-label">Time</span>
                            <span className="stat-value">{formatTime(lastGameResult?.duration || currentGameTime)}</span>
                            {stats.bestWinTime && gameStatus.status === 'won' && (
                              <span className="stat-compare">Best: {formatTime(stats.bestWinTime)}</span>
                            )}
                          </div>
                          <div className="stat">
                            <span className="stat-label">Win Streak</span>
                            <span className="stat-value">{stats.currentStreak}</span>
                            {stats.bestStreak > 0 && (
                              <span className="stat-compare">Best: {stats.bestStreak}</span>
                            )}
                          </div>
                          <div className="stat">
                            <span className="stat-label">Win Rate</span>
                            <span className="stat-value">{getWinRate()}%</span>
                            <span className="stat-compare">{stats.wins}/{stats.totalGames} games</span>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })()}

                <div className="game-over-buttons">
                  {/* Campaign-specific buttons */}
                  {currentCampaignLevel && gameStatus.status === 'won' && currentCampaignLevel.levelNumber < 30 ? (
                    <>
                      <button
                        className="game-over-button"
                        onClick={() => {
                          const nextLevel = getLevelByNumber(currentCampaignLevel.levelNumber + 1)
                          if (nextLevel) {
                            handlePlayCampaignLevel(nextLevel)
                          }
                        }}
                      >
                        Next Level
                      </button>
                      <button
                        className="game-over-button secondary"
                        onClick={() => {
                          setCurrentCampaignLevel(null)
                          setShowCampaignScreen(true)
                          setShowHomeScreen(true)
                        }}
                      >
                        Back to Campaign
                      </button>
                    </>
                  ) : currentCampaignLevel ? (
                    <>
                      <button
                        className="game-over-button"
                        onClick={() => {
                          // Replay the same level
                          handlePlayCampaignLevel(currentCampaignLevel)
                        }}
                      >
                        {gameStatus.status === 'won' ? 'Play Again' : 'Retry Level'}
                      </button>
                      <button
                        className="game-over-button secondary"
                        onClick={() => {
                          setCurrentCampaignLevel(null)
                          setShowCampaignScreen(true)
                          setShowHomeScreen(true)
                        }}
                      >
                        Back to Campaign
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="game-over-button"
                        onClick={handleNewGame}
                      >
                        Play Again
                      </button>
                      <button
                        className="game-over-button secondary"
                        onClick={handleGoHome}
                      >
                        Home
                      </button>
                      <button
                        className="game-over-button secondary"
                        onClick={() => setStatsModalOpen(true)}
                      >
                        View Stats
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hint Display - floating notification */}
          <HintDisplay
            hint={currentHint}
            onDismiss={clearHint}
          />

          <GameStage
            snapshot={currentSnapshot}
            config={config}
            simulateStockDraw={simulateStockDraw}
            currentStockCards={currentStockCards}
            currentWasteCards={currentWasteCards}
            startDrag={startDrag}
            endDrag={endDrag}
            handleDrop={handleDropWithNotification}
            isValidTarget={isValidTarget}
            dragState={dragState}
            handleAutoMove={handleAutoMoveWithNotification}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            handleTouchCancel={handleTouchCancel}
            animatingCard={animatingCard}
            autoMoveAnimation={autoMoveAnimation}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndoWithNotification}
            onRedo={handleRedoWithNotification}
            onPause={handlePause}
            moveCount={moveCount}
            currentTime={currentGameTime}
            formatTime={formatTime}
            circularPlayState={circularPlayState}
            canAutoComplete={canAutoComplete}
            isAutoCompleting={isAutoCompleting}
            onAutoComplete={executeAutoComplete}
            onCancelAutoComplete={cancelAutoComplete}
            hintsRemaining={hintsRemaining}
            onShowHint={showHint}
          />

          {/* Gear Button - fixed top-right, triggers settings menu */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 'var(--z-controls)'
          }}>
            <GearButton onClick={handleMenuToggle} />
            <GameMenu
              isOpen={isMenuOpen}
              onToggle={handleMenuToggle}
              onClose={handleMenuClose}
              onNewGame={handleNewGame}
              onRestartLevel={handleRestartLevel}
              isCampaignGame={!!currentCampaignLevel}
              campaignLevelNumber={currentCampaignLevel?.levelNumber}
              selectedMode={selectedMode}
              onModeChange={handleModeChange}
              modeOptions={modeOptions}
              onOpenStats={() => setStatsModalOpen(true)}
              isFunStyle={config.isFun}
              onToggleStyle={toggleStyle}
              onGoHome={handleGoHome}
              hideToggle={true}
            />
          </div>

          {/* Pause Overlay */}
          <PauseOverlay
            isOpen={isPaused}
            onResume={handleResume}
            onHome={handleHomeFromPause}
            onNewGame={handleNewGameFromPause}
            onRestartLevel={handleRestartLevel}
            isCampaignGame={!!currentCampaignLevel}
            campaignLevelNumber={currentCampaignLevel?.levelNumber}
            gameStats={{
              moves: moveCount,
              elapsedTime: currentGameTime,
              mode: selectedMode,
              foundationProgress: getFoundationProgress()
            }}
          />
        </>
      )}
      </div>
    </div>
  )
}

export default App
