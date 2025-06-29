import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/lib/firebase/useNotifications';
import { Notification } from '@/lib/types/notification';
import { formatDistanceToNow } from 'date-fns';

/**
 * NotificationDropdown component renders a bell icon with notification count badge
 * and a dropdown panel showing recent notifications with actions.
 * Supports marking notifications as read, hiding them, and handling invitation responses.
 */
const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Firebase notifications hook providing real-time notification data and actions
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    hideFromDropdown
  } = useNotifications();

  // Close dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handles clicking on a notification item
   * Marks unread notifications as read and closes dropdown if there's an action URL
   */
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      setIsOpen(false);
    }
  };

  /**
   * Handles organization invitation accept/decline actions
   * Makes API call to process invitation and redirects user appropriately
   * Falls back to invitation page if API call fails
   */
  const handleInvitationAction = async (notification: Notification, action: 'accept' | 'decline') => {
    if (notification.metadata?.membershipId) {
      try {
        const response = await fetch(`/api/invitations/${notification.metadata.membershipId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            userId: notification.userId
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          await markAsRead(notification.id);
          
          // Redirect to specific URL or default to organizations page
          if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
          } else {
            window.location.href = '/organizations';
          }
        } else {
          console.error('Failed to process invitation:', result.message);
          // Fallback to invitation page for manual handling
          window.location.href = `/invitation/${notification.metadata.membershipId}`;
        }
      } catch (error) {
        console.error('Error processing invitation:', error);
        // Fallback to invitation page for manual handling
        window.location.href = `/invitation/${notification.metadata.membershipId}`;
      }
    }
  };

  /**
   * Returns appropriate SVG icon based on notification type
   * Each notification type has a distinct icon and color scheme
   */
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'organization_invite':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );

      case 'plan_upgrade':
      case 'plan_downgrade':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );

      case 'system_announcement':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  /**
   * Formats notification timestamp to relative time (e.g., "2 hours ago")
   * Handles both Firestore timestamps and regular Date objects
   * Returns empty string if timestamp is invalid or missing
   */
  const formatNotificationTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      // Handle Firestore timestamp objects or regular Date objects
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Scrollable notification list with loading, error, and empty states */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <button
                              onClick={() => hideFromDropdown(notification.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                          {notification.actionUrl ? (
                            <Link
                              href={notification.actionUrl}
                              onClick={() => handleNotificationClick(notification)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/notifications"
              className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;