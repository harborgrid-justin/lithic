/**
 * Email Notification Channel
 * Lithic Healthcare Platform v0.5
 *
 * Handles email notification delivery via nodemailer
 */

import { Notification, NotificationStatus } from '@/types/notifications';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export class EmailNotificationChannel {
  private transporter: Transporter | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'notifications@lithic.health';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Lithic Healthcare';

    // Initialize email transporter
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on configuration
   */
  private initializeTransporter(): void {
    if (process.env.EMAIL_PROVIDER === 'smtp' && process.env.SMTP_HOST) {
      // SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else if (process.env.EMAIL_PROVIDER === 'ses') {
      // AWS SES configuration would go here
      console.log('AWS SES email provider configured');
    } else {
      console.warn('Email provider not configured. Email notifications will not be sent.');
    }
  }

  /**
   * Send email notification
   */
  async send(notification: Notification): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email channel not configured');
    }

    try {
      // Get user's email address
      const emailAddress = await this.getUserEmail(notification.recipientId);

      if (!emailAddress) {
        throw new Error('No email address found for user');
      }

      // Prepare email content
      const { subject, html, text } = this.prepareEmailContent(notification);

      // Send email
      const result = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: emailAddress,
        subject,
        text,
        html,
        headers: {
          'X-Notification-ID': notification.id,
          'X-Category': notification.category,
          'X-Priority': notification.priority,
        },
      });

      // Update delivery status
      notification.deliveryStatus.email = {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      };

      // Track message ID for delivery tracking
      if (notification.metadata) {
        notification.metadata.emailMessageId = result.messageId;
      }
    } catch (error) {
      notification.deliveryStatus.email = {
        status: NotificationStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      throw error;
    }
  }

  /**
   * Prepare email content (HTML and plain text)
   */
  private prepareEmailContent(notification: Notification): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = notification.title;

    // Plain text version
    const text = `
${notification.title}

${notification.message}

${notification.actions?.map((action) => `${action.label}: ${action.url}`).join('\n') || ''}

---
This is an automated notification from Lithic Healthcare Platform.
If you wish to unsubscribe, please update your notification preferences.
    `.trim();

    // HTML version
    const html = this.generateEmailHTML(notification);

    return { subject, html, text };
  }

  /**
   * Generate HTML email template
   */
  private generateEmailHTML(notification: Notification): string {
    const priorityColors: Record<string, string> = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#2563eb',
      low: '#64748b',
    };

    const priorityColor = priorityColors[notification.priority] || '#2563eb';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-wrapper {
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: ${priorityColor};
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .priority-badge {
      display: inline-block;
      background-color: ${priorityColor};
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 15px;
    }
    .message {
      font-size: 16px;
      color: #444;
      margin: 20px 0;
    }
    .actions {
      margin: 30px 0;
    }
    .action-button {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${priorityColor};
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 5px;
    }
    .action-button:hover {
      opacity: 0.9;
    }
    .metadata {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 14px;
    }
    .metadata strong {
      color: #666;
    }
    .footer {
      padding: 20px 30px;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: ${priorityColor};
      text-decoration: none;
    }
    ${notification.imageUrl ? `
    .notification-image {
      width: 100%;
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 20px 0;
    }
    ` : ''}
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <div class="header">
        <h1>${notification.title}</h1>
      </div>
      <div class="content">
        <div class="priority-badge">${notification.priority} Priority</div>

        ${notification.subtitle ? `<h2 style="color: #333; margin-top: 0;">${notification.subtitle}</h2>` : ''}

        <div class="message">${this.escapeHtml(notification.message)}</div>

        ${notification.imageUrl ? `<img src="${notification.imageUrl}" alt="Notification image" class="notification-image">` : ''}

        ${notification.actions && notification.actions.length > 0 ? `
          <div class="actions">
            ${notification.actions
              .map(
                (action) =>
                  `<a href="${action.url || '#'}" class="action-button">${this.escapeHtml(action.label)}</a>`
              )
              .join('')}
          </div>
        ` : ''}

        ${notification.metadata && Object.keys(notification.metadata).length > 0 ? `
          <div class="metadata">
            ${Object.entries(notification.metadata)
              .filter(([key]) => !key.startsWith('_'))
              .map(([key, value]) => `<p><strong>${this.formatMetadataKey(key)}:</strong> ${this.escapeHtml(String(value))}</p>`)
              .join('')}
          </div>
        ` : ''}

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This notification was sent on ${this.formatDate(notification.createdAt)}.
        </p>
      </div>
      <div class="footer">
        <p>
          © ${new Date().getFullYear()} Lithic Healthcare Platform. All rights reserved.
        </p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">Manage notification preferences</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get user's email address from database
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    // This would typically fetch from database
    // In production:
    // const user = await prisma.user.findUnique({
    //   where: { id: userId },
    //   select: { email: true, emailVerified: true },
    // });
    // return user?.emailVerified ? user.email : null;
    return null;
  }

  /**
   * Verify email transporter configuration
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email transporter verification failed:', error);
      return false;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(toEmail: string): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email channel not configured');
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: toEmail,
        subject: 'Test Email from Lithic Healthcare',
        text: 'This is a test email to verify your email configuration.',
        html: '<p>This is a test email to verify your email configuration.</p>',
      });
      return true;
    } catch (error) {
      console.error('Failed to send test email:', error);
      return false;
    }
  }

  /**
   * Utility methods
   */

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  private formatMetadataKey(key: string): string {
    return key
      .split(/(?=[A-Z])|_/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  }
}
