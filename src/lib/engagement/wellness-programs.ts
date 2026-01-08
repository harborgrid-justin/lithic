/**
 * Wellness Program Management Engine
 * Agent 5: Patient Engagement Platform
 *
 * Comprehensive wellness program system including:
 * - Program enrollment and management
 * - Progress tracking
 * - Content delivery
 * - Coach assignment
 * - Completion certification
 */

import type {
  WellnessProgram,
  ProgramType,
  ProgramCategory,
  ProgramLevel,
  ProgramEnrollment,
  EnrollmentStatus,
  EnrollProgramDto,
} from "@/types/engagement";

// ============================================================================
// Wellness Programs Engine
// ============================================================================

export class WellnessProgramsEngine {
  /**
   * Enroll patient in wellness program
   */
  static async enrollPatient(
    data: EnrollProgramDto
  ): Promise<ProgramEnrollment> {
    const program = await this.getProgramById(data.programId);

    // Check eligibility
    await this.checkEligibility(data.patientId, program);

    // Check capacity
    if (program.maxParticipants && program.currentParticipants >= program.maxParticipants) {
      throw new Error("Program is at full capacity");
    }

    const now = new Date();

    const enrollment: ProgramEnrollment = {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: data.patientId,
      updatedBy: data.patientId,
      programId: data.programId,
      program,
      patientId: data.patientId,
      enrolledDate: now,
      startedDate: null,
      completedDate: null,
      status: EnrollmentStatus.ENROLLED,
      progress: 0,
      currentWeek: 0,
      completedContent: [],
      completedActivities: [],
      notes: null,
      coachId: data.coachId || null,
    };

    // Update program participant count
    program.currentParticipants++;

    return enrollment;
  }

  /**
   * Start a program (move from enrolled to active)
   */
  static async startProgram(enrollmentId: string): Promise<ProgramEnrollment> {
    const enrollment = await this.getEnrollmentById(enrollmentId);

    if (enrollment.status !== EnrollmentStatus.ENROLLED) {
      throw new Error("Program must be in enrolled status to start");
    }

    enrollment.status = EnrollmentStatus.ACTIVE;
    enrollment.startedDate = new Date();
    enrollment.currentWeek = 1;
    enrollment.updatedAt = new Date();

    return enrollment;
  }

  /**
   * Mark content as completed
   */
  static async completeContent(
    enrollmentId: string,
    contentId: string
  ): Promise<{
    enrollment: ProgramEnrollment;
    pointsEarned: number;
    programCompleted: boolean;
  }> {
    const enrollment = await this.getEnrollmentById(enrollmentId);

    if (!enrollment.completedContent.includes(contentId)) {
      enrollment.completedContent.push(contentId);
    }

    // Calculate progress
    const totalContent = this.getTotalContentCount(enrollment.program);
    const progress = (enrollment.completedContent.length / totalContent) * 100;
    enrollment.progress = Math.min(progress, 100);
    enrollment.updatedAt = new Date();

    // Check if program is completed
    const programCompleted = enrollment.progress >= 100;
    if (programCompleted && enrollment.status === EnrollmentStatus.ACTIVE) {
      enrollment.status = EnrollmentStatus.COMPLETED;
      enrollment.completedDate = new Date();
    }

    // Calculate points
    const pointsEarned = programCompleted
      ? enrollment.program.rewards.points
      : Math.round(enrollment.program.rewards.points * 0.1);

    return {
      enrollment,
      pointsEarned,
      programCompleted,
    };
  }

  /**
   * Advance to next week
   */
  static async advanceWeek(enrollmentId: string): Promise<ProgramEnrollment> {
    const enrollment = await this.getEnrollmentById(enrollmentId);
    const currentWeekContent = enrollment.program.content.find(
      (c) => c.week === enrollment.currentWeek
    );

    if (!currentWeekContent) {
      throw new Error("Current week content not found");
    }

    // Check if current week is completed
    const weekCompleted = currentWeekContent.contentIds.every((id) =>
      enrollment.completedContent.includes(id)
    );

    if (!weekCompleted) {
      throw new Error("Complete current week before advancing");
    }

    enrollment.currentWeek++;
    enrollment.updatedAt = new Date();

    return enrollment;
  }

  /**
   * Get recommended programs for patient
   */
  static async getRecommendations(
    patientId: string,
    healthData: HealthProfile
  ): Promise<ProgramRecommendation[]> {
    const allPrograms = await this.getActivePrograms();
    const recommendations: ProgramRecommendation[] = [];

    for (const program of allPrograms) {
      const matchScore = this.calculateMatchScore(program, healthData);

      if (matchScore > 0.5) {
        recommendations.push({
          program,
          matchScore,
          reasons: this.getRecommendationReasons(program, healthData),
          estimatedDuration: program.duration,
        });
      }
    }

    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  /**
   * Calculate how well a program matches patient profile
   */
  private static calculateMatchScore(
    program: WellnessProgram,
    healthData: HealthProfile
  ): number {
    let score = 0;
    let factors = 0;

    // Age match
    if (program.targetAudience.ageMin !== null || program.targetAudience.ageMax !== null) {
      const age = healthData.age;
      const minMatch = !program.targetAudience.ageMin || age >= program.targetAudience.ageMin;
      const maxMatch = !program.targetAudience.ageMax || age <= program.targetAudience.ageMax;

      if (minMatch && maxMatch) {
        score += 1;
      }
      factors++;
    }

    // Condition match
    if (program.targetAudience.conditions.length > 0 && healthData.conditions) {
      const hasMatchingCondition = program.targetAudience.conditions.some((c) =>
        healthData.conditions?.includes(c)
      );
      if (hasMatchingCondition) {
        score += 2; // Higher weight for condition match
      }
      factors++;
    }

    // Risk factor match
    if (program.targetAudience.riskFactors.length > 0 && healthData.riskFactors) {
      const matchingRiskFactors = program.targetAudience.riskFactors.filter((rf) =>
        healthData.riskFactors?.includes(rf)
      );
      score += matchingRiskFactors.length / program.targetAudience.riskFactors.length;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Get reasons why program is recommended
   */
  private static getRecommendationReasons(
    program: WellnessProgram,
    healthData: HealthProfile
  ): string[] {
    const reasons: string[] = [];

    // Condition-based reasons
    if (program.targetAudience.conditions.length > 0 && healthData.conditions) {
      const matchingConditions = program.targetAudience.conditions.filter((c) =>
        healthData.conditions?.includes(c)
      );
      matchingConditions.forEach((condition) => {
        reasons.push(`Designed for patients with ${condition}`);
      });
    }

    // Risk factor reasons
    if (program.targetAudience.riskFactors.length > 0 && healthData.riskFactors) {
      const matchingRiskFactors = program.targetAudience.riskFactors.filter((rf) =>
        healthData.riskFactors?.includes(rf)
      );
      if (matchingRiskFactors.length > 0) {
        reasons.push(`Addresses your risk factors`);
      }
    }

    // Category-based reasons
    switch (program.category) {
      case ProgramCategory.WEIGHT_MANAGEMENT:
        if (healthData.bmi && healthData.bmi > 25) {
          reasons.push("BMI indicates weight management would be beneficial");
        }
        break;
      case ProgramCategory.DIABETES_MANAGEMENT:
        if (healthData.a1c && healthData.a1c > 7) {
          reasons.push("A1C levels suggest diabetes management focus");
        }
        break;
      case ProgramCategory.CARDIAC_REHABILITATION:
        if (healthData.bloodPressure && healthData.bloodPressure.systolic > 130) {
          reasons.push("Blood pressure indicates cardiovascular focus needed");
        }
        break;
    }

    return reasons;
  }

  /**
   * Get enrollment statistics
   */
  static async getEnrollmentStats(
    patientId: string
  ): Promise<EnrollmentStatistics> {
    const enrollments = await this.getPatientEnrollments(patientId);

    const active = enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE);
    const completed = enrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED);
    const dropped = enrollments.filter((e) => e.status === EnrollmentStatus.DROPPED);

    const completionRate = enrollments.length > 0
      ? completed.length / enrollments.length
      : 0;

    const avgProgress = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
      : 0;

    return {
      totalEnrollments: enrollments.length,
      activePrograms: active.length,
      completedPrograms: completed.length,
      droppedPrograms: dropped.length,
      completionRate,
      averageProgress: avgProgress,
      totalPointsEarned: this.calculateTotalProgramPoints(completed),
    };
  }

  /**
   * Drop out of program
   */
  static async dropProgram(
    enrollmentId: string,
    reason?: string
  ): Promise<ProgramEnrollment> {
    const enrollment = await this.getEnrollmentById(enrollmentId);

    enrollment.status = EnrollmentStatus.DROPPED;
    enrollment.updatedAt = new Date();
    enrollment.notes = reason || null;

    return enrollment;
  }

  /**
   * Put program on hold
   */
  static async pauseProgram(
    enrollmentId: string,
    reason?: string
  ): Promise<ProgramEnrollment> {
    const enrollment = await this.getEnrollmentById(enrollmentId);

    enrollment.status = EnrollmentStatus.ON_HOLD;
    enrollment.updatedAt = new Date();
    enrollment.notes = reason || null;

    return enrollment;
  }

  /**
   * Resume program from hold
   */
  static async resumeProgram(enrollmentId: string): Promise<ProgramEnrollment> {
    const enrollment = await this.getEnrollmentById(enrollmentId);

    if (enrollment.status !== EnrollmentStatus.ON_HOLD) {
      throw new Error("Can only resume programs that are on hold");
    }

    enrollment.status = EnrollmentStatus.ACTIVE;
    enrollment.updatedAt = new Date();

    return enrollment;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static async checkEligibility(
    patientId: string,
    program: WellnessProgram
  ): Promise<void> {
    // Would check age, conditions, etc.
    // Throw error if not eligible
  }

  private static getTotalContentCount(program: WellnessProgram): number {
    return program.content.reduce((sum, week) => sum + week.contentIds.length, 0);
  }

  private static calculateTotalProgramPoints(
    completedEnrollments: ProgramEnrollment[]
  ): number {
    return completedEnrollments.reduce(
      (sum, e) => sum + e.program.rewards.points,
      0
    );
  }

  private static async getProgramById(programId: string): Promise<WellnessProgram> {
    // Mock - would query database
    throw new Error("Not implemented");
  }

  private static async getEnrollmentById(
    enrollmentId: string
  ): Promise<ProgramEnrollment> {
    // Mock - would query database
    throw new Error("Not implemented");
  }

  private static async getActivePrograms(): Promise<WellnessProgram[]> {
    // Mock - would query database
    return [];
  }

  private static async getPatientEnrollments(
    patientId: string
  ): Promise<ProgramEnrollment[]> {
    // Mock - would query database
    return [];
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface HealthProfile {
  age: number;
  conditions?: string[];
  riskFactors?: string[];
  bmi?: number;
  a1c?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
}

interface ProgramRecommendation {
  program: WellnessProgram;
  matchScore: number;
  reasons: string[];
  estimatedDuration: number;
}

interface EnrollmentStatistics {
  totalEnrollments: number;
  activePrograms: number;
  completedPrograms: number;
  droppedPrograms: number;
  completionRate: number;
  averageProgress: number;
  totalPointsEarned: number;
}
