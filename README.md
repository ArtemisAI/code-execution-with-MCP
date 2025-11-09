# Code Execution with MCP - Template Repository

A production-ready template for building AI agents using the **Code Execution with MCP** pattern. This harness enables AI agents to dynamically discover and execute MCP tools through secure, sandboxed code execution.

## 🌟 Key Features

- **Dynamic Tool Discovery** - Tools discovered at runtime using `list_mcp_tools()` and `get_mcp_tool_details()` (no static files)
- **Secure Sandbox Execution** - Docker-based isolation with resource limits, read-only filesystem, and network restrictions
- **PII Protection** - Automatic tokenization/de-tokenization of sensitive data
- **Persistent Skills** - `/skills` directory for reusable agent code
- **Ephemeral Workspace** - `/workspace` directory for temporary task files
- **Multi-Turn Conversations** - Support for complex agent workflows
- **Extensible Architecture** - Easy to customize and extend

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User / Application                        │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Request
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Agent Orchestrator                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ AgentManager │◄─┤ PII Censor   │◄─┤ MCP Client      │   │
│  └──────┬───────┘  └──────────────┘  └─────────────────┘   │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────┐                                           │
│  │ LLM Provider │ (OpenAI, Anthropic, etc.)                 │
│  └──────┬───────┘                                           │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────┐                       │
│  │   Sandbox Manager (Docker)       │                       │
│  └──────┬───────────────────────────┘                       │
└─────────┼────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              Secure Docker Container                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Agent Code Execution                                 │   │
│  │  - Runtime API (callMCPTool, fs, utils)             │   │
│  │  - Dynamic Tool Discovery                            │   │
│  │  - /skills (persistent, mounted)                     │   │
│  │  - /workspace (ephemeral, mounted)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Security: Non-root user, read-only rootfs, resource limits │
└─────────────────────────────────────────────────────────────┘
          │
          │ Authenticated API Call
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Servers                               │
│  (File System, Databases, APIs, Custom Tools)               │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Docker (for sandbox execution)
- TypeScript knowledge

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd code-execution-with-MCP

# Install dependencies
npm install

# Build the project
npm run build

# Build the Docker sandbox image
npm run build-sandbox

# Create required directories
npm run prepare-workspace

# Start the server
npm start
```

### Development

```bash
# Run in development mode with auto-reload
npm run dev

# Type checking only
npm run type-check

# Clean build artifacts
npm run clean
```

## 📁 Project Structure

```
mcp-code-exec-harness/
├── src/
│   ├── agent_orchestrator/     # Main agent logic
│   │   ├── AgentManager.ts     # Agent execution loop
│   │   └── prompt_templates.ts # System prompts
│   │
│   ├── sandbox_manager/        # Secure code execution
│   │   ├── SandboxManager.ts   # Abstract interface
│   │   └── DockerSandbox.ts    # Docker implementation
│   │
│   ├── mcp_client/            # MCP communication
│   │   ├── McpClient.ts       # MCP server client
│   │   └── PiiCensor.ts       # PII tokenization
│   │
│   ├── agent_runtime/         # Sandbox runtime API
│   │   └── runtime_api.ts     # Injected helper functions
│   │
│   ├── tools_interface/       # Dynamic tool discovery
│   │   └── DynamicToolManager.ts
│   │
│   └── index.ts               # Main server entry point
│
├── skills/                    # Persistent agent skills (user-specific)
├── workspace/                 # Ephemeral execution workspace
├── Dockerfile.sandbox         # Secure sandbox container
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Sandbox Configuration
SANDBOX_IMAGE=sandbox-image-name
SANDBOX_TIMEOUT_MS=30000
SANDBOX_MEMORY_MB=100
SANDBOX_CPU_QUOTA=50000

# LLM Provider (configure for your provider)
LLM_API_KEY=your-api-key-here
LLM_MODEL=your-model-name

# MCP Servers (customize for your setup)
# Add your MCP server configurations here
```

### Customizing the Agent

1. **Implement LLM Integration** - Edit `src/agent_orchestrator/AgentManager.ts`:
   ```typescript
   async function callLLM(prompt: string, tools: any[]): Promise<LLMResponse> {
     // Add your LLM API call here
     // Examples: OpenAI, Anthropic, Google Gemini, etc.
   }
   ```

2. **Connect MCP Servers** - Edit `src/mcp_client/McpClient.ts`:
   ```typescript
   private initializeServers(): void {
     // Add your MCP server connections
     // Use @modelcontextprotocol/sdk
   }
   ```

3. **Customize System Prompts** - Edit `src/agent_orchestrator/prompt_templates.ts`

4. **Adjust Sandbox Security** - Edit `src/sandbox_manager/DockerSandbox.ts`

## 🔐 Security Features

### Sandbox Isolation

- **Non-root execution** - Runs as `sandboxuser`
- **Read-only root filesystem** - Prevents system modifications
- **Resource limits** - CPU and memory constraints
- **Network restrictions** - Configurable network access
- **Capability dropping** - Minimal container privileges

### PII Protection

Automatic detection and tokenization of:
- Email addresses
- Phone numbers
- Social Security Numbers
- Credit card numbers
- IP addresses
- Custom patterns (extensible)

### Authentication

- Session-specific auth tokens for sandbox ↔ host communication
- Validate tokens in production deployment

## 📚 Usage Examples

### Making a Request

```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "task": "Analyze the latest sales data and create a summary report"
  }'
```

### Agent Code Example

The agent writes code like this (executed in sandbox):

```javascript
// 1. Discover available tools
const tools = await list_mcp_tools();
console.log("Available tools:", tools);

// 2. Get tool details
const dbTool = await get_mcp_tool_details("database__query");
console.log("Tool info:", dbTool.description);

// 3. Execute tools
const salesData = await callMCPTool("database__query", {
  query: "SELECT * FROM sales WHERE date > '2024-01-01'"
});

// 4. Process data in code
const summary = salesData.reduce((acc, sale) => {
  acc.total += sale.amount;
  acc.count += 1;
  return acc;
}, { total: 0, count: 0 });

// 5. Save to skills for reuse
await fs.writeFile('/skills/sales_summary.js', `
  module.exports = async function summarizeSales(data) {
    return data.reduce((acc, sale) => {
      acc.total += sale.amount;
      acc.count += 1;
      return acc;
    }, { total: 0, count: 0 });
  };
`);

// 6. Return results
return { summary, totalSales: summary.total, count: summary.count };
```

## 🛠️ Extending the Template

### Adding New MCP Servers

```typescript
// In src/mcp_client/McpClient.ts
async addServer(config: MCPServerConfig): Promise<void> {
  const client = new Client({
    name: config.name,
    version: '1.0.0'
  }, {
    capabilities: { tools: {} }
  });
  
  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args
  });
  
  await client.connect(transport);
  
  // Discover and register tools
  const tools = await client.listTools();
  tools.forEach(tool => this.registerTool(tool));
}
```

### Custom PII Patterns

```typescript
// In your code
const piiCensor = new PiiCensor();
piiCensor.addPattern('custom_id', /\bID-\d{6}\b/g);
```

### Alternative Sandbox Implementations

Extend `SandboxManager` to create custom execution environments:
- WebAssembly-based sandboxes
- Cloud function execution
- Process-based isolation

## 🧪 Testing

```bash
# Test the sandbox
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "task": "Write a simple hello world function and save it to skills"
  }'

# Check health
curl http://localhost:3000/health
```

## 📖 References

1. [Code Execution with MCP - Anthropic Engineering Blog](https://www.anthropic.com/engineering/code-execution-with-mcp)
2. [Model Context Protocol Documentation](https://modelcontextprotocol.io)
3. [Docker Security Best Practices](https://docs.docker.com/engine/security/)

## 🤝 Contributing

This is a template repository. Customize it for your specific needs:

1. Implement your LLM integration
2. Connect your MCP servers
3. Customize security policies
4. Extend PII detection
5. Add monitoring and logging

## 📝 License

MIT License - See LICENSE file for details

## ⚠️ Important Notes

- **TODO Items**: Search for `TODO` comments in the code for areas requiring implementation
- **Security**: Review and harden security settings before production deployment
- **LLM Integration**: The LLM calling function is a placeholder - implement with your provider
- **MCP Servers**: Mock implementations are provided - replace with actual MCP connections
- **Production Ready**: Additional hardening required for production use (monitoring, error handling, scaling)

---

Built with the Code Execution with MCP pattern for dynamic, secure AI agent workflows.

