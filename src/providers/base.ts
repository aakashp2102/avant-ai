import { LLMProvider, GenerateArgs, LLMResponse, Capabilities } from '../types';

export abstract class BaseLLMProvider implements LLMProvider {
  abstract id: string;
  abstract authMode: 'api_key' | 'oauth' | 'relay_oauth' | 'local_webgpu' | 'local_ollama';

  abstract getCapabilities(): Promise<Capabilities>;
  abstract getAuthState(): Promise<{ status: 'connected' | 'disconnected'; expiresAt?: string }>;
  abstract chat(args: GenerateArgs): Promise<LLMResponse>;

  async beginAuth?(_options?: any): Promise<void> {
    throw new Error('Authentication not supported for this provider');
  }

  protected validateAuth(): void {
    // Override in subclasses to check authentication state
  }

  protected async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  protected parseStreamResponse(response: Response, onToken?: (token: string) => void): Promise<LLMResponse> {
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    return new Promise((resolve, reject) => {
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              resolve({
                content: fullContent,
                finishReason: 'stop'
              });
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  resolve({
                    content: fullContent,
                    finishReason: 'stop'
                  });
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices?.[0]?.delta?.content) {
                    const token = parsed.choices[0].delta.content;
                    fullContent += token;
                    onToken?.(token);
                  }
                } catch (e) {
                  // Skip invalid JSON lines
                }
              }
            }
          }
        } catch (error) {
          reject(error);
        }
      };

      readStream();
    });
  }
} 