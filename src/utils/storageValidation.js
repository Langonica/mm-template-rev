/**
 * Storage Validation Utilities
 * 
 * Validates data loaded from localStorage to ensure it matches expected schemas.
 * Prevents corrupted or malformed data from causing runtime errors.
 */

// ============================================================================
// STATS SCHEMA
// ============================================================================

const STATS_SCHEMA = {
  totalGames: { type: 'number', min: 0 },
  wins: { type: 'number', min: 0 },
  losses: { type: 'number', min: 0 },
  forfeits: { type: 'number', min: 0 },
  currentStreak: { type: 'number', min: 0 },
  bestStreak: { type: 'number', min: 0 },
  bestWinMoves: { type: ['number', 'null'], min: 1 },
  bestWinTime: { type: ['number', 'null'], min: 1 },
  totalMoves: { type: 'number', min: 0 },
  totalPlayTime: { type: 'number', min: 0 },
  byMode: { type: 'object' },
  lastPlayed: { type: ['number', 'null'], min: 0 }
};

const MODE_STATS_SCHEMA = {
  games: { type: 'number', min: 0 },
  wins: { type: 'number', min: 0 },
  forfeits: { type: 'number', min: 0 },
  bestMoves: { type: ['number', 'null'], min: 1 },
  bestTime: { type: ['number', 'null'], min: 1 }
};

const VALID_MODES = ['classic', 'classic_double', 'hidden', 'hidden_double'];

// ============================================================================
// CAMPAIGN SCHEMA
// ============================================================================

const CAMPAIGN_SCHEMA = {
  currentLevel: { type: 'number', min: 1, max: 30 },
  highestUnlocked: { type: 'number', min: 1, max: 30 },
  tiersCompleted: { type: 'object' },
  campaignComplete: { type: 'boolean' },
  levels: { type: 'object' }
};

const LEVEL_STATS_SCHEMA = {
  completed: { type: 'boolean' },
  bestMoves: { type: ['number', 'null'], min: 1 },
  bestTime: { type: ['number', 'null'], min: 1 },
  attempts: { type: 'number', min: 0 }
};

const VALID_TIERS = ['easy', 'moderate', 'hard'];

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a value matches the expected type(s)
 * @param {*} value - Value to check
 * @param {string|string[]} expectedType - Expected type(s)
 * @returns {boolean}
 */
function isValidType(value, expectedType) {
  const types = Array.isArray(expectedType) ? expectedType : [expectedType];
  const actualType = value === null ? 'null' : typeof value;
  
  // Handle null specially
  if (types.includes('null') && value === null) {
    return true;
  }
  
  return types.includes(actualType);
}

/**
 * Validate a value against field constraints
 * @param {*} value - Value to validate
 * @param {object} constraints - Field constraints (type, min, max)
 * @param {string} path - Field path for error messages
 * @returns {string|null} - Error message or null if valid
 */
function validateField(value, constraints, path) {
  // Check type
  if (!isValidType(value, constraints.type)) {
    return `Field "${path}" has invalid type. Expected ${constraints.type.join ? constraints.type.join(' or ') : constraints.type}, got ${typeof value}`;
  }
  
  // Skip further checks for null
  if (value === null) {
    return null;
  }
  
  // Check numeric constraints
  if (typeof value === 'number') {
    if (constraints.min !== undefined && value < constraints.min) {
      return `Field "${path}" value ${value} is below minimum ${constraints.min}`;
    }
    if (constraints.max !== undefined && value > constraints.max) {
      return `Field "${path}" value ${value} exceeds maximum ${constraints.max}`;
    }
  }
  
  return null;
}

/**
 * Validate an object against a schema
 * @param {object} obj - Object to validate
 * @param {object} schema - Schema definition
 * @param {string} [path=''] - Base path for error messages
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateObject(obj, schema, path = '') {
  const errors = [];
  
  if (obj === null || typeof obj !== 'object') {
    return { valid: false, errors: [`Expected object, got ${typeof obj}`] };
  }
  
  for (const [key, constraints] of Object.entries(schema)) {
    const fieldPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    
    // Skip validation for undefined fields (they'll use defaults)
    if (value === undefined) {
      continue;
    }
    
    const error = validateField(value, constraints, fieldPath);
    if (error) {
      errors.push(error);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Validate game stats data
 * @param {*} data - Data to validate
 * @returns {object} - { valid: boolean, errors: string[], sanitized: object }
 */
export function validateStats(data) {
  // Must be an object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { 
      valid: false, 
      errors: ['Stats data must be a plain object'],
      sanitized: null
    };
  }
  
  const result = validateObject(data, STATS_SCHEMA);
  
  // Validate byMode structure if present
  if (data.byMode && typeof data.byMode === 'object') {
    for (const [mode, modeStats] of Object.entries(data.byMode)) {
      if (!VALID_MODES.includes(mode)) {
        result.errors.push(`Unknown game mode "${mode}"`);
        continue;
      }
      
      const modeResult = validateObject(modeStats, MODE_STATS_SCHEMA, `byMode.${mode}`);
      result.errors.push(...modeResult.errors);
    }
  }
  
  // Check logical consistency
  if (data.wins + data.losses + data.forfeits > data.totalGames) {
    result.errors.push('Sum of wins + losses + forfeits exceeds totalGames');
  }
  
  if (data.currentStreak > data.bestStreak) {
    result.errors.push('currentStreak cannot exceed bestStreak');
  }
  
  return {
    valid: result.errors.length === 0,
    errors: result.errors,
    sanitized: result.errors.length === 0 ? data : null
  };
}

/**
 * Validate campaign progress data
 * @param {*} data - Data to validate
 * @returns {object} - { valid: boolean, errors: string[], sanitized: object }
 */
export function validateCampaignProgress(data) {
  // Must be an object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { 
      valid: false, 
      errors: ['Campaign progress data must be a plain object'],
      sanitized: null
    };
  }
  
  const result = validateObject(data, CAMPAIGN_SCHEMA);
  
  // Validate tiersCompleted structure
  if (data.tiersCompleted && typeof data.tiersCompleted === 'object') {
    for (const [tier, completed] of Object.entries(data.tiersCompleted)) {
      if (!VALID_TIERS.includes(tier)) {
        result.errors.push(`Unknown tier "${tier}"`);
      }
      if (typeof completed !== 'boolean') {
        result.errors.push(`tiersCompleted.${tier} must be a boolean`);
      }
    }
  }
  
  // Validate levels structure
  if (data.levels && typeof data.levels === 'object') {
    for (const [levelId, levelStats] of Object.entries(data.levels)) {
      const levelResult = validateObject(levelStats, LEVEL_STATS_SCHEMA, `levels.${levelId}`);
      result.errors.push(...levelResult.errors);
    }
  }
  
  // Check logical consistency
  if (data.highestUnlocked < data.currentLevel) {
    result.errors.push('highestUnlocked cannot be less than currentLevel');
  }
  
  return {
    valid: result.errors.length === 0,
    errors: result.errors,
    sanitized: result.errors.length === 0 ? data : null
  };
}

/**
 * Safely parse JSON with validation
 * @param {string} jsonString - JSON string to parse
 * @param {function} validator - Validation function to apply
 * @returns {object} - { success: boolean, data: object|null, error: string|null }
 */
export function safeParseAndValidate(jsonString, validator) {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = validator(parsed);
    
    if (!validation.valid) {
      return {
        success: false,
        data: null,
        error: `Validation failed: ${validation.errors.join('; ')}`
      };
    }
    
    return {
      success: true,
      data: validation.sanitized,
      error: null
    };
  } catch (e) {
    return {
      success: false,
      data: null,
      error: `JSON parse error: ${e.message}`
    };
  }
}
