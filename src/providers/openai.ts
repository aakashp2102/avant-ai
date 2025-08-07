import { BaseLLMProvider } from './base';
import { GenerateArgs, LLMResponse, Capabilities } from '../types';

export class OpenAIProvider extends BaseLLMProvider {
  id = 'openai';
  authMode = 'api_key' as const;
  private apiKey: string | null = null;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || null;
  }

  async getCapabilities(): Promise<Capabilities> {
    return {
      streaming: true,
      vision: false, // GPT-4V would be true
      functionCalling: true,
      maxTokens: 4096,
      model: 'gpt-3.5-turbo-0125' // Using a more recent, potentially cheaper model
    };
  }

  async getAuthState(): Promise<{ status: 'connected' | 'disconnected'; expiresAt?: string }> {
    if (!this.apiKey) {
      return { status: 'disconnected' };
    }
    return { status: 'connected' };
  }

  async chat(args: GenerateArgs): Promise<LLMResponse> {
    this.validateAuth();

    const url = `${this.baseUrl}/chat/completions`;
    const body = {
      model: args.model || 'gpt-3.5-turbo-0125',
      messages: args.messages,
      max_tokens: args.maxTokens || 1000,
      temperature: args.temperature || 0.7,
      stream: args.stream || false,
    };

    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    };

    try {
      const response = await this.makeRequest(url, options);

      if (args.stream) {
        return this.parseStreamResponse(response, args.onToken);
      } else {
        const data = await response.json();
        return {
          content: data.choices[0]?.message?.content || '',
          usage: data.usage,
          finishReason: data.choices[0]?.finish_reason
        };
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('insufficient_quota')) {
        throw new Error('OpenAI quota exceeded. Please check your billing at https://platform.openai.com/account/usage');
      }
      throw new Error(`OpenAI API error: ${error}`);
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  protected validateAuth(): void {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  }
} 