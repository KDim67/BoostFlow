# Email Notifications Setup Guide

This guide explains how to set up and test email notifications in BoostFlow using MailHog for development and SendGrid for production.

## Features Implemented

✅ **Group/Team Invitations**: Email notifications when users are invited to organizations  
✅ **Project Creation**: Email notifications to organization members when new projects are created  
✅ **Task Creation**: Email notifications when tasks are created and assigned  
✅ **Development Testing**: MailHog integration for safe email testing  
✅ **Production Ready**: SendGrid integration for reliable email delivery  

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- SendGrid account (for production)

## Development Setup with MailHog

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env.local
```

For development, ensure these variables are set in `.env.local`:
```env
NODE_ENV=development
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Start Services with Docker

Start all services including MailHog:
```bash
docker-compose up -d
```

This will start:
- **BoostFlow App**: http://localhost:3000
- **MailHog Web UI**: http://localhost:8025
- **MinIO**: http://localhost:9001

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

## Testing Email Notifications

### 1. Access MailHog Web Interface

Open http://localhost:8025 in your browser to view the MailHog interface where all emails will be captured.

### 2. Test Team Invitations

1. Log into BoostFlow at http://localhost:3000
2. Navigate to an organization
3. Go to Settings → Members
4. Invite a new team member
5. Check MailHog at http://localhost:8025 to see the invitation email

### 3. Test Project Creation Notifications

1. Create a new project in any organization
2. All organization members will receive email notifications
3. Check MailHog to see the project creation emails

### 4. Test Task Notifications

1. Create a new task in any project
2. Assign it to a team member
3. Both the assignee and other project members will receive notifications
4. Check MailHog for the task-related emails

## Production Setup with SendGrid

### 1. SendGrid Account Setup

1. Sign up for a free SendGrid account at https://sendgrid.com
2. Verify your sender identity (email or domain)
3. Create an API key with "Mail Send" permissions

### 2. Environment Configuration

Update your production `.env` file:
```env
NODE_ENV=production
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=BoostFlow
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Deploy and Test

Deploy your application and test the email functionality in production.

## Email Templates

The system includes responsive HTML email templates for:

- **Team Invitations**: Welcome new members with organization details
- **Project Notifications**: Inform about new projects with direct links
- **Task Notifications**: Alert about task assignments and updates

## Troubleshooting

### MailHog Not Receiving Emails

1. Ensure MailHog is running: `docker-compose ps`
2. Check that SMTP_HOST=localhost and SMTP_PORT=1025
3. Verify NODE_ENV=development

### SendGrid Emails Not Sending

1. Verify your SendGrid API key is correct
2. Check that your sender email is verified in SendGrid
3. Review SendGrid activity logs for delivery issues
4. Ensure NODE_ENV=production

### General Issues

1. Check application logs for error messages
2. Verify all environment variables are set correctly
3. Ensure Firebase configuration is complete
4. Check network connectivity for external services

## Email Service Architecture

The email system uses a provider pattern:

- **Development**: `MailHogProvider` sends emails to local MailHog instance
- **Production**: `SendGridProvider` sends emails via SendGrid API
- **Fallback**: Graceful error handling ensures app functionality isn't blocked

## Notification Preferences

Users can manage their email notification preferences in their account settings. The system respects these preferences when sending notifications.

## Cost Considerations

- **MailHog**: Free for development testing
- **SendGrid Free Tier**: 100 emails/day forever
- **SendGrid Paid Plans**: Start at $14.95/month for higher volumes

## Security Best Practices

- API keys are stored as environment variables
- Email content is sanitized
- Rate limiting prevents spam
- Unsubscribe links included in all emails