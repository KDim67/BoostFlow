import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { Notification, NotificationType, NotificationPreferences } from '../types/notification';
import { createLogger } from '../utils/logger';

// Logger instance for tracking notification service operations
const logger = createLogger('NotificationService');

/**
 * Service class for managing user notifications in Firebase Firestore
 * Handles CRUD operations, real-time subscriptions, and user preferences
 */
export class NotificationService {
  /**
   * Creates a new notification for a user
   * @param userId - Target user's unique identifier
   * @param title - Notification title
   * @param message - Notification content
   * @param type - Type of notification (defined in NotificationType enum)
   * @param organizationId - Optional organization context
   * @param actionUrl - Optional URL for notification action
   * @param metadata - Optional additional data for the notification
   * @returns Promise resolving to the created notification's ID
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    organizationId?: string,
    actionUrl?: string,
    metadata?: { [key: string]: any }
  ): Promise<string> {
    try {
      // Generate a new document reference with auto-generated ID
      const notificationRef = doc(collection(db, 'notifications'));
      
      // Build notification data object, conditionally including optional fields
      // Uses spread operator to avoid storing undefined/null values in Firestore
      const notificationData: Omit<Notification, 'id'> = {
        userId,
        ...(organizationId !== undefined && organizationId !== null && { organizationId }),
        title,
        message,
        type,
        read: false, // All notifications start as unread
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(actionUrl !== undefined && actionUrl !== null && { actionUrl }),
        ...(metadata !== undefined && metadata !== null && { metadata })
      };

      await setDoc(notificationRef, notificationData);
      logger.info(`Notification created for user: ${userId}`, { type, title });
      return notificationRef.id;
    } catch (error) {
      logger.error('Error creating notification:', error as Error);
      throw error;
    }
  }

  /**
   * Retrieves notifications for a specific user with filtering options
   * @param userId - User's unique identifier
   * @param limitCount - Maximum number of notifications to return (default: 20)
   * @param unreadOnly - If true, only returns unread notifications
   * @param includeHidden - If false, excludes notifications hidden from dropdown
   * @returns Promise resolving to array of user notifications
   */
  static async getUserNotifications(
    userId: string,
    limitCount: number = 20,
    unreadOnly: boolean = false,
    includeHidden: boolean = true
  ): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, 'notifications');
      
      // Build base query for user's notifications, ordered by newest first
      let q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      // Modify query to filter only unread notifications if requested
      if (unreadOnly) {
        q = query(
          notificationsRef,
          where('userId', '==', userId),
          where('read', '==', false),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      const notifications: Notification[] = [];
      
      // Process each document and apply client-side filtering
      querySnapshot.forEach((doc) => {
        const notification = {
          id: doc.id,
          ...doc.data()
        } as Notification;
        
        // Filter out hidden notifications unless explicitly requested
        if (includeHidden || !notification.hiddenFromDropdown) {
          notifications.push(notification);
        }
      });

      return notifications;
    } catch (error) {
      logger.error('Error fetching user notifications:', error as Error);
      throw error;
    }
  }

  /**
   * Sets up real-time subscription to user notifications
   * @param userId - User's unique identifier
   * @param callback - Function called when notifications change
   * @param limitCount - Maximum number of notifications to watch (default: 20)
   * @param includeHidden - If false, excludes notifications hidden from dropdown
   * @returns Unsubscribe function to stop the real-time listener
   */
  static subscribeToUserNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    limitCount: number = 20,
    includeHidden: boolean = true
  ): Unsubscribe {
    const notificationsRef = collection(db, 'notifications');
    
    // Set up query for real-time notifications
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    // Return the unsubscribe function from onSnapshot
    return onSnapshot(q, (querySnapshot) => {
      const notifications: Notification[] = [];
      
      // Process each notification document
      querySnapshot.forEach((doc) => {
        const notification = {
          id: doc.id,
          ...doc.data()
        } as Notification;
        
        // Apply client-side filtering for hidden notifications
        if (includeHidden || !notification.hiddenFromDropdown) {
          notifications.push(notification);
        }
      });
      
      // Trigger callback with filtered notifications
      callback(notifications);
    }, (error) => {
      logger.error('Error in notifications subscription:', error);
    });
  }

  /**
   * Marks a specific notification as read
   * @param notificationId - Unique identifier of the notification
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp()
      });
      logger.info(`Notification marked as read: ${notificationId}`);
    } catch (error) {
      logger.error('Error marking notification as read:', error as Error);
      throw error;
    }
  }

  /**
   * Updates specific fields of a notification
   * @param notificationId - Unique identifier of the notification
   * @param updates - Partial notification object with fields to update
   */
  static async updateNotification(
    notificationId: string,
    updates: Partial<Notification>
  ): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      // Merge updates with automatic timestamp update
      await updateDoc(notificationRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      logger.info(`Notification updated: ${notificationId}`);
    } catch (error) {
      logger.error('Error updating notification:', error as Error);
      throw error;
    }
  }

  /**
   * Marks all unread notifications as read for a specific user
   * @param userId - User's unique identifier
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      // Fetch up to 100 unread notifications for the user
      const notifications = await this.getUserNotifications(userId, 100, true);
      
      // Create array of promises to mark each notification as read
      const updatePromises = notifications.map(notification => 
        this.markAsRead(notification.id)
      );
      
      // Execute all updates concurrently
      await Promise.all(updatePromises);
      logger.info(`All notifications marked as read for user: ${userId}`);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error as Error);
      throw error;
    }
  }

  /**
   * Permanently deletes a notification from the database
   * @param notificationId - Unique identifier of the notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
      logger.info(`Notification deleted: ${notificationId}`);
    } catch (error) {
      logger.error('Error deleting notification:', error as Error);
      throw error;
    }
  }

  /**
   * Hides a notification from dropdown UI without deleting it
   * Useful for notifications that should remain in history but not be visible
   * @param notificationId - Unique identifier of the notification
   */
  static async hideFromDropdown(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        hiddenFromDropdown: true,
        updatedAt: serverTimestamp()
      });
      logger.info(`Notification hidden from dropdown: ${notificationId}`);
    } catch (error) {
      logger.error('Error hiding notification from dropdown:', error as Error);
      throw error;
    }
  }

  /**
   * Removes organization invitation notifications for a specific membership
   * Used when an invitation is accepted, declined, or cancelled
   * @param userId - User's unique identifier
   * @param membershipId - Membership ID associated with the invitation
   */
  static async removeInvitationNotification(userId: string, membershipId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, 'notifications');
      
      // Query for specific invitation notifications
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('type', '==', 'organization_invite'),
        where('metadata.membershipId', '==', membershipId)
      );

      const querySnapshot = await getDocs(q);
      
      // Delete all matching invitation notifications concurrently
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      logger.info(`Invitation notification removed for user: ${userId}, membership: ${membershipId}`);
    } catch (error) {
      logger.error('Error removing invitation notification:', error as Error);
      throw error;
    }
  }

  /**
   * Gets the count of unread notifications for a user
   * @param userId - User's unique identifier
   * @returns Promise resolving to number of unread notifications
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      // Fetch unread notifications (limited to 100 for performance)
      const unreadNotifications = await this.getUserNotifications(userId, 100, true);
      return unreadNotifications.length;
    } catch (error) {
      logger.error('Error getting unread count:', error as Error);
      // Return 0 on error to prevent UI issues
      return 0;
    }
  }

  /**
   * Retrieves user's notification preferences
   * @param userId - User's unique identifier
   * @returns Promise resolving to user preferences or null if not set
   */
  static async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const preferencesRef = doc(db, 'userNotificationPreferences', userId);
      const preferencesDoc = await getDoc(preferencesRef);
      
      // Return preferences if document exists, otherwise null for default settings
      if (preferencesDoc.exists()) {
        return preferencesDoc.data() as NotificationPreferences;
      }
      return null;
    } catch (error) {
      logger.error('Error fetching notification preferences:', error as Error);
      throw error;
    }
  }

  /**
   * Updates or creates user notification preferences
   * @param userId - User's unique identifier
   * @param preferences - Complete notification preferences object
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      const preferencesRef = doc(db, 'userNotificationPreferences', userId);
      
      // Use merge: true to update existing preferences or create new document
      await setDoc(preferencesRef, {
        ...preferences,
        updatedAt: serverTimestamp()
      }, { merge: true });
      logger.info(`Notification preferences updated for user: ${userId}`);
    } catch (error) {
      logger.error('Error updating notification preferences:', error as Error);
      throw error;
    }
  }
}