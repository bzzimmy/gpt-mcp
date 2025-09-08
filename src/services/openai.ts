import OpenAI from 'openai';
import type { GPTModel, ReasoningEffort, Verbosity, Message } from '../types/index.js';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async askGPT(
    model: GPTModel,
    prompt: string,
    reasoning_effort?: ReasoningEffort,
    verbosity?: Verbosity,
    conversationHistory?: Message[]
  ): Promise<{ response: string; tokensUsed: number }> {
    try {
      // Build messages array
      const messages: any[] = conversationHistory ? 
        [...conversationHistory.map(m => ({ role: m.role, content: m.content }))] : 
        [];
      
      // Add current prompt
      messages.push({ role: 'user', content: prompt });

      const params: any = {
        model,
        messages,
      };

      // Add reasoning_effort for GPT-5 models
      if (model !== 'o3' && reasoning_effort) {
        params.reasoning_effort = reasoning_effort;
      }

      // Add verbosity for GPT-5 models
      if (model !== 'o3' && verbosity) {
        params.verbosity = verbosity;
      }

      const response = await this.client.chat.completions.create(params);
      
      const responseText = response.choices[0]?.message?.content || 'No response from GPT';
      const tokensUsed = (response.usage?.total_tokens || 0);
      
      return { response: responseText, tokensUsed };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling OpenAI API');
    }
  }
}