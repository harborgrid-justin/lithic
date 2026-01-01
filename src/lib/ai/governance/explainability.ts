/**
 * Model Explainability and Interpretability
 *
 * Provides explanations for AI model predictions:
 * - Feature importance (SHAP-like values)
 * - Decision paths
 * - Counterfactual explanations
 * - Confidence intervals
 * - Clinical reasoning chains
 *
 * @module ai/governance/explainability
 */

/**
 * Feature contribution to prediction
 */
export interface FeatureContribution {
  feature: string;
  value: unknown;
  contribution: number; // -1 to 1 (negative pushes down, positive pushes up)
  absoluteContribution: number; // 0 to 1
  rank: number;
  description?: string;
}

/**
 * Explanation for a prediction
 */
export interface PredictionExplanation {
  predictionId: string;
  modelId: string;
  prediction: unknown;
  confidence: number;

  // Feature importance
  topFeatures: FeatureContribution[];
  allFeatures?: FeatureContribution[];

  // Decision path
  decisionPath?: DecisionNode[];

  // Alternative outcomes
  alternatives?: AlternativeOutcome[];

  // Confidence breakdown
  confidenceFactors?: {
    dataQuality: number;
    modelCertainty: number;
    historicalAccuracy: number;
  };

  // Clinical reasoning (for healthcare models)
  clinicalReasoning?: ClinicalReasoning;

  timestamp: Date;
}

/**
 * Decision tree node
 */
export interface DecisionNode {
  level: number;
  feature: string;
  condition: string;
  branchTaken: 'left' | 'right';
  samplesAtNode: number;
  impurity: number;
}

/**
 * Alternative outcome (counterfactual)
 */
export interface AlternativeOutcome {
  outcome: unknown;
  probability: number;
  requiredChanges: Array<{
    feature: string;
    currentValue: unknown;
    requiredValue: unknown;
    feasible: boolean;
  }>;
}

/**
 * Clinical reasoning chain
 */
export interface ClinicalReasoning {
  hypothesis: string;
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  differentialDiagnoses?: string[];
  clinicalGuidelines?: string[];
  confidence: number;
}

/**
 * Model Explainability System
 *
 * Generates human-interpretable explanations for model predictions
 */
export class ModelExplainer {
  /**
   * Explain a prediction
   *
   * @param predictionId - Prediction ID
   * @param modelId - Model ID
   * @param input - Model input features
   * @param output - Model output
   * @param modelType - Type of model
   * @returns Prediction explanation
   */
  explain(
    predictionId: string,
    modelId: string,
    input: Record<string, unknown>,
    output: unknown,
    modelType: 'classification' | 'regression' | 'risk_score'
  ): PredictionExplanation {
    // Calculate feature contributions (SHAP-like values)
    const featureContributions = this.calculateFeatureContributions(
      input,
      output,
      modelType
    );

    // Rank and filter top features
    const rankedFeatures = this.rankFeatures(featureContributions);
    const topFeatures = rankedFeatures.slice(0, 10);

    // Calculate confidence
    const confidence = this.calculateConfidence(input, featureContributions);

    // Generate alternatives (counterfactuals)
    const alternatives = this.generateAlternatives(
      input,
      output,
      featureContributions
    );

    return {
      predictionId,
      modelId,
      prediction: output,
      confidence,
      topFeatures,
      allFeatures: rankedFeatures,
      alternatives,
      timestamp: new Date(),
    };
  }

  /**
   * Explain clinical risk prediction
   *
   * @param predictionId - Prediction ID
   * @param modelId - Model ID
   * @param input - Patient data
   * @param riskScore - Predicted risk score
   * @param riskFactors - Identified risk factors
   * @returns Clinical explanation
   */
  explainClinicalRisk(
    predictionId: string,
    modelId: string,
    input: Record<string, unknown>,
    riskScore: number,
    riskFactors: Array<{ factor: string; weight: number }>
  ): PredictionExplanation {
    // Convert risk factors to feature contributions
    const featureContributions: FeatureContribution[] = riskFactors.map(
      (rf, index) => ({
        feature: rf.factor,
        value: input[rf.factor],
        contribution: rf.weight,
        absoluteContribution: Math.abs(rf.weight),
        rank: index + 1,
        description: this.getFeatureDescription(rf.factor),
      })
    );

    // Build clinical reasoning
    const clinicalReasoning = this.buildClinicalReasoning(
      riskScore,
      riskFactors,
      input
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(input, featureContributions);

    return {
      predictionId,
      modelId,
      prediction: riskScore,
      confidence,
      topFeatures: featureContributions,
      clinicalReasoning,
      timestamp: new Date(),
    };
  }

  /**
   * Generate counterfactual explanations
   *
   * "What would need to change for a different outcome?"
   *
   * @param input - Current input
   * @param currentPrediction - Current prediction
   * @param targetPrediction - Desired prediction
   * @returns Array of necessary changes
   */
  generateCounterfactual(
    input: Record<string, unknown>,
    currentPrediction: number,
    targetPrediction: number
  ): Array<{
    feature: string;
    currentValue: unknown;
    targetValue: unknown;
    changeRequired: number;
    feasibility: 'easy' | 'moderate' | 'difficult' | 'impossible';
  }> {
    const changes: Array<{
      feature: string;
      currentValue: unknown;
      targetValue: unknown;
      changeRequired: number;
      feasibility: 'easy' | 'moderate' | 'difficult' | 'impossible';
    }> = [];

    // Identify modifiable features
    const modifiableFeatures = this.identifyModifiableFeatures(input);

    modifiableFeatures.forEach(feature => {
      const currentValue = input[feature];
      if (typeof currentValue !== 'number') return;

      // Estimate required change (simplified linear approximation)
      const changeRequired = Math.abs(targetPrediction - currentPrediction) * 0.1;

      // Determine feasibility
      let feasibility: 'easy' | 'moderate' | 'difficult' | 'impossible' = 'moderate';

      if (this.isImmutableFeature(feature)) {
        feasibility = 'impossible';
      } else if (changeRequired < 0.1) {
        feasibility = 'easy';
      } else if (changeRequired < 0.3) {
        feasibility = 'moderate';
      } else {
        feasibility = 'difficult';
      }

      changes.push({
        feature,
        currentValue,
        targetValue: currentValue + (targetPrediction > currentPrediction ? changeRequired : -changeRequired),
        changeRequired,
        feasibility,
      });
    });

    return changes.sort((a, b) => a.changeRequired - b.changeRequired);
  }

  /**
   * Explain feature importance globally (across all predictions)
   *
   * @param modelId - Model ID
   * @param predictions - Historical predictions
   * @returns Global feature importance
   */
  explainGlobalImportance(
    modelId: string,
    predictions: Array<{
      input: Record<string, unknown>;
      output: unknown;
    }>
  ): Array<{
    feature: string;
    importance: number;
    averageContribution: number;
    frequency: number;
  }> {
    const featureStats: Record<
      string,
      { contributions: number[]; count: number }
    > = {};

    // Aggregate contributions across all predictions
    predictions.forEach(pred => {
      const contributions = this.calculateFeatureContributions(
        pred.input,
        pred.output,
        'classification'
      );

      contributions.forEach(fc => {
        if (!featureStats[fc.feature]) {
          featureStats[fc.feature] = { contributions: [], count: 0 };
        }
        featureStats[fc.feature]!.contributions.push(fc.absoluteContribution);
        featureStats[fc.feature]!.count++;
      });
    });

    // Calculate global importance
    const globalImportance = Object.entries(featureStats).map(
      ([feature, stats]) => ({
        feature,
        importance:
          stats.contributions.reduce((sum, c) => sum + c, 0) /
          stats.contributions.length,
        averageContribution:
          stats.contributions.reduce((sum, c) => sum + c, 0) /
          stats.contributions.length,
        frequency: stats.count / predictions.length,
      })
    );

    return globalImportance.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Generate plain-English explanation
   *
   * @param explanation - Technical explanation
   * @returns Human-readable explanation
   */
  generateNaturalLanguageExplanation(
    explanation: PredictionExplanation
  ): string {
    const parts: string[] = [];

    // Main prediction
    if (typeof explanation.prediction === 'number') {
      parts.push(
        `The model predicts a score of ${explanation.prediction.toFixed(2)} with ${(explanation.confidence * 100).toFixed(0)}% confidence.`
      );
    }

    // Top contributing factors
    if (explanation.topFeatures.length > 0) {
      parts.push('\nKey factors influencing this prediction:');

      explanation.topFeatures.slice(0, 5).forEach((fc, index) => {
        const direction = fc.contribution > 0 ? 'increases' : 'decreases';
        const strength =
          Math.abs(fc.contribution) > 0.5
            ? 'strongly'
            : Math.abs(fc.contribution) > 0.25
            ? 'moderately'
            : 'slightly';

        parts.push(
          `${index + 1}. ${fc.feature}: ${strength} ${direction} the prediction`
        );
      });
    }

    // Clinical reasoning
    if (explanation.clinicalReasoning) {
      const cr = explanation.clinicalReasoning;
      parts.push(`\nClinical Reasoning: ${cr.hypothesis}`);

      if (cr.supportingEvidence.length > 0) {
        parts.push('\nSupporting Evidence:');
        cr.supportingEvidence.forEach(evidence => {
          parts.push(`- ${evidence}`);
        });
      }

      if (cr.contradictoryEvidence && cr.contradictoryEvidence.length > 0) {
        parts.push('\nConsiderations:');
        cr.contradictoryEvidence.forEach(evidence => {
          parts.push(`- ${evidence}`);
        });
      }
    }

    // Alternatives
    if (explanation.alternatives && explanation.alternatives.length > 0) {
      parts.push('\nAlternative outcomes:');
      explanation.alternatives.forEach(alt => {
        parts.push(
          `- ${alt.outcome} (${(alt.probability * 100).toFixed(0)}% probability)`
        );
      });
    }

    return parts.join('\n');
  }

  /**
   * Calculate feature contributions (simplified SHAP-like values)
   */
  private calculateFeatureContributions(
    input: Record<string, unknown>,
    output: unknown,
    modelType: string
  ): FeatureContribution[] {
    const contributions: FeatureContribution[] = [];

    Object.entries(input).forEach(([feature, value]) => {
      // Simplified contribution calculation
      // In production, would use actual SHAP values from model
      const baselineValue = this.getBaselineValue(feature);
      let contribution = 0;

      if (typeof value === 'number') {
        const deviation = value - baselineValue;
        contribution = deviation / (baselineValue || 1);
      } else if (typeof value === 'boolean') {
        contribution = value ? 0.5 : -0.5;
      } else {
        contribution = 0.3; // Categorical feature present
      }

      // Normalize to [-1, 1]
      contribution = Math.max(-1, Math.min(1, contribution));

      contributions.push({
        feature,
        value,
        contribution,
        absoluteContribution: Math.abs(contribution),
        rank: 0, // Will be set during ranking
        description: this.getFeatureDescription(feature),
      });
    });

    return contributions;
  }

  /**
   * Rank features by importance
   */
  private rankFeatures(
    contributions: FeatureContribution[]
  ): FeatureContribution[] {
    const ranked = contributions.sort(
      (a, b) => b.absoluteContribution - a.absoluteContribution
    );

    ranked.forEach((fc, index) => {
      fc.rank = index + 1;
    });

    return ranked;
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(
    input: Record<string, unknown>,
    contributions: FeatureContribution[]
  ): number {
    let confidence = 0.8; // Base confidence

    // Reduce confidence for missing data
    const missingFeatures = Object.values(input).filter(
      v => v === undefined || v === null
    ).length;
    const missingRatio = missingFeatures / Object.keys(input).length;
    confidence -= missingRatio * 0.3;

    // Reduce confidence if feature contributions are very uncertain
    const maxContribution = Math.max(
      ...contributions.map(fc => fc.absoluteContribution)
    );
    if (maxContribution < 0.2) {
      confidence -= 0.2; // Low signal = low confidence
    }

    return Math.max(0.3, Math.min(1.0, confidence));
  }

  /**
   * Generate alternative outcomes
   */
  private generateAlternatives(
    input: Record<string, unknown>,
    output: unknown,
    contributions: FeatureContribution[]
  ): AlternativeOutcome[] {
    // Simplified alternative generation
    // In production, would use actual model to generate alternatives
    return [];
  }

  /**
   * Build clinical reasoning explanation
   */
  private buildClinicalReasoning(
    riskScore: number,
    riskFactors: Array<{ factor: string; weight: number }>,
    input: Record<string, unknown>
  ): ClinicalReasoning {
    // Generate hypothesis based on risk level
    let hypothesis = '';
    if (riskScore > 75) {
      hypothesis = 'High risk identified due to multiple significant risk factors';
    } else if (riskScore > 50) {
      hypothesis = 'Moderate risk with several contributing factors';
    } else {
      hypothesis = 'Low to moderate risk based on current assessment';
    }

    // Extract supporting evidence
    const supportingEvidence = riskFactors
      .filter(rf => rf.weight > 0)
      .slice(0, 5)
      .map(rf => `${rf.factor} contributes to increased risk`);

    // Extract contradictory evidence (protective factors)
    const contradictoryEvidence = riskFactors
      .filter(rf => rf.weight < 0)
      .slice(0, 3)
      .map(rf => `${rf.factor} provides some protective effect`);

    return {
      hypothesis,
      supportingEvidence,
      contradictoryEvidence,
      confidence: this.calculateConfidence(input, []),
    };
  }

  /**
   * Get baseline value for feature
   */
  private getBaselineValue(feature: string): number {
    // In production, would use actual baseline statistics from training data
    return 0;
  }

  /**
   * Get human-readable feature description
   */
  private getFeatureDescription(feature: string): string {
    // Map technical feature names to descriptions
    const descriptions: Record<string, string> = {
      age: 'Patient age',
      previousAdmissions: 'Number of previous hospital admissions',
      comorbidityCount: 'Number of chronic conditions',
      lengthOfStay: 'Duration of hospital stay',
      // Add more as needed
    };

    return descriptions[feature] || feature;
  }

  /**
   * Identify modifiable features
   */
  private identifyModifiableFeatures(
    input: Record<string, unknown>
  ): string[] {
    const immutableFeatures = [
      'age',
      'gender',
      'race',
      'birthDate',
      'previousAdmissions',
    ];

    return Object.keys(input).filter(
      feature => !immutableFeatures.includes(feature)
    );
  }

  /**
   * Check if feature is immutable
   */
  private isImmutableFeature(feature: string): boolean {
    const immutableFeatures = [
      'age',
      'gender',
      'race',
      'birthDate',
      'previousAdmissions',
      'previousHistory',
    ];

    return immutableFeatures.includes(feature);
  }
}

/**
 * Singleton explainer instance
 */
let explainerInstance: ModelExplainer | null = null;

export function getModelExplainer(): ModelExplainer {
  if (!explainerInstance) {
    explainerInstance = new ModelExplainer();
  }
  return explainerInstance;
}
