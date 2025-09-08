import { randomUUID } from 'crypto';
import type { Session, SessionInfo, Message } from '../types/index.js';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly MAX_TOKENS_PER_SESSION = 100000;
  private readonly MAX_MESSAGES_PER_SESSION = 100;
  private readonly SESSION_EXPIRY_HOURS = 24;

  createSession(systemPrompt?: string): string {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const messages: Message[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    const session: Session = {
      id,
      created_at: now,
      last_used: now,
      messages,
      metadata: {
        total_tokens: 0,
        message_count: 0,
      },
    };
    
    this.sessions.set(id, session);
    this.cleanupOldSessions();
    return id;
  }

  getSession(id: string): Session | null {
    const session = this.sessions.get(id);
    if (session) {
      session.last_used = new Date().toISOString();
      return session;
    }
    return null;
  }

  addMessage(sessionId: string, message: Message, tokensUsed: number = 0): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.messages.push(message);
    session.metadata.message_count++;
    session.metadata.total_tokens += tokensUsed;
    session.last_used = new Date().toISOString();

    // Prune old messages if we hit limits
    if (session.messages.length > this.MAX_MESSAGES_PER_SESSION) {
      // Keep system message if present, remove oldest user/assistant messages
      const systemMsg = session.messages.find(m => m.role === 'system');
      const otherMessages = session.messages.filter(m => m.role !== 'system');
      const toKeep = otherMessages.slice(-this.MAX_MESSAGES_PER_SESSION + (systemMsg ? 1 : 0));
      session.messages = systemMsg ? [systemMsg, ...toKeep] : toKeep;
    }

    if (session.metadata.total_tokens > this.MAX_TOKENS_PER_SESSION) {
      // Reset conversation but keep system message
      const systemMsg = session.messages.find(m => m.role === 'system');
      session.messages = systemMsg ? [systemMsg] : [];
      session.metadata.total_tokens = 0;
      session.metadata.message_count = systemMsg ? 1 : 0;
    }
  }

  clearSession(id: string): boolean {
    return this.sessions.delete(id);
  }

  listSessions(): SessionInfo[] {
    this.cleanupOldSessions();
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      created_at: session.created_at,
      last_used: session.last_used,
      message_count: session.metadata.message_count,
      total_tokens: session.metadata.total_tokens,
      model_preference: session.metadata.model_preference,
    }));
  }

  getSessionInfo(id: string): SessionInfo | null {
    const session = this.sessions.get(id);
    if (!session) return null;
    
    return {
      id: session.id,
      created_at: session.created_at,
      last_used: session.last_used,
      message_count: session.metadata.message_count,
      total_tokens: session.metadata.total_tokens,
      model_preference: session.metadata.model_preference,
    };
  }

  private cleanupOldSessions(): void {
    const now = Date.now();
    const expiryTime = this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000;

    for (const [id, session] of this.sessions.entries()) {
      const lastUsed = new Date(session.last_used).getTime();
      if (now - lastUsed > expiryTime) {
        this.sessions.delete(id);
      }
    }
  }

  // Get conversation history for API call
  getConversationHistory(sessionId: string): Message[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.messages] : [];
  }

  // Update model preference based on usage
  updateModelPreference(sessionId: string, model: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.metadata.model_preference = model as any;
    }
  }
}