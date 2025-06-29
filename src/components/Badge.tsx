/**
 * Props interface for the Badge component
 * Defines the structure and types for badge configuration
 */
interface BadgeProps {
  type: 'priority' | 'plan' | 'role' | 'status' | 'severity' | 'visibility' | 'custom';
  value: string;
  variant?: 'default' | 'with-icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * A versatile badge component for displaying categorized information with semantic colors
 * Supports multiple types (priority, plan, role, status, etc.) with automatic color coding
 * and optional icons for enhanced visual communication
 */
export default function Badge({ type, value, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  /**
   * Generates CSS classes for the badge based on type, value, and size
   * Returns a string combining size, color, and base styling classes
   */
  const getStyles = () => {
    // Size-based styling presets for consistent spacing and typography
    const baseStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm'
    };

    const sizeClass = baseStyles[size];
    let colorClass = ''; // Will be populated based on type and value combination

    // Determine color scheme based on badge type and value
    // Each case handles semantic meaning with appropriate visual feedback
    switch (type) {
      case 'priority':
        // Priority levels with intuitive color coding: red=urgent, yellow=moderate, green=low
        switch (value.toLowerCase()) {
          case 'high':
            colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            break;
          case 'medium':
            colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            break;
          case 'low':
            colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            break;
          default:
            colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
        break;

      case 'plan':
        // Subscription plan tiers with progressive color scheme
        switch (value.toLowerCase()) {
          case 'free':
            colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            break;
          case 'starter':
            colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            break;
          case 'professional':
            colorClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            break;
          case 'enterprise':
            colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            break;
          default:
            colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
        break;

      case 'role':
        // User role hierarchy with distinct colors for each permission level
        switch (value.toLowerCase()) {
          case 'owner':
            colorClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
            break;
          case 'admin':
            colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            break;
          case 'member':
            colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            break;
          case 'viewer':
            colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            break;
          default:
            colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
        break;

      case 'status':
        // Status indicators covering various states with semantic color mapping
        switch (value.toLowerCase()) {
          // Positive/completed states - green indicates success or active status
          case 'active':
          case 'completed':
          case 'success':
            colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            break;
          // In-progress/transitional states - blue indicates ongoing activity
          case 'in-progress':
          case 'in progress':
          case 'pending':
          case 'planning':
          case 'invited':
            colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            break;
          // Warning/caution states - yellow indicates attention needed
          case 'on-hold':
          case 'on hold':
          case 'warning':
            colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            break;
          // Error/problem states - red indicates issues requiring action
          case 'inactive':
          case 'suspended':
          case 'error':
          case 'failed':
          case 'overdue':
            colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            break;
          default:
            colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
        break;

      case 'visibility':
        // Access level indicators for content or resource visibility
        switch (value.toLowerCase()) {
          case 'public':
            colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            break;
          case 'private':
            colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            break;
          default:
            colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
        break;

      case 'severity':
        // Issue severity levels with escalating color intensity
        switch (value.toLowerCase()) {
          // Critical issues requiring immediate attention
          case 'high':
          case 'critical':
            colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            break;
          // Moderate issues that should be addressed
          case 'medium':
          case 'moderate':
            colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            break;
          // Minor issues or normal severity
          case 'low':
          case 'normal':
            colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            break;
          default:
            colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
        break;

      case 'custom':
      default:
        // Fallback styling for custom types or unrecognized values
        colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }

    return `${sizeClass} font-medium rounded-full ${colorClass}`;
  };

  /**
   * Generates contextual SVG icons based on badge type and value
   * Only renders when variant is set to 'with-icon'
   * Returns null for unsupported combinations
   */
  const getIcon = () => {
    if (variant !== 'with-icon') return null;

    // Icon size scales with badge size for visual consistency
    const iconSize = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';

    // Icon selection based on semantic meaning of badge type and value
    switch (type) {
      case 'plan':
        // Plan-specific icons representing different subscription tiers
        switch (value.toLowerCase()) {
          case 'free':
            return (
              <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            );
          case 'starter':
            return (
              <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            );
          case 'professional':
            return (
              <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            );
          case 'enterprise':
            return (
              <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            );
          default:
            return null;
        }

      case 'priority':
        // Priority badges don't have icons to keep them minimal
        return null;

      case 'status':
        // Status icons provide immediate visual feedback for state
        switch (value.toLowerCase()) {
          case 'active':
          case 'completed':
          case 'success':
            return (
              <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            );
          case 'in-progress':
          case 'in progress':
          case 'pending':
            return (
              <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            );
          case 'on-hold':
          case 'warning':
            return (
              <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            );
          case 'error':
          case 'failed':
          case 'overdue':
            return (
              <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            );
          default:
            return null;
        }

      default:
        // No icons for unsupported badge types
        return null;
    }
  };

  /**
   * Formats the badge label text based on type-specific conventions
   * Handles capitalization and word separation for better readability
   */
  const getLabel = () => {
    switch (type) {
      case 'priority':
        // Simple title case for priority levels
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      case 'plan':
      case 'role':
        // Title case for plan and role names
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      case 'status':
        // Convert hyphenated status values to space-separated title case
        return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
      default:
        // Return value as-is for custom types
        return value;
    }
  };

  const icon = getIcon();

  return (
    <span className={`inline-flex items-center gap-1 ${getStyles()} ${className}`}>
      {icon}
      {getLabel()}
    </span>
  );
}