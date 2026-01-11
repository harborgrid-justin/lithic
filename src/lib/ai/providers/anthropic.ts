/**
 * Anthropic Claude Provider Implementation
 * Supports Claude 3 Opus, Sonnet, and Haiku models
 *
 * HIPAA Compliant: Uses Anthropic's Enterprise API with BAA
 */

import {
  LLMConfig,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  AIServiceError,
} from '@/types/ai';
import { ILLMProvider } from '../llm-service';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  system?: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicStreamEvent {
  type: string;
  message?: {
    id: string;
    type: string;
    role: string;
    content: Array<{
      type: string;
      text: string;
    }>;
    model: string;
    stop_reason: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  content_block?: {
    type: string;
    text: string;
  };
  delta?: {
    type: string;
    text?: string;
    stop_reason?: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicProvider implements ILLMProvider {
  private config: LLMConfig;
  private baseURL: string;

  constructor(config: LLMConfig) {
    this.config = config;
    this.baseURL = config.baseURL || 'https://api.anthropic.com/v1';
  }

  validateConfig(): boolean {
    if (!this.config.apiKey) {
      throw new AIServiceError(
        'Anthropic API key is required',
        'MISSING_API_KEY',
        'anthropic'
      );
    }
    if (!this.config.model) {
      throw new AIServiceError(
        'Model name is required',
        'MISSING_MODEL',
        'anthropic'
      );
    }
    return true;
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    this.validateConfig();

    // Extract system message if present
    const systemMessage = request.messages.find(m => m.role === 'system');
    const conversationMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant' as const,
        content: m.content,
      }));

    const anthropicRequest: AnthropicRequest = {
      model: request.model || this.config.model,
      messages: conversationMessages,
      max_tokens: request.maxTokens ?? this.config.maxTokens ?? 1500,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      top_p: this.config.topP ?? 1.0,
      stream: false,
      ...(systemMessage && { system: systemMessage.content }),
    };

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(anthropicRequest),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AIServiceError(
          error.error?.message || `Anthropic API error: ${response.statusText}`,
          error.error?.type || 'API_ERROR',
          'anthropic',
          response.status,
          error
        );
      }

      const data: AnthropicResponse = await response.json();

      return {
        content: data.content[0]?.text || '',
        model: data.model,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        finishReason: this.mapStopReason(data.stop_reason),
        metadata: {
          id: data.id,
          type: data.type,
        },
      };
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'REQUEST_FAILED',
        'anthropic',
        undefined,
        { originalError: error }
      );
    }
  }

  async *streamResponse(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    this.validateConfig();

    // Extract system message if present
    const systemMessage = request.messages.find(m => m.role === 'system');
    const conversationMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant' as const,
        content: m.content,
      }));

    const anthropicRequest: AnthropicRequest = {
      model: request.model || this.config.model,
      messages: conversationMessages,
      max_tokens: request.maxTokens ?? this.config.maxTokens ?? 1500,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      top_p: this.config.topP ?? 1.0,
      stream: true,
      ...(systemMessage && { system: systemMessage.content }),
    };

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(anthropicRequest),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AIServiceError(
          error.error?.message || `Anthropic API error: ${response.statusText}`,
          error.error?.type || 'API_ERROR',
          'anthropic',
          response.status,
          error
        );
      }

      if (!response.body) {
        throw new AIServiceError(
          'No response body received',
          'NO_RESPONSE_BODY',
          'anthropic'
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let inputTokens = 0;
      let outputTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const data: AnthropicStreamEvent = JSON.parse(trimmed.slice(6));

            if (data.type === 'content_block_delta' && data.delta?.text) {
              yield {
                content: data.delta.text,
                done: false,
              };
            }

            if (data.type === 'message_delta' && data.usage) {
              outputTokens = data.usage.output_tokens;
            }

            if (data.type === 'message_start' && data.message?.usage) {
              inputTokens = data.message.usage.input_tokens;
            }

            if (data.type === 'message_delta' && data.delta?.stop_reason) {
              yield {
                content: '',
                done: true,
                usage: {
                  promptTokens: inputTokens,
                  completionTokens: outputTokens,
                  totalTokens: inputTokens + outputTokens,
                },
              };
            }
          } catch (parseError) {
            // Skip malformed chunks
            console.error('Failed to parse Anthropic stream chunk:', parseError);
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
        'anthropic',
        undefined,
        { originalError: error }
      );
    }
  }

  private mapStopReason(reason: string): LLMResponse['finishReason'] {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }
}
