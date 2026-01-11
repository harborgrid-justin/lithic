/**
 * SMS Notification Channel
 * Lithic Healthcare Platform v0.5
 *
 * Handles SMS notification delivery via Twilio
 */

import { Notification, NotificationStatus } from '@/types/notifications';
import twilio from 'twilio';

export class SMSNotificationChannel {
  private client: twilio.Twilio | null = null;
  private fromNumber: string;

  constructor() {
    // Initialize Twilio client if credentials are available
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    } else {
      console.warn('Twilio credentials not configured. SMS notifications will not be sent.');
      this.fromNumber = '';
    }
  }

  /**
   * Send SMS notification
   */
  async send(notification: Notification): Promise<void> {
    if (!this.client) {
      throw new Error('SMS channel not configured');
    }

    try {
      // Get user's phone number
      const phoneNumber = await this.getUserPhoneNumber(notification.recipientId);

      if (!phoneNumber) {
        throw new Error('No phone number found for user');
      }

      // Prepare SMS content
      const message = this.prepareSMSMessage(notification);

      // Send SMS
      const result = await this.client.messages.create({
        to: phoneNumber,
        from: this.fromNumber,
        body: message,
        // For HIPAA compliance, consider using Twilio's secure messaging
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
      });

      // Update delivery status
      notification.deliveryStatus.sms = {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      };

      // Track message SID for status updates
      if (notification.metadata) {
        notification.metadata.smsSid = result.sid;
      }
    } catch (error) {
      notification.deliveryStatus.sms = {
        status: NotificationStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      throw error;
    }
  }

  /**
   * Prepare SMS message content
   */
  private prepareSMSMessage(notification: Notification): string {
    // Format message for SMS (limit to 160 characters for single SMS)
    let message = `${notification.title}\n${notification.message}`;

    // Add action link if available
    if (notification.actions && notification.actions.length > 0) {
      const primaryAction = notification.actions[0];
      if (primaryAction.url) {
        message += `\n${primaryAction.url}`;
      }
    }

    // Truncate if too long (SMS limit is typically 1600 chars for concatenated)
    if (message.length > 1600) {
      message = message.substring(0, 1597) + '...';
    }

    // Add opt-out message for compliance
    if (notification.priority !== 'critical') {
      message += '\nReply STOP to opt out';
    }

    return message;
  }

  /**
   * Get user's phone number from database
   */
  private async getUserPhoneNumber(userId: string): Promise<string | null> {
    // This would typically fetch from database
    // In production:
    // const user = await prisma.user.findUnique({
    //   where: { id: userId },
    //   select: { phone: true, phoneVerified: true },
    // });
    // return user?.phoneVerified ? user.phone : null;
    return null;
  }

  /**
   * Handle SMS delivery status webhook
   */
  async handleStatusCallback(messageSid: string, status: string): Promise<void> {
    // Update notification delivery status based on Twilio callback
    // In production, this would update the database
    switch (status) {
      case 'delivered':
        // Update notification status to delivered
        break;
      case 'failed':
      case 'undelivered':
        // Update notification status to failed
        break;
      case 'sent':
        // Update notification status to sent
        break;
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164
   */
  formatPhoneNumber(phoneNumber: string, countryCode: string = 'US'): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // Add country code if missing
    if (countryCode === 'US' && digits.length === 10) {
      return `+1${digits}`;
    }

    return `+${digits}`;
  }

  /**
   * Check if phone number is opted out
   */
  async isOptedOut(phoneNumber: string): Promise<boolean> {
    // This would check against a database of opted-out numbers
    // In production:
    // const optOut = await prisma.smsOptOut.findUnique({
    //   where: { phoneNumber },
    // });
    // return !!optOut;
    return false;
  }

  /**
   * Opt out a phone number
   */
  async optOut(phoneNumber: string): Promise<void> {
    // This would save opt-out to database
    // In production:
    // await prisma.smsOptOut.create({
    //   data: { phoneNumber, optedOutAt: new Date() },
    // });
  }

  /**
   * Opt in a phone number
   */
  async optIn(phoneNumber: string): Promise<void> {
    // This would remove opt-out from database
    // In production:
    // await prisma.smsOptOut.delete({
    //   where: { phoneNumber },
    // });
  }

  /**
   * Get SMS sending statistics
   */
  async getStats(startDate: Date, endDate: Date): Promise<any> {
    if (!this.client) {
      return null;
    }

    try {
      const messages = await this.client.messages.list({
        dateSentAfter: startDate,
        dateSentBefore: endDate,
      });

      const stats = {
        total: messages.length,
        sent: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
      };

      messages.forEach((msg) => {
        switch (msg.status) {
          case 'delivered':
            stats.delivered++;
            break;
          case 'failed':
          case 'undelivered':
            stats.failed++;
            break;
          case 'sent':
            stats.sent++;
            break;
          case 'queued':
          case 'sending':
            stats.pending++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get SMS stats:', error);
      return null;
    }
  }
}
