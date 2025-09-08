import { z } from 'zod';
import type { GPTResponse } from '../types/index.js';
import type { OpenAIService } from '../services/openai.js';
import type { SessionManager } from '../services/session-manager.js';

export const askGPTSchema = z.object({
  model: z.enum(['gpt-5', 'gpt-5-mini', 'o3']),
  prompt: z.string().min(1),
  reasoning_effort: z.enum(['minimal', 'low', 'medium', 'high']).optional(),
  verbosity: z.enum(['low', 'medium', 'high']).optional(),
  session_id: z.string().optional(),
});

export async function handleAskGPT(
  params: z.infer<typeof askGPTSchema>,
  openaiService: OpenAIService,
  sessionManager: SessionManager
): Promise<GPTResponse> {
  const { model, prompt, reasoning_effort, verbosity, session_id } = params;
  
  let conversationHistory = undefined;
  let activeSessionId = session_id;
  
  // Handle session
  if (session_id) {
    const session = sessionManager.getSession(session_id);
    if (!session) {
      throw new Error(`Session ${session_id} not found`);
    }
    conversationHistory = sessionManager.getConversationHistory(session_id);
    sessionManager.updateModelPreference(session_id, model);
  }
  
  // Call OpenAI
  const { response, tokensUsed } = await openaiService.askGPT(
    model, 
    prompt, 
    reasoning_effort,
    verbosity,
    conversationHistory
  );
  
  // Update session with new messages
  if (activeSessionId) {
    sessionManager.addMessage(activeSessionId, { role: 'user', content: prompt }, 0);
    sessionManager.addMessage(activeSessionId, { role: 'assistant', content: response }, tokensUsed);
  }
  
  return {
    model,
    response,
    reasoning_effort: model !== 'o3' ? reasoning_effort : undefined,
    verbosity: model !== 'o3' ? verbosity : undefined,
    session_id: activeSessionId,
    timestamp: new Date().toISOString(),
    tokens_used: tokensUsed,
  };
}