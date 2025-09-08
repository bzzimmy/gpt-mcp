export type GPTModel = 'gpt-5' | 'gpt-5-mini' | 'o3';
export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';
export type Verbosity = 'low' | 'medium' | 'high';

export interface AskGPTParams {
  model: GPTModel;
  prompt: string;
  reasoning_effort?: ReasoningEffort;
  verbosity?: Verbosity;
  session_id?: string;
}

export interface GPTResponse {
  model: GPTModel;
  response: string;
  reasoning_effort?: ReasoningEffort;
  verbosity?: Verbosity;
  session_id?: string;
  timestamp: string;
  tokens_used?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Session {
  id: string;
  created_at: string;
  last_used: string;
  messages: Message[];
  metadata: {
    total_tokens: number;
    model_preference?: GPTModel;
    message_count: number;
  };
}

export interface SessionInfo {
  id: string;
  created_at: string;
  last_used: string;
  message_count: number;
  total_tokens: number;
  model_preference?: GPTModel;
}