import { useMemo } from 'react';

/**
 * Props interface for the UserAvatar component
 * @param username - The user's display name, used for generating initials and color
 * @param size - Avatar size variant (sm: 32px, md: 40px, lg: 48px)
 * @param imageUrl - Optional profile image URL; if not provided, shows initials
 * @param status - Optional status indicator for user presence
 */
interface UserAvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

/**
 * UserAvatar component displays a user's profile picture or initials with optional status indicator
 * Features:
 * - Fallback to initials when no image is provided
 * - Consistent color generation based on username
 * - Multiple size variants
 * - Status indicator overlay
 */
export default function UserAvatar({
  username,
  size = 'md',
  imageUrl,
  status
}: UserAvatarProps) {
  // Size mappings for avatar dimensions and text size
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  };

  // Status indicator color mappings
  const statusClasses = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  // Generate user initials from username, memoized for performance
  const initials = useMemo(() => {
    if (!username) return '';
    
    // Split by common separators (space, dash, underscore) and filter empty strings
    const parts = username.split(/[\s-_]+/).filter(Boolean);
    if (parts.length >= 2) {
      // Use first letter of first two parts for multi-word names
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    // For single words, use first two characters
    return username.substring(0, 2).toUpperCase();
  }, [username]);

  // Generate consistent background color based on username hash
  const backgroundColor = useMemo(() => {
    if (!username) return 'bg-blue-500';
    
    // Predefined color palette for avatar backgrounds
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    
    // Create a simple hash from username characters
    // This ensures the same username always gets the same color
    const hash = username.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  }, [username]);

  return (
    <div className="relative inline-block">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={username}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white dark:border-gray-800`}
        />
      ) : (
        <div className={`${sizeClasses[size]} ${backgroundColor} rounded-full flex items-center justify-center text-white font-medium`}>
          {initials}
        </div>
      )}
      
      {status && (
        <span 
          className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-800 ${statusClasses[status]}`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}