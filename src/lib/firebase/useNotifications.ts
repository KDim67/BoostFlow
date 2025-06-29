import { useState, useEffect, useCallback } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import { NotificationService } from './notificationService';
import { Notification, NotificationType } from '../types/notification';
import { useAuth } from './useAuth';
import { createLogger } from '../utils/logger';

const logger = createLogger('useNotifications');

/**
 * Custom hook for managing user notifications with real-time updates
 * @param includeHidden - Whether to include notifications hidden from dropdown in the results
 * @returns Object containing notifications state and management functions
 */
export const useNotifications = (includeHidden: boolean = false) => {
  const { user } = useAuth();
  // State management for notifications and UI feedback
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to calculate and update unread notification count
  const updateUnreadCount = useCallback((notificationList: Notification[]) => {
    const count = notificationList.filter(n => !n.read).length;
    setUnreadCount(count);
  }, []);

  // Callback for handling real-time notification updates from Firebase
  const handleNotificationsUpdate = useCallback((newNotifications: Notification[]) => {
    setNotifications(newNotifications);
    updateUnreadCount(newNotifications);
    setIsLoading(false);
    setError(null);
  }, [updateUnreadCount]);

  // Set up real-time subscription to user notifications
  useEffect(() => {
    // Clear state if user is not authenticated
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let unsubscribe: Unsubscribe;

    try {
      // Subscribe to real-time notifications with limit of 50
      unsubscribe = NotificationService.subscribeToUserNotifications(
        user.uid,
        handleNotificationsUpdate,
        50, // Limit to prevent performance issues
        includeHidden
      );
    } catch (err) {
      logger.error('Error subscribing to notifications:', err as Error);
      setError('Failed to load notifications');
      setIsLoading(false);
    }

    // Cleanup subscription on unmount or dependency change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, handleNotificationsUpdate]);

  // Mark a specific notification as read and update local state
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      logger.error('Error marking notification as read:', err as Error);
      setError('Failed to mark notification as read');
    }
  }, []);

  // Mark all user notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      await NotificationService.markAllAsRead(user.uid);
      // Update all notifications to read state and reset unread count
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      logger.error('Error marking all notifications as read:', err as Error);
      setError('Failed to mark all notifications as read');
    }
  }, [user?.uid]);

  // Permanently delete a notification from the database and local state
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      // Remove from local state immediately
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
    } catch (err) {
      logger.error('Error deleting notification:', err as Error);
      setError('Failed to delete notification');
    }
  }, []);

  // Hide notification from dropdown without deleting it
  const hideFromDropdown = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.hideFromDropdown(notificationId);
      // Only remove from local state if we're not including hidden notifications
      if (!includeHidden) {
        setNotifications(prev => 
          prev.filter(n => n.id !== notificationId)
        );
      }
    } catch (err) {
      logger.error('Error hiding notification from dropdown:', err as Error);
      setError('Failed to hide notification');
    }
  }, [includeHidden]);

  // Create a new notification for the current user
  const createNotification = useCallback(async (
    title: string,
    message: string,
    type: NotificationType,
    organizationId?: string,
    actionUrl?: string,
    metadata?: { [key: string]: any }
  ) => {
    if (!user?.uid) return;
    
    try {
      await NotificationService.createNotification(
        user.uid,
        title,
        message,
        type,
        organizationId,
        actionUrl,
        metadata
      );
    } catch (err) {
      logger.error('Error creating notification:', err as Error);
      setError('Failed to create notification');
    }
  }, [user?.uid]);

  // Clear any error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    hideFromDropdown,
    createNotification,
    clearError
  };
};