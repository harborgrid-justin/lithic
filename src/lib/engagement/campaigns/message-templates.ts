/**
 * Message Templates - Multi-channel templates with personalization
 * Email, SMS, push notification, and in-app message templates
 */

import { CampaignType, CampaignChannel } from './campaign-engine';

export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  channels: TemplateChannel[];
  variables: TemplateVariable[];
  category: string;
}

export interface TemplateChannel {
  channel: CampaignChannel;
  subject?: string;
  preheader?: string;
  body: string;
  cta?: CallToAction;
}

export interface TemplateVariable {
  key: string;
  name: string;
  description: string;
  defaultValue?: string;
  required: boolean;
}

export interface CallToAction {
  text: string;
  url: string;
  trackingId?: string;
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // ============ APPOINTMENT REMINDERS ============
  {
    id: 'appointment_reminder_24h',
    name: 'Appointment Reminder - 24 Hours',
    description: 'Reminder sent 24 hours before appointment',
    type: CampaignType.APPOINTMENT_REMINDER,
    category: 'Appointments',
    variables: [
      {
        key: 'patient_name',
        name: 'Patient Name',
        description: 'First name of patient',
        defaultValue: 'Patient',
        required: true,
      },
      {
        key: 'provider_name',
        name: 'Provider Name',
        description: 'Name of healthcare provider',
        required: true,
      },
      {
        key: 'appointment_date',
        name: 'Appointment Date',
        description: 'Date and time of appointment',
        required: true,
      },
      {
        key: 'appointment_location',
        name: 'Location',
        description: 'Appointment location or telehealth link',
        required: true,
      },
      {
        key: 'cancel_link',
        name: 'Cancellation Link',
        description: 'Link to cancel or reschedule',
        required: false,
      },
    ],
    channels: [
      {
        channel: CampaignChannel.EMAIL,
        subject: 'Appointment Reminder: {{appointment_date}} with {{provider_name}}',
        preheader: 'Your appointment is tomorrow',
        body: `
          <h2>Hello {{patient_name}},</h2>

          <p>This is a friendly reminder about your upcoming appointment:</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong>Provider:</strong> {{provider_name}}<br>
            <strong>Date & Time:</strong> {{appointment_date}}<br>
            <strong>Location:</strong> {{appointment_location}}
          </div>

          <p><strong>Before Your Appointment:</strong></p>
          <ul>
            <li>Complete any pre-visit forms in your patient portal</li>
            <li>Gather your current medications list</li>
            <li>Prepare questions for your provider</li>
            <li>Arrive 10 minutes early</li>
          </ul>

          <p>Need to reschedule? <a href="{{cancel_link}}">Click here</a></p>
        `,
        cta: {
          text: 'View Appointment Details',
          url: '/patient-portal/appointments',
        },
      },
      {
        channel: CampaignChannel.SMS,
        body: 'Hi {{patient_name}}! Reminder: Appointment tomorrow at {{appointment_date}} with {{provider_name}}. Location: {{appointment_location}}. Reply CANCEL to reschedule.',
      },
      {
        channel: CampaignChannel.PUSH_NOTIFICATION,
        subject: 'Appointment Tomorrow',
        body: 'Your appointment with {{provider_name}} is at {{appointment_date}}',
      },
    ],
  },

  // ============ MEDICATION ADHERENCE ============
  {
    id: 'medication_refill_reminder',
    name: 'Medication Refill Reminder',
    description: 'Reminder to refill prescription',
    type: CampaignType.MEDICATION_ADHERENCE,
    category: 'Medications',
    variables: [
      {
        key: 'patient_name',
        name: 'Patient Name',
        description: 'Patient first name',
        required: true,
      },
      {
        key: 'medication_name',
        name: 'Medication',
        description: 'Name of medication',
        required: true,
      },
      {
        key: 'days_remaining',
        name: 'Days Supply Remaining',
        description: 'Days until medication runs out',
        required: true,
      },
      {
        key: 'pharmacy_name',
        name: 'Pharmacy',
        description: 'Preferred pharmacy',
        required: false,
      },
    ],
    channels: [
      {
        channel: CampaignChannel.EMAIL,
        subject: 'Time to Refill: {{medication_name}}',
        body: `
          <h2>Hello {{patient_name}},</h2>

          <p>It's time to refill your prescription for <strong>{{medication_name}}</strong>.</p>

          <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <strong>⚠️ You have {{days_remaining}} days of medication remaining</strong>
          </div>

          <p><strong>How to Refill:</strong></p>
          <ol>
            <li>Log into your patient portal</li>
            <li>Go to Medications section</li>
            <li>Click "Request Refill"</li>
            <li>Select {{pharmacy_name}}</li>
          </ol>

          <p>Questions? Contact your pharmacy or provider through the portal.</p>
        `,
        cta: {
          text: 'Request Refill Now',
          url: '/patient-portal/medications',
        },
      },
      {
        channel: CampaignChannel.SMS,
        body: 'Hi {{patient_name}}, you have {{days_remaining}} days of {{medication_name}} left. Time to refill! Visit your patient portal or call your pharmacy.',
      },
    ],
  },

  // ============ PREVENTIVE CARE ============
  {
    id: 'annual_checkup_due',
    name: 'Annual Checkup Due',
    description: 'Reminder for annual wellness visit',
    type: CampaignType.PREVENTIVE_CARE,
    category: 'Preventive Care',
    variables: [
      {
        key: 'patient_name',
        name: 'Patient Name',
        description: 'Patient first name',
        required: true,
      },
      {
        key: 'last_visit_date',
        name: 'Last Visit',
        description: 'Date of last annual checkup',
        required: false,
      },
    ],
    channels: [
      {
        channel: CampaignChannel.EMAIL,
        subject: 'It\'s Time for Your Annual Wellness Visit',
        body: `
          <h2>Hello {{patient_name}},</h2>

          <p>It's been a year since your last wellness visit. Annual checkups are important for:</p>

          <ul>
            <li>✓ Early detection of health issues</li>
            <li>✓ Updating preventive screenings</li>
            <li>✓ Reviewing medications</li>
            <li>✓ Discussing health goals</li>
          </ul>

          <p><strong>Most insurance plans cover annual wellness visits at 100%!</strong></p>

          <p>Schedule your appointment today to stay on top of your health.</p>
        `,
        cta: {
          text: 'Schedule Appointment',
          url: '/patient-portal/appointments/schedule',
        },
      },
      {
        channel: CampaignChannel.IN_APP,
        subject: 'Annual Checkup Due',
        body: 'Time for your yearly wellness visit! Schedule now to maintain your health.',
      },
    ],
  },

  {
    id: 'screening_recommendation',
    name: 'Health Screening Recommendation',
    description: 'Personalized screening recommendation',
    type: CampaignType.PREVENTIVE_CARE,
    category: 'Preventive Care',
    variables: [
      {
        key: 'patient_name',
        name: 'Patient Name',
        description: 'Patient first name',
        required: true,
      },
      {
        key: 'screening_name',
        name: 'Screening Name',
        description: 'Type of screening recommended',
        required: true,
      },
      {
        key: 'age_guideline',
        name: 'Age Guideline',
        description: 'Age-based guideline information',
        required: true,
      },
    ],
    channels: [
      {
        channel: CampaignChannel.EMAIL,
        subject: 'Recommended Health Screening: {{screening_name}}',
        body: `
          <h2>Hello {{patient_name}},</h2>

          <p>Based on your age and health history, we recommend scheduling a <strong>{{screening_name}}</strong>.</p>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Why This Screening?</h3>
            <p>{{age_guideline}}</p>
          </div>

          <p><strong>Benefits of Early Detection:</strong></p>
          <ul>
            <li>Better treatment options</li>
            <li>Improved outcomes</li>
            <li>Peace of mind</li>
          </ul>

          <p>Talk to your provider about scheduling this important screening.</p>
        `,
        cta: {
          text: 'Schedule Screening',
          url: '/patient-portal/appointments/schedule',
        },
      },
    ],
  },

  // ============ EDUCATIONAL ============
  {
    id: 'health_tip_weekly',
    name: 'Weekly Health Tip',
    description: 'Weekly educational health content',
    type: CampaignType.EDUCATIONAL,
    category: 'Education',
    variables: [
      {
        key: 'patient_name',
        name: 'Patient Name',
        description: 'Patient first name',
        required: true,
      },
      {
        key: 'tip_title',
        name: 'Tip Title',
        description: 'Title of health tip',
        required: true,
      },
      {
        key: 'tip_content',
        name: 'Tip Content',
        description: 'Main content of health tip',
        required: true,
      },
      {
        key: 'tip_category',
        name: 'Category',
        description: 'Health category',
        required: true,
      },
    ],
    channels: [
      {
        channel: CampaignChannel.EMAIL,
        subject: 'Your Weekly Health Tip: {{tip_title}}',
        body: `
          <h2>Hello {{patient_name}},</h2>

          <p>Here's this week's health tip in the <strong>{{tip_category}}</strong> category:</p>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>{{tip_title}}</h3>
            <p>{{tip_content}}</p>
          </div>

          <p><strong>Put it into practice:</strong> Set a goal in your patient portal to track your progress!</p>
        `,
        cta: {
          text: 'Explore More Health Tips',
          url: '/patient-portal/education',
        },
      },
    ],
  },

  // ============ GOAL ENCOURAGEMENT ============
  {
    id: 'goal_milestone_achieved',
    name: 'Goal Milestone Achieved',
    description: 'Congratulations on reaching milestone',
    type: CampaignType.GOAL_ENCOURAGEMENT,
    category: 'Goals',
    variables: [
      {
        key: 'patient_name',
        name: 'Patient Name',
        description: 'Patient first name',
        required: true,
      },
      {
        key: 'goal_name',
        name: 'Goal Name',
        description: 'Name of health goal',
        required: true,
      },
      {
        key: 'milestone_percentage',
        name: 'Milestone %',
        description: 'Percentage completed',
        required: true,
      },
      {
        key: 'points_earned',
        name: 'Points Earned',
        description: 'Points awarded for milestone',
        required: true,
      },
    ],
    channels: [
      {
        channel: CampaignChannel.EMAIL,
        subject: '🎉 Congratulations! You Reached {{milestone_percentage}}% of Your Goal',
        body: `
          <h2>Amazing Work, {{patient_name}}! 🎉</h2>

          <p>You've reached <strong>{{milestone_percentage}}%</strong> of your goal: <strong>{{goal_name}}</strong></p>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h2 style="color: white; margin: 0;">+{{points_earned}} Points!</h2>
            <p style="margin: 10px 0 0 0;">Added to your account</p>
          </div>

          <p><strong>Keep up the momentum!</strong> You're making real progress toward better health.</p>

          <p>Your dedication is inspiring. Keep going!</p>
        `,
        cta: {
          text: 'View Your Progress',
          url: '/patient-portal/engagement/goals',
        },
      },
      {
        channel: CampaignChannel.PUSH_NOTIFICATION,
        subject: '🎉 Milestone Reached!',
        body: 'Congrats! You\'re {{milestone_percentage}}% of the way to "{{goal_name}}" (+{{points_earned}} points)',
      },
    ],
  },

  {
    id: 'goal_encouragement',
    name: 'Goal Progress Encouragement',
    description: 'Motivation to continue working on goal',
    type: CampaignType.GOAL_ENCOURAGEMENT,
    category: 'Goals',
    variables: [
      {
        key: 'patient_name',
        name: 'Patient Name',
        description: 'Patient first name',
        required: true,
      },
      {
        key: 'goal_name',
        name: 'Goal Name',
        description: 'Name of health goal',
        required: true,
      },
      {
        key: 'days_active',
        name: 'Days Active',
        description: 'Days working on goal',
        required: true,
      },
      {
        key: 'current_progress',
        name: 'Current Progress %',
        description: 'Current progress percentage',
        required: true,
      },
    ],
    channels: [
      {
        channel: CampaignChannel.EMAIL,
        subject: 'Keep Going! You\'re Making Progress on {{goal_name}}',
        body: `
          <h2>Hey {{patient_name}}, 👋</h2>

          <p>You've been working on "<strong>{{goal_name}}</strong>" for {{days_active}} days. That's dedication!</p>

          <p>You're currently at <strong>{{current_progress}}% complete</strong>. Every step counts!</p>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>💡 Tips to Stay Motivated:</h3>
            <ul>
              <li>Celebrate small wins</li>
              <li>Track your progress daily</li>
              <li>Share your journey with supportive friends</li>
              <li>Remember your "why"</li>
            </ul>
          </div>

          <p>You've got this! We're here to support you every step of the way.</p>
        `,
        cta: {
          text: 'Update Your Progress',
          url: '/patient-portal/engagement/goals',
        },
      },
    ],
  },

  // ============ CHALLENGE INVITATIONS ============
  {
    id: 'challenge_invitation',
    name: 'Challenge Invitation',
    description: 'Invite to join health challenge',
    type: CampaignType.CHALLENGE_INVITATION,
    category: 'Challenges',
    variables: [
      {
        key: 'patient_name',
        name: 'Patient Name',
        description: 'Patient first name',
        required: true,
      },
      {
        key: 'challenge_name',
        name: 'Challenge Name',
        description: 'Name of challenge',
        required: true,
      },
      {
        key: 'challenge_duration',
        name: 'Duration',
        description: 'Challenge duration',
        required: true,
      },
      {
        key: 'points_reward',
        name: 'Points Reward',
        description: 'Points for completion',
        required: true,
      },
      {
        key: 'start_date',
        name: 'Start Date',
        description: 'When challenge begins',
        required: true,
      },
    ],
    channels: [
      {
        channel: CampaignChannel.EMAIL,
        subject: 'You\'re Invited: {{challenge_name}} Challenge!',
        body: `
          <h2>Hey {{patient_name}},</h2>

          <p>Ready for a new challenge? Join the <strong>{{challenge_name}}</strong>!</p>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: white; margin: 0 0 10px 0;">{{challenge_name}}</h3>
            <p style="margin: 0;"><strong>Duration:</strong> {{challenge_duration}}</p>
            <p style="margin: 5px 0 0 0;"><strong>Starts:</strong> {{start_date}}</p>
            <h2 style="color: #ffd700; margin: 15px 0 0 0;">{{points_reward}} Points!</h2>
          </div>

          <p><strong>Why Join?</strong></p>
          <ul>
            <li>Build healthy habits</li>
            <li>Connect with others</li>
            <li>Earn points and badges</li>
            <li>Have fun!</li>
          </ul>

          <p>Spots are limited. Join now!</p>
        `,
        cta: {
          text: 'Join Challenge',
          url: '/patient-portal/engagement/challenges',
        },
      },
      {
        channel: CampaignChannel.PUSH_NOTIFICATION,
        subject: 'New Challenge Available!',
        body: 'Join {{challenge_name}} and earn {{points_reward}} points! Starts {{start_date}}',
      },
    ],
  },

  // ============ WELLNESS CHECK ============
  {
    id: 'wellness_check_in',
    name: 'Weekly Wellness Check-in',
    description: 'Weekly check-in to log health data',
    type: CampaignType.WELLNESS_CHECK,
    category: 'Wellness',
    variables: [
      {
        key: 'patient_name',
        name: 'Patient Name',
        description: 'Patient first name',
        required: true,
      },
      {
        key: 'last_check_in',
        name: 'Last Check-in',
        description: 'Date of last check-in',
        required: false,
      },
    ],
    channels: [
      {
        channel: CampaignChannel.EMAIL,
        subject: 'Weekly Wellness Check-in',
        body: `
          <h2>Hi {{patient_name}},</h2>

          <p>It's time for your weekly wellness check-in! Take 2 minutes to log:</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <ul style="margin: 0;">
              <li>Weight and vital signs</li>
              <li>Mood and energy level</li>
              <li>Any symptoms or concerns</li>
              <li>Medication adherence</li>
            </ul>
          </div>

          <p><strong>Earn 50 points</strong> for completing your check-in!</p>

          <p>Regular tracking helps you and your care team spot trends early.</p>
        `,
        cta: {
          text: 'Complete Check-in',
          url: '/patient-portal/health-tracking',
        },
      },
      {
        channel: CampaignChannel.SMS,
        body: 'Hi {{patient_name}}! Time for your weekly wellness check-in. Log your vitals & mood to earn 50 points: [link]',
      },
    ],
  },
];

/**
 * Get template by ID
 */
export function getMessageTemplate(id: string): MessageTemplate | undefined {
  return MESSAGE_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by type
 */
export function getMessageTemplatesByType(
  type: CampaignType
): MessageTemplate[] {
  return MESSAGE_TEMPLATES.filter((t) => t.type === type);
}

/**
 * Get templates by channel
 */
export function getMessageTemplatesByChannel(
  channel: CampaignChannel
): MessageTemplate[] {
  return MESSAGE_TEMPLATES.filter((t) =>
    t.channels.some((c) => c.channel === channel)
  );
}

/**
 * Personalize message template
 */
export function personalizeMessage(
  template: string,
  variables: Record<string, string>
): string {
  let personalized = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    personalized = personalized.replace(regex, value);
  });

  return personalized;
}
