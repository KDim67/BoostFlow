// Test BoostFlow EmailService implementation
// Run with: node test-email-service.js

require('dotenv').config({ path: '.env.local' });

// Import our email service (we'll use require since this is a .js file)
const path = require('path');

// Since we're testing from root, we need to compile TypeScript or use a different approach
// Let's create a simple test that mimics our service
const sgMail = require('@sendgrid/mail');

// Simple logger for testing
const logger = {
  info: (msg, data) => console.log('ℹ️ ', msg, data || ''),
  error: (msg, error) => console.error('❌', msg, error || ''),
  warn: (msg) => console.warn('⚠️ ', msg)
};

// Simplified SendGrid provider for testing
class TestSendGridProvider {
  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('SendGrid API key not found. Email sending will fail.');
    }
  }

  async sendEmail(options) {
    try {
      if (!this.apiKey) {
        throw new Error('SendGrid API key is not configured');
      }

      sgMail.setApiKey(this.apiKey);

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

      const result = await sgMail.send(msg);
      logger.info('Email sent via SendGrid', { to: options.to, subject: options.subject });
      
      return {
        success: true,
        messageId: result[0].headers['x-message-id'],
      };
    } catch (error) {
      logger.error('Failed to send email via SendGrid', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test the invitation email template
  async sendInvitationEmail({ to, inviterName, organizationName, inviteUrl }) {
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

    return this.sendEmail({ to, subject, html, text });
  }
}

// Test the service
async function testEmailService() {
  console.log('🧪 Testing BoostFlow Email Service Implementation\n');
  
  const emailProvider = new TestSendGridProvider();
  
  console.log('📋 Configuration:');
  console.log('- EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
  console.log('- SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Configured' : 'Missing');
  console.log('- DEFAULT_FROM_EMAIL:', process.env.DEFAULT_FROM_EMAIL);
  console.log('');

  // Test 1: Simple email
  console.log('📧 Test 1: Sending simple test email...');
  const simpleResult = await emailProvider.sendEmail({
    to: 'it2022150@hua.gr',
    subject: 'BoostFlow Email Service Test',
    text: 'This is a test of the BoostFlow email service implementation.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">BoostFlow Email Service Test</h2>
        <p>This is a test of the BoostFlow email service implementation.</p>
        <p><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
        <p>✅ If you received this, the email service is working correctly!</p>
      </div>
    `
  });
  
  console.log('Result:', simpleResult);
  console.log('');

  // Test 2: Invitation email template
  console.log('📧 Test 2: Sending invitation email template...');
  const inviteResult = await emailProvider.sendInvitationEmail({
    to: 'it2022053@hua.gr',
    inviterName: 'Test Admin',
    organizationName: 'Test Organization',
    inviteUrl: 'https://boostflow.me/invite/test123'
  });
  
  console.log('Result:', inviteResult);
  console.log('');

  console.log('🎉 Email service testing completed!');
  console.log('📬 Check your email at it2022053@hua.gr for the test messages.');
}

// Run the test
testEmailService().catch(console.error);