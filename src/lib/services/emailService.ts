import { createLogger } from '../utils/logger';

const logger = createLogger('EmailService');

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Check if we're running on the server side
const isServer = typeof window === 'undefined';

// MailHog provider for development
class MailHogProvider implements EmailProvider {
  private smtpHost: string;
  private smtpPort: number;

  constructor() {
    this.smtpHost = process.env.MAILHOG_HOST || 'localhost';
    this.smtpPort = parseInt(process.env.MAILHOG_PORT || '1025');
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!isServer) {
      logger.error('Email service can only be used on the server side');
      return {
        success: false,
        error: 'Email service can only be used on the server side',
      };
    }

    try {
      // For MailHog, we'll use nodemailer
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: this.smtpHost,
        port: this.smtpPort,
        secure: false, // MailHog doesn't use SSL
        ignoreTLS: true,
      });

      const mailOptions = {
        from: options.from || process.env.DEFAULT_FROM_EMAIL || 'noreply@boostflow.me',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc?.join(', '),
        bcc: options.bcc?.join(', '),
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await transporter.sendMail(mailOptions);
      logger.info('Email sent via MailHog', { to: options.to, subject: options.subject, messageId: result.messageId });
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      logger.error('Failed to send email via MailHog', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// SendGrid provider for production
class SendGridProvider implements EmailProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    if (!this.apiKey && isServer) {
      logger.warn('SendGrid API key not found. Email sending will fail.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!isServer) {
      logger.error('Email service can only be used on the server side');
      return {
        success: false,
        error: 'Email service can only be used on the server side',
      };
    }

    try {
      if (!this.apiKey) {
        throw new Error('SendGrid API key is not configured');
      }

      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(this.apiKey);

      const msg = {
        to: options.to,
        from: options.from || process.env.DEFAULT_FROM_EMAIL || 'noreply@boostflow.me',
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
          type: att.contentType,
        })),
      };

      const result = await sgMail.default.send(msg);
      logger.info('Email sent via SendGrid', { to: options.to, subject: options.subject });
      
      return {
        success: true,
        messageId: result[0].headers['x-message-id'],
      };
    } catch (error) {
      logger.error('Failed to send email via SendGrid', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Email service factory
class EmailService {
  private provider: EmailProvider | null = null;

  constructor() {
    if (!isServer) {
      logger.warn('EmailService initialized on client side - email functionality will be disabled');
      return;
    }

    const environment = process.env.NODE_ENV || 'development';
    
    // Auto-detect environment and choose appropriate provider
    // Priority: 1. Explicit EMAIL_PROVIDER env var, 2. Auto-detect based on NODE_ENV
    let emailProvider = process.env.EMAIL_PROVIDER;
    
    if (!emailProvider) {
      // Auto-detect based on environment
      if (environment === 'production') {
        emailProvider = 'sendgrid';
      } else {
        // For development, test, or any non-production environment, use MailHog
        emailProvider = 'mailhog';
      }
      logger.info(`Auto-detected email provider: ${emailProvider} (NODE_ENV: ${environment})`);
    } else {
      logger.info(`Using explicit email provider: ${emailProvider}`);
    }

    switch (emailProvider.toLowerCase()) {
      case 'sendgrid':
        this.provider = new SendGridProvider();
        logger.info('Email service initialized with SendGrid provider');
        break;
      case 'mailhog':
      default:
        this.provider = new MailHogProvider();
        logger.info('Email service initialized with MailHog provider');
        break;
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!isServer || !this.provider) {
      return {
        success: false,
        error: 'Email service can only be used on the server side',
      };
    }
    return this.provider.sendEmail(options);
  }

  async sendInvitationEmail({
    to,
    inviterName,
    organizationName,
    inviteUrl,
  }: {
    to: string;
    inviterName: string;
    organizationName: string;
    inviteUrl: string;
  }) {
    const subject = `You've been invited to join ${organizationName} on BoostFlow`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're Invited!</h2>
        <p>Hi there,</p>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on BoostFlow.</p>
        <p>BoostFlow is a powerful project management platform that helps teams collaborate and stay organized.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This invitation was sent by ${inviterName}. If you don't know this person or don't want to join this organization, you can safely ignore this email.</p>
      </div>
    `;
    const text = `You've been invited to join ${organizationName} on BoostFlow by ${inviterName}. Accept your invitation: ${inviteUrl}`;

    logger.info(`Attempting to send invitation email to ${to}`);
    const result = await this.sendEmail({ to, subject, html, text });
    
    if (result.success) {
      logger.info(`Invitation email sent successfully to ${to}`, { messageId: result.messageId });
    } else {
      logger.error(`Failed to send invitation email to ${to}: ${result.error}`);
    }
    
    return result;
  }

  async sendProjectNotificationEmail({
    to,
    creatorName,
    projectName,
    organizationName,
    projectUrl,
    type = 'created',
  }: {
    to: string | string[];
    creatorName: string;
    projectName: string;
    organizationName: string;
    projectUrl: string;
    type?: 'created' | 'updated';
  }) {
    const action = type === 'created' ? 'created' : 'updated';
    const subject = `New project ${action}: ${projectName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Project ${action.charAt(0).toUpperCase() + action.slice(1)}</h2>
        <p>Hi there,</p>
        <p><strong>${creatorName}</strong> has ${action} a new project <strong>${projectName}</strong> in <strong>${organizationName}</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${projectUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Project</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${projectUrl}</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">You're receiving this email because you're a member of ${organizationName}. You can manage your notification preferences in your account settings.</p>
      </div>
    `;
    const text = `${creatorName} has ${action} a new project "${projectName}" in ${organizationName}. View it here: ${projectUrl}`;

    return this.sendEmail({ to, subject, html, text });
  }

  async sendTaskNotificationEmail({
    to,
    creatorName,
    taskTitle,
    projectName,
    organizationName,
    taskUrl,
    assigneeName,
  }: {
    to: string | string[];
    creatorName: string;
    taskTitle: string;
    projectName: string;
    organizationName: string;
    taskUrl: string;
    assigneeName?: string;
  }) {
    const subject = `New task assigned: ${taskTitle}`;
    const assignmentText = assigneeName ? ` and assigned to ${assigneeName}` : '';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Task Created</h2>
        <p>Hi there,</p>
        <p><strong>${creatorName}</strong> has created a new task <strong>${taskTitle}</strong> in project <strong>${projectName}</strong>${assignmentText}.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${taskUrl}" style="background-color: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Task</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${taskUrl}</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">You're receiving this email because you're a member of ${organizationName}. You can manage your notification preferences in your account settings.</p>
      </div>
    `;
    const text = `${creatorName} has created a new task "${taskTitle}" in project ${projectName}${assignmentText}. View it here: ${taskUrl}`;

    return this.sendEmail({ to, subject, html, text });
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;