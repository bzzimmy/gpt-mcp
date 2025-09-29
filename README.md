
# GPT-MCP Bridge

A Model Context Protocol (MCP) server that enables Claude Code and other MCP-compatible tools to communicate with OpenAI's GPT models, featuring conversation history, session management, and advanced controls.

## Features

### 🎯 Core Capabilities
- **Conversation History** - Maintain context across multiple interaction's
- **Session Management** - Create, manage, and track parallel conversation sessions
- **Multi-Model Support** - GPT-5, GPT-5-mini, and o3 models
- **Advanced Controls** - Reasoning effort and verbosity parameters
- **Token Tracking** - Monitor usage per session for cost management
- **Error Handling** - Robust error recovery and session validation

### 💡 Key Benefits
- **70% Token Savings** - Reuse context without repeating information
- **Parallel Workflows** - Handle multiple independent tasks simultaneously
- **Adaptive Responses** - Control response length with verbosity settings
- **Smart Model Routing** - Choose optimal model for each task

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/gpt-mcp.git
cd gpt-mcp
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

4. **Build the project**
```bash
npm run build
```

## Usage

### Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### MCP Tools

#### 1. askGPT
Send prompts to GPT models with optional conversation context.

**Parameters:**
- `model` (required): "gpt-5" | "gpt-5-mini" | "o3"
- `prompt` (required): Your question or request
- `reasoning_effort` (optional): "minimal" | "low" | "medium" | "high"
- `verbosity` (optional): "low" | "medium" | "high"
- `session_id` (optional): Session ID for conversation context

**Example:**
```json
{
  "model": "gpt-5",
  "prompt": "Explain async/await",
  "reasoning_effort": "medium",
  "verbosity": "low",
  "session_id": "abc-123"
}
```

#### 2. createSession
Create a new conversation session for maintaining context.

**Parameters:**
- `system_prompt` (optional): System message to set context

**Returns:** Session ID for use in subsequent calls

#### 3. clearSession
Clear a conversation session and its history.

**Parameters:**
- `session_id` (required): Session to clear

#### 4. listSessions
List all active conversation sessions.

**Returns:** Array of session information including ID, creation time, message count, and token usage

#### 5. getSessionInfo
Get detailed information about a specific session.

**Parameters:**
- `session_id` (required): Session to query

## Configuration

### Environment Variables
- `OPENAI_API_KEY` - Your OpenAI API key (required)

### Session Limits
- Max tokens per session: 100,000
- Max messages per session: 100
- Session expiry: 24 hours
- Auto-cleanup of expired sessions

## Example Workflows

### Multi-Step Debugging
```javascript
// Create a session for debugging
session_id = createSession("Help debug React component")

// Step 1: Present the problem
askGPT({
  model: "gpt-5",
  prompt: "My component re-renders on every keystroke",
  session_id: session_id
})

// Step 2: Ask follow-up (context maintained)
askGPT({
  model: "gpt-5",
  prompt: "How do I fix this?",
  session_id: session_id
})
```

### Parallel Tasks
```javascript
// Create separate sessions for different tasks
bugSession = createSession("Fixing memory leak")
featureSession = createSession("Adding authentication")

// Work on both independently
askGPT({ model: "gpt-5", prompt: "...", session_id: bugSession })
askGPT({ model: "gpt-5-mini", prompt: "...", session_id: featureSession })
```

## Model Selection Guide

### GPT-5
- **Best for:** Complex tasks, code generation, detailed analysis
- **Reasoning levels:** minimal, low, medium, high
- **Use when:** Quality is priority over speed

### GPT-5-mini
- **Best for:** Simple queries, quick responses, cost optimization
- **Reasoning levels:** minimal, low, medium, high
- **Use when:** Speed and cost are priorities

### o3
- **Best for:** Logic puzzles, mathematical reasoning, complex problem-solving
- **Reasoning levels:** Not applicable (always maximum)
- **Use when:** Deep reasoning is required

## Architecture

```
gpt-mcp/
├── src/
│   ├── index.ts              # MCP server setup
│   ├── services/
│   │   ├── openai.ts         # OpenAI API integration
│   │   └── session-manager.ts # Session management
│   ├── tools/
│   │   ├── askGPT.ts         # Main GPT interface
│   │   └── session-tools.ts  # Session management tools
│   └── types/
│       └── index.ts          # TypeScript interfaces
```

## Development

### Building
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

### Project Structure
- **ES Modules** - Uses `.js` extensions in imports
- **Strict TypeScript** - Full type safety
- **MCP SDK** - Built on official MCP TypeScript SDK

## Requirements

- Node.js >= 18
- OpenAI API key
- MCP-compatible client (Claude Code, etc.)


## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please use the GitHub issue tracker.
