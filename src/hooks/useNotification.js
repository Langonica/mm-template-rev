import { useState, useCallback, useEffect } from 'react';
import React from 'react';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

/**
 * Custom hook for managing notifications/toasts
 */
export const useNotification = (duration = 3000) => {
  const [notification, setNotification] = useState(null);

  // Auto-dismiss notification after duration
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, notification.duration || duration);

      return () => clearTimeout(timer);
    }
  }, [notification, duration]);

  // Show notification
  const showNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, customDuration = null) => {
    setNotification({
      message,
      type,
      duration: customDuration || duration,
      timestamp: Date.now()
    });
  }, [duration]);

  // Show success notification
  const showSuccess = useCallback((message) => {
    showNotification(message, NOTIFICATION_TYPES.SUCCESS);
  }, [showNotification]);

  // Show error notification
  const showError = useCallback((message) => {
    showNotification(message, NOTIFICATION_TYPES.ERROR);
  }, [showNotification]);

  // Show info notification
  const showInfo = useCallback((message) => {
    showNotification(message, NOTIFICATION_TYPES.INFO);
  }, [showNotification]);

  // Show warning notification
  const showWarning = useCallback((message) => {
    showNotification(message, NOTIFICATION_TYPES.WARNING);
  }, [showNotification]);

  // Clear notification
  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearNotification
  };
};

/**
 * Notification Component
 */
export const Notification = ({ notification, onClose }) => {
  if (!notification) return null;

  const typeStyles = {
    success: {
      background: 'rgba(76, 175, 80, 0.95)',
      color: 'white',
      icon: '✓',
      border: '1px solid rgba(76, 175, 80, 1)'
    },
    error: {
      background: 'rgba(244, 67, 54, 0.95)',
      color: 'white',
      icon: '✕',
      border: '1px solid rgba(244, 67, 54, 1)'
    },
    info: {
      background: 'rgba(33, 150, 243, 0.95)',
      color: 'white',
      icon: 'ℹ',
      border: '1px solid rgba(33, 150, 243, 1)'
    },
    warning: {
      background: 'rgba(255, 152, 0, 0.95)',
      color: 'white',
      icon: '⚠',
      border: '1px solid rgba(255, 152, 0, 1)'
    }
  };

  const style = typeStyles[notification.type] || typeStyles.info;

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        background: style.background,
        color: style.color,
        padding: '12px 20px',
        borderRadius: '8px',
        border: style.border,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '200px',
        maxWidth: '500px',
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <span style={{ 
        fontSize: '20px', 
        fontWeight: 'bold',
        flexShrink: 0
      }}>
        {style.icon}
      </span>
      
      <span style={{ 
        flex: 1,
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {notification.message}
      </span>
      
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
          transition: 'opacity 0.2s',
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        ×
      </button>
    </div>
  );
};

/**
 * Common notification messages
 */
export const NOTIFICATION_MESSAGES = {
  // Move-related
  INVALID_MOVE: 'Invalid move - check the rules!',
  CARD_MOVED: 'Card moved successfully',
  AUTO_MOVED: 'Card auto-moved to foundation',
  
  // Undo/Redo
  UNDONE: 'Move undone',
  REDONE: 'Move redone',
  NO_UNDO: 'No moves to undo',
  NO_REDO: 'No moves to redo',
  
  // Stock/Waste
  STOCK_EMPTY: 'Stock is empty - click to recycle',
  WASTE_RECYCLED: 'Waste pile recycled to stock',
  CARD_DRAWN: 'Card drawn from stock',
  
  // Validation errors
  COLOR_MISMATCH: 'Cards must alternate colors',
  SEQUENCE_INVALID: 'Invalid card sequence',
  FOUNDATION_ERROR: 'Cannot place on foundation',
  POCKET_OCCUPIED: 'Pocket is already occupied',
  EMPTY_COLUMN_ERROR: 'Only Ace or King can start empty column',
  
  // Game status
  GAME_WON: 'Congratulations! You won!',
  GAME_LOADED: 'Game loaded successfully',
  
  // Touch-specific
  LONG_PRESS_HINT: 'Long-press cards to drag on touch devices',
  TOUCH_MODE: 'Touch mode enabled'
};
