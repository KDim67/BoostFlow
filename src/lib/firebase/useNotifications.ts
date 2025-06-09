import { useState, useEffect, useCallback } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import { NotificationService } from './notificationService';
import { Notification, NotificationType } from '../types/notification';
import { useAuth } from './useAuth';
import { createLogger } from '../utils/logger';

const logger = createLogger('useNotifications');

export const useNotifications = (includeHidden: boolean = false) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateUnreadCount = useCallback((notificationList: Notification[]) => {
    const count = notificationList.filter(n => !n.read).length;
    setUnreadCount(count);
  }, []);

  const handleNotificationsUpdate = useCallback((newNotifications: Notification[]) => {
    setNotifications(newNotifications);
    updateUnreadCount(newNotifications);
    setIsLoading(false);
    setError(null);
  }, [updateUnreadCount]);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let unsubscribe: Unsubscribe;

    try {
      unsubscribe = NotificationService.subscribeToUserNotifications(
        user.uid,
        handleNotificationsUpdate,
        50,
        includeHidden
      );
    } catch (err) {
      logger.error('Error subscribing to notifications:', err as Error);
      setError('Failed to load notifications');
      setIsLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, handleNotificationsUpdate]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
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

  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      await NotificationService.markAllAsRead(user.uid);
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      logger.error('Error marking all notifications as read:', err as Error);
      setError('Failed to mark all notifications as read');
    }
  }, [user?.uid]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
    } catch (err) {
      logger.error('Error deleting notification:', err as Error);
      setError('Failed to delete notification');
    }
  }, []);

  const hideFromDropdown = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.hideFromDropdown(notificationId);
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