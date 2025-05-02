import { useMemo } from 'react';

interface UserAvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export default function UserAvatar({
  username,
  size = 'md',
  imageUrl,
  status
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  };

  const statusClasses = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  const initials = useMemo(() => {
    if (!username) return '';
    
    const parts = username.split(/[\s-_]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }, [username]);

  const backgroundColor = useMemo(() => {
    if (!username) return 'bg-blue-500';
    
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