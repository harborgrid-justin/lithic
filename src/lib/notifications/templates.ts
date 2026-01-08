/**
 * Template Engine
 * Lithic Healthcare Platform v0.5
 *
 * Manages notification templates and variable substitution
 * for consistent messaging across channels.
 */

import {
  NotificationTemplate,
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
} from '@/types/notifications';

export class TemplateEngine {
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Render a template with variables
   */
  async render(
    templateId: string,
    variables: Record<string, any>
  ): Promise<{
    title: string;
    message: string;
    subtitle?: string;
  }> {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Validate required variables
    this.validateVariables(template, variables);

    // Get in-app template (default)
    const inAppTemplate = template.templates[NotificationChannel.IN_APP];

    if (!inAppTemplate) {
      throw new Error(`Template ${templateId} does not have in-app configuration`);
    }

    return {
      title: this.substituteVariables(inAppTemplate.title || '', variables),
      message: this.substituteVariables(inAppTemplate.message, variables),
      subtitle: inAppTemplate.subject
        ? this.substituteVariables(inAppTemplate.subject, variables)
        : undefined,
    };
  }

  /**
   * Render template for specific channel
   */
  async renderForChannel(
    templateId: string,
    channel: NotificationChannel,
    variables: Record<string, any>
  ): Promise<{
    subject?: string;
    title?: string;
    message: string;
    htmlBody?: string;
  }> {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    this.validateVariables(template, variables);

    const channelTemplate = template.templates[channel];

    if (!channelTemplate) {
      throw new Error(`Template ${templateId} does not have ${channel} configuration`);
    }

    return {
      subject: channelTemplate.subject
        ? this.substituteVariables(channelTemplate.subject, variables)
        : undefined,
      title: channelTemplate.title
        ? this.substituteVariables(channelTemplate.title, variables)
        : undefined,
      message: this.substituteVariables(channelTemplate.message, variables),
      htmlBody: channelTemplate.htmlBody
        ? this.substituteVariables(channelTemplate.htmlBody, variables)
        : undefined,
    };
  }

  /**
   * Register a new template
   */
  registerTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: NotificationCategory): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.category === category);
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  /**
   * Substitute variables in text
   */
  private substituteVariables(text: string, variables: Record<string, any>): string {
    let result = text;

    // Replace {{variable}} patterns
    const matches = text.match(/\{\{([^}]+)\}\}/g);

    if (matches) {
      matches.forEach((match) => {
        const varName = match.slice(2, -2).trim();
        const value = this.getNestedValue(variables, varName);

        if (value !== undefined && value !== null) {
          result = result.replace(match, String(value));
        }
      });
    }

    return result;
  }

  /**
   * Get nested object value by dot notation
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    let value: any = obj;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Validate required variables
   */
  private validateVariables(
    template: NotificationTemplate,
    variables: Record<string, any>
  ): void {
    const missing: string[] = [];

    for (const required of template.requiredVariables) {
      const value = this.getNestedValue(variables, required);
      if (value === undefined || value === null) {
        missing.push(required);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    // Appointment Reminder Template
    this.registerTemplate({
      id: 'appointment-reminder',
      tenantId: 'default',
      name: 'Appointment Reminder',
      description: 'Reminds patient about upcoming appointment',
      category: NotificationCategory.APPOINTMENT,
      defaultPriority: NotificationPriority.MEDIUM,
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      requiredVariables: ['patientName', 'appointmentDate', 'providerName', 'location'],
      templates: {
        [NotificationChannel.IN_APP]: {
          title: 'Appointment Reminder',
          message:
            'Hi {{patientName}}, you have an appointment with {{providerName}} on {{appointmentDate}} at {{location}}.',
        },
        [NotificationChannel.EMAIL]: {
          subject: 'Appointment Reminder - {{appointmentDate}}',
          message:
            'Hi {{patientName}}, you have an appointment with {{providerName}} on {{appointmentDate}} at {{location}}.',
          htmlBody: `
            <h2>Appointment Reminder</h2>
            <p>Hi {{patientName}},</p>
            <p>This is a reminder about your upcoming appointment:</p>
            <ul>
              <li><strong>Provider:</strong> {{providerName}}</li>
              <li><strong>Date & Time:</strong> {{appointmentDate}}</li>
              <li><strong>Location:</strong> {{location}}</li>
            </ul>
          `,
        },
        [NotificationChannel.SMS]: {
          message:
            'Appointment reminder: {{appointmentDate}} with {{providerName}} at {{location}}. Reply CONFIRM to confirm.',
        },
      },
      active: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Lab Result Available Template
    this.registerTemplate({
      id: 'lab-result-available',
      tenantId: 'default',
      name: 'Lab Result Available',
      description: 'Notifies patient that lab results are ready',
      category: NotificationCategory.LAB_RESULT,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      requiredVariables: ['patientName', 'testName', 'resultDate'],
      templates: {
        [NotificationChannel.IN_APP]: {
          title: 'Lab Results Available',
          message:
            'Hi {{patientName}}, your {{testName}} results from {{resultDate}} are now available to view.',
        },
        [NotificationChannel.EMAIL]: {
          subject: 'Your Lab Results Are Ready',
          message:
            'Hi {{patientName}}, your {{testName}} results from {{resultDate}} are now available to view in your patient portal.',
          htmlBody: `
            <h2>Lab Results Available</h2>
            <p>Hi {{patientName}},</p>
            <p>Your lab results are now available:</p>
            <ul>
              <li><strong>Test:</strong> {{testName}}</li>
              <li><strong>Date:</strong> {{resultDate}}</li>
            </ul>
            <p>Please log in to your patient portal to view your results.</p>
          `,
        },
      },
      active: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Medication Reminder Template
    this.registerTemplate({
      id: 'medication-reminder',
      tenantId: 'default',
      name: 'Medication Reminder',
      description: 'Reminds patient to take medication',
      category: NotificationCategory.MEDICATION,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      requiredVariables: ['patientName', 'medicationName', 'dosage', 'time'],
      templates: {
        [NotificationChannel.IN_APP]: {
          title: 'Time to Take Your Medication',
          message: 'Hi {{patientName}}, it\'s time to take {{medicationName}} ({{dosage}}).',
        },
        [NotificationChannel.PUSH]: {
          title: 'Medication Reminder',
          message: 'Time to take {{medicationName}} ({{dosage}})',
        },
        [NotificationChannel.SMS]: {
          message: 'Medication reminder: Take {{medicationName}} ({{dosage}}) at {{time}}.',
        },
      },
      active: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Clinical Alert Template
    this.registerTemplate({
      id: 'clinical-alert',
      tenantId: 'default',
      name: 'Clinical Alert',
      description: 'Critical clinical alert for providers',
      category: NotificationCategory.CLINICAL_ALERT,
      defaultPriority: NotificationPriority.CRITICAL,
      defaultChannels: [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
        NotificationChannel.SMS,
      ],
      requiredVariables: ['providerName', 'patientName', 'alertType', 'details'],
      templates: {
        [NotificationChannel.IN_APP]: {
          title: 'CRITICAL: {{alertType}}',
          message: 'Dr. {{providerName}}, critical alert for {{patientName}}: {{details}}',
        },
        [NotificationChannel.PUSH]: {
          title: 'CRITICAL ALERT',
          message: '{{alertType}} - {{patientName}}: {{details}}',
        },
        [NotificationChannel.SMS]: {
          message: 'CRITICAL: {{alertType}} for {{patientName}}. {{details}}. Check system immediately.',
        },
        [NotificationChannel.EMAIL]: {
          subject: 'CRITICAL ALERT: {{alertType}}',
          message: 'Dr. {{providerName}}, critical alert for {{patientName}}: {{details}}',
          htmlBody: `
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 20px;">
              <h2 style="color: #dc2626; margin-top: 0;">CRITICAL ALERT</h2>
              <p><strong>Type:</strong> {{alertType}}</p>
              <p><strong>Patient:</strong> {{patientName}}</p>
              <p><strong>Details:</strong> {{details}}</p>
              <p style="margin-bottom: 0;">Please review immediately.</p>
            </div>
          `,
        },
      },
      active: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Message Received Template
    this.registerTemplate({
      id: 'message-received',
      tenantId: 'default',
      name: 'Message Received',
      description: 'Notifies user about new message',
      category: NotificationCategory.MESSAGE,
      defaultPriority: NotificationPriority.MEDIUM,
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      requiredVariables: ['recipientName', 'senderName', 'messagePreview'],
      templates: {
        [NotificationChannel.IN_APP]: {
          title: 'New Message from {{senderName}}',
          message: '{{messagePreview}}',
        },
        [NotificationChannel.PUSH]: {
          title: 'New Message',
          message: '{{senderName}}: {{messagePreview}}',
        },
      },
      active: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Billing Statement Template
    this.registerTemplate({
      id: 'billing-statement',
      tenantId: 'default',
      name: 'Billing Statement',
      description: 'Notifies patient about billing statement',
      category: NotificationCategory.BILLING,
      defaultPriority: NotificationPriority.MEDIUM,
      defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      requiredVariables: ['patientName', 'amount', 'dueDate', 'statementId'],
      templates: {
        [NotificationChannel.EMAIL]: {
          subject: 'Your Statement is Ready - Due {{dueDate}}',
          message:
            'Hi {{patientName}}, your billing statement #{{statementId}} for ${{amount}} is now available. Payment is due by {{dueDate}}.',
          htmlBody: `
            <h2>Billing Statement Available</h2>
            <p>Hi {{patientName}},</p>
            <p>Your billing statement is now available:</p>
            <ul>
              <li><strong>Statement ID:</strong> {{statementId}}</li>
              <li><strong>Amount Due:</strong> ${{amount}}</li>
              <li><strong>Due Date:</strong> {{dueDate}}</li>
            </ul>
            <p>Please log in to view your statement and make a payment.</p>
          `,
        },
        [NotificationChannel.IN_APP]: {
          title: 'Billing Statement Available',
          message: 'Your statement #{{statementId}} for ${{amount}} is ready. Due: {{dueDate}}',
        },
      },
      active: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Create custom template
   */
  createCustomTemplate(
    tenantId: string,
    name: string,
    category: NotificationCategory,
    templates: NotificationTemplate['templates'],
    requiredVariables: string[]
  ): NotificationTemplate {
    const template: NotificationTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      name,
      category,
      templates,
      requiredVariables,
      defaultPriority: NotificationPriority.MEDIUM,
      defaultChannels: [NotificationChannel.IN_APP],
      active: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.registerTemplate(template);
    return template;
  }
}
