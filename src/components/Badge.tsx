interface BadgeProps {
  type: 'priority' | 'plan' | 'role' | 'status' | 'severity' | 'visibility' | 'custom';
  value: string;
  variant?: 'default' | 'with-icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Badge({ type, value, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  const getStyles = () => {
    const baseStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm'
    };

    const sizeClass = baseStyles[size];
    let colorClass = '';

    switch (type) {
      case 'priority':
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
        switch (value.toLowerCase()) {
          case 'active':
          case 'completed':
          case 'success':
            colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            break;
          case 'in-progress':
          case 'in progress':
          case 'pending':
          case 'planning':
          case 'invited':
            colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            break;
          case 'on-hold':
          case 'on hold':
          case 'warning':
            colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            break;
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
        switch (value.toLowerCase()) {
          case 'high':
          case 'critical':
            colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            break;
          case 'medium':
          case 'moderate':
            colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            break;
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
        colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }

    return `${sizeClass} font-medium rounded-full ${colorClass}`;
  };

  const getIcon = () => {
    if (variant !== 'with-icon') return null;

    const iconSize = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';

    switch (type) {
      case 'plan':
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
        return null;

      case 'status':
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
        return null;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'priority':
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      case 'plan':
      case 'role':
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      case 'status':
        return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
      default:
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