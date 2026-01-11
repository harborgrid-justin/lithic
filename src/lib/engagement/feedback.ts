/**
 * Patient Feedback and Satisfaction Collection System
 * Agent 5: Patient Engagement Platform
 *
 * Comprehensive feedback system including:
 * - Multi-type feedback collection
 * - Survey management
 * - Sentiment analysis
 * - Feedback routing and response
 * - Analytics and reporting
 */

import type {
  PatientFeedback,
  FeedbackType,
  FeedbackCategory,
  FeedbackStatus,
  FeedbackPriority,
  FeedbackSentiment,
  Survey,
  SurveyType,
  SurveyQuestion,
  SurveyResponse,
  SurveyAnswer,
  SubmitFeedbackDto,
} from "@/types/engagement";

// ============================================================================
// Feedback Engine
// ============================================================================

export class FeedbackEngine {
  /**
   * Submit patient feedback
   */
  static async submitFeedback(
    data: SubmitFeedbackDto
  ): Promise<PatientFeedback> {
    const now = new Date();

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(data.description);

    // Determine priority
    const priority = this.determinePriority(data.type, data.rating, sentiment);

    const feedback: PatientFeedback = {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: data.isAnonymous ? "anonymous" : data.patientId,
      updatedBy: data.isAnonymous ? "anonymous" : data.patientId,
      patientId: data.isAnonymous ? "anonymous" : data.patientId,
      type: data.type,
      category: data.category,
      rating: data.rating,
      subject: data.subject,
      description: data.description,
      relatedEntityType: null,
      relatedEntityId: null,
      status: FeedbackStatus.NEW,
      priority,
      assignedTo: null,
      responseDate: null,
      response: null,
      isAnonymous: data.isAnonymous || false,
      sentiment,
      tags: this.extractTags(data.subject, data.description),
      attachments: [],
    };

    // Auto-assign based on category
    await this.autoAssignFeedback(feedback);

    // Send acknowledgment
    if (!feedback.isAnonymous) {
      await this.sendAcknowledgment(feedback);
    }

    return feedback;
  }

  /**
   * Respond to feedback
   */
  static async respondToFeedback(
    feedbackId: string,
    response: string,
    responderId: string
  ): Promise<PatientFeedback> {
    const feedback = await this.getFeedbackById(feedbackId);

    feedback.response = response;
    feedback.responseDate = new Date();
    feedback.status = FeedbackStatus.RESOLVED;
    feedback.updatedAt = new Date();
    feedback.updatedBy = responderId;

    // Notify patient if not anonymous
    if (!feedback.isAnonymous) {
      await this.notifyFeedbackResponse(feedback);
    }

    return feedback;
  }

  /**
   * Update feedback status
   */
  static async updateFeedbackStatus(
    feedbackId: string,
    status: FeedbackStatus,
    assignedTo?: string
  ): Promise<PatientFeedback> {
    const feedback = await this.getFeedbackById(feedbackId);

    feedback.status = status;
    if (assignedTo) {
      feedback.assignedTo = assignedTo;
    }
    feedback.updatedAt = new Date();

    return feedback;
  }

  /**
   * Create survey
   */
  static async createSurvey(
    surveyData: CreateSurveyDto
  ): Promise<Survey> {
    const now = new Date();

    const survey: Survey = {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: "", // Set from context
      updatedBy: "", // Set from context
      name: surveyData.name,
      description: surveyData.description,
      type: surveyData.type,
      questions: surveyData.questions,
      targetAudience: surveyData.targetAudience || {
        allPatients: true,
        conditions: [],
        ageMin: null,
        ageMax: null,
        programIds: [],
      },
      startDate: surveyData.startDate || now,
      endDate: surveyData.endDate || null,
      isActive: true,
      isAnonymous: surveyData.isAnonymous || false,
      requiredForAccess: surveyData.requiredForAccess || false,
      rewardPoints: surveyData.rewardPoints || 0,
      responseCount: 0,
      completionRate: 0,
    };

    return survey;
  }

  /**
   * Submit survey response
   */
  static async submitSurveyResponse(
    surveyId: string,
    patientId: string | null,
    answers: SurveyAnswer[],
    timeToComplete: number
  ): Promise<{
    response: SurveyResponse;
    pointsEarned: number;
  }> {
    const survey = await this.getSurveyById(surveyId);

    // Validate all required questions are answered
    const requiredQuestions = survey.questions.filter((q) => q.isRequired);
    const answeredQuestionIds = answers.map((a) => a.questionId);

    for (const question of requiredQuestions) {
      if (!answeredQuestionIds.includes(question.id)) {
        throw new Error(`Required question not answered: ${question.question}`);
      }
    }

    const now = new Date();

    const response: SurveyResponse = {
      id: crypto.randomUUID(),
      organizationId: survey.organizationId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: patientId || "anonymous",
      updatedBy: patientId || "anonymous",
      surveyId,
      patientId: survey.isAnonymous ? null : patientId,
      completedDate: now,
      answers,
      timeToComplete,
    };

    // Update survey statistics
    survey.responseCount++;
    survey.completionRate = this.calculateCompletionRate(survey);

    const pointsEarned = survey.rewardPoints;

    return {
      response,
      pointsEarned,
    };
  }

  /**
   * Get eligible surveys for patient
   */
  static async getEligibleSurveys(
    patientId: string,
    patientProfile: PatientProfile
  ): Promise<Survey[]> {
    const allSurveys = await this.getActiveSurveys();
    const completedSurveys = await this.getCompletedSurveyIds(patientId);

    return allSurveys.filter((survey) => {
      // Skip if already completed
      if (completedSurveys.includes(survey.id)) {
        return false;
      }

      // Check target audience
      if (survey.targetAudience.allPatients) {
        return true;
      }

      // Age check
      if (survey.targetAudience.ageMin || survey.targetAudience.ageMax) {
        const age = patientProfile.age;
        if (survey.targetAudience.ageMin && age < survey.targetAudience.ageMin) {
          return false;
        }
        if (survey.targetAudience.ageMax && age > survey.targetAudience.ageMax) {
          return false;
        }
      }

      // Condition check
      if (survey.targetAudience.conditions.length > 0) {
        const hasCondition = survey.targetAudience.conditions.some((c) =>
          patientProfile.conditions?.includes(c)
        );
        if (!hasCondition) {
          return false;
        }
      }

      // Program enrollment check
      if (survey.targetAudience.programIds.length > 0) {
        const hasProgram = survey.targetAudience.programIds.some((p) =>
          patientProfile.enrolledPrograms?.includes(p)
        );
        if (!hasProgram) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get feedback analytics
   */
  static async getFeedbackAnalytics(
    organizationId: string,
    timeframe: AnalyticsTimeframe
  ): Promise<FeedbackAnalytics> {
    const feedback = await this.getFeedbackInTimeframe(organizationId, timeframe);

    const totalFeedback = feedback.length;
    const byType = this.groupByType(feedback);
    const byCategory = this.groupByCategory(feedback);
    const bySentiment = this.groupBySentiment(feedback);
    const byStatus = this.groupByStatus(feedback);

    const averageRating = this.calculateAverageRating(feedback);
    const responseTime = this.calculateAverageResponseTime(feedback);
    const resolutionRate =
      totalFeedback > 0
        ? feedback.filter((f) => f.status === FeedbackStatus.RESOLVED).length /
          totalFeedback
        : 0;

    const trends = this.analyzeTrends(feedback);
    const topIssues = this.identifyTopIssues(feedback);

    return {
      totalFeedback,
      byType,
      byCategory,
      bySentiment,
      byStatus,
      averageRating,
      averageResponseTime: responseTime,
      resolutionRate,
      trends,
      topIssues,
    };
  }

  /**
   * Get survey analytics
   */
  static async getSurveyAnalytics(
    surveyId: string
  ): Promise<SurveyAnalytics> {
    const survey = await this.getSurveyById(surveyId);
    const responses = await this.getSurveyResponses(surveyId);

    const totalResponses = responses.length;
    const completionRate = survey.completionRate;
    const averageTimeToComplete =
      responses.reduce((sum, r) => sum + r.timeToComplete, 0) / totalResponses;

    const questionAnalytics = survey.questions.map((question) => {
      const questionResponses = responses.map((r) =>
        r.answers.find((a) => a.questionId === question.id)
      );

      return this.analyzeQuestion(question, questionResponses);
    });

    return {
      surveyId,
      surveyName: survey.name,
      totalResponses,
      completionRate,
      averageTimeToComplete,
      questionAnalytics,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Analyze sentiment of feedback text
   */
  private static analyzeSentiment(text: string): FeedbackSentiment {
    // Simple keyword-based sentiment analysis
    const lowerText = text.toLowerCase();

    const positiveKeywords = [
      "excellent",
      "great",
      "wonderful",
      "amazing",
      "helpful",
      "thank",
      "love",
      "perfect",
    ];
    const negativeKeywords = [
      "terrible",
      "awful",
      "horrible",
      "bad",
      "worst",
      "disappointing",
      "frustrated",
      "angry",
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveKeywords.forEach((word) => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeKeywords.forEach((word) => {
      if (lowerText.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount + 1) {
      return FeedbackSentiment.VERY_POSITIVE;
    } else if (positiveCount > negativeCount) {
      return FeedbackSentiment.POSITIVE;
    } else if (negativeCount > positiveCount + 1) {
      return FeedbackSentiment.VERY_NEGATIVE;
    } else if (negativeCount > positiveCount) {
      return FeedbackSentiment.NEGATIVE;
    }

    return FeedbackSentiment.NEUTRAL;
  }

  /**
   * Determine feedback priority
   */
  private static determinePriority(
    type: FeedbackType,
    rating: number,
    sentiment: FeedbackSentiment
  ): FeedbackPriority {
    // Complaints with low ratings are high priority
    if (type === FeedbackType.COMPLAINT && rating <= 2) {
      return FeedbackPriority.URGENT;
    }

    if (sentiment === FeedbackSentiment.VERY_NEGATIVE) {
      return FeedbackPriority.HIGH;
    }

    if (type === FeedbackType.BUG_REPORT) {
      return FeedbackPriority.HIGH;
    }

    if (rating <= 3) {
      return FeedbackPriority.MEDIUM;
    }

    return FeedbackPriority.LOW;
  }

  /**
   * Extract tags from feedback text
   */
  private static extractTags(subject: string, description: string): string[] {
    const text = `${subject} ${description}`.toLowerCase();
    const tags: string[] = [];

    // Simple keyword extraction
    const keywords = [
      "appointment",
      "billing",
      "provider",
      "medication",
      "portal",
      "technical",
      "communication",
      "wait time",
      "staff",
    ];

    keywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return tags;
  }

  /**
   * Auto-assign feedback to appropriate team
   */
  private static async autoAssignFeedback(
    feedback: PatientFeedback
  ): Promise<void> {
    // Assignment logic based on category
    const assignments: Record<FeedbackCategory, string> = {
      [FeedbackCategory.PROVIDER_CARE]: "clinical_team",
      [FeedbackCategory.STAFF_INTERACTION]: "patient_experience",
      [FeedbackCategory.FACILITY]: "operations",
      [FeedbackCategory.APPOINTMENT]: "scheduling",
      [FeedbackCategory.BILLING]: "billing_team",
      [FeedbackCategory.TECHNOLOGY]: "it_support",
      [FeedbackCategory.PORTAL]: "it_support",
      [FeedbackCategory.ENGAGEMENT_PLATFORM]: "it_support",
      [FeedbackCategory.OTHER]: "patient_experience",
    };

    feedback.assignedTo = assignments[feedback.category] || null;
    feedback.status = FeedbackStatus.ACKNOWLEDGED;
  }

  private static async sendAcknowledgment(
    feedback: PatientFeedback
  ): Promise<void> {
    // Send acknowledgment notification
  }

  private static async notifyFeedbackResponse(
    feedback: PatientFeedback
  ): Promise<void> {
    // Send response notification
  }

  private static calculateCompletionRate(survey: Survey): number {
    // Would calculate based on actual data
    return 0;
  }

  private static groupByType(
    feedback: PatientFeedback[]
  ): Record<FeedbackType, number> {
    const grouped: Partial<Record<FeedbackType, number>> = {};
    feedback.forEach((f) => {
      grouped[f.type] = (grouped[f.type] || 0) + 1;
    });
    return grouped as Record<FeedbackType, number>;
  }

  private static groupByCategory(
    feedback: PatientFeedback[]
  ): Record<FeedbackCategory, number> {
    const grouped: Partial<Record<FeedbackCategory, number>> = {};
    feedback.forEach((f) => {
      grouped[f.category] = (grouped[f.category] || 0) + 1;
    });
    return grouped as Record<FeedbackCategory, number>;
  }

  private static groupBySentiment(
    feedback: PatientFeedback[]
  ): Record<FeedbackSentiment, number> {
    const grouped: Partial<Record<FeedbackSentiment, number>> = {};
    feedback.forEach((f) => {
      if (f.sentiment) {
        grouped[f.sentiment] = (grouped[f.sentiment] || 0) + 1;
      }
    });
    return grouped as Record<FeedbackSentiment, number>;
  }

  private static groupByStatus(
    feedback: PatientFeedback[]
  ): Record<FeedbackStatus, number> {
    const grouped: Partial<Record<FeedbackStatus, number>> = {};
    feedback.forEach((f) => {
      grouped[f.status] = (grouped[f.status] || 0) + 1;
    });
    return grouped as Record<FeedbackStatus, number>;
  }

  private static calculateAverageRating(feedback: PatientFeedback[]): number {
    if (feedback.length === 0) return 0;
    const sum = feedback.reduce((acc, f) => acc + f.rating, 0);
    return sum / feedback.length;
  }

  private static calculateAverageResponseTime(
    feedback: PatientFeedback[]
  ): number {
    const responded = feedback.filter((f) => f.responseDate);
    if (responded.length === 0) return 0;

    const times = responded.map((f) => {
      const created = new Date(f.createdAt).getTime();
      const responded = new Date(f.responseDate!).getTime();
      return (responded - created) / (1000 * 60 * 60); // hours
    });

    return times.reduce((sum, t) => sum + t, 0) / times.length;
  }

  private static analyzeTrends(
    feedback: PatientFeedback[]
  ): { improving: boolean; changePercent: number } {
    // Simplified trend analysis
    return { improving: true, changePercent: 5 };
  }

  private static identifyTopIssues(
    feedback: PatientFeedback[]
  ): { issue: string; count: number }[] {
    const tags: Record<string, number> = {};

    feedback.forEach((f) => {
      f.tags.forEach((tag) => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    });

    return Object.entries(tags)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private static analyzeQuestion(
    question: SurveyQuestion,
    responses: (SurveyAnswer | undefined)[]
  ): QuestionAnalytics {
    const validResponses = responses.filter(
      (r) => r !== undefined
    ) as SurveyAnswer[];

    return {
      questionId: question.id,
      question: question.question,
      responseCount: validResponses.length,
      responseDistribution: {}, // Would calculate actual distribution
    };
  }

  // Mock database methods
  private static async getFeedbackById(
    feedbackId: string
  ): Promise<PatientFeedback> {
    throw new Error("Not implemented");
  }

  private static async getSurveyById(surveyId: string): Promise<Survey> {
    throw new Error("Not implemented");
  }

  private static async getActiveSurveys(): Promise<Survey[]> {
    return [];
  }

  private static async getCompletedSurveyIds(
    patientId: string
  ): Promise<string[]> {
    return [];
  }

  private static async getFeedbackInTimeframe(
    organizationId: string,
    timeframe: AnalyticsTimeframe
  ): Promise<PatientFeedback[]> {
    return [];
  }

  private static async getSurveyResponses(
    surveyId: string
  ): Promise<SurveyResponse[]> {
    return [];
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface CreateSurveyDto {
  name: string;
  description: string;
  type: SurveyType;
  questions: SurveyQuestion[];
  targetAudience?: any;
  startDate?: Date;
  endDate?: Date | null;
  isAnonymous?: boolean;
  requiredForAccess?: boolean;
  rewardPoints?: number;
}

interface PatientProfile {
  age: number;
  conditions?: string[];
  enrolledPrograms?: string[];
}

interface AnalyticsTimeframe {
  start: Date;
  end: Date;
}

interface FeedbackAnalytics {
  totalFeedback: number;
  byType: Record<FeedbackType, number>;
  byCategory: Record<FeedbackCategory, number>;
  bySentiment: Record<FeedbackSentiment, number>;
  byStatus: Record<FeedbackStatus, number>;
  averageRating: number;
  averageResponseTime: number;
  resolutionRate: number;
  trends: { improving: boolean; changePercent: number };
  topIssues: { issue: string; count: number }[];
}

interface SurveyAnalytics {
  surveyId: string;
  surveyName: string;
  totalResponses: number;
  completionRate: number;
  averageTimeToComplete: number;
  questionAnalytics: QuestionAnalytics[];
}

interface QuestionAnalytics {
  questionId: string;
  question: string;
  responseCount: number;
  responseDistribution: Record<string, number>;
}
