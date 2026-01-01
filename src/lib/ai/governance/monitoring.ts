/**
 * AI Model Monitoring
 *
 * Real-time monitoring system for AI models:
 * - Prediction performance tracking
 * - Data drift detection
 * - Model degradation alerts
 * - Usage analytics
 * - Error tracking
 *
 * @module ai/governance/monitoring
 */

/**
 * Prediction record for monitoring
 */
export interface PredictionRecord {
  predictionId: string;
  modelId: string;
  modelVersion: string;
  timestamp: Date;
  input: Record<string, unknown>;
  output: unknown;
  confidence?: number;
  latencyMs: number;
  userId?: string;
  context?: Record<string, unknown>;
}

/**
 * Prediction outcome (ground truth)
 */
export interface PredictionOutcome {
  predictionId: string;
  actualOutcome: unknown;
  correct: boolean;
  timestamp: Date;
}

/**
 * Model performance metrics
 */
export interface PerformanceMetrics {
  modelId: string;
  timeWindow: {
    start: Date;
    end: Date;
  };
  totalPredictions: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  auc?: number;
  rmse?: number;
  mae?: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  customMetrics?: Record<string, number>;
}

/**
 * Drift detection result
 */
export interface DriftDetectionResult {
  modelId: string;
  driftDetected: boolean;
  driftScore: number; // 0-1, higher means more drift
  driftType: 'none' | 'data_drift' | 'concept_drift' | 'both';
  affectedFeatures: string[];
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  timestamp: Date;
}

/**
 * Model alert
 */
export interface ModelAlert {
  alertId: string;
  modelId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'performance_degradation' | 'drift_detected' | 'high_error_rate' | 'latency_spike';
  message: string;
  details: Record<string, unknown>;
  timestamp: Date;
  acknowledged: boolean;
}

/**
 * Usage statistics
 */
export interface UsageStatistics {
  modelId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  totalPredictions: number;
  uniqueUsers: number;
  averageConfidence: number;
  predictionsByCategory?: Record<string, number>;
  predictionsByUser?: Record<string, number>;
}

/**
 * AI Model Monitoring System
 *
 * Tracks model performance, detects drift, and generates alerts
 */
export class ModelMonitor {
  private predictions: Map<string, PredictionRecord> = new Map();
  private outcomes: Map<string, PredictionOutcome> = new Map();
  private alerts: ModelAlert[] = [];
  private baselineDistributions: Map<string, FeatureDistribution> = new Map();

  // Thresholds
  private readonly PERFORMANCE_DROP_THRESHOLD = 0.05; // 5% drop
  private readonly DRIFT_THRESHOLD = 0.15;
  private readonly ERROR_RATE_THRESHOLD = 0.10; // 10%
  private readonly LATENCY_THRESHOLD_MS = 5000;

  /**
   * Log a prediction
   *
   * @param record - Prediction record
   */
  logPrediction(record: PredictionRecord): void {
    this.predictions.set(record.predictionId, record);

    // Check for latency issues
    if (record.latencyMs > this.LATENCY_THRESHOLD_MS) {
      this.createAlert({
        modelId: record.modelId,
        severity: 'medium',
        type: 'latency_spike',
        message: `Prediction latency exceeded threshold: ${record.latencyMs}ms`,
        details: { predictionId: record.predictionId, latencyMs: record.latencyMs },
      });
    }
  }

  /**
   * Log prediction outcome (ground truth)
   *
   * @param outcome - Prediction outcome
   */
  logOutcome(outcome: PredictionOutcome): void {
    this.outcomes.set(outcome.predictionId, outcome);
  }

  /**
   * Calculate performance metrics for a time window
   *
   * @param modelId - Model ID
   * @param timeWindow - Time window
   * @returns Performance metrics
   */
  calculatePerformanceMetrics(
    modelId: string,
    timeWindow: { start: Date; end: Date }
  ): PerformanceMetrics {
    // Filter predictions for this model and time window
    const modelPredictions = Array.from(this.predictions.values()).filter(
      p =>
        p.modelId === modelId &&
        p.timestamp >= timeWindow.start &&
        p.timestamp <= timeWindow.end
    );

    if (modelPredictions.length === 0) {
      throw new Error('No predictions found for this time window');
    }

    // Get outcomes for these predictions
    const predictionsWithOutcomes = modelPredictions
      .map(p => ({
        prediction: p,
        outcome: this.outcomes.get(p.predictionId),
      }))
      .filter(po => po.outcome !== undefined);

    // Calculate accuracy
    const accuracy =
      predictionsWithOutcomes.length > 0
        ? predictionsWithOutcomes.filter(po => po.outcome!.correct).length /
          predictionsWithOutcomes.length
        : undefined;

    // Calculate latency metrics
    const latencies = modelPredictions.map(p => p.latencyMs).sort((a, b) => a - b);
    const averageLatencyMs =
      latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const p95LatencyMs = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99LatencyMs = latencies[Math.floor(latencies.length * 0.99)] || 0;

    // Calculate error rate (predictions without outcomes or with errors)
    const errorRate =
      1 - predictionsWithOutcomes.length / modelPredictions.length;

    return {
      modelId,
      timeWindow,
      totalPredictions: modelPredictions.length,
      accuracy,
      averageLatencyMs,
      p95LatencyMs,
      p99LatencyMs,
      errorRate,
    };
  }

  /**
   * Detect data drift
   *
   * @param modelId - Model ID
   * @param currentWindow - Current time window
   * @returns Drift detection result
   */
  detectDrift(
    modelId: string,
    currentWindow: { start: Date; end: Date }
  ): DriftDetectionResult {
    // Get current predictions
    const currentPredictions = Array.from(this.predictions.values()).filter(
      p =>
        p.modelId === modelId &&
        p.timestamp >= currentWindow.start &&
        p.timestamp <= currentWindow.end
    );

    if (currentPredictions.length < 100) {
      return {
        modelId,
        driftDetected: false,
        driftScore: 0,
        driftType: 'none',
        affectedFeatures: [],
        severity: 'none',
        recommendations: ['Insufficient data for drift detection (minimum 100 samples)'],
        timestamp: new Date(),
      };
    }

    // Get baseline distribution
    const baseline = this.baselineDistributions.get(modelId);
    if (!baseline) {
      // Set current as baseline
      this.setBaseline(modelId, currentPredictions);
      return {
        modelId,
        driftDetected: false,
        driftScore: 0,
        driftType: 'none',
        affectedFeatures: [],
        severity: 'none',
        recommendations: ['Baseline distribution established'],
        timestamp: new Date(),
      };
    }

    // Calculate drift for each feature
    const featureDriftScores = this.calculateFeatureDrift(
      currentPredictions,
      baseline
    );

    // Determine affected features
    const affectedFeatures = Object.entries(featureDriftScores)
      .filter(([, score]) => score > this.DRIFT_THRESHOLD)
      .map(([feature]) => feature);

    // Calculate overall drift score
    const driftScore =
      Object.values(featureDriftScores).reduce((sum, score) => sum + score, 0) /
      Object.keys(featureDriftScores).length;

    const driftDetected = driftScore > this.DRIFT_THRESHOLD;

    // Determine severity
    let severity: DriftDetectionResult['severity'] = 'none';
    if (driftScore > 0.4) severity = 'critical';
    else if (driftScore > 0.3) severity = 'high';
    else if (driftScore > 0.2) severity = 'medium';
    else if (driftScore > this.DRIFT_THRESHOLD) severity = 'low';

    // Generate recommendations
    const recommendations: string[] = [];
    if (driftDetected) {
      recommendations.push('Model retraining recommended');
      recommendations.push(`Monitor affected features: ${affectedFeatures.join(', ')}`);

      if (severity === 'critical' || severity === 'high') {
        recommendations.push('Consider rolling back to previous model version');
        recommendations.push('Investigate root cause of drift');
      }
    }

    // Create alert if drift is significant
    if (severity === 'high' || severity === 'critical') {
      this.createAlert({
        modelId,
        severity: severity === 'critical' ? 'critical' : 'high',
        type: 'drift_detected',
        message: `${severity.toUpperCase()} data drift detected`,
        details: {
          driftScore,
          affectedFeatures,
        },
      });
    }

    return {
      modelId,
      driftDetected,
      driftScore,
      driftType: driftDetected ? 'data_drift' : 'none',
      affectedFeatures,
      severity,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Monitor model performance degradation
   *
   * @param modelId - Model ID
   * @param currentMetrics - Current performance metrics
   * @param baselineMetrics - Baseline performance metrics
   */
  monitorPerformanceDegradation(
    modelId: string,
    currentMetrics: PerformanceMetrics,
    baselineMetrics: PerformanceMetrics
  ): void {
    // Check accuracy drop
    if (currentMetrics.accuracy && baselineMetrics.accuracy) {
      const accuracyDrop = baselineMetrics.accuracy - currentMetrics.accuracy;
      if (accuracyDrop > this.PERFORMANCE_DROP_THRESHOLD) {
        this.createAlert({
          modelId,
          severity: accuracyDrop > 0.10 ? 'high' : 'medium',
          type: 'performance_degradation',
          message: `Model accuracy dropped by ${(accuracyDrop * 100).toFixed(1)}%`,
          details: {
            currentAccuracy: currentMetrics.accuracy,
            baselineAccuracy: baselineMetrics.accuracy,
          },
        });
      }
    }

    // Check error rate
    if (currentMetrics.errorRate > this.ERROR_RATE_THRESHOLD) {
      this.createAlert({
        modelId,
        severity: currentMetrics.errorRate > 0.20 ? 'critical' : 'high',
        type: 'high_error_rate',
        message: `Error rate exceeded threshold: ${(currentMetrics.errorRate * 100).toFixed(1)}%`,
        details: {
          errorRate: currentMetrics.errorRate,
          threshold: this.ERROR_RATE_THRESHOLD,
        },
      });
    }
  }

  /**
   * Get usage statistics
   *
   * @param modelId - Model ID
   * @param period - Time period
   * @returns Usage statistics
   */
  getUsageStatistics(
    modelId: string,
    period: 'hour' | 'day' | 'week' | 'month'
  ): UsageStatistics {
    const now = new Date();
    const start = this.getStartDateForPeriod(now, period);

    const predictions = Array.from(this.predictions.values()).filter(
      p => p.modelId === modelId && p.timestamp >= start && p.timestamp <= now
    );

    const uniqueUsers = new Set(predictions.map(p => p.userId).filter(Boolean)).size;

    const averageConfidence =
      predictions.filter(p => p.confidence !== undefined).length > 0
        ? predictions
            .filter(p => p.confidence !== undefined)
            .reduce((sum, p) => sum + (p.confidence || 0), 0) /
          predictions.filter(p => p.confidence !== undefined).length
        : 0;

    return {
      modelId,
      period,
      totalPredictions: predictions.length,
      uniqueUsers,
      averageConfidence,
    };
  }

  /**
   * Get active alerts
   *
   * @param modelId - Optional model ID filter
   * @param severity - Optional severity filter
   * @returns Array of alerts
   */
  getActiveAlerts(
    modelId?: string,
    severity?: ModelAlert['severity']
  ): ModelAlert[] {
    let alerts = this.alerts.filter(a => !a.acknowledged);

    if (modelId) {
      alerts = alerts.filter(a => a.modelId === modelId);
    }

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Acknowledge alert
   *
   * @param alertId - Alert ID
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.alertId === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Set baseline distribution for drift detection
   */
  private setBaseline(modelId: string, predictions: PredictionRecord[]): void {
    const distribution = this.calculateFeatureDistribution(predictions);
    this.baselineDistributions.set(modelId, distribution);
  }

  /**
   * Calculate feature distribution from predictions
   */
  private calculateFeatureDistribution(
    predictions: PredictionRecord[]
  ): FeatureDistribution {
    const distribution: FeatureDistribution = {};

    // Extract all features
    const allFeatures = new Set<string>();
    predictions.forEach(p => {
      Object.keys(p.input).forEach(key => allFeatures.add(key));
    });

    // Calculate distribution for each feature
    allFeatures.forEach(feature => {
      const values = predictions
        .map(p => p.input[feature])
        .filter(v => v !== undefined && v !== null);

      if (values.length === 0) return;

      // Determine if numeric or categorical
      const isNumeric = values.every(v => typeof v === 'number');

      if (isNumeric) {
        const numericValues = values as number[];
        const mean =
          numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
        const variance =
          numericValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
          numericValues.length;

        distribution[feature] = {
          type: 'numeric',
          mean,
          std: Math.sqrt(variance),
        };
      } else {
        // Categorical
        const counts: Record<string, number> = {};
        values.forEach(v => {
          const key = String(v);
          counts[key] = (counts[key] || 0) + 1;
        });

        distribution[feature] = {
          type: 'categorical',
          frequencies: counts,
        };
      }
    });

    return distribution;
  }

  /**
   * Calculate drift score for each feature
   */
  private calculateFeatureDrift(
    currentPredictions: PredictionRecord[],
    baseline: FeatureDistribution
  ): Record<string, number> {
    const current = this.calculateFeatureDistribution(currentPredictions);
    const driftScores: Record<string, number> = {};

    Object.keys(baseline).forEach(feature => {
      const baselineDist = baseline[feature];
      const currentDist = current[feature];

      if (!currentDist) {
        driftScores[feature] = 1.0; // Feature missing = maximum drift
        return;
      }

      if (baselineDist.type === 'numeric' && currentDist.type === 'numeric') {
        // Calculate standardized difference in means
        const meanDiff = Math.abs(currentDist.mean - baselineDist.mean);
        const pooledStd = (baselineDist.std + currentDist.std) / 2;
        driftScores[feature] = pooledStd > 0 ? meanDiff / pooledStd : 0;
      } else if (
        baselineDist.type === 'categorical' &&
        currentDist.type === 'categorical'
      ) {
        // Calculate Jensen-Shannon divergence
        driftScores[feature] = this.calculateJSDivergence(
          baselineDist.frequencies,
          currentDist.frequencies
        );
      }
    });

    return driftScores;
  }

  /**
   * Calculate Jensen-Shannon divergence for categorical distributions
   */
  private calculateJSDivergence(
    p: Record<string, number>,
    q: Record<string, number>
  ): number {
    // Normalize distributions
    const pTotal = Object.values(p).reduce((sum, v) => sum + v, 0);
    const qTotal = Object.values(q).reduce((sum, v) => sum + v, 0);

    const pNorm: Record<string, number> = {};
    const qNorm: Record<string, number> = {};

    Object.keys(p).forEach(k => (pNorm[k] = p[k]! / pTotal));
    Object.keys(q).forEach(k => (qNorm[k] = q[k]! / qTotal));

    // Get all categories
    const allCategories = new Set([...Object.keys(p), ...Object.keys(q)]);

    // Calculate M = (P + Q) / 2
    const m: Record<string, number> = {};
    allCategories.forEach(cat => {
      m[cat] = ((pNorm[cat] || 0) + (qNorm[cat] || 0)) / 2;
    });

    // Calculate KL divergences
    let klPM = 0;
    let klQM = 0;

    allCategories.forEach(cat => {
      const pVal = pNorm[cat] || 0;
      const qVal = qNorm[cat] || 0;
      const mVal = m[cat]!;

      if (pVal > 0 && mVal > 0) {
        klPM += pVal * Math.log2(pVal / mVal);
      }
      if (qVal > 0 && mVal > 0) {
        klQM += qVal * Math.log2(qVal / mVal);
      }
    });

    // JS divergence = (KL(P||M) + KL(Q||M)) / 2
    return (klPM + klQM) / 2;
  }

  /**
   * Create and store alert
   */
  private createAlert(
    alert: Omit<ModelAlert, 'alertId' | 'timestamp' | 'acknowledged'>
  ): void {
    const fullAlert: ModelAlert = {
      ...alert,
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(fullAlert);
  }

  /**
   * Get start date for period
   */
  private getStartDateForPeriod(now: Date, period: UsageStatistics['period']): Date {
    const start = new Date(now);

    switch (period) {
      case 'hour':
        start.setHours(start.getHours() - 1);
        break;
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return start;
  }
}

/**
 * Feature distribution for drift detection
 */
interface FeatureDistribution {
  [feature: string]:
    | {
        type: 'numeric';
        mean: number;
        std: number;
      }
    | {
        type: 'categorical';
        frequencies: Record<string, number>;
      };
}

/**
 * Singleton monitor instance
 */
let monitorInstance: ModelMonitor | null = null;

export function getModelMonitor(): ModelMonitor {
  if (!monitorInstance) {
    monitorInstance = new ModelMonitor();
  }
  return monitorInstance;
}
