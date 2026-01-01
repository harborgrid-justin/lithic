/**
 * SMART Goals - AI-Powered Goal Validation and Suggestions
 * Validates goals against SMART criteria and provides personalized recommendations
 */

import { GoalType, GoalPriority, Goal } from './goal-engine';
import { getGoalTemplate, GOAL_TEMPLATES } from './goal-templates';
import { db } from '@/lib/db';

export interface SMARTValidation {
  isValid: boolean;
  score: number; // 0-100
  feedback: {
    specific: SMARTCriteriaFeedback;
    measurable: SMARTCriteriaFeedback;
    achievable: SMARTCriteriaFeedback;
    relevant: SMARTCriteriaFeedback;
    timeBound: SMARTCriteriaFeedback;
  };
  suggestions: string[];
}

export interface SMARTCriteriaFeedback {
  met: boolean;
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface PersonalizedGoalSuggestion {
  template: string;
  title: string;
  description: string;
  rationale: string;
  customizations: {
    targetValue: number;
    duration: number;
    priority: GoalPriority;
  };
  confidence: number; // 0-1
}

export class SMARTGoalsEngine {
  /**
   * Validate if a goal meets SMART criteria
   */
  static validateSMARTGoal(goal: Partial<Goal>): SMARTValidation {
    const specific = this.validateSpecific(goal);
    const measurable = this.validateMeasurable(goal);
    const achievable = this.validateAchievable(goal);
    const relevant = this.validateRelevant(goal);
    const timeBound = this.validateTimeBound(goal);

    const score =
      (specific.score +
        measurable.score +
        achievable.score +
        relevant.score +
        timeBound.score) /
      5;

    const isValid =
      specific.met &&
      measurable.met &&
      achievable.met &&
      relevant.met &&
      timeBound.met;

    const suggestions = [
      ...specific.suggestions,
      ...measurable.suggestions,
      ...achievable.suggestions,
      ...relevant.suggestions,
      ...timeBound.suggestions,
    ];

    return {
      isValid,
      score,
      feedback: {
        specific,
        measurable,
        achievable,
        relevant,
        timeBound,
      },
      suggestions,
    };
  }

  /**
   * Validate Specific criterion
   */
  private static validateSpecific(goal: Partial<Goal>): SMARTCriteriaFeedback {
    const suggestions: string[] = [];
    let score = 0;

    // Check if goal has a clear, specific description
    if (!goal.specific || goal.specific.length < 20) {
      suggestions.push(
        'Add more detail about exactly what you want to achieve'
      );
      suggestions.push('Include what, why, and how in your description');
    } else {
      score += 50;
    }

    // Check if title is clear and specific
    if (!goal.title || goal.title.length < 5) {
      suggestions.push('Create a clear, descriptive title for your goal');
    } else {
      score += 25;
    }

    // Check if description provides context
    if (!goal.description || goal.description.length < 30) {
      suggestions.push('Provide more context in the description');
    } else {
      score += 25;
    }

    const met = score >= 75;
    const feedback = met
      ? 'Your goal is specific and clearly defined'
      : 'Your goal needs more specific details';

    return {
      met,
      score,
      feedback,
      suggestions,
    };
  }

  /**
   * Validate Measurable criterion
   */
  private static validateMeasurable(
    goal: Partial<Goal>
  ): SMARTCriteriaFeedback {
    const suggestions: string[] = [];
    let score = 0;

    // Check if has target value
    if (typeof goal.targetValue !== 'number') {
      suggestions.push('Set a specific target value to measure progress');
    } else {
      score += 40;
    }

    // Check if has unit
    if (!goal.unit) {
      suggestions.push('Specify the unit of measurement (lbs, minutes, etc.)');
    } else {
      score += 30;
    }

    // Check if has measurable criteria
    if (!goal.measurable) {
      suggestions.push('Define how progress will be measured');
    } else {
      score += 30;
    }

    const met = score >= 75;
    const feedback = met
      ? 'Your goal has clear metrics for tracking progress'
      : 'Add specific measurements to track your progress';

    return {
      met,
      score,
      feedback,
      suggestions,
    };
  }

  /**
   * Validate Achievable criterion
   */
  private static validateAchievable(
    goal: Partial<Goal>
  ): SMARTCriteriaFeedback {
    const suggestions: string[] = [];
    let score = 50; // Default neutral score

    // Check if achievability is explained
    if (!goal.achievable || goal.achievable.length < 20) {
      suggestions.push('Explain why this goal is achievable for you');
      suggestions.push('Consider your current situation and resources');
      score -= 25;
    } else {
      score += 25;
    }

    // Check if target is reasonable based on duration
    if (goal.targetDate && goal.startDate) {
      const durationDays = Math.ceil(
        (new Date(goal.targetDate).getTime() -
          new Date(goal.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (durationDays < 7) {
        suggestions.push('Very short timeframe - ensure goal is achievable');
        score -= 15;
      } else if (durationDays > 365) {
        suggestions.push(
          'Long timeframe - consider breaking into smaller goals'
        );
        score -= 10;
      } else {
        score += 25;
      }
    }

    const met = score >= 60;
    const feedback = met
      ? 'Your goal appears achievable with effort'
      : 'Consider if this goal is realistic given your circumstances';

    return {
      met,
      score,
      feedback,
      suggestions,
    };
  }

  /**
   * Validate Relevant criterion
   */
  private static validateRelevant(goal: Partial<Goal>): SMARTCriteriaFeedback {
    const suggestions: string[] = [];
    let score = 0;

    // Check if relevance is explained
    if (!goal.relevant || goal.relevant.length < 20) {
      suggestions.push('Explain why this goal matters to you');
      suggestions.push('Connect this goal to your health priorities');
    } else {
      score += 50;
    }

    // Check if priority is set
    if (!goal.priority) {
      suggestions.push('Set a priority level for this goal');
    } else {
      score += 25;
    }

    // Check if category/type is defined
    if (!goal.type) {
      suggestions.push('Specify the type of health goal');
    } else {
      score += 25;
    }

    const met = score >= 75;
    const feedback = met
      ? 'Your goal aligns with your health priorities'
      : 'Clarify how this goal relates to your overall health';

    return {
      met,
      score,
      feedback,
      suggestions,
    };
  }

  /**
   * Validate Time-bound criterion
   */
  private static validateTimeBound(goal: Partial<Goal>): SMARTCriteriaFeedback {
    const suggestions: string[] = [];
    let score = 0;

    // Check if has start date
    if (!goal.startDate) {
      suggestions.push('Set a start date for your goal');
    } else {
      score += 25;
    }

    // Check if has target date
    if (!goal.targetDate) {
      suggestions.push('Set a target completion date');
    } else {
      score += 50;
    }

    // Check if time-bound explanation exists
    if (!goal.timeBound || goal.timeBound.length < 10) {
      suggestions.push('Explain your timeframe and any important deadlines');
    } else {
      score += 25;
    }

    const met = score >= 75;
    const feedback = met
      ? 'Your goal has a clear deadline'
      : 'Add specific dates to create urgency';

    return {
      met,
      score,
      feedback,
      suggestions,
    };
  }

  /**
   * Get AI-powered goal suggestions based on user profile
   */
  static async getSuggestedGoals(
    userId: string,
    limit = 5
  ): Promise<PersonalizedGoalSuggestion[]> {
    const suggestions: PersonalizedGoalSuggestion[] = [];

    // Get user's health data and history
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        goals: {
          where: {
            status: { in: ['ACTIVE', 'COMPLETED'] },
          },
        },
      },
    });

    if (!user) return suggestions;

    // Get user's completed goal types
    const completedTypes = new Set(
      user.goals.filter((g: any) => g.status === 'COMPLETED').map((g: any) => g.type)
    );

    const activeTypes = new Set(
      user.goals.filter((g: any) => g.status === 'ACTIVE').map((g: any) => g.type)
    );

    // Calculate user's experience level
    const completedCount = user.goals.filter(
      (g: any) => g.status === 'COMPLETED'
    ).length;
    const experienceLevel =
      completedCount >= 10
        ? 'advanced'
        : completedCount >= 3
          ? 'intermediate'
          : 'beginner';

    // Find suitable templates
    for (const template of GOAL_TEMPLATES) {
      // Skip if user already has active goal of this type
      if (activeTypes.has(template.type)) continue;

      // Calculate confidence based on various factors
      let confidence = 0.5;

      // Boost confidence if difficulty matches experience
      if (template.difficulty === experienceLevel) {
        confidence += 0.2;
      }

      // Boost if user has completed similar goals
      if (completedTypes.has(template.type)) {
        confidence += 0.15;
      }

      // Boost high priority goals
      if (template.priority === GoalPriority.CRITICAL) {
        confidence += 0.1;
      }

      // Lower confidence for very long goals for beginners
      if (experienceLevel === 'beginner' && template.duration > 60) {
        confidence -= 0.15;
      }

      // Customize target based on user's level
      let targetValue = template.targetValue;
      let duration = template.duration;

      if (experienceLevel === 'beginner') {
        // Reduce targets for beginners
        targetValue = Math.round(template.targetValue * 0.7);
        duration = Math.min(template.duration, 60);
      } else if (experienceLevel === 'advanced' && completedTypes.has(template.type)) {
        // Increase targets for experienced users
        targetValue = Math.round(template.targetValue * 1.3);
      }

      // Generate personalized rationale
      const rationale = this.generateRationale(
        template,
        experienceLevel,
        completedTypes.has(template.type)
      );

      suggestions.push({
        template: template.id,
        title: template.title,
        description: template.description,
        rationale,
        customizations: {
          targetValue,
          duration,
          priority: template.priority,
        },
        confidence,
      });
    }

    // Sort by confidence and return top suggestions
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
  }

  /**
   * Generate personalized rationale for goal suggestion
   */
  private static generateRationale(
    template: any,
    experienceLevel: string,
    hasCompletedSimilar: boolean
  ): string {
    const rationales: string[] = [];

    if (hasCompletedSimilar) {
      rationales.push(
        `Based on your success with similar goals, you're ready for this challenge.`
      );
    }

    if (template.priority === GoalPriority.CRITICAL) {
      rationales.push(
        `This is a high-priority goal that can significantly impact your health.`
      );
    }

    if (experienceLevel === 'beginner' && template.difficulty === 'beginner') {
      rationales.push(
        `This beginner-friendly goal is a great starting point for your health journey.`
      );
    } else if (
      experienceLevel === 'advanced' &&
      template.difficulty === 'advanced'
    ) {
      rationales.push(
        `Given your experience, this advanced goal will help you reach new heights.`
      );
    }

    if (template.category === 'Weight Management') {
      rationales.push(
        `Weight management is foundational to many health outcomes.`
      );
    } else if (template.category === 'Medication') {
      rationales.push(
        `Medication adherence is crucial for treatment effectiveness.`
      );
    }

    return rationales.join(' ') || 'Recommended based on your health profile.';
  }

  /**
   * Auto-fill SMART components from a template
   */
  static fillFromTemplate(
    templateId: string,
    customizations?: Partial<{
      currentValue: number;
      targetValue: number;
      duration: number;
    }>
  ): Partial<Goal> {
    const template = getGoalTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const startDate = new Date();
    const targetDate = new Date();
    targetDate.setDate(
      startDate.getDate() + (customizations?.duration || template.duration)
    );

    return {
      type: template.type,
      title: template.title,
      description: template.description,
      priority: template.priority,
      startDate,
      targetDate,
      specific: template.specific,
      measurable: {
        name: template.title,
        currentValue: customizations?.currentValue || 0,
        targetValue: customizations?.targetValue || template.targetValue,
        unit: template.unit,
        direction: template.direction,
      },
      achievable: template.achievable,
      relevant: template.relevant,
      timeBound: `Complete by ${targetDate.toLocaleDateString()}`,
      currentValue: customizations?.currentValue || 0,
      targetValue: customizations?.targetValue || template.targetValue,
      unit: template.unit,
      category: template.category,
      tags: [template.category, template.difficulty],
    };
  }

  /**
   * Suggest improvements to make a goal SMART
   */
  static suggestImprovements(goal: Partial<Goal>): string[] {
    const validation = this.validateSMARTGoal(goal);
    const improvements: string[] = [];

    if (!validation.isValid) {
      improvements.push(
        `Overall SMART score: ${validation.score.toFixed(0)}%. Aim for 75%+.`
      );

      Object.entries(validation.feedback).forEach(([criterion, feedback]) => {
        if (!feedback.met) {
          improvements.push(`${criterion.toUpperCase()}: ${feedback.feedback}`);
          improvements.push(...feedback.suggestions.map((s) => `  • ${s}`));
        }
      });
    }

    return improvements;
  }

  /**
   * Generate SMART goal from free-form text (AI-assisted)
   */
  static async generateFromText(
    userId: string,
    text: string
  ): Promise<Partial<Goal>> {
    // This would integrate with an AI service to parse text and extract goal components
    // For now, provide a structured template

    // Simple keyword matching to determine goal type
    const lowerText = text.toLowerCase();
    let type = GoalType.CUSTOM;

    if (lowerText.includes('weight') || lowerText.includes('lose')) {
      type = GoalType.WEIGHT_LOSS;
    } else if (lowerText.includes('exercise') || lowerText.includes('walk')) {
      type = GoalType.EXERCISE;
    } else if (lowerText.includes('medication') || lowerText.includes('pill')) {
      type = GoalType.MEDICATION_ADHERENCE;
    } else if (lowerText.includes('sleep')) {
      type = GoalType.SLEEP;
    } else if (lowerText.includes('eat') || lowerText.includes('nutrition')) {
      type = GoalType.NUTRITION;
    }

    // Extract numbers for targets
    const numbers = text.match(/\d+/g);
    const targetValue = numbers && numbers.length > 0 ? parseInt(numbers[0]) : 10;

    // Extract time periods
    let duration = 30; // default
    if (lowerText.includes('week')) {
      const weeks = numbers?.find((n) => parseInt(n) <= 52);
      duration = weeks ? parseInt(weeks) * 7 : 7;
    } else if (lowerText.includes('month')) {
      const months = numbers?.find((n) => parseInt(n) <= 12);
      duration = months ? parseInt(months) * 30 : 30;
    } else if (lowerText.includes('day')) {
      const days = numbers?.find((n) => parseInt(n) <= 365);
      duration = days ? parseInt(days) : 30;
    }

    const startDate = new Date();
    const targetDate = new Date();
    targetDate.setDate(startDate.getDate() + duration);

    return {
      type,
      title: text.substring(0, 100),
      description: `Goal generated from: "${text}"`,
      priority: GoalPriority.MEDIUM,
      startDate,
      targetDate,
      specific: text,
      achievable:
        'I will work consistently towards this goal with support from my care team',
      relevant: 'This goal is important for my overall health and wellbeing',
      timeBound: `Complete by ${targetDate.toLocaleDateString()}`,
      targetValue,
      currentValue: 0,
      unit: 'units',
    };
  }
}
