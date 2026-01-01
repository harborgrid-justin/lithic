/**
 * ML Model Registry
 *
 * Central registry for AI/ML models with:
 * - Model versioning
 * - Metadata tracking
 * - A/B testing support
 * - Model lifecycle management
 * - Performance tracking
 *
 * @module ai/governance/model-registry
 */

import { z } from 'zod';

/**
 * Model status
 */
export type ModelStatus =
  | 'development'
  | 'staging'
  | 'production'
  | 'deprecated'
  | 'archived';

/**
 * Model type
 */
export type ModelType =
  | 'classification'
  | 'regression'
  | 'nlp'
  | 'llm'
  | 'risk_score'
  | 'recommendation';

/**
 * Model metadata schema
 */
export const ModelMetadataSchema = z.object({
  modelId: z.string(),
  name: z.string(),
  version: z.string(),
  type: z.enum([
    'classification',
    'regression',
    'nlp',
    'llm',
    'risk_score',
    'recommendation',
  ]),
  description: z.string(),
  status: z.enum(['development', 'staging', 'production', 'deprecated', 'archived']),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),

  // Training information
  trainingData: z.object({
    datasetName: z.string(),
    datasetVersion: z.string(),
    sampleSize: z.number(),
    dateRange: z.object({
      start: z.date(),
      end: z.date(),
    }).optional(),
    features: z.array(z.string()),
  }).optional(),

  // Performance metrics
  performance: z.object({
    accuracy: z.number().optional(),
    precision: z.number().optional(),
    recall: z.number().optional(),
    f1Score: z.number().optional(),
    auc: z.number().optional(),
    rmse: z.number().optional(),
    mae: z.number().optional(),
    customMetrics: z.record(z.number()).optional(),
  }).optional(),

  // Validation
  validation: z.object({
    method: z.string(),
    validationDataSize: z.number(),
    validationResults: z.record(z.unknown()),
  }).optional(),

  // Deployment
  deployment: z.object({
    environment: z.string(),
    endpoint: z.string().optional(),
    trafficPercentage: z.number().min(0).max(100).optional(),
    rolloutStrategy: z.string().optional(),
  }).optional(),

  // Dependencies
  dependencies: z.object({
    framework: z.string().optional(),
    libraries: z.record(z.string()).optional(),
    modelFiles: z.array(z.string()).optional(),
  }).optional(),

  // Clinical validation (for healthcare models)
  clinicalValidation: z.object({
    clinicalTrialId: z.string().optional(),
    fdaApproval: z.boolean().optional(),
    validatedBy: z.array(z.string()).optional(),
    validationDate: z.date().optional(),
    sensitivityGoal: z.number().optional(),
    specificityGoal: z.number().optional(),
  }).optional(),

  // Tags and categories
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

export type ModelMetadata = z.infer<typeof ModelMetadataSchema>;

/**
 * Model comparison result
 */
export interface ModelComparison {
  baselineModel: string;
  challengerModel: string;
  metrics: Record<string, {
    baseline: number;
    challenger: number;
    improvement: number;
    significantDifference: boolean;
  }>;
  recommendation: 'promote_challenger' | 'keep_baseline' | 'requires_more_data';
  confidence: number;
}

/**
 * A/B test configuration
 */
export interface ABTestConfig {
  testId: string;
  name: string;
  modelA: string;
  modelB: string;
  trafficSplit: {
    modelA: number; // percentage
    modelB: number; // percentage
  };
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'cancelled';
  successCriteria: {
    metric: string;
    threshold: number;
    direction: 'higher' | 'lower';
  };
}

/**
 * ML Model Registry
 *
 * Centralized model management and governance
 */
export class ModelRegistry {
  private models: Map<string, ModelMetadata> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();

  /**
   * Register a new model
   *
   * @param metadata - Model metadata
   * @returns Model ID
   */
  registerModel(metadata: Omit<ModelMetadata, 'modelId' | 'createdAt' | 'updatedAt'>): string {
    const modelId = this.generateModelId(metadata.name, metadata.version);

    const fullMetadata: ModelMetadata = {
      ...metadata,
      modelId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate schema
    ModelMetadataSchema.parse(fullMetadata);

    this.models.set(modelId, fullMetadata);

    return modelId;
  }

  /**
   * Update model metadata
   *
   * @param modelId - Model ID
   * @param updates - Metadata updates
   */
  updateModel(modelId: string, updates: Partial<ModelMetadata>): void {
    const existing = this.models.get(modelId);
    if (!existing) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const updated: ModelMetadata = {
      ...existing,
      ...updates,
      modelId, // Preserve ID
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date(),
    };

    ModelMetadataSchema.parse(updated);
    this.models.set(modelId, updated);
  }

  /**
   * Get model metadata
   *
   * @param modelId - Model ID
   * @returns Model metadata
   */
  getModel(modelId: string): ModelMetadata | undefined {
    return this.models.get(modelId);
  }

  /**
   * List all models
   *
   * @param filters - Optional filters
   * @returns Array of models
   */
  listModels(filters?: {
    status?: ModelStatus;
    type?: ModelType;
    tags?: string[];
  }): ModelMetadata[] {
    let models = Array.from(this.models.values());

    if (filters) {
      if (filters.status) {
        models = models.filter(m => m.status === filters.status);
      }
      if (filters.type) {
        models = models.filter(m => m.type === filters.type);
      }
      if (filters.tags) {
        models = models.filter(m =>
          m.tags?.some(tag => filters.tags!.includes(tag))
        );
      }
    }

    return models.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Promote model to production
   *
   * @param modelId - Model ID
   * @param validationResults - Validation results
   */
  promoteToProduction(
    modelId: string,
    validationResults: Record<string, unknown>
  ): void {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Validate that model has required metrics
    if (!model.performance || Object.keys(model.performance).length === 0) {
      throw new Error('Model must have performance metrics before promotion');
    }

    // Archive previous production model if exists
    const previousProdModel = this.findProductionModel(model.name);
    if (previousProdModel) {
      this.updateModel(previousProdModel.modelId, {
        status: 'deprecated',
      });
    }

    // Promote new model
    this.updateModel(modelId, {
      status: 'production',
      validation: {
        ...model.validation,
        validationResults,
      },
      deployment: {
        ...model.deployment,
        environment: 'production',
        trafficPercentage: 100,
      },
    });
  }

  /**
   * Create A/B test for model comparison
   *
   * @param config - A/B test configuration
   * @returns Test ID
   */
  createABTest(config: Omit<ABTestConfig, 'testId'>): string {
    const testId = `ab_test_${Date.now()}`;

    // Validate models exist
    if (!this.models.has(config.modelA)) {
      throw new Error(`Model A not found: ${config.modelA}`);
    }
    if (!this.models.has(config.modelB)) {
      throw new Error(`Model B not found: ${config.modelB}`);
    }

    // Validate traffic split
    if (config.trafficSplit.modelA + config.trafficSplit.modelB !== 100) {
      throw new Error('Traffic split must sum to 100%');
    }

    const fullConfig: ABTestConfig = {
      ...config,
      testId,
    };

    this.abTests.set(testId, fullConfig);

    // Update model deployments
    this.updateModel(config.modelA, {
      deployment: {
        environment: 'production',
        trafficPercentage: config.trafficSplit.modelA,
        rolloutStrategy: `A/B test: ${testId}`,
      },
    });

    this.updateModel(config.modelB, {
      deployment: {
        environment: 'production',
        trafficPercentage: config.trafficSplit.modelB,
        rolloutStrategy: `A/B test: ${testId}`,
      },
    });

    return testId;
  }

  /**
   * Complete A/B test and select winner
   *
   * @param testId - Test ID
   * @param winnerModelId - Winning model ID
   */
  completeABTest(testId: string, winnerModelId: string): void {
    const test = this.abTests.get(testId);
    if (!test) {
      throw new Error(`A/B test not found: ${testId}`);
    }

    // Update test status
    test.status = 'completed';
    test.endDate = new Date();

    // Promote winner to 100% traffic
    this.updateModel(winnerModelId, {
      deployment: {
        environment: 'production',
        trafficPercentage: 100,
        rolloutStrategy: 'full_rollout',
      },
    });

    // Deprecate loser
    const loserModelId = winnerModelId === test.modelA ? test.modelB : test.modelA;
    this.updateModel(loserModelId, {
      status: 'deprecated',
      deployment: {
        environment: 'production',
        trafficPercentage: 0,
      },
    });
  }

  /**
   * Compare two models
   *
   * @param baselineModelId - Baseline model ID
   * @param challengerModelId - Challenger model ID
   * @returns Comparison result
   */
  compareModels(
    baselineModelId: string,
    challengerModelId: string
  ): ModelComparison {
    const baseline = this.models.get(baselineModelId);
    const challenger = this.models.get(challengerModelId);

    if (!baseline || !challenger) {
      throw new Error('Both models must exist for comparison');
    }

    if (!baseline.performance || !challenger.performance) {
      throw new Error('Both models must have performance metrics');
    }

    const metrics: ModelComparison['metrics'] = {};

    // Compare all common metrics
    const allMetrics = new Set([
      ...Object.keys(baseline.performance),
      ...Object.keys(challenger.performance),
    ]);

    allMetrics.forEach(metric => {
      const baselineValue = (baseline.performance as any)[metric];
      const challengerValue = (challenger.performance as any)[metric];

      if (baselineValue !== undefined && challengerValue !== undefined) {
        const improvement = ((challengerValue - baselineValue) / baselineValue) * 100;
        const significantDifference = Math.abs(improvement) > 5; // 5% threshold

        metrics[metric] = {
          baseline: baselineValue,
          challenger: challengerValue,
          improvement,
          significantDifference,
        };
      }
    });

    // Determine recommendation
    const significantImprovements = Object.values(metrics).filter(
      m => m.significantDifference && m.improvement > 0
    );

    let recommendation: ModelComparison['recommendation'];
    if (significantImprovements.length >= 2) {
      recommendation = 'promote_challenger';
    } else if (significantImprovements.length === 0) {
      recommendation = 'keep_baseline';
    } else {
      recommendation = 'requires_more_data';
    }

    // Calculate confidence based on sample sizes
    const baselineSample = baseline.trainingData?.sampleSize || 0;
    const challengerSample = challenger.trainingData?.sampleSize || 0;
    const minSample = Math.min(baselineSample, challengerSample);
    const confidence = Math.min((minSample / 10000) * 100, 95);

    return {
      baselineModel: baselineModelId,
      challengerModel: challengerModelId,
      metrics,
      recommendation,
      confidence,
    };
  }

  /**
   * Get model lineage (version history)
   *
   * @param modelName - Model name
   * @returns Array of model versions
   */
  getModelLineage(modelName: string): ModelMetadata[] {
    return this.listModels()
      .filter(m => m.name === modelName)
      .sort((a, b) => {
        const versionA = this.parseVersion(a.version);
        const versionB = this.parseVersion(b.version);
        return versionB - versionA;
      });
  }

  /**
   * Find current production model by name
   */
  private findProductionModel(modelName: string): ModelMetadata | undefined {
    return this.listModels({ status: 'production' }).find(m => m.name === modelName);
  }

  /**
   * Generate unique model ID
   */
  private generateModelId(name: string, version: string): string {
    const sanitizedName = name.toLowerCase().replace(/\s+/g, '_');
    const sanitizedVersion = version.replace(/\./g, '_');
    return `${sanitizedName}_${sanitizedVersion}_${Date.now()}`;
  }

  /**
   * Parse semantic version to number for sorting
   */
  private parseVersion(version: string): number {
    const parts = version.split('.').map(Number);
    return parts[0]! * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
  }

  /**
   * Export model registry to JSON
   */
  exportRegistry(): string {
    return JSON.stringify({
      models: Array.from(this.models.entries()),
      abTests: Array.from(this.abTests.entries()),
    }, null, 2);
  }

  /**
   * Import model registry from JSON
   */
  importRegistry(json: string): void {
    const data = JSON.parse(json);

    if (data.models) {
      this.models = new Map(data.models);
    }

    if (data.abTests) {
      this.abTests = new Map(data.abTests);
    }
  }
}

/**
 * Singleton model registry instance
 */
let registryInstance: ModelRegistry | null = null;

export function getModelRegistry(): ModelRegistry {
  if (!registryInstance) {
    registryInstance = new ModelRegistry();
  }
  return registryInstance;
}
