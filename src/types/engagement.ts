/**
 * Patient Engagement Platform Types
 * Agent 5: Patient Engagement Platform
 *
 * Comprehensive types for gamification, wellness programs, achievements,
 * challenges, rewards, education content, and family engagement.
 */

import type { BaseEntity } from "./index";

// ============================================================================
// Health Goals Types
// ============================================================================

export interface HealthGoal extends BaseEntity {
  patientId: string;
  type: GoalType;
  category: GoalCategory;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: Date;
  targetDate: Date;
  completedDate: Date | null;
  status: GoalStatus;
  priority: GoalPriority;
  visibility: GoalVisibility;
  milestones: GoalMilestone[];
  reminderFrequency: ReminderFrequency | null;
  lastReminderSent: Date | null;
  assignedBy: string | null; // Provider who assigned the goal
  tags: string[];
  notes: string | null;
  relatedConditions: string[]; // ICD codes
  relatedMedications: string[]; // Medication IDs
}

export enum GoalType {
  WEIGHT_LOSS = "WEIGHT_LOSS",
  WEIGHT_GAIN = "WEIGHT_GAIN",
  EXERCISE = "EXERCISE",
  BLOOD_PRESSURE = "BLOOD_PRESSURE",
  BLOOD_SUGAR = "BLOOD_SUGAR",
  CHOLESTEROL = "CHOLESTEROL",
  MEDICATION_ADHERENCE = "MEDICATION_ADHERENCE",
  SMOKING_CESSATION = "SMOKING_CESSATION",
  STRESS_REDUCTION = "STRESS_REDUCTION",
  SLEEP_QUALITY = "SLEEP_QUALITY",
  NUTRITION = "NUTRITION",
  HYDRATION = "HYDRATION",
  STEPS = "STEPS",
  CUSTOM = "CUSTOM",
}

export enum GoalCategory {
  CLINICAL = "CLINICAL",
  LIFESTYLE = "LIFESTYLE",
  PREVENTIVE = "PREVENTIVE",
  CHRONIC_DISEASE = "CHRONIC_DISEASE",
  RECOVERY = "RECOVERY",
  WELLNESS = "WELLNESS",
}

export enum GoalStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
  ON_HOLD = "ON_HOLD",
  OVERDUE = "OVERDUE",
}

export enum GoalPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum GoalVisibility {
  PRIVATE = "PRIVATE",
  SHARED_WITH_PROVIDER = "SHARED_WITH_PROVIDER",
  SHARED_WITH_FAMILY = "SHARED_WITH_FAMILY",
  PUBLIC = "PUBLIC",
}

export enum ReminderFrequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
  CUSTOM = "CUSTOM",
}

export interface GoalMilestone {
  id: string;
  value: number;
  description: string;
  achievedDate: Date | null;
  rewardPoints: number;
}

export interface GoalProgress {
  goalId: string;
  date: Date;
  value: number;
  note: string | null;
  recordedBy: string;
  source: ProgressSource;
  metadata: Record<string, any>;
}

export enum ProgressSource {
  MANUAL = "MANUAL",
  WEARABLE = "WEARABLE",
  EHR = "EHR",
  VITALS = "VITALS",
  LAB_RESULT = "LAB_RESULT",
  MEDICATION_LOG = "MEDICATION_LOG",
}

// ============================================================================
// Gamification Types
// ============================================================================

export interface PlayerProfile extends BaseEntity {
  patientId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  level: number;
  experiencePoints: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  joinDate: Date;
  rank: number;
  badges: BadgeEarned[];
  achievements: AchievementEarned[];
  titles: PlayerTitle[];
  currentTitle: string | null;
  stats: PlayerStats;
  preferences: GamificationPreferences;
}

export interface PlayerStats {
  goalsCompleted: number;
  goalsActive: number;
  challengesCompleted: number;
  challengesActive: number;
  pointsThisWeek: number;
  pointsThisMonth: number;
  pointsAllTime: number;
  activeDays: number;
  checkInsCompleted: number;
  contentCompleted: number;
  socialInteractions: number;
}

export interface GamificationPreferences {
  showLeaderboard: boolean;
  allowCompare: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  celebrateAchievements: boolean;
  publicProfile: boolean;
}

export interface PointTransaction extends BaseEntity {
  patientId: string;
  amount: number;
  type: PointTransactionType;
  reason: string;
  category: PointCategory;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  metadata: Record<string, any>;
  expiresAt: Date | null;
  status: PointTransactionStatus;
}

export enum PointTransactionType {
  EARNED = "EARNED",
  REDEEMED = "REDEEMED",
  EXPIRED = "EXPIRED",
  ADJUSTED = "ADJUSTED",
  BONUS = "BONUS",
}

export enum PointCategory {
  GOAL_PROGRESS = "GOAL_PROGRESS",
  GOAL_COMPLETION = "GOAL_COMPLETION",
  CHALLENGE_COMPLETION = "CHALLENGE_COMPLETION",
  STREAK_MILESTONE = "STREAK_MILESTONE",
  EDUCATION = "EDUCATION",
  CHECK_IN = "CHECK_IN",
  SURVEY = "SURVEY",
  APPOINTMENT_ADHERENCE = "APPOINTMENT_ADHERENCE",
  MEDICATION_ADHERENCE = "MEDICATION_ADHERENCE",
  SOCIAL_ENGAGEMENT = "SOCIAL_ENGAGEMENT",
  REFERRAL = "REFERRAL",
  OTHER = "OTHER",
}

export enum PointTransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// ============================================================================
// Achievements & Badges Types
// ============================================================================

export interface Achievement extends BaseEntity {
  code: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  iconColor: string;
  requirement: AchievementRequirement;
  rewardPoints: number;
  isSecret: boolean;
  isRepeatable: boolean;
  dependencies: string[]; // Achievement codes
  tags: string[];
  isActive: boolean;
}

export enum AchievementCategory {
  GOALS = "GOALS",
  STREAKS = "STREAKS",
  CHALLENGES = "CHALLENGES",
  EDUCATION = "EDUCATION",
  SOCIAL = "SOCIAL",
  WELLNESS = "WELLNESS",
  CLINICAL = "CLINICAL",
  ENGAGEMENT = "ENGAGEMENT",
  SPECIAL = "SPECIAL",
}

export enum AchievementTier {
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  GOLD = "GOLD",
  PLATINUM = "PLATINUM",
  DIAMOND = "DIAMOND",
}

export interface AchievementRequirement {
  type: RequirementType;
  threshold: number;
  metric: string;
  timeframe: Timeframe | null;
  conditions: Record<string, any>;
}

export enum RequirementType {
  COUNT = "COUNT",
  STREAK = "STREAK",
  PERCENTAGE = "PERCENTAGE",
  THRESHOLD = "THRESHOLD",
  COMPOSITE = "COMPOSITE",
}

export enum Timeframe {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  QUARTER = "QUARTER",
  YEAR = "YEAR",
  ALL_TIME = "ALL_TIME",
}

export interface AchievementEarned extends BaseEntity {
  patientId: string;
  achievementId: string;
  achievement: Achievement;
  earnedDate: Date;
  progress: number;
  isCompleted: boolean;
  notificationSent: boolean;
  displayedToUser: boolean;
}

export interface Badge extends BaseEntity {
  code: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  iconColor: string;
  backgroundColor: string;
  requirement: string;
  isActive: boolean;
  rarity: BadgeRarity;
  seasonalEvent: string | null;
}

export enum BadgeCategory {
  MILESTONE = "MILESTONE",
  ACHIEVEMENT = "ACHIEVEMENT",
  EVENT = "EVENT",
  SEASONAL = "SEASONAL",
  SPECIAL = "SPECIAL",
}

export enum BadgeRarity {
  COMMON = "COMMON",
  UNCOMMON = "UNCOMMON",
  RARE = "RARE",
  EPIC = "EPIC",
  LEGENDARY = "LEGENDARY",
}

export interface BadgeEarned extends BaseEntity {
  patientId: string;
  badgeId: string;
  badge: Badge;
  earnedDate: Date;
  displayOrder: number;
}

export interface PlayerTitle extends BaseEntity {
  patientId: string;
  title: string;
  description: string;
  earnedDate: Date;
  icon: string | null;
  color: string | null;
}

// ============================================================================
// Streak Types
// ============================================================================

export interface Streak extends BaseEntity {
  patientId: string;
  type: StreakType;
  currentCount: number;
  longestCount: number;
  startDate: Date;
  lastActivityDate: Date;
  isActive: boolean;
  freezeCount: number; // Streak freeze/protection uses
  metadata: Record<string, any>;
}

export enum StreakType {
  DAILY_CHECK_IN = "DAILY_CHECK_IN",
  GOAL_LOGGING = "GOAL_LOGGING",
  EXERCISE = "EXERCISE",
  MEDICATION = "MEDICATION",
  APPOINTMENT = "APPOINTMENT",
  EDUCATION = "EDUCATION",
  CUSTOM = "CUSTOM",
}

export interface StreakActivity extends BaseEntity {
  streakId: string;
  patientId: string;
  date: Date;
  completed: boolean;
  metadata: Record<string, any>;
}

// ============================================================================
// Wellness Program Types
// ============================================================================

export interface WellnessProgram extends BaseEntity {
  name: string;
  description: string;
  type: ProgramType;
  category: ProgramCategory;
  level: ProgramLevel;
  duration: number; // in days
  thumbnailUrl: string;
  bannerUrl: string;
  goals: string[]; // Goal templates
  content: ProgramContent[];
  requirements: ProgramRequirement[];
  rewards: ProgramReward;
  maxParticipants: number | null;
  currentParticipants: number;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  targetAudience: TargetAudience;
}

export enum ProgramType {
  SELF_PACED = "SELF_PACED",
  SCHEDULED = "SCHEDULED",
  COHORT = "COHORT",
  ONE_ON_ONE = "ONE_ON_ONE",
}

export enum ProgramCategory {
  WEIGHT_MANAGEMENT = "WEIGHT_MANAGEMENT",
  DIABETES_MANAGEMENT = "DIABETES_MANAGEMENT",
  CARDIAC_REHABILITATION = "CARDIAC_REHABILITATION",
  STRESS_MANAGEMENT = "STRESS_MANAGEMENT",
  SMOKING_CESSATION = "SMOKING_CESSATION",
  NUTRITION = "NUTRITION",
  FITNESS = "FITNESS",
  MENTAL_HEALTH = "MENTAL_HEALTH",
  CHRONIC_DISEASE = "CHRONIC_DISEASE",
  PREVENTIVE_CARE = "PREVENTIVE_CARE",
  PREGNANCY = "PREGNANCY",
  SENIOR_WELLNESS = "SENIOR_WELLNESS",
}

export enum ProgramLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  ALL_LEVELS = "ALL_LEVELS",
}

export interface ProgramContent {
  week: number;
  title: string;
  description: string;
  contentIds: string[]; // Education content IDs
  activities: string[];
  milestones: string[];
}

export interface ProgramRequirement {
  type: string;
  value: any;
  description: string;
}

export interface ProgramReward {
  points: number;
  badges: string[];
  certificates: boolean;
  incentives: string[];
}

export interface TargetAudience {
  ageMin: number | null;
  ageMax: number | null;
  conditions: string[]; // ICD codes
  gender: string | null;
  riskFactors: string[];
}

export interface ProgramEnrollment extends BaseEntity {
  programId: string;
  program: WellnessProgram;
  patientId: string;
  enrolledDate: Date;
  startedDate: Date | null;
  completedDate: Date | null;
  status: EnrollmentStatus;
  progress: number; // 0-100
  currentWeek: number;
  completedContent: string[];
  completedActivities: string[];
  notes: string | null;
  coachId: string | null;
}

export enum EnrollmentStatus {
  ENROLLED = "ENROLLED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  DROPPED = "DROPPED",
  ON_HOLD = "ON_HOLD",
}

// ============================================================================
// Challenge Types
// ============================================================================

export interface Challenge extends BaseEntity {
  name: string;
  description: string;
  type: ChallengeType;
  category: ChallengeCategory;
  thumbnailUrl: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  goal: ChallengeGoal;
  rules: string[];
  rewards: ChallengeReward;
  maxParticipants: number | null;
  currentParticipants: number;
  isTeamBased: boolean;
  teamSize: number | null;
  visibility: ChallengeVisibility;
  difficulty: ChallengeDifficulty;
  requirements: ChallengeRequirement[];
  status: ChallengeStatus;
  leaderboardType: LeaderboardType;
  tags: string[];
}

export enum ChallengeType {
  INDIVIDUAL = "INDIVIDUAL",
  TEAM = "TEAM",
  COMMUNITY = "COMMUNITY",
  VERSUS = "VERSUS",
}

export enum ChallengeCategory {
  STEPS = "STEPS",
  EXERCISE = "EXERCISE",
  NUTRITION = "NUTRITION",
  HYDRATION = "HYDRATION",
  SLEEP = "SLEEP",
  MINDFULNESS = "MINDFULNESS",
  WEIGHT_LOSS = "WEIGHT_LOSS",
  MEDICATION_ADHERENCE = "MEDICATION_ADHERENCE",
  CUSTOM = "CUSTOM",
}

export enum ChallengeVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
  INVITATION_ONLY = "INVITATION_ONLY",
}

export enum ChallengeDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
  EXTREME = "EXTREME",
}

export enum ChallengeStatus {
  UPCOMING = "UPCOMING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum LeaderboardType {
  TOTAL_PROGRESS = "TOTAL_PROGRESS",
  DAILY_AVERAGE = "DAILY_AVERAGE",
  PERCENTAGE_COMPLETE = "PERCENTAGE_COMPLETE",
  CUSTOM_METRIC = "CUSTOM_METRIC",
}

export interface ChallengeGoal {
  metric: string;
  target: number;
  unit: string;
  isAccumulative: boolean;
}

export interface ChallengeReward {
  points: number;
  badges: string[];
  prizes: ChallengePrize[];
  tiers: RewardTier[];
}

export interface ChallengePrize {
  name: string;
  description: string;
  quantity: number;
  value: number;
  imageUrl: string | null;
}

export interface RewardTier {
  rank: number;
  name: string;
  points: number;
  prizes: string[];
}

export interface ChallengeRequirement {
  type: string;
  value: any;
  description: string;
}

export interface ChallengeParticipant extends BaseEntity {
  challengeId: string;
  patientId: string;
  teamId: string | null;
  joinedDate: Date;
  status: ParticipantStatus;
  currentProgress: number;
  rank: number;
  completedDate: Date | null;
  lastActivityDate: Date | null;
}

export enum ParticipantStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  DROPPED = "DROPPED",
  DISQUALIFIED = "DISQUALIFIED",
}

export interface ChallengeTeam extends BaseEntity {
  challengeId: string;
  name: string;
  description: string | null;
  captainId: string;
  members: string[]; // Patient IDs
  currentProgress: number;
  rank: number;
  avatar: string | null;
  color: string;
}

// ============================================================================
// Rewards & Incentives Types
// ============================================================================

export interface Reward extends BaseEntity {
  name: string;
  description: string;
  category: RewardCategory;
  type: RewardType;
  pointCost: number;
  cashValue: number | null;
  inventory: number | null;
  claimed: number;
  imageUrl: string;
  terms: string;
  expirationDays: number | null;
  isActive: boolean;
  isFeatured: boolean;
  restrictions: RewardRestriction[];
  tags: string[];
  vendorInfo: VendorInfo | null;
}

export enum RewardCategory {
  GIFT_CARD = "GIFT_CARD",
  MERCHANDISE = "MERCHANDISE",
  DISCOUNT = "DISCOUNT",
  SERVICE = "SERVICE",
  DONATION = "DONATION",
  VIRTUAL = "VIRTUAL",
  HEALTHCARE = "HEALTHCARE",
}

export enum RewardType {
  PHYSICAL = "PHYSICAL",
  DIGITAL = "DIGITAL",
  VOUCHER = "VOUCHER",
  CREDIT = "CREDIT",
}

export interface RewardRestriction {
  type: string;
  value: any;
  description: string;
}

export interface VendorInfo {
  name: string;
  contact: string;
  deliveryMethod: string;
}

export interface RewardRedemption extends BaseEntity {
  patientId: string;
  rewardId: string;
  reward: Reward;
  pointsSpent: number;
  status: RedemptionStatus;
  redemptionDate: Date;
  fulfillmentDate: Date | null;
  expirationDate: Date | null;
  code: string | null;
  trackingNumber: string | null;
  shippingAddress: any | null;
  notes: string | null;
}

export enum RedemptionStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  FULFILLED = "FULFILLED",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export interface Incentive extends BaseEntity {
  name: string;
  description: string;
  type: IncentiveType;
  trigger: IncentiveTrigger;
  reward: IncentiveReward;
  conditions: IncentiveCondition[];
  startDate: Date;
  endDate: Date | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  priority: number;
}

export enum IncentiveType {
  POINT_MULTIPLIER = "POINT_MULTIPLIER",
  BONUS_POINTS = "BONUS_POINTS",
  DISCOUNT = "DISCOUNT",
  FREE_REWARD = "FREE_REWARD",
  STREAK_PROTECTION = "STREAK_PROTECTION",
}

export interface IncentiveTrigger {
  event: string;
  threshold: number | null;
  metric: string | null;
}

export interface IncentiveReward {
  type: string;
  value: number;
  description: string;
}

export interface IncentiveCondition {
  field: string;
  operator: string;
  value: any;
}

// ============================================================================
// Education Content Types
// ============================================================================

export interface EducationContent extends BaseEntity {
  title: string;
  description: string;
  type: ContentType;
  category: ContentCategory;
  format: ContentFormat;
  level: ContentLevel;
  duration: number; // in minutes
  thumbnailUrl: string;
  contentUrl: string;
  transcript: string | null;
  author: string;
  publishedDate: Date;
  lastReviewDate: Date;
  version: string;
  language: string;
  translations: ContentTranslation[];
  tags: string[];
  relatedConditions: string[]; // ICD codes
  relatedTopics: string[];
  quiz: Quiz | null;
  resources: ContentResource[];
  rewardPoints: number;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  completionCount: number;
  averageRating: number;
  reviewCount: number;
}

export enum ContentType {
  ARTICLE = "ARTICLE",
  VIDEO = "VIDEO",
  PODCAST = "PODCAST",
  INFOGRAPHIC = "INFOGRAPHIC",
  INTERACTIVE = "INTERACTIVE",
  COURSE = "COURSE",
  WEBINAR = "WEBINAR",
}

export enum ContentCategory {
  DISEASE_MANAGEMENT = "DISEASE_MANAGEMENT",
  MEDICATION = "MEDICATION",
  NUTRITION = "NUTRITION",
  EXERCISE = "EXERCISE",
  MENTAL_HEALTH = "MENTAL_HEALTH",
  PREVENTIVE_CARE = "PREVENTIVE_CARE",
  PROCEDURES = "PROCEDURES",
  SYMPTOMS = "SYMPTOMS",
  LIFESTYLE = "LIFESTYLE",
  GENERAL_WELLNESS = "GENERAL_WELLNESS",
}

export enum ContentFormat {
  TEXT = "TEXT",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  MIXED_MEDIA = "MIXED_MEDIA",
}

export enum ContentLevel {
  BASIC = "BASIC",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export interface ContentTranslation {
  language: string;
  title: string;
  description: string;
  contentUrl: string;
  transcript: string | null;
}

export interface ContentResource {
  title: string;
  url: string;
  type: string;
}

export interface Quiz {
  questions: QuizQuestion[];
  passingScore: number;
  allowRetake: boolean;
  maxAttempts: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options: QuizOption[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  MULTIPLE_SELECT = "MULTIPLE_SELECT",
  SHORT_ANSWER = "SHORT_ANSWER",
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface ContentProgress extends BaseEntity {
  patientId: string;
  contentId: string;
  status: ContentProgressStatus;
  progress: number; // 0-100
  startedDate: Date;
  completedDate: Date | null;
  timeSpent: number; // in seconds
  quizAttempts: QuizAttempt[];
  lastPosition: number | null; // For videos/audio
  bookmarked: boolean;
  rating: number | null;
  review: string | null;
}

export enum ContentProgressStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export interface QuizAttempt {
  attemptNumber: number;
  date: Date;
  score: number;
  answers: QuizAnswer[];
  passed: boolean;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
}

// ============================================================================
// Family & Caregiver Types
// ============================================================================

export interface FamilyMember extends BaseEntity {
  patientId: string; // Primary patient
  familyMemberId: string | null; // If they're also a patient
  name: string;
  relationship: FamilyRelationship;
  email: string | null;
  phone: string | null;
  dateOfBirth: Date | null;
  accessLevel: FamilyAccessLevel;
  permissions: FamilyPermission[];
  invitationStatus: InvitationStatus;
  invitationSentDate: Date | null;
  acceptedDate: Date | null;
  isActive: boolean;
  canViewMedicalInfo: boolean;
  canViewAppointments: boolean;
  canViewGoals: boolean;
  canManageGoals: boolean;
  canReceiveAlerts: boolean;
  notificationPreferences: FamilyNotificationPreferences;
}

export enum FamilyRelationship {
  SPOUSE = "SPOUSE",
  PARENT = "PARENT",
  CHILD = "CHILD",
  SIBLING = "SIBLING",
  GRANDPARENT = "GRANDPARENT",
  GRANDCHILD = "GRANDCHILD",
  GUARDIAN = "GUARDIAN",
  CAREGIVER = "CAREGIVER",
  HEALTHCARE_PROXY = "HEALTHCARE_PROXY",
  OTHER = "OTHER",
}

export enum FamilyAccessLevel {
  VIEW_ONLY = "VIEW_ONLY",
  SUPPORT = "SUPPORT",
  MANAGE = "MANAGE",
  FULL = "FULL",
}

export interface FamilyPermission {
  resource: string;
  actions: string[];
}

export enum InvitationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
}

export interface FamilyNotificationPreferences {
  email: boolean;
  sms: boolean;
  goalMilestones: boolean;
  challengeUpdates: boolean;
  appointmentReminders: boolean;
  criticalAlerts: boolean;
}

export interface CareCircle extends BaseEntity {
  patientId: string;
  name: string;
  description: string | null;
  members: string[]; // FamilyMember IDs
  goals: string[]; // Shared goal IDs
  challenges: string[]; // Shared challenge IDs
  isActive: boolean;
}

export interface FamilyActivity extends BaseEntity {
  patientId: string;
  familyMemberId: string;
  activityType: FamilyActivityType;
  description: string;
  metadata: Record<string, any>;
}

export enum FamilyActivityType {
  GOAL_COMMENT = "GOAL_COMMENT",
  GOAL_ENCOURAGEMENT = "GOAL_ENCOURAGEMENT",
  CHALLENGE_JOIN = "CHALLENGE_JOIN",
  ACHIEVEMENT_SHARE = "ACHIEVEMENT_SHARE",
  MESSAGE_SENT = "MESSAGE_SENT",
  APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER",
}

// ============================================================================
// Feedback & Satisfaction Types
// ============================================================================

export interface PatientFeedback extends BaseEntity {
  patientId: string;
  type: FeedbackType;
  category: FeedbackCategory;
  rating: number; // 1-5
  subject: string;
  description: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  assignedTo: string | null;
  responseDate: Date | null;
  response: string | null;
  isAnonymous: boolean;
  sentiment: FeedbackSentiment | null;
  tags: string[];
  attachments: string[];
}

export enum FeedbackType {
  COMPLAINT = "COMPLAINT",
  SUGGESTION = "SUGGESTION",
  PRAISE = "PRAISE",
  QUESTION = "QUESTION",
  BUG_REPORT = "BUG_REPORT",
  FEATURE_REQUEST = "FEATURE_REQUEST",
}

export enum FeedbackCategory {
  PROVIDER_CARE = "PROVIDER_CARE",
  STAFF_INTERACTION = "STAFF_INTERACTION",
  FACILITY = "FACILITY",
  APPOINTMENT = "APPOINTMENT",
  BILLING = "BILLING",
  TECHNOLOGY = "TECHNOLOGY",
  PORTAL = "PORTAL",
  ENGAGEMENT_PLATFORM = "ENGAGEMENT_PLATFORM",
  OTHER = "OTHER",
}

export enum FeedbackStatus {
  NEW = "NEW",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export enum FeedbackPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum FeedbackSentiment {
  VERY_NEGATIVE = "VERY_NEGATIVE",
  NEGATIVE = "NEGATIVE",
  NEUTRAL = "NEUTRAL",
  POSITIVE = "POSITIVE",
  VERY_POSITIVE = "VERY_POSITIVE",
}

export interface Survey extends BaseEntity {
  name: string;
  description: string;
  type: SurveyType;
  questions: SurveyQuestion[];
  targetAudience: SurveyAudience;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  isAnonymous: boolean;
  requiredForAccess: boolean;
  rewardPoints: number;
  responseCount: number;
  completionRate: number;
}

export enum SurveyType {
  SATISFACTION = "SATISFACTION",
  EXPERIENCE = "EXPERIENCE",
  HEALTH_STATUS = "HEALTH_STATUS",
  PROGRAM_EVALUATION = "PROGRAM_EVALUATION",
  ENGAGEMENT = "ENGAGEMENT",
  CUSTOM = "CUSTOM",
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: SurveyQuestionType;
  options: string[] | null;
  isRequired: boolean;
  order: number;
}

export enum SurveyQuestionType {
  RATING = "RATING",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  MULTIPLE_SELECT = "MULTIPLE_SELECT",
  TEXT = "TEXT",
  YES_NO = "YES_NO",
  SCALE = "SCALE",
}

export interface SurveyAudience {
  allPatients: boolean;
  conditions: string[];
  ageMin: number | null;
  ageMax: number | null;
  programIds: string[];
}

export interface SurveyResponse extends BaseEntity {
  surveyId: string;
  patientId: string | null; // Null if anonymous
  completedDate: Date;
  answers: SurveyAnswer[];
  timeToComplete: number; // in seconds
}

export interface SurveyAnswer {
  questionId: string;
  answer: string | string[] | number;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface EngagementNotification extends BaseEntity {
  patientId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl: string | null;
  actionText: string | null;
  priority: NotificationPriority;
  isRead: boolean;
  readDate: Date | null;
  sentDate: Date;
  expiresAt: Date | null;
  metadata: Record<string, any>;
}

export enum NotificationType {
  GOAL_REMINDER = "GOAL_REMINDER",
  GOAL_MILESTONE = "GOAL_MILESTONE",
  ACHIEVEMENT_EARNED = "ACHIEVEMENT_EARNED",
  BADGE_EARNED = "BADGE_EARNED",
  STREAK_MILESTONE = "STREAK_MILESTONE",
  STREAK_WARNING = "STREAK_WARNING",
  CHALLENGE_INVITE = "CHALLENGE_INVITE",
  CHALLENGE_START = "CHALLENGE_START",
  CHALLENGE_END = "CHALLENGE_END",
  PROGRAM_UPDATE = "PROGRAM_UPDATE",
  REWARD_AVAILABLE = "REWARD_AVAILABLE",
  CONTENT_RECOMMENDATION = "CONTENT_RECOMMENDATION",
  FAMILY_ACTIVITY = "FAMILY_ACTIVITY",
  LEADERBOARD_UPDATE = "LEADERBOARD_UPDATE",
  LEVEL_UP = "LEVEL_UP",
}

export enum NotificationCategory {
  ACHIEVEMENT = "ACHIEVEMENT",
  REMINDER = "REMINDER",
  SOCIAL = "SOCIAL",
  SYSTEM = "SYSTEM",
  PROMOTIONAL = "PROMOTIONAL",
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface EngagementMetrics {
  patientId: string;
  period: MetricPeriod;
  startDate: Date;
  endDate: Date;
  activeGoals: number;
  completedGoals: number;
  activeChallenges: number;
  completedChallenges: number;
  pointsEarned: number;
  currentStreak: number;
  loginCount: number;
  contentViewed: number;
  contentCompleted: number;
  achievementsEarned: number;
  engagementScore: number;
  activityLevel: ActivityLevel;
}

export enum MetricPeriod {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

export enum ActivityLevel {
  INACTIVE = "INACTIVE",
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateGoalDto {
  patientId: string;
  type: GoalType;
  category: GoalCategory;
  title: string;
  description: string;
  targetValue: number;
  unit: string;
  targetDate: Date;
  priority?: GoalPriority;
  visibility?: GoalVisibility;
  reminderFrequency?: ReminderFrequency;
}

export interface UpdateGoalDto extends Partial<CreateGoalDto> {
  id: string;
  currentValue?: number;
  status?: GoalStatus;
}

export interface JoinChallengeDto {
  challengeId: string;
  patientId: string;
  teamId?: string;
}

export interface RedeemRewardDto {
  rewardId: string;
  patientId: string;
  shippingAddress?: any;
}

export interface SubmitFeedbackDto {
  patientId: string;
  type: FeedbackType;
  category: FeedbackCategory;
  rating: number;
  subject: string;
  description: string;
  isAnonymous?: boolean;
}

export interface EnrollProgramDto {
  programId: string;
  patientId: string;
  coachId?: string;
}
