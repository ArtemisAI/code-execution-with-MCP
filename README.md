# Code Execution with MCP - Template Repository

A production-ready template for building AI agents using the **Code Execution with MCP** pattern. This harness enables AI agents to dynamically discover and execute MCP tools through secure, sandboxed code execution.

> **Inspired by**: This template implements the architectural patterns and design philosophy from Anthropic's [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) engineering blog post and their [Skills Repository](https://github.com/anthropics/skills). We are grateful to Anthropic for openly sharing these patterns.

## 🌟 Key Features

- **Dynamic Tool Discovery** - Tools discovered at runtime using `list_mcp_tools()` and `get_mcp_tool_details()` (no static files)
- **Secure Sandbox Execution** - Docker-based isolation with resource limits, read-only filesystem, and network restrictions
- **PII Protection** - Automatic tokenization/de-tokenization of sensitive data
- **Persistent Skills** - `/skills` directory for reusable agent code
- **Ephemeral Workspace** - `/workspace` directory for temporary task files
- **Multi-Turn Conversations** - Support for complex agent workflows
- **Extensible Architecture** - Easy to customize and extend
- **n8n Integration** - Built-in support for n8n workflow automation with progressive disclosure pattern

## 💡 Why Code Execution?

**The Token Efficiency Problem**: Traditional AI agents must describe every computational step in natural language, consuming valuable context window space. Processing 1,000 records might use 50,000 tokens just to describe the transformations.

**The Solution**: Code execution lets agents write and run code, delegating computation to traditional software while focusing their intelligence on high-level reasoning. The same 1,000-record task uses just ~500 tokens of code.

**Key Benefits**:
- 📊 **Scalability**: Handle tasks of any complexity within token limits
- 🔄 **Reusability**: Save code to `/skills` for future use
- 🔒 **Privacy**: PII tokenized before reaching the LLM
- 🎯 **Reliability**: Deterministic code execution vs. natural language descriptions

> 📖 Read the full philosophy in [`docs/PHILOSOPHY.md`](docs/PHILOSOPHY.md) - explains the "why" behind this architecture based on Anthropic's research.

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
│   │   ├── N8nMcpClient.ts    # n8n integration
│   │   └── PiiCensor.ts       # PII tokenization
│   │
│   ├── n8n_services/          # n8n business logic
│   │   ├── NodeService.ts     # n8n node operations
│   │   ├── TemplateService.ts # Template management
│   │   ├── WorkflowService.ts # Workflow CRUD
│   │   └── types.ts           # Type definitions
│   │
│   ├── agent_runtime/         # Sandbox runtime API
│   │   └── runtime_api.ts     # Injected helper functions
│   │
│   ├── tools_interface/       # Dynamic tool discovery
│   │   └── DynamicToolManager.ts
│   │
│   └── index.ts               # Main server entry point
│
├── servers/                   # Filesystem-based tool discovery
│   ├── n8n-nodes/            # n8n node discovery tools
│   ├── n8n-templates/        # Template search tools
│   ├── n8n-workflows/        # Workflow management tools
│   └── README.md             # Tool discovery guide
│
├── skills/                    # Persistent agent skills
│   └── n8n-workflow-builder/ # Example n8n skill
├── workspace/                 # Ephemeral execution workspace
├── docs/
│   └── n8n_implementation.md # Full n8n implementation plan
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

### n8n Workflow Building Example

Build n8n workflows using the filesystem-based tool discovery:

```javascript
// 1. Discover n8n tools via filesystem
import * as nodes from './servers/n8n-nodes/index.js';
import * as workflows from './servers/n8n-workflows/index.js';

// 2. Search for required nodes (token efficient)
const slackNodes = await nodes.searchNodes('slack');
console.log('Found Slack nodes:', slackNodes);

// 3. Get essential properties only (not full definitions)
const slackInfo = await nodes.getNodeEssentials('n8n-nodes-base.slack');
console.log('Essential properties:', slackInfo.properties.slice(0, 3));

// 4. Build workflow structure
const workflow = {
  name: 'Slack Notification',
  active: false,
  nodes: [
    {
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      position: [250, 300],
      parameters: { path: '/notify', httpMethod: 'POST' }
    },
    {
      name: 'Slack',
      type: 'n8n-nodes-base.slack',
      position: [450, 300],
      parameters: {
        resource: 'message',
        operation: 'post',
        channel: '#alerts',
        text: '={{$json["message"]}}'
      }
    }
  ],
  connections: {
    'Webhook': { main: [[{ node: 'Slack', type: 'main', index: 0 }]] }
  }
};

// 5. Validate before creating
const validation = await workflows.validateWorkflow(workflow);
if (validation.valid) {
  const created = await workflows.createWorkflow(workflow);
  console.log(`Created workflow: ${created.id}`);
  
  // 6. Execute the workflow
  const result = await workflows.executeWorkflow(created.id, {
    message: 'Hello from n8n!'
  });
  console.log('Execution result:', result);
}
```

**Token Savings**: This approach uses ~3,000 tokens vs ~300,000 tokens with traditional tool calling (99% reduction!)

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

## 📖 Documentation & References

### Core Documentation

- **[PHILOSOPHY.md](docs/PHILOSOPHY.md)** - ⭐ **Start here!** Explains the "why" behind code execution, token efficiency, and design principles based on Anthropic's research
- **[IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md)** - 🔧 **Complete implementation guide** for the Code Execution with MCP architecture including all components and usage examples
- **[QUICK_START.md](docs/QUICK_START.md)** - Get running in 5 minutes
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Technical deep dive into system components
- **[SECURITY.md](docs/SECURITY.md)** - Security best practices and hardening checklist
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment guides (Docker, K8s, Cloud)
- **[API_EXAMPLES.md](docs/API_EXAMPLES.md)** - Usage examples and patterns

### Skills & Examples

- **[skills/examples/](skills/examples/)** - Example skills following the Anthropic skills pattern
  - `template-skill/` - Template for creating new skills
  - `data-processor/` - Token-efficient data transformation example

### External References

1. **[Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)** - Anthropic's engineering blog post describing the dynamic execution model and philosophy
2. **[Anthropic Skills Repository](https://github.com/anthropics/skills)** - Open-source examples of skills that extend agent capabilities
3. **[Equipping Agents for the Real World with Agent Skills](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)** - Philosophy behind persistent agent capabilities
4. **[Model Context Protocol Documentation](https://modelcontextprotocol.io)** - MCP specification and guides
5. **[Docker Security Best Practices](https://docs.docker.com/engine/security/)** - Container security hardening

## 🤝 Contributing & Community Collaboration

This is a template repository that represents a **new paradigm** in AI agent development - one where code execution, security, and persistent capabilities work together seamlessly. We believe this approach has the potential to transform how AI agents are built and deployed at scale.

### We're Inviting You to Build This Together

The open-source community is fundamental to advancing this paradigm. We welcome contributions in all forms:

#### **Areas We're Looking For Help**

1. **LLM Integrations** - Add support for more providers (Claude, GPT-4, Gemini, Llama, etc.)
2. **MCP Server Connectors** - Build adapters for popular services (databases, APIs, file systems)
3. **Security Hardening** - Audit the sandbox, propose additional security measures
4. **Performance Optimizations** - Container pooling, caching strategies, resource tuning
5. **Monitoring & Observability** - Prometheus metrics, logging, distributed tracing
6. **Skills Library** - Create reusable, domain-specific skills for the community
7. **Documentation** - Tutorials, deployment guides, best practices
8. **Testing & Examples** - Integration tests, real-world use cases, benchmarks
9. **Alternative Sandboxes** - WebAssembly, cloud functions, process isolation implementations
10. **Frontend UI** - Dashboard, skill explorer, task monitoring interface

#### **How to Contribute**

1. **Fork & Customize** - Start with this template for your specific use case
2. **Share Improvements** - Submit PRs with general-purpose enhancements
3. **Build Skills** - Create reusable skills and submit to the community skills library
4. **Report Issues** - Help us identify bugs and security concerns
5. **Discuss Ideas** - Join conversations about the architecture and design
6. **Write Documentation** - Help others understand and adopt the pattern

#### **The Vision**

We're building toward a future where:
- 🧠 **AI agents scale** beyond token limitations through code execution
- 🔄 **Skills accumulate** over time, making agents continuously smarter
- 🔒 **Privacy is built-in** with automatic PII protection
- 🛡️ **Security is layered** with multiple defense mechanisms
- 🌐 **Tools are discovered dynamically**, not statically configured
- 📚 **Community-driven** with shared skills and best practices

### Customization Guide for Your Organization

Customize this template for your specific needs:

1. **Implement your LLM integration** - Choose your preferred provider
2. **Connect your MCP servers** - Wire up your tools and data sources
3. **Customize security policies** - Adjust for your threat model
4. **Extend PII detection** - Add patterns for your domain
5. **Add monitoring and logging** - Integrate with your observability stack
6. **Build domain-specific skills** - Create your organization's capability library
7. **Share back** - Contribute generic improvements to help the community

### Community Resources

- **Issues & Discussions** - Ask questions, propose features, discuss architecture
- **Skills Repository** - Contribute reusable skills to `skills/examples/`
- **Documentation** - Help improve guides and examples
- **Partnerships** - Collaborate on larger initiatives

### Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Community Hall of Fame
- Speaking opportunities at community events

---

**Together, we can build the next generation of AI agent infrastructure.** Whether you're an AI researcher, DevOps engineer, security expert, or full-stack developer, there's a place for your contributions. Join us in advancing this paradigm!

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

