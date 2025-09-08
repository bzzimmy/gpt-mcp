#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { OpenAIService } from './services/openai.js';
import { SessionManager } from './services/session-manager.js';
import { askGPTSchema, handleAskGPT } from './tools/askGPT.js';
import { registerSessionTools } from './tools/session-tools.js';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

const server = new McpServer({
  name: 'gpt-mcp',
  version: '2.0.0',
});

const openaiService = new OpenAIService(apiKey);
const sessionManager = new SessionManager();

function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  const field = issue.path.join('.');
  
  if (issue.code === 'invalid_enum_value') {
    const options = issue.options as string[];
    const received = issue.received as string;
    
    // Add helpful descriptions for common fields
    const descriptions: Record<string, string> = {
      model: 'Available models',
      reasoning_effort: 'Reasoning levels (minimal=fastest, low, medium, high=most thorough)',
      verbosity: 'Response detail levels'
    };
    
    const desc = descriptions[field] || 'Available options';
    return `Invalid ${field} '${received}'. ${desc}: ${options.join(', ')}`;
  }
  
  if (issue.code === 'too_small') {
    return `${field} is required and cannot be empty`;
  }
  
  return `Invalid ${field}: ${issue.message}`;
}

server.registerTool(
  'askGPT',
  {
    title: 'Ask GPT',
    description: 'Send a prompt to OpenAI GPT models with optional conversation context',
    inputSchema: {
      model: askGPTSchema.shape.model,
      prompt: askGPTSchema.shape.prompt,
      reasoning_effort: askGPTSchema.shape.reasoning_effort,
      verbosity: askGPTSchema.shape.verbosity,
      session_id: askGPTSchema.shape.session_id,
    },
  },
  async (params) => {
    try {
      const validatedParams = askGPTSchema.parse(params);
      const result = await handleAskGPT(validatedParams, openaiService, sessionManager);
      
      // Format output for better readability
      let formattedOutput = `Model: ${result.model}\n`;
      if (result.reasoning_effort) {
        formattedOutput += `Reasoning: ${result.reasoning_effort}\n`;
      }
      if (result.verbosity) {
        formattedOutput += `Verbosity: ${result.verbosity}\n`;
      }
      if (result.session_id) {
        formattedOutput += `Session: ${result.session_id}\n`;
      }
      if (result.tokens_used) {
        formattedOutput += `Tokens: ${result.tokens_used}\n`;
      }
      formattedOutput += `Time: ${result.timestamp}\n`;
      formattedOutput += `${'─'.repeat(40)}\n\n`;
      formattedOutput += result.response;
      
      return {
        content: [
          {
            type: 'text',
            text: formattedOutput,
          },
        ],
      };
    } catch (error) {
      let errorMessage: string;
      
      if (error instanceof z.ZodError) {
        errorMessage = formatZodError(error);
      } else {
        errorMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
      
      return {
        content: [
          {
            type: 'text',
            text: errorMessage,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register session management tools
registerSessionTools(server, sessionManager);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GPT-MCP server started successfully');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});