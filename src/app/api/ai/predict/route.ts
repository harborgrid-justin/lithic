/**
 * AI Prediction API Route
 *
 * Clinical prediction models endpoint
 *
 * @route POST /api/ai/predict
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { getReadmissionModel } from '@/lib/ai/prediction/readmission-model';
import { getSepsisModel } from '@/lib/ai/prediction/sepsis-model';
import { getLOSModel } from '@/lib/ai/prediction/length-of-stay';
import { getNoShowModel } from '@/lib/ai/prediction/no-show-model';
import { getModelExplainer } from '@/lib/ai/governance/explainability';
import { getModelMonitor } from '@/lib/ai/governance/monitoring';

/**
 * Request schema
 */
const PredictRequestSchema = z.object({
  modelType: z.enum(['readmission', 'sepsis', 'length_of_stay', 'no_show']),
  input: z.record(z.unknown()),
  explainPrediction: z.boolean().default(true),
});

type PredictRequest = z.infer<typeof PredictRequestSchema>;

/**
 * POST /api/ai/predict
 *
 * Generate clinical predictions
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = PredictRequestSchema.parse(body);

    const startTime = Date.now();
    let prediction: any;
    let modelId: string;

    // Route to appropriate model
    switch (validatedRequest.modelType) {
      case 'readmission': {
        const model = getReadmissionModel();
        prediction = model.predict(validatedRequest.input as any);
        modelId = 'readmission-v1.0.0';
        break;
      }

      case 'sepsis': {
        const model = getSepsisModel();
        prediction = model.screen(validatedRequest.input as any);
        modelId = 'sepsis-v1.0.0';
        break;
      }

      case 'length_of_stay': {
        const model = getLOSModel();
        prediction = model.predict(validatedRequest.input as any);
        modelId = 'los-v1.0.0';
        break;
      }

      case 'no_show': {
        const model = getNoShowModel();
        prediction = model.predict(validatedRequest.input as any);
        modelId = 'no-show-v1.0.0';
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid model type' },
          { status: 400 }
        );
    }

    const latencyMs = Date.now() - startTime;

    // Generate explanation if requested
    let explanation;
    if (validatedRequest.explainPrediction) {
      const explainer = getModelExplainer();

      // Extract risk score and risk factors based on model type
      let riskScore: number = 0;
      let riskFactors: any[] = [];

      if ('riskScore' in prediction) {
        riskScore = prediction.riskScore;
        riskFactors = prediction.riskFactors || [];
      }

      explanation = explainer.explainClinicalRisk(
        `pred_${Date.now()}`,
        modelId,
        validatedRequest.input,
        riskScore,
        riskFactors
      );
    }

    // Log prediction for monitoring
    const monitor = getModelMonitor();
    monitor.logPrediction({
      predictionId: `pred_${Date.now()}`,
      modelId,
      modelVersion: '1.0.0',
      timestamp: new Date(),
      input: validatedRequest.input,
      output: prediction,
      confidence: prediction.confidence,
      latencyMs,
      userId: session.user.id,
    });

    // Log usage
    console.log('[AI Predict] Usage:', {
      userId: session.user.id,
      modelType: validatedRequest.modelType,
      latencyMs,
    });

    return NextResponse.json({
      prediction,
      explanation,
      metadata: {
        modelId,
        modelType: validatedRequest.modelType,
        latencyMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[AI Predict] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/predict
 */
export async function GET() {
  return NextResponse.json({
    service: 'Clinical Prediction Models',
    version: '1.0.0',
    availableModels: [
      {
        type: 'readmission',
        name: '30-Day Readmission Risk',
        description: 'Predicts risk of hospital readmission within 30 days',
      },
      {
        type: 'sepsis',
        name: 'Sepsis Screening',
        description: 'Early sepsis detection using qSOFA, SIRS, and SOFA scores',
      },
      {
        type: 'length_of_stay',
        name: 'Length of Stay Prediction',
        description: 'Predicts expected hospital length of stay',
      },
      {
        type: 'no_show',
        name: 'Appointment No-Show Risk',
        description: 'Predicts likelihood of patient no-show for appointments',
      },
    ],
  });
}
