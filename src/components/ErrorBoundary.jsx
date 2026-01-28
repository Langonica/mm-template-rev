import React from 'react';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * Added as part of Phase 1 Critical Fixes (Code Audit 2026-01-28)
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-deep, #0d1117)',
          color: 'var(--text-primary, #eee)',
          fontFamily: 'var(--font-family, sans-serif)',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            marginBottom: '16px',
            color: 'var(--color-danger, #f44336)'
          }}>
            Something Went Wrong
          </h1>
          <p style={{ 
            fontSize: '14px', 
            marginBottom: '24px',
            color: 'var(--text-secondary, #aaa)',
            maxWidth: '400px'
          }}>
            The game encountered an unexpected error. Your progress has been saved.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              background: 'var(--color-primary, #1720c3)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Reload Game
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              fontSize: '12px',
              textAlign: 'left',
              maxWidth: '600px',
              overflow: 'auto',
              color: 'var(--text-muted, #888)'
            }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
