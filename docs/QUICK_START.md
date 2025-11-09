# Quick Start Guide

Get the MCP Code Execution Harness running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Docker installed and running
- Basic TypeScript knowledge

## Step 1: Clone and Install

```bash
git clone <your-repo>
cd code-execution-with-MCP
npm install
```

## Step 2: Configure

```bash
cp .env.example .env
# Edit .env if needed (defaults work for development)
```

## Step 3: Build

```bash
# Build TypeScript
npm run build

# Build sandbox Docker image
npm run build-sandbox
```

## Step 4: Implement LLM (Required)

Edit `src/agent_orchestrator/AgentManager.ts`:

```typescript
async function callLLM(prompt: string, tools: any[]): Promise<LLMResponse> {
  // Example: OpenAI Integration
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    tools: tools
  });
  
  // Parse response and return appropriate type
  return {
    type: "code_execution",
    code: extractCodeFromResponse(response)
  };
}
```

## Step 5: Connect MCP Servers (Required)

Edit `src/mcp_client/McpClient.ts`:

```typescript
private initializeServers(): void {
  // Example: Add your MCP servers
  this.registerTool({
    name: 'file__read',
    description: 'Read a file from filesystem',
    schema: { input: { path: 'string' } }
  });
  
  // Connect to actual MCP servers using SDK
  // this.addServer({ name: 'fs', command: 'npx', args: [...] });
}
```

## Step 6: Run

```bash
npm start
```

The server will start on `http://localhost:3000`

## Step 7: Test

```bash
# Check health
curl http://localhost:3000/health

# Submit a task (will fail without LLM implementation)
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "task": "List all available tools"
  }'
```

## Next Steps

1. ✅ **Implement LLM Integration** - Required for agent to work
2. ✅ **Connect MCP Servers** - Required for tools to work
3. 📖 **Read Documentation** - See `docs/` directory
4. 🔒 **Review Security** - See `docs/SECURITY.md`
5. 🚀 **Deploy** - See `docs/DEPLOYMENT.md`

## Development Mode

```bash
# Auto-reload on code changes
npm run dev
```

## Common Issues

### "LLM integration not implemented"
➡️ You need to implement the `callLLM()` function in `AgentManager.ts`

### "Docker image not found"
➡️ Run `npm run build-sandbox` to build the sandbox image

### "Tool not found"
➡️ Connect your MCP servers in `McpClient.ts`

## Example: Minimal Working Setup

The fastest way to get something working:

1. **Mock LLM Response** (for testing only):
```typescript
async function callLLM(prompt: string, tools: any[]): Promise<LLMResponse> {
  return {
    type: "code_execution",
    code: `
      console.log("Hello from agent!");
      const tools = await list_mcp_tools();
      console.log("Available tools:", tools);
      return { message: "Success!" };
    `
  };
}
```

2. **Add a Simple MCP Tool**:
```typescript
private registerMockServers(): void {
  this.registerTool({
    name: 'echo',
    description: 'Echo back the input',
    schema: { input: 'any' }
  });
}

private async executeToolOnServer(toolName: string, input: any): Promise<any> {
  if (toolName === 'echo') {
    return { echo: input };
  }
  return { success: true };
}
```

3. **Test**:
```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "task": "Run a test"}'
```

You should see the agent code execute and return results!

## What's Next?

- Replace mock implementations with real integrations
- Add your domain-specific MCP tools
- Customize the system prompts
- Review and harden security settings
- Set up monitoring and logging

## Need Help?

- 📖 Full documentation in `docs/`
- 🏗️ Architecture: `docs/ARCHITECTURE.md`
- 🔒 Security: `docs/SECURITY.md`
- 🚀 Deployment: `docs/DEPLOYMENT.md`
- 💡 Examples: `docs/EXAMPLE_*.md`
