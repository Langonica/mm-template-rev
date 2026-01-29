import React from 'react';

const Footer = ({ currentSnapshot }) => {
  const getVariantText = () => {
    if (!currentSnapshot) return 'NORMAL';
    return currentSnapshot.metadata.variant.toUpperCase();
  };

  const snapshotInfo = currentSnapshot 
    ? `${currentSnapshot.metadata.name} - ${getVariantText()}`
    : 'LOADING...';

  // Get analysis data if available (v2.0)
  const analysis = currentSnapshot?.analysis;
  const progress = analysis?.progress;
  const cardCounts = analysis?.cardCounts;

  return (
    <footer>
      <div className="footer-left">
        <div style={{ 
          fontSize: '10px', 
          color: '#777',
          fontStyle: 'italic'
        }}>
          {currentSnapshot?.metadata.mode.toUpperCase()} MODE | {currentSnapshot?.metadata.pockets} POCKET{currentSnapshot?.metadata.pockets > 1 ? 'S' : ''}
        </div>
        {/* Show progress if available */}
        {progress && (
          <div style={{
            fontSize: '9px',
            color: '#c9a050',
            marginTop: '2px'
          }}>
            Progress: {progress.percentage}% | Tableau: {cardCounts?.tableau || 0}
          </div>
        )}
      </div>
      
      <div className="footer-center">
        <span className="snapshot-info" id="snapshotInfo">
          {snapshotInfo}
        </span>
        {/* Show card distribution if available */}
        {cardCounts && (
          <div style={{
            fontSize: '8px',
            color: '#666',
            marginTop: '2px'
          }}>
            Stock: {cardCounts.stock} | Waste: {cardCounts.waste} | Foundations: {cardCounts.foundations}
          </div>
        )}
      </div>
      
      <div className="footer-right">
        <div style={{ 
          fontSize: '9px', 
          color: '#7d92a1',
          opacity: 0.7
        }}>
          {currentSnapshot?.metadata.allUp ? 'ALL FACE-UP' : 'MIXED FACE-UP/DOWN'}
        </div>
        {/* Show validation status if available */}
        {currentSnapshot?.validation && (
          <div style={{
            fontSize: '8px',
            color: currentSnapshot.validation.isValid ? '#4a9d4a' : '#d44',
            marginTop: '2px'
          }}>
            {currentSnapshot.validation.isValid ? 'Valid' : 'Invalid'}
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;
