/**
 * AI Transcription API Route
 *
 * Voice-to-text transcription using OpenAI Whisper
 *
 * @route POST /api/ai/transcribe
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/ai/transcribe
 *
 * Transcribe audio to text
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data (audio file)
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = (formData.get('language') as string) || 'en';
    const prompt = (formData.get('prompt') as string) || undefined;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB)
    const maxSize = 25 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Audio file too large (max 25MB)' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/mp4',
      'audio/m4a',
    ];

    if (!validTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Invalid audio format' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Call OpenAI Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', language);
    if (prompt) {
      whisperFormData.append('prompt', prompt);
    }

    const whisperResponse = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: whisperFormData,
      }
    );

    if (!whisperResponse.ok) {
      const error = await whisperResponse.json();
      console.error('[AI Transcribe] Whisper API error:', error);
      return NextResponse.json(
        { error: 'Transcription failed', details: error },
        { status: whisperResponse.status }
      );
    }

    const result = await whisperResponse.json();
    const latencyMs = Date.now() - startTime;

    // Log usage
    console.log('[AI Transcribe] Usage:', {
      userId: session.user.id,
      audioSize: audioFile.size,
      duration: result.duration,
      latencyMs,
    });

    return NextResponse.json({
      transcription: result.text,
      language: result.language,
      duration: result.duration,
      metadata: {
        fileName: audioFile.name,
        fileSize: audioFile.size,
        latencyMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[AI Transcribe] Error:', error);

    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/transcribe
 */
export async function GET() {
  return NextResponse.json({
    service: 'Clinical Audio Transcription',
    version: '1.0.0',
    supportedFormats: ['mp3', 'mp4', 'm4a', 'wav', 'webm'],
    maxFileSize: '25MB',
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh'],
  });
}
