/**
 * OR Case Duration Predictor
 * ML-based duration prediction using historical analysis and surgeon-specific models
 */

import type { SurgicalCase, CaseDurationPrediction, PatientFactors, ASAClass, CaseComplexity } from "@/types/or-management";

export interface PredictionModel {
  procedureId: string;
  surgeonId: string | null;
  sampleSize: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  percentile25: number;
  percentile75: number;
  percentile90: number;
  lastUpdated: Date;
}

export interface DurationFactors {
  baselineDuration: number;
  ageAdjustment: number;
  bmiAdjustment: number;
  asaAdjustment: number;
  complexityAdjustment: number;
  surgeonExperienceAdjustment: number;
  teamFamiliarityAdjustment: number;
  timeOfDayAdjustment: number;
}

export class DurationPredictor {
  private models: Map<string, PredictionModel> = new Map();

  // --------------------------------------------------------------------------
  // Prediction
  // --------------------------------------------------------------------------

  predictDuration(
    procedureId: string,
    surgeonId: string,
    patientFactors: PatientFactors,
    historicalCases: SurgicalCase[]
  ): CaseDurationPrediction {
    // Build or retrieve models
    const procedureModel = this.buildModel(procedureId, null, historicalCases);
    const surgeonProcedureModel = this.buildModel(procedureId, surgeonId, historicalCases);
    const surgeonModel = this.buildModel(null, surgeonId, historicalCases);

    // Calculate base duration
    let baseDuration: number;
    let confidence: number;

    if (surgeonProcedureModel.sampleSize >= 5) {
      baseDuration = surgeonProcedureModel.median;
      confidence = Math.min(95, 70 + surgeonProcedureModel.sampleSize * 2);
    } else if (procedureModel.sampleSize >= 10) {
      baseDuration = procedureModel.median;
      confidence = Math.min(90, 60 + procedureModel.sampleSize);
    } else if (surgeonModel.sampleSize >= 10) {
      baseDuration = surgeonModel.median;
      confidence = Math.max(40, 50 + surgeonModel.sampleSize);
    } else {
      baseDuration = 90; // Default assumption
      confidence = 30;
    }

    // Apply patient-specific adjustments
    const factors = this.calculateAdjustments(patientFactors, baseDuration);
    const adjustedDuration = this.applyAdjustments(baseDuration, factors);

    // Calculate confidence interval
    const stdDev = surgeonProcedureModel.sampleSize >= 5
      ? surgeonProcedureModel.stdDev
      : procedureModel.stdDev;

    const confidenceInterval = {
      lower: Math.max(15, Math.round(adjustedDuration - stdDev)),
      upper: Math.round(adjustedDuration + stdDev),
    };

    return {
      procedureId,
      procedureName: "", // Would be looked up
      surgeonId,
      patientFactors,
      historicalAverage: procedureModel.mean,
      surgeonAverage: surgeonProcedureModel.mean || surgeonModel.mean,
      predictedDuration: Math.round(adjustedDuration),
      confidenceInterval,
      confidence,
    };
  }

  // --------------------------------------------------------------------------
  // Model Building
  // --------------------------------------------------------------------------

  private buildModel(
    procedureId: string | null,
    surgeonId: string | null,
    historicalCases: SurgicalCase[]
  ): PredictionModel {
    const modelKey = `${procedureId || "all"}_${surgeonId || "all"}`;

    // Check cache
    const cached = this.models.get(modelKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    // Filter relevant cases
    const relevantCases = historicalCases.filter((c) => {
      if (!c.actualDuration || c.status !== "COMPLETED") return false;
      if (procedureId && c.procedureId !== procedureId) return false;
      if (surgeonId && c.surgeonId !== surgeonId) return false;
      return true;
    });

    if (relevantCases.length === 0) {
      return this.getDefaultModel(procedureId, surgeonId);
    }

    const durations = relevantCases
      .map((c) => c.actualDuration!)
      .sort((a, b) => a - b);

    const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const median = this.calculateMedian(durations);
    const stdDev = this.calculateStdDev(durations, mean);

    const model: PredictionModel = {
      procedureId: procedureId || "all",
      surgeonId,
      sampleSize: durations.length,
      mean,
      median,
      stdDev,
      min: durations[0],
      max: durations[durations.length - 1],
      percentile25: this.calculatePercentile(durations, 25),
      percentile75: this.calculatePercentile(durations, 75),
      percentile90: this.calculatePercentile(durations, 90),
      lastUpdated: new Date(),
    };

    this.models.set(modelKey, model);
    return model;
  }

  private getDefaultModel(
    procedureId: string | null,
    surgeonId: string | null
  ): PredictionModel {
    return {
      procedureId: procedureId || "all",
      surgeonId,
      sampleSize: 0,
      mean: 90,
      median: 90,
      stdDev: 30,
      min: 30,
      max: 240,
      percentile25: 60,
      percentile75: 120,
      percentile90: 150,
      lastUpdated: new Date(),
    };
  }

  private isCacheValid(model: PredictionModel): boolean {
    const hoursSinceUpdate =
      (Date.now() - model.lastUpdated.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < 24;
  }

  // --------------------------------------------------------------------------
  // Adjustments
  // --------------------------------------------------------------------------

  private calculateAdjustments(
    factors: PatientFactors,
    baseDuration: number
  ): DurationFactors {
    let ageAdjustment = 0;
    let bmiAdjustment = 0;
    let asaAdjustment = 0;
    let complexityAdjustment = 0;

    // Age adjustments
    if (factors.age > 75) {
      ageAdjustment = baseDuration * 0.15;
    } else if (factors.age > 65) {
      ageAdjustment = baseDuration * 0.1;
    } else if (factors.age < 5) {
      ageAdjustment = baseDuration * 0.12;
    }

    // BMI adjustments
    if (factors.bmi > 40) {
      bmiAdjustment = baseDuration * 0.2;
    } else if (factors.bmi > 35) {
      bmiAdjustment = baseDuration * 0.15;
    } else if (factors.bmi > 30) {
      bmiAdjustment = baseDuration * 0.1;
    }

    // ASA class adjustments
    const asaMultipliers: Record<ASAClass, number> = {
      [ASAClass.I]: 0,
      [ASAClass.II]: 0.05,
      [ASAClass.III]: 0.1,
      [ASAClass.IV]: 0.15,
      [ASAClass.V]: 0.2,
      [ASAClass.VI]: 0,
    };
    asaAdjustment = baseDuration * (asaMultipliers[factors.asa] || 0);

    // Complexity adjustments
    const complexityMultipliers: Record<CaseComplexity, number> = {
      [CaseComplexity.SIMPLE]: -0.1,
      [CaseComplexity.MODERATE]: 0,
      [CaseComplexity.COMPLEX]: 0.15,
      [CaseComplexity.HIGHLY_COMPLEX]: 0.3,
    };
    complexityAdjustment =
      baseDuration * (complexityMultipliers[factors.complexity] || 0);

    return {
      baselineDuration: baseDuration,
      ageAdjustment,
      bmiAdjustment,
      asaAdjustment,
      complexityAdjustment,
      surgeonExperienceAdjustment: 0,
      teamFamiliarityAdjustment: 0,
      timeOfDayAdjustment: 0,
    };
  }

  private applyAdjustments(
    baseDuration: number,
    factors: DurationFactors
  ): number {
    return (
      factors.baselineDuration +
      factors.ageAdjustment +
      factors.bmiAdjustment +
      factors.asaAdjustment +
      factors.complexityAdjustment +
      factors.surgeonExperienceAdjustment +
      factors.teamFamiliarityAdjustment +
      factors.timeOfDayAdjustment
    );
  }

  // --------------------------------------------------------------------------
  // Accuracy Analysis
  // --------------------------------------------------------------------------

  analyzeAccuracy(
    predictions: Array<{ predicted: number; actual: number }>
  ): {
    meanAbsoluteError: number;
    meanPercentageError: number;
    accuracy: number;
    withinTolerance: number;
  } {
    if (predictions.length === 0) {
      return {
        meanAbsoluteError: 0,
        meanPercentageError: 0,
        accuracy: 0,
        withinTolerance: 0,
      };
    }

    const errors = predictions.map((p) => Math.abs(p.predicted - p.actual));
    const percentageErrors = predictions.map(
      (p) => (Math.abs(p.predicted - p.actual) / p.actual) * 100
    );

    const meanAbsoluteError =
      errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const meanPercentageError =
      percentageErrors.reduce((sum, e) => sum + e, 0) / percentageErrors.length;

    const within15Minutes = predictions.filter(
      (p) => Math.abs(p.predicted - p.actual) <= 15
    ).length;
    const withinTolerance = (within15Minutes / predictions.length) * 100;

    const accuracy = 100 - meanPercentageError;

    return {
      meanAbsoluteError,
      meanPercentageError,
      accuracy,
      withinTolerance,
    };
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  private calculateMedian(sorted: number[]): number {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateStdDev(values: number[], mean: number): number {
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculatePercentile(sorted: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  updateModelWithCase(completedCase: SurgicalCase): void {
    // Clear relevant cached models to force rebuild with new data
    const procedureKey = `${completedCase.procedureId}_all`;
    const surgeonKey = `all_${completedCase.surgeonId}`;
    const bothKey = `${completedCase.procedureId}_${completedCase.surgeonId}`;

    this.models.delete(procedureKey);
    this.models.delete(surgeonKey);
    this.models.delete(bothKey);
  }
}

let predictorInstance: DurationPredictor | null = null;

export function getDurationPredictor(): DurationPredictor {
  if (!predictorInstance) {
    predictorInstance = new DurationPredictor();
  }
  return predictorInstance;
}
