/**
 * Icon Component
 * 
 * Centralized icon exports from Lucide React with consistent sizing.
 * Replaces emoji usage throughout the application.
 */

import React from 'react';
import styles from './Icon.module.css';

// Export all needed icons from lucide-react
export {
  // Navigation & Actions
  Undo2,
  Redo2,
  Pause,
  Play,
  Home,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  
  // Notifications & Status
  Trophy,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  X,
  CircleX,
  Lightbulb,
  MessageCircle,
  HelpCircle,
  
  // Input & Controls
  MousePointerClick,
  Hand,
  Smartphone,
  Keyboard,
  
  // Game & Cards
  BookOpen,
  Layers,
  LayoutGrid,
  Sparkles,
  Square,
  Star,
  Flame,
  Target,
  Zap,
  Gem,
  Gamepad2,
  BarChart3,
  Settings,
  Menu,
  
  // Misc
  Clock,
  Move,
  History,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
} from 'lucide-react';

/**
 * Icon wrapper component for consistent sizing
 * 
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} size - xs | sm | md | lg | xl | 2xl
 * @param {string} className - Additional CSS classes
 * @param {object} props - Additional props passed to icon
 */
export const Icon = ({ 
  // eslint-disable-next-line no-unused-vars
  icon: LucideIcon, 
  size = 'md', 
  className = '',
  ...props 
}) => {
  const sizeMap = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40
  };
  
  const iconSize = sizeMap[size] || sizeMap.md;
  
  return (
    <span className={`${styles.iconWrapper} ${className}`}>
      <LucideIcon size={iconSize} {...props} />
    </span>
  );
};

/**
 * Pre-sized icon components for common use cases
 */
export const IconXS = (props) => <Icon size="xs" {...props} />;
export const IconSM = (props) => <Icon size="sm" {...props} />;
export const IconMD = (props) => <Icon size="md" {...props} />;
export const IconLG = (props) => <Icon size="lg" {...props} />;
export const IconXL = (props) => <Icon size="xl" {...props} />;
