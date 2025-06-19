import { NotificationService } from '../firebase/notificationService';
import { emailService } from './emailService';
import { createLogger } from '../utils/logger';
import { NotificationType } from '../types/notification';

const logger = createLogger('EnhancedNotificationService');

export interface NotificationOptions {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  organizationId?: string;
  actionUrl?: string;
  metadata?: { [key: string]: any };
  sendEmail?: boolean;
  emailRecipients?: string[];
}

export class EnhancedNotificationService {
  /**
   * Create a notification and optionally send an email
   */
  static async createNotification(options: NotificationOptions): Promise<string> {
    const {
      userId,
      title,
      message,
      type,
      organizationId,
      actionUrl,
      metadata,
      sendEmail = false,
      emailRecipients = []
    } = options;

    try {
      // Create in-app notification
      const notificationId = await NotificationService.createNotification(
        userId,
        title,
        message,
        type,
        organizationId,
        actionUrl,
        metadata
      );

      // Send email notification if requested
      if (sendEmail && emailRecipients.length > 0) {
        try {
          await this.sendEmailNotification({
            type,
            title,
            message,
            recipients: emailRecipients,
            actionUrl,
            metadata
          });
        } catch (emailError) {
          logger.error('Failed to send email notification', emailError as Error);
          // Don't throw - the in-app notification was created successfully
        }
      }

      return notificationId;
    } catch (error) {
      logger.error('Error creating enhanced notification:', error as Error);
      throw error;
    }
  }

  /**
   * Send project creation notifications
   */
  static async notifyProjectCreated({
    projectId,
    projectName,
    creatorUserId,
    organizationId,
    organizationName,
    memberEmails = []
  }: {
    projectId: string;
    projectName: string;
    creatorUserId: string;
    organizationId: string;
    organizationName: string;
    memberEmails?: string[];
  }): Promise<void> {
    try {
      const { getUserProfile } = await import('../firebase/userProfileService');
      const creatorProfile = await getUserProfile(creatorUserId);
      const creatorName = creatorProfile?.displayName || creatorProfile?.email || 'Someone';
      
      const projectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/organizations/${organizationId}/projects/${projectId}`;
      
      // Get organization members to notify
      const { getOrganizationMembers } = await import('../firebase/organizationService');
      const members = await getOrganizationMembers(organizationId);
      
      // Filter out the creator and get active members
      const membersToNotify = members.filter(member => 
        member.userId !== creatorUserId && 
        member.status === 'active'
      );
      
      // Create notifications for each member
      const notificationPromises = membersToNotify.map(member =>
        this.createNotification({
          userId: member.userId,
          title: 'New Project Created',
          message: `${creatorName} created a new project "${projectName}" in ${organizationName}`,
          type: 'project_created',
          organizationId,
          actionUrl: `/organizations/${organizationId}/projects/${projectId}`,
          metadata: {
            projectId,
            projectName,
            creatorUserId,
            organizationId,
            organizationName
          },
          sendEmail: true,
          emailRecipients: memberEmails.length > 0 ? memberEmails : [member.userProfile?.email].filter(Boolean)
        })
      );
      
      await Promise.all(notificationPromises);
      
      // Send email to additional recipients if provided
      if (memberEmails.length > 0) {
        try {
          await emailService.sendProjectNotificationEmail({
            to: memberEmails,
            creatorName,
            projectName,
            organizationName,
            projectUrl,
            type: 'created'
          });
        } catch (emailError) {
          logger.error('Failed to send project creation email to additional recipients', emailError as Error);
        }
      }
      
      logger.info(`Project creation notifications sent for project: ${projectId}`);
    } catch (error) {
      logger.error('Error sending project creation notifications:', error as Error);
      throw error;
    }
  }

  /**
   * Send task creation notifications
   */
  static async notifyTaskCreated({
    taskId,
    taskTitle,
    creatorUserId,
    assigneeUserId,
    projectId,
    projectName,
    organizationId,
    organizationName
  }: {
    taskId: string;
    taskTitle: string;
    creatorUserId: string;
    assigneeUserId?: string;
    projectId: string;
    projectName: string;
    organizationId: string;
    organizationName: string;
  }): Promise<void> {
    try {
      const { getUserProfile } = await import('../firebase/userProfileService');
      const creatorProfile = await getUserProfile(creatorUserId);
      const creatorName = creatorProfile?.displayName || creatorProfile?.email || 'Someone';
      
      const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/organizations/${organizationId}/projects/${projectId}/tasks`;
      
      const notifications: Promise<string>[] = [];
      
      // Notify assignee if different from creator
      if (assigneeUserId && assigneeUserId !== creatorUserId) {
        const assigneeProfile = await getUserProfile(assigneeUserId);
        const assigneeName = assigneeProfile?.displayName || assigneeProfile?.email || 'Unknown';
        
        notifications.push(
          this.createNotification({
            userId: assigneeUserId,
            title: 'New Task Assigned',
            message: `${creatorName} assigned you a new task "${taskTitle}" in project ${projectName}`,
            type: 'task_assigned',
            organizationId,
            actionUrl: `/organizations/${organizationId}/projects/${projectId}/tasks`,
            metadata: {
              taskId,
              taskTitle,
              creatorUserId,
              assigneeUserId,
              projectId,
              projectName,
              organizationId,
              organizationName
            },
            sendEmail: true,
            emailRecipients: assigneeProfile?.email ? [assigneeProfile.email] : []
          })
        );
        
        // Send email notification
        if (assigneeProfile?.email) {
          try {
            await emailService.sendTaskNotificationEmail({
              to: assigneeProfile.email,
              creatorName,
              taskTitle,
              projectName,
              organizationName,
              taskUrl,
              assigneeName
            });
          } catch (emailError) {
            logger.error('Failed to send task assignment email', emailError as Error);
          }
        }
      }
      
      // Notify project members (excluding creator and assignee)
      const { getOrganizationMembers } = await import('../firebase/organizationService');
      const members = await getOrganizationMembers(organizationId);
      
      const membersToNotify = members.filter(member => 
        member.userId !== creatorUserId && 
        member.userId !== assigneeUserId &&
        member.status === 'active'
      );
      
      membersToNotify.forEach(member => {
        notifications.push(
          this.createNotification({
            userId: member.userId,
            title: 'New Task Created',
            message: `${creatorName} created a new task "${taskTitle}" in project ${projectName}`,
            type: 'task_created',
            organizationId,
            actionUrl: `/organizations/${organizationId}/projects/${projectId}/tasks`,
            metadata: {
              taskId,
              taskTitle,
              creatorUserId,
              assigneeUserId,
              projectId,
              projectName,
              organizationId,
              organizationName
            }
          })
        );
      });
      
      await Promise.all(notifications);
      
      logger.info(`Task creation notifications sent for task: ${taskId}`);
    } catch (error) {
      logger.error('Error sending task creation notifications:', error as Error);
      throw error;
    }
  }

  /**
   * Send email notification based on type
   */
  private static async sendEmailNotification({
    type,
    title,
    message,
    recipients,
    actionUrl,
    metadata
  }: {
    type: NotificationType;
    title: string;
    message: string;
    recipients: string[];
    actionUrl?: string;
    metadata?: { [key: string]: any };
  }): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const fullActionUrl = actionUrl ? `${baseUrl}${actionUrl}` : undefined;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${title}</h2>
        <p>${message}</p>
        ${fullActionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${fullActionUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a>
          </div>
        ` : ''}
        ${fullActionUrl ? `
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${fullActionUrl}</p>
        ` : ''}
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">You're receiving this email because you're a member of this organization. You can manage your notification preferences in your account settings.</p>
      </div>
    `;
    
    const text = `${title}\n\n${message}${fullActionUrl ? `\n\nView details: ${fullActionUrl}` : ''}`;
    
    await emailService.sendEmail({
      to: recipients,
      subject: title,
      html,
      text
    });
  }
}

export default EnhancedNotificationService;