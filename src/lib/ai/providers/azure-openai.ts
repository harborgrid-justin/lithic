/**
 * Azure OpenAI Provider Implementation
 * Supports Azure-hosted OpenAI models with enterprise security
 *
 * HIPAA Compliant: Uses Azure's HIPAA-compliant infrastructure
 */

import {
  LLMConfig,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  AIServiceError,
} from '@/types/ai';
import { ILLMProvider } from '../llm-service';

interface AzureOpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

interface AzureOpenAIRequest {
  messages: AzureOpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  n?: number;
  stop?: string | string[];
}

interface AzureOpenAIResponse {
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

interface AzureOpenAIStreamChunk {
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

export class AzureOpenAIProvider implements ILLMProvider {
  private config: LLMConfig;
  private endpoint: string;
  private deploymentName: string;
  private apiVersion: string;

  constructor(config: LLMConfig) {
    this.config = config;

    // Azure OpenAI requires specific configuration
    // Format: https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/chat/completions?api-version={api-version}
    this.endpoint = config.baseURL || process.env.AZURE_OPENAI_ENDPOINT || '';
    this.deploymentName = config.model; // In Azure, model is the deployment name
    this.apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
  }

  validateConfig(): boolean {
    if (!this.config.apiKey) {
      throw new AIServiceError(
        'Azure OpenAI API key is required',
        'MISSING_API_KEY',
        'azure-openai'
      );
    }
    if (!this.endpoint) {
      throw new AIServiceError(
        'Azure OpenAI endpoint is required',
        'MISSING_ENDPOINT',
        'azure-openai'
      );
    }
    if (!this.deploymentName) {
      throw new AIServiceError(
        'Azure OpenAI deployment name is required',
        'MISSING_DEPLOYMENT',
        'azure-openai'
      );
    }
    return true;
  }

  private getCompletionURL(): string {
    return `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    this.validateConfig();

    const azureRequest: AzureOpenAIRequest = {
      messages: request.messages,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? this.config.maxTokens ?? 1500,
      top_p: this.config.topP ?? 1.0,
      stream: false,
    };

    try {
      const response = await fetch(this.getCompletionURL(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify(azureRequest),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AIServiceError(
          error.error?.message || `Azure OpenAI API error: ${response.statusText}`,
          error.error?.code || 'API_ERROR',
          'azure-openai',
          response.status,
          error
        );
      }

      const data: AzureOpenAIResponse = await response.json();

      return {
        content: data.choices[0]?.message.content || '',
        model: data.model || this.deploymentName,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        finishReason: this.mapFinishReason(data.choices[0]?.finish_reason),
        metadata: {
          id: data.id,
          created: data.created,
          deployment: this.deploymentName,
        },
      };
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'REQUEST_FAILED',
        'azure-openai',
        undefined,
        { originalError: error }
      );
    }
  }

  async *streamResponse(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    this.validateConfig();

    const azureRequest: AzureOpenAIRequest = {
      messages: request.messages,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? this.config.maxTokens ?? 1500,
      top_p: this.config.topP ?? 1.0,
      stream: true,
    };

    try {
      const response = await fetch(this.getCompletionURL(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify(azureRequest),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AIServiceError(
          error.error?.message || `Azure OpenAI API error: ${response.statusText}`,
          error.error?.code || 'API_ERROR',
          'azure-openai',
          response.status,
          error
        );
      }

      if (!response.body) {
        throw new AIServiceError(
          'No response body received',
          'NO_RESPONSE_BODY',
          'azure-openai'
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
            const data: AzureOpenAIStreamChunk = JSON.parse(trimmed.slice(6));
            const delta = data.choices[0]?.delta;
            const finishReason = data.choices[0]?.finish_reason;

            if (delta?.content) {
              yield {
                content: delta.content,
                done: false,
              };
            }

            if (finishReason) {
              // Estimate tokens (Azure OpenAI doesn't always provide in stream)
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
            console.error('Failed to parse Azure OpenAI stream chunk:', parseError);
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
        'azure-openai',
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
