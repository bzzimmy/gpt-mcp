import { z } from 'zod';
import type { SessionManager } from '../services/session-manager.js';

export const createSessionSchema = z.object({
  system_prompt: z.string().optional(),
});

export const clearSessionSchema = z.object({
  session_id: z.string(),
});

export const getSessionInfoSchema = z.object({
  session_id: z.string(),
});

export function registerSessionTools(server: any, sessionManager: SessionManager) {
  // Create session tool
  server.registerTool(
    'createSession',
    {
      title: 'Create Session',
      description: 'Create a new conversation session for maintaining context across multiple GPT calls',
      inputSchema: {
        system_prompt: createSessionSchema.shape.system_prompt,
      },
    },
    async (params: any) => {
      try {
        const { system_prompt } = createSessionSchema.parse(params);
        const sessionId = sessionManager.createSession(system_prompt);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                session_id: sessionId,
                message: 'Session created successfully',
                system_prompt: system_prompt ? 'Set' : 'None',
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Clear session tool
  server.registerTool(
    'clearSession',
    {
      title: 'Clear Session',
      description: 'Clear a conversation session and its history',
      inputSchema: {
        session_id: clearSessionSchema.shape.session_id,
      },
    },
    async (params: any) => {
      try {
        const { session_id } = clearSessionSchema.parse(params);
        const cleared = sessionManager.clearSession(session_id);
        
        return {
          content: [
            {
              type: 'text',
              text: cleared ? 'Session cleared successfully' : 'Session not found',
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List sessions tool
  server.registerTool(
    'listSessions',
    {
      title: 'List Sessions',
      description: 'List all active conversation sessions',
      inputSchema: {},
    },
    async () => {
      try {
        const sessions = sessionManager.listSessions();
        
        if (sessions.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No active sessions',
              },
            ],
          };
        }
        
        const output = sessions.map(s => 
          `Session: ${s.id}\n` +
          `  Created: ${s.created_at}\n` +
          `  Last used: ${s.last_used}\n` +
          `  Messages: ${s.message_count}\n` +
          `  Tokens: ${s.total_tokens}\n` +
          `  Model: ${s.model_preference || 'None'}`
        ).join('\n\n');
        
        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get session info tool
  server.registerTool(
    'getSessionInfo',
    {
      title: 'Get Session Info',
      description: 'Get detailed information about a specific session',
      inputSchema: {
        session_id: getSessionInfoSchema.shape.session_id,
      },
    },
    async (params: any) => {
      try {
        const { session_id } = getSessionInfoSchema.parse(params);
        const info = sessionManager.getSessionInfo(session_id);
        
        if (!info) {
          return {
            content: [
              {
                type: 'text',
                text: 'Session not found',
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}