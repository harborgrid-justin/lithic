/**
 * OpenAI Provider Implementation
 * Supports GPT-4, GPT-3.5, and other OpenAI models
 *
 * HIPAA Compliant: Uses OpenAI's Enterprise API with BAA
 */

import {
  LLMConfig,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  AIServiceError,
} from '@/types/ai';
import { ILLMProvider } from '../llm-service';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  n?: number;
  stop?: string | string[];
}

interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

export class OpenAIProvider implements ILLMProvider {
  private config: LLMConfig;
  private baseURL: string;

  constructor(config: LLMConfig) {
    this.config = config;
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
  }

  validateConfig(): boolean {
    if (!this.config.apiKey) {
      throw new AIServiceError(
        'OpenAI API key is required',
        'MISSING_API_KEY',
        'openai'
      );
    }
    if (!this.config.model) {
      throw new AIServiceError(
        'Model name is required',
        'MISSING_MODEL',
        'openai'
      );
    }
    return true;
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    this.validateConfig();

    const openAIRequest: OpenAICompletionRequest = {
      model: request.model || this.config.model,
      messages: request.messages,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? this.config.maxTokens ?? 1500,
      top_p: this.config.topP ?? 1.0,
      stream: false,
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...(this.config.organization && {
            'OpenAI-Organization': this.config.organization,
          }),
        },
        body: JSON.stringify(openAIRequest),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AIServiceError(
          error.error?.message || `OpenAI API error: ${response.statusText}`,
          error.error?.code || 'API_ERROR',
          'openai',
          response.status,
          error
        );
      }

      const data: OpenAICompletionResponse = await response.json();

      return {
        content: data.choices[0]?.message.content || '',
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        finishReason: this.mapFinishReason(data.choices[0]?.finish_reason),
        metadata: {
          id: data.id,
          created: data.created,
        },
      };
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'REQUEST_FAILED',
        'openai',
        undefined,
        { originalError: error }
      );
    }
  }

  async *streamResponse(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    this.validateConfig();

    const openAIRequest: OpenAICompletionRequest = {
      model: request.model || this.config.model,
      messages: request.messages,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? this.config.maxTokens ?? 1500,
      top_p: this.config.topP ?? 1.0,
      stream: true,
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...(this.config.organization && {
            'OpenAI-Organization': this.config.organization,
          }),
        },
        body: JSON.stringify(openAIRequest),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AIServiceError(
          error.error?.message || `OpenAI API error: ${response.statusText}`,
          error.error?.code || 'API_ERROR',
          'openai',
          response.status,
          error
        );
      }

      if (!response.body) {
        throw new AIServiceError(
          'No response body received',
          'NO_RESPONSE_BODY',
          'openai'
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let totalTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data: OpenAIStreamChunk = JSON.parse(trimmed.slice(6));
            const delta = data.choices[0]?.delta;
            const finishReason = data.choices[0]?.finish_reason;

            if (delta?.content) {
              yield {
                content: delta.content,
                done: false,
              };
            }

            if (finishReason) {
              // Estimate tokens (OpenAI doesn't provide in stream)
              totalTokens = Math.ceil(
                (request.messages.reduce((sum, m) => sum + m.content.length, 0) / 4) + 100
              );

              yield {
                content: '',
                done: true,
                usage: {
                  promptTokens: Math.ceil(totalTokens * 0.7),
                  completionTokens: Math.ceil(totalTokens * 0.3),
                  totalTokens,
                },
              };
            }
          } catch (parseError) {
            // Skip malformed chunks
            console.error('Failed to parse OpenAI stream chunk:', parseError);
          }
        }
      }
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Stream failed',
        'STREAM_FAILED',
        'openai',
        undefined,
        { originalError: error }
      );
    }
  }

  private mapFinishReason(reason: string): LLMResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
