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

const logger = createLogger('NotificationService');

export class NotificationService {
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
      const notificationRef = doc(collection(db, 'notifications'));
      const notificationData: Omit<Notification, 'id'> = {
        userId,
        ...(organizationId !== undefined && organizationId !== null && { organizationId }),
        title,
        message,
        type,
        read: false,
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

  static async getUserNotifications(
    userId: string,
    limitCount: number = 20,
    unreadOnly: boolean = false,
    includeHidden: boolean = true
  ): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, 'notifications');
      let q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

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
      querySnapshot.forEach((doc) => {
        const notification = {
          id: doc.id,
          ...doc.data()
        } as Notification;
        
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

  static subscribeToUserNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    limitCount: number = 20,
    includeHidden: boolean = true
  ): Unsubscribe {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (querySnapshot) => {
      const notifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const notification = {
          id: doc.id,
          ...doc.data()
        } as Notification;
        
        if (includeHidden || !notification.hiddenFromDropdown) {
          notifications.push(notification);
        }
      });
      callback(notifications);
    }, (error) => {
      logger.error('Error in notifications subscription:', error);
    });
  }

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

  static async updateNotification(
    notificationId: string,
    updates: Partial<Notification>
  ): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
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

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getUserNotifications(userId, 100, true);
      const updatePromises = notifications.map(notification => 
        this.markAsRead(notification.id)
      );
      await Promise.all(updatePromises);
      logger.info(`All notifications marked as read for user: ${userId}`);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error as Error);
      throw error;
    }
  }

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

  static async removeInvitationNotification(userId: string, membershipId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('type', '==', 'organization_invite'),
        where('metadata.membershipId', '==', membershipId)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      logger.info(`Invitation notification removed for user: ${userId}, membership: ${membershipId}`);
    } catch (error) {
      logger.error('Error removing invitation notification:', error as Error);
      throw error;
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const unreadNotifications = await this.getUserNotifications(userId, 100, true);
      return unreadNotifications.length;
    } catch (error) {
      logger.error('Error getting unread count:', error as Error);
      return 0;
    }
  }

  static async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const preferencesRef = doc(db, 'userNotificationPreferences', userId);
      const preferencesDoc = await getDoc(preferencesRef);
      
      if (preferencesDoc.exists()) {
        return preferencesDoc.data() as NotificationPreferences;
      }
      return null;
    } catch (error) {
      logger.error('Error fetching notification preferences:', error as Error);
      throw error;
    }
  }

  static async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      const preferencesRef = doc(db, 'userNotificationPreferences', userId);
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