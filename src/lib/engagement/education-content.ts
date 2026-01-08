/**
 * Patient Education Content Delivery System
 * Agent 5: Patient Engagement Platform
 *
 * Comprehensive education system including:
 * - Content delivery and tracking
 * - Multi-language support
 * - Interactive quizzes
 * - Progress monitoring
 * - Personalized recommendations
 */

import type {
  EducationContent,
  ContentType,
  ContentCategory,
  ContentFormat,
  ContentLevel,
  ContentProgress,
  ContentProgressStatus,
  Quiz,
  QuizAttempt,
  QuizAnswer,
} from "@/types/engagement";

// ============================================================================
// Education Content Engine
// ============================================================================

export class EducationContentEngine {
  /**
   * Start content consumption
   */
  static async startContent(
    patientId: string,
    contentId: string
  ): Promise<ContentProgress> {
    const content = await this.getContentById(contentId);

    // Check if already started
    const existing = await this.findProgress(patientId, contentId);
    if (existing) {
      return existing;
    }

    const now = new Date();

    const progress: ContentProgress = {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: patientId,
      updatedBy: patientId,
      patientId,
      contentId,
      status: ContentProgressStatus.IN_PROGRESS,
      progress: 0,
      startedDate: now,
      completedDate: null,
      timeSpent: 0,
      quizAttempts: [],
      lastPosition: null,
      bookmarked: false,
      rating: null,
      review: null,
    };

    return progress;
  }

  /**
   * Update content progress
   */
  static async updateProgress(
    progressId: string,
    currentProgress: number,
    timeSpent: number,
    lastPosition?: number
  ): Promise<ContentProgress> {
    const progress = await this.getProgressById(progressId);

    progress.progress = Math.min(currentProgress, 100);
    progress.timeSpent += timeSpent;
    progress.lastPosition = lastPosition || progress.lastPosition;
    progress.updatedAt = new Date();

    // Auto-complete if 100%
    if (progress.progress >= 100 && progress.status !== ContentProgressStatus.COMPLETED) {
      await this.completeContent(progressId);
    }

    return progress;
  }

  /**
   * Complete content
   */
  static async completeContent(
    progressId: string
  ): Promise<{
    progress: ContentProgress;
    pointsEarned: number;
    certificate?: string;
  }> {
    const progress = await this.getProgressById(progressId);
    const content = await this.getContentById(progress.contentId);

    progress.status = ContentProgressStatus.COMPLETED;
    progress.completedDate = new Date();
    progress.progress = 100;
    progress.updatedAt = new Date();

    // Update content statistics
    content.completionCount++;

    // Award points
    const pointsEarned = content.rewardPoints;

    // Generate certificate for courses
    let certificate: string | undefined;
    if (content.type === ContentType.COURSE) {
      certificate = await this.generateCertificate(progress, content);
    }

    return {
      progress,
      pointsEarned,
      certificate,
    };
  }

  /**
   * Submit quiz attempt
   */
  static async submitQuiz(
    progressId: string,
    answers: QuizAnswer[]
  ): Promise<{
    attempt: QuizAttempt;
    passed: boolean;
    pointsEarned: number;
  }> {
    const progress = await this.getProgressById(progressId);
    const content = await this.getContentById(progress.contentId);

    if (!content.quiz) {
      throw new Error("Content does not have a quiz");
    }

    // Calculate score
    const { score, gradedAnswers } = this.gradeQuiz(content.quiz, answers);
    const totalPoints = content.quiz.questions.reduce(
      (sum, q) => sum + q.points,
      0
    );

    const passed = score >= content.quiz.passingScore;

    // Check attempt limit
    const attemptNumber = progress.quizAttempts.length + 1;
    if (
      !content.quiz.allowRetake &&
      attemptNumber > 1
    ) {
      throw new Error("Retakes not allowed for this quiz");
    }

    if (
      content.quiz.maxAttempts &&
      attemptNumber > content.quiz.maxAttempts
    ) {
      throw new Error("Maximum attempts exceeded");
    }

    const attempt: QuizAttempt = {
      attemptNumber,
      date: new Date(),
      score,
      answers: gradedAnswers,
      passed,
    };

    progress.quizAttempts.push(attempt);

    // If passed, mark content as complete
    if (passed && progress.status !== ContentProgressStatus.COMPLETED) {
      progress.status = ContentProgressStatus.COMPLETED;
      progress.completedDate = new Date();
      progress.progress = 100;
    }

    const pointsEarned = passed ? content.rewardPoints : 0;

    return {
      attempt,
      passed,
      pointsEarned,
    };
  }

  /**
   * Grade quiz answers
   */
  private static gradeQuiz(
    quiz: Quiz,
    answers: QuizAnswer[]
  ): {
    score: number;
    gradedAnswers: QuizAnswer[];
  } {
    const gradedAnswers: QuizAnswer[] = [];
    let totalPoints = 0;
    let earnedPoints = 0;

    quiz.questions.forEach((question) => {
      const answer = answers.find((a) => a.questionId === question.id);
      totalPoints += question.points;

      if (!answer) {
        gradedAnswers.push({
          questionId: question.id,
          answer: "",
          isCorrect: false,
          pointsEarned: 0,
        });
        return;
      }

      const isCorrect = this.checkAnswer(question, answer.answer);
      const pointsEarned = isCorrect ? question.points : 0;

      gradedAnswers.push({
        questionId: question.id,
        answer: answer.answer,
        isCorrect,
        pointsEarned,
      });

      if (isCorrect) {
        earnedPoints += question.points;
      }
    });

    const score = (earnedPoints / totalPoints) * 100;

    return { score, gradedAnswers };
  }

  /**
   * Check if answer is correct
   */
  private static checkAnswer(
    question: any,
    answer: string | string[]
  ): boolean {
    const correctAnswer = question.correctAnswer;

    if (Array.isArray(correctAnswer)) {
      // Multiple select
      if (!Array.isArray(answer)) return false;
      return (
        correctAnswer.length === answer.length &&
        correctAnswer.every((a: string) => answer.includes(a))
      );
    }

    // Single answer
    return answer === correctAnswer;
  }

  /**
   * Get personalized content recommendations
   */
  static async getRecommendations(
    patientId: string,
    healthProfile: HealthProfile
  ): Promise<ContentRecommendation[]> {
    const allContent = await this.getActiveContent();
    const viewHistory = await this.getViewHistory(patientId);
    const completedContent = viewHistory
      .filter((v) => v.status === ContentProgressStatus.COMPLETED)
      .map((v) => v.contentId);

    const recommendations: ContentRecommendation[] = [];

    for (const content of allContent) {
      // Skip already completed
      if (completedContent.includes(content.id)) continue;

      const relevanceScore = this.calculateRelevance(content, healthProfile);

      if (relevanceScore > 0.3) {
        recommendations.push({
          content,
          relevanceScore,
          reasons: this.getRecommendationReasons(content, healthProfile),
        });
      }
    }

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }

  /**
   * Calculate content relevance to patient
   */
  private static calculateRelevance(
    content: EducationContent,
    healthProfile: HealthProfile
  ): number {
    let score = 0;

    // Condition match
    if (healthProfile.conditions) {
      const conditionMatch = content.relatedConditions.some((c) =>
        healthProfile.conditions?.includes(c)
      );
      if (conditionMatch) score += 0.5;
    }

    // Age appropriateness
    if (healthProfile.age) {
      if (content.level === ContentLevel.BASIC && healthProfile.age > 65) {
        score += 0.2;
      }
    }

    // Popular content
    if (content.viewCount > 1000) {
      score += 0.1;
    }

    // Highly rated
    if (content.averageRating >= 4.5) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get recommendation reasons
   */
  private static getRecommendationReasons(
    content: EducationContent,
    healthProfile: HealthProfile
  ): string[] {
    const reasons: string[] = [];

    if (
      healthProfile.conditions &&
      content.relatedConditions.some((c) => healthProfile.conditions?.includes(c))
    ) {
      reasons.push("Related to your health conditions");
    }

    if (content.averageRating >= 4.5) {
      reasons.push("Highly rated by other patients");
    }

    if (content.isFeatured) {
      reasons.push("Featured content");
    }

    if (content.viewCount > 1000) {
      reasons.push("Popular among patients");
    }

    return reasons;
  }

  /**
   * Rate and review content
   */
  static async rateContent(
    progressId: string,
    rating: number,
    review?: string
  ): Promise<ContentProgress> {
    const progress = await this.getProgressById(progressId);
    const content = await this.getContentById(progress.contentId);

    progress.rating = rating;
    progress.review = review || null;
    progress.updatedAt = new Date();

    // Update content average rating
    const allRatings = await this.getContentRatings(content.id);
    const avgRating =
      allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
    content.averageRating = avgRating;
    content.reviewCount = allRatings.length;

    return progress;
  }

  /**
   * Bookmark content
   */
  static async toggleBookmark(
    progressId: string
  ): Promise<ContentProgress> {
    const progress = await this.getProgressById(progressId);
    progress.bookmarked = !progress.bookmarked;
    progress.updatedAt = new Date();
    return progress;
  }

  /**
   * Get content statistics for patient
   */
  static async getContentStats(
    patientId: string
  ): Promise<ContentStatistics> {
    const progressRecords = await this.getViewHistory(patientId);

    const completed = progressRecords.filter(
      (p) => p.status === ContentProgressStatus.COMPLETED
    );
    const inProgress = progressRecords.filter(
      (p) => p.status === ContentProgressStatus.IN_PROGRESS
    );

    const totalTimeSpent = progressRecords.reduce(
      (sum, p) => sum + p.timeSpent,
      0
    );

    const completionRate =
      progressRecords.length > 0
        ? completed.length / progressRecords.length
        : 0;

    const avgRating =
      completed.filter((p) => p.rating !== null).length > 0
        ? completed
            .filter((p) => p.rating !== null)
            .reduce((sum, p) => sum + (p.rating || 0), 0) /
          completed.filter((p) => p.rating !== null).length
        : 0;

    return {
      totalViewed: progressRecords.length,
      totalCompleted: completed.length,
      inProgress: inProgress.length,
      totalTimeSpent,
      completionRate,
      averageRating: avgRating,
      certificatesEarned: this.countCertificates(completed),
    };
  }

  /**
   * Search content
   */
  static async searchContent(
    query: string,
    filters?: ContentFilters
  ): Promise<EducationContent[]> {
    let results = await this.getActiveContent();

    // Text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (c) =>
          c.title.toLowerCase().includes(lowerQuery) ||
          c.description.toLowerCase().includes(lowerQuery) ||
          c.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply filters
    if (filters?.category) {
      results = results.filter((c) => c.category === filters.category);
    }

    if (filters?.type) {
      results = results.filter((c) => c.type === filters.type);
    }

    if (filters?.level) {
      results = results.filter((c) => c.level === filters.level);
    }

    if (filters?.language) {
      results = results.filter((c) => c.language === filters.language);
    }

    return results;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static async generateCertificate(
    progress: ContentProgress,
    content: EducationContent
  ): Promise<string> {
    // Would generate PDF certificate
    return `CERT-${progress.id}`;
  }

  private static countCertificates(
    completed: ContentProgress[]
  ): number {
    // Count completed courses (which generate certificates)
    return completed.length; // Simplified
  }

  // Mock database methods
  private static async getContentById(
    contentId: string
  ): Promise<EducationContent> {
    throw new Error("Not implemented");
  }

  private static async getProgressById(
    progressId: string
  ): Promise<ContentProgress> {
    throw new Error("Not implemented");
  }

  private static async findProgress(
    patientId: string,
    contentId: string
  ): Promise<ContentProgress | null> {
    return null;
  }

  private static async getActiveContent(): Promise<EducationContent[]> {
    return [];
  }

  private static async getViewHistory(
    patientId: string
  ): Promise<ContentProgress[]> {
    return [];
  }

  private static async getContentRatings(contentId: string): Promise<number[]> {
    return [];
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface HealthProfile {
  age?: number;
  conditions?: string[];
  medications?: string[];
  preferences?: {
    contentTypes?: ContentType[];
    languages?: string[];
  };
}

interface ContentRecommendation {
  content: EducationContent;
  relevanceScore: number;
  reasons: string[];
}

interface ContentStatistics {
  totalViewed: number;
  totalCompleted: number;
  inProgress: number;
  totalTimeSpent: number;
  completionRate: number;
  averageRating: number;
  certificatesEarned: number;
}

interface ContentFilters {
  category?: ContentCategory;
  type?: ContentType;
  level?: ContentLevel;
  language?: string;
  minRating?: number;
}
