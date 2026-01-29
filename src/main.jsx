import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationSettingsProvider } from './contexts/NotificationSettingsContext'
import './styles/themes/blue-casino.css'
import './styles/App.css'

// Set default theme immediately to prevent flash
if (typeof document !== 'undefined') {
  const saved = localStorage.getItem('meridian-theme') || 'blue-casino'
  document.documentElement.setAttribute('data-theme', saved)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationSettingsProvider>
          <App />
        </NotificationSettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
