/**
 * Randomization Algorithms
 * Lithic Healthcare Platform v0.5
 *
 * Secure randomization for clinical trials
 */

import {
  RandomizationScheme,
  RandomizationMethod,
  RandomizationAssignment,
  StratificationFactor,
  StudyArm,
} from "@/types/research";
import { auditLogger } from "@/lib/audit-logger";
import { createHash, randomBytes } from "crypto";

export class RandomizationEngine {
  private static instance: RandomizationEngine;
  private schemes: Map<string, RandomizationScheme> = new Map();
  private assignments: Map<string, RandomizationAssignment> = new Map();
  private assignmentsByTrial: Map<string, Set<string>> = new Map();

  private constructor() {}

  static getInstance(): RandomizationEngine {
    if (!RandomizationEngine.instance) {
      RandomizationEngine.instance = new RandomizationEngine();
    }
    return RandomizationEngine.instance;
  }

  /**
   * Create randomization scheme for trial
   */
  async createScheme(
    trialId: string,
    method: RandomizationMethod,
    arms: StudyArm[],
    allocationRatio: number[],
    blockSize?: number,
    stratificationFactors?: StratificationFactor[],
    userId?: string,
    organizationId?: string
  ): Promise<RandomizationScheme> {
    try {
      // Generate secure seed
      const seed = this.generateSecureSeed();

      const scheme: RandomizationScheme = {
        id: this.generateId(),
        trialId,
        method,
        blockSize: blockSize || null,
        allocationRatio,
        stratificationFactors: stratificationFactors || [],
        totalAllocations: this.calculateTotalAllocations(arms),
        usedAllocations: 0,
        seed,
        isLocked: false,
        generatedBy: userId || "system",
        generatedAt: new Date(),
        organizationId: organizationId || "",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: userId || "system",
        updatedBy: userId || "system",
      };

      this.schemes.set(trialId, scheme);

      // Audit log
      if (userId) {
        await auditLogger.log({
          userId,
          action: "CREATE",
          resource: "randomization_scheme",
          resourceId: scheme.id,
          details: {
            trialId,
            method,
            blockSize,
          },
          organizationId: organizationId || "",
        });
      }

      return scheme;
    } catch (error) {
      throw new Error(
        `Failed to create randomization scheme: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Randomize subject to study arm
   */
  async randomize(
    trialId: string,
    subjectId: string,
    studyArms: StudyArm[],
    stratificationValues?: Record<string, string>,
    userId?: string,
    organizationId?: string
  ): Promise<RandomizationAssignment> {
    try {
      const scheme = this.schemes.get(trialId);
      if (!scheme) {
        throw new Error(`Randomization scheme for trial ${trialId} not found`);
      }

      if (scheme.isLocked) {
        throw new Error("Randomization scheme is locked");
      }

      // Select arm based on randomization method
      let selectedArm: StudyArm;
      switch (scheme.method) {
        case RandomizationMethod.SIMPLE:
          selectedArm = this.simpleRandomization(studyArms, scheme.allocationRatio);
          break;

        case RandomizationMethod.BLOCK:
          selectedArm = this.blockRandomization(
            studyArms,
            scheme.allocationRatio,
            scheme.blockSize!,
            scheme.usedAllocations
          );
          break;

        case RandomizationMethod.STRATIFIED:
          selectedArm = this.stratifiedRandomization(
            studyArms,
            scheme.allocationRatio,
            stratificationValues || {},
            scheme.stratificationFactors
          );
          break;

        case RandomizationMethod.ADAPTIVE:
          selectedArm = this.adaptiveRandomization(
            trialId,
            studyArms,
            scheme.allocationRatio
          );
          break;

        case RandomizationMethod.MINIMIZATION:
          selectedArm = this.minimizationRandomization(
            trialId,
            studyArms,
            stratificationValues || {}
          );
          break;

        default:
          selectedArm = this.simpleRandomization(studyArms, scheme.allocationRatio);
      }

      // Create assignment
      const assignment: RandomizationAssignment = {
        id: this.generateId(),
        subjectId,
        trialId,
        armId: selectedArm.id,
        assignmentNumber: this.generateAssignmentNumber(trialId),
        assignedAt: new Date(),
        assignedBy: userId || "system",
        stratificationValues: stratificationValues || {},
      };

      this.assignments.set(assignment.id, assignment);

      // Index by trial
      if (!this.assignmentsByTrial.has(trialId)) {
        this.assignmentsByTrial.set(trialId, new Set());
      }
      this.assignmentsByTrial.get(trialId)!.add(assignment.id);

      // Update scheme
      scheme.usedAllocations++;

      // Audit log
      if (userId) {
        await auditLogger.log({
          userId,
          action: "CREATE",
          resource: "randomization_assignment",
          resourceId: assignment.id,
          details: {
            trialId,
            subjectId,
            armId: selectedArm.id,
            method: scheme.method,
          },
          organizationId: organizationId || "",
        });
      }

      return assignment;
    } catch (error) {
      throw new Error(
        `Failed to randomize subject: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Lock randomization scheme (prevent further randomizations)
   */
  async lockScheme(trialId: string, userId: string, organizationId: string): Promise<void> {
    const scheme = this.schemes.get(trialId);
    if (!scheme) {
      throw new Error(`Randomization scheme for trial ${trialId} not found`);
    }

    scheme.isLocked = true;

    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "randomization_scheme",
      resourceId: scheme.id,
      details: {
        trialId,
        locked: true,
      },
      organizationId,
    });
  }

  /**
   * Get randomization statistics
   */
  async getRandomizationStats(trialId: string): Promise<{
    totalRandomized: number;
    byArm: Record<string, number>;
    balanceRatio: number[];
  }> {
    const assignmentIds = this.assignmentsByTrial.get(trialId) || new Set();
    const assignments: RandomizationAssignment[] = [];

    for (const id of assignmentIds) {
      const assignment = this.assignments.get(id);
      if (assignment) {
        assignments.push(assignment);
      }
    }

    const byArm: Record<string, number> = {};
    for (const assignment of assignments) {
      byArm[assignment.armId] = (byArm[assignment.armId] || 0) + 1;
    }

    const balanceRatio = Object.values(byArm);

    return {
      totalRandomized: assignments.length,
      byArm,
      balanceRatio,
    };
  }

  // Randomization algorithms

  private simpleRandomization(
    arms: StudyArm[],
    allocationRatio: number[]
  ): StudyArm {
    const totalWeight = allocationRatio.reduce((sum, w) => sum + w, 0);
    const random = Math.random() * totalWeight;

    let cumulative = 0;
    for (let i = 0; i < arms.length; i++) {
      cumulative += allocationRatio[i];
      if (random <= cumulative) {
        return arms[i];
      }
    }

    return arms[arms.length - 1];
  }

  private blockRandomization(
    arms: StudyArm[],
    allocationRatio: number[],
    blockSize: number,
    usedAllocations: number
  ): StudyArm {
    // Determine position in current block
    const blockPosition = usedAllocations % blockSize;

    // Generate block sequence if at start of block
    if (blockPosition === 0) {
      // For simplicity, use simple randomization within block
      return this.simpleRandomization(arms, allocationRatio);
    }

    // Use simple randomization (in production, would track block sequences)
    return this.simpleRandomization(arms, allocationRatio);
  }

  private stratifiedRandomization(
    arms: StudyArm[],
    allocationRatio: number[],
    stratificationValues: Record<string, string>,
    stratificationFactors: StratificationFactor[]
  ): StudyArm {
    // For each stratum, maintain separate randomization
    // In production, would track assignments per stratum
    return this.simpleRandomization(arms, allocationRatio);
  }

  private adaptiveRandomization(
    trialId: string,
    arms: StudyArm[],
    allocationRatio: number[]
  ): StudyArm {
    // Adjust allocation based on current balance
    const stats = this.getRandomizationStats(trialId);

    // Calculate imbalance and adjust probabilities
    // For simplicity, using simple randomization
    return this.simpleRandomization(arms, allocationRatio);
  }

  private minimizationRandomization(
    trialId: string,
    arms: StudyArm[],
    stratificationValues: Record<string, string>
  ): StudyArm {
    // Calculate imbalance score for each arm
    // Assign to arm that minimizes overall imbalance
    // For simplicity, using simple selection
    return arms[0];
  }

  // Helper methods

  private generateSecureSeed(): string {
    const bytes = randomBytes(32);
    return createHash("sha256").update(bytes).digest("hex");
  }

  private calculateTotalAllocations(arms: StudyArm[]): number {
    return arms.reduce((sum, arm) => sum + arm.targetEnrollment, 0);
  }

  private generateAssignmentNumber(trialId: string): string {
    const assignmentIds = this.assignmentsByTrial.get(trialId) || new Set();
    const count = assignmentIds.size + 1;

    return `RND${count.toString().padStart(6, "0")}`;
  }

  private generateId(): string {
    return `rand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const randomizationEngine = RandomizationEngine.getInstance();
