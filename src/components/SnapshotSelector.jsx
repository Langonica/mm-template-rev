import React, { useState } from 'react'
import { 
  SNAPSHOT_CATEGORIES, 
  getSnapshotDisplayName,
  getSnapshotDescription,
  getSnapshotCategory 
} from '../utils/snapshotLoader'

const SnapshotSelector = ({ selectedSnapshotId, onSnapshotChange, compact = false }) => {
  const [selectedCategory, setSelectedCategory] = useState('easy')
  
  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    // Select first snapshot in the new category
    const firstSnapshot = SNAPSHOT_CATEGORIES[category][0]
    onSnapshotChange(firstSnapshot)
  }
  
  const handleSnapshotChange = (snapshotId) => {
    onSnapshotChange(snapshotId)
    // Update category to match selected snapshot
    const category = getSnapshotCategory(snapshotId)
    if (category !== selectedCategory) {
      setSelectedCategory(category)
    }
  }
  
  const currentSnapshotName = getSnapshotDisplayName(selectedSnapshotId)
  
  if (compact) {
    // Compact horizontal layout for header
    return (
      <div className="snapshot-selector" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '100%'
      }}>
        {/* Category selector */}
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          style={{
            background: '#222',
            border: '1px solid #444',
            color: '#ccc',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '9px',
            cursor: 'pointer',
            minWidth: '90px',
            height: '24px'
          }}
          title="Select category"
        >
			{Object.keys(SNAPSHOT_CATEGORIES).map(category => {
			  const displayName = {
				easy: 'Easy',
				moderate: 'Moderate',
				hard: 'Hard'
			  }[category] || category;
			  
			  return (
				<option key={category} value={category}>
				  {displayName} ({SNAPSHOT_CATEGORIES[category].length})
				</option>
			  );
			})}
        </select>
        
        {/* Snapshot selector */}
        <select
          value={selectedSnapshotId}
          onChange={(e) => handleSnapshotChange(e.target.value)}
          style={{
            flex: 1,
            background: '#222',
            border: '1px solid #444',
            color: '#ccc',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '9px',
            cursor: 'pointer',
            height: '24px',
            minWidth: '180px'
          }}
          title="Select snapshot"
        >
          {SNAPSHOT_CATEGORIES[selectedCategory].map(snapshotId => (
            <option key={snapshotId} value={snapshotId}>
              {getSnapshotDisplayName(snapshotId)}
            </option>
          ))}
        </select>
        
        {/* Current snapshot name (tooltip on hover) */}
        <div style={{
          fontSize: '9px',
          color: '#c9a050',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '150px',
          padding: '0 4px'
        }} title={currentSnapshotName}>
          {currentSnapshotName}
        </div>
      </div>
    )
  }
  
  // Original expanded layout (if needed elsewhere)
  return (
    <div className="snapshot-selector" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
      {/* Selector row */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        alignItems: 'center', 
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ 
            fontSize: '10px', 
            color: '#7d92a1',
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}>
            Category:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            style={{
              background: '#222',
              border: '1px solid #444',
              color: '#ccc',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
				{Object.keys(SNAPSHOT_CATEGORIES).map(category => {
				  const displayName = {
					easy: 'Easy',
					moderate: 'Moderate',
					hard: 'Hard'
				  }[category] || category;
				  
				  return (
					<option key={category} value={category}>
					  {displayName} ({SNAPSHOT_CATEGORIES[category].length})
					</option>
				  );
				})}
          </select>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px' 
        }}>
          <span style={{ 
            fontSize: '10px', 
            color: '#7d92a1',
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}>
            Snapshot:
          </span>
          <select
            value={selectedSnapshotId}
            onChange={(e) => handleSnapshotChange(e.target.value)}
            style={{
              background: '#222',
              border: '1px solid #444',
              color: '#ccc',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            {SNAPSHOT_CATEGORIES[selectedCategory].map(snapshotId => (
              <option key={snapshotId} value={snapshotId}>
                {getSnapshotDisplayName(snapshotId)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default SnapshotSelector