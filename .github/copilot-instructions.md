# GitHub Copilot Instructions for code-execution-with-MCP

This repository implements the **Code Execution with MCP** pattern - a production-ready AI agent harness that enables dynamic tool discovery and secure code execution through Model Context Protocol (MCP).

## Project Overview

This is a TypeScript-based template for building AI agents that can:
- Dynamically discover and execute MCP tools at runtime
- Run agent-generated code in secure Docker sandboxes
- Protect PII through automatic tokenization/de-tokenization
- Persist reusable skills across sessions
- Scale beyond token limitations through code execution

**Inspired by**: Anthropic's [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) pattern and [Skills Repository](https://github.com/anthropics/skills).

## Architecture

The project is organized into distinct layers:

- **`src/agent_orchestrator/`** - Main agent execution loop and LLM integration
- **`src/sandbox_manager/`** - Secure Docker-based code execution with resource limits
- **`src/mcp_client/`** - MCP server communication and PII protection
- **`src/agent_runtime/`** - Runtime API injected into sandbox (callMCPTool, fs, utils)
- **`src/tools_interface/`** - Dynamic tool discovery from MCP servers
- **`skills/`** - Persistent agent skills (user-specific, mounted into sandbox)
- **`workspace/`** - Ephemeral execution workspace (temporary files)

## Coding Conventions

### TypeScript Standards
- **Strict mode enabled** - Use TypeScript strict mode with proper type annotations
- **No implicit any** - Always define explicit types
- **Error handling** - Use try-catch blocks and propagate errors appropriately
- **Async/await** - Prefer async/await over Promise chains
- **Naming** - Use PascalCase for classes, camelCase for variables/functions
- **Interfaces over types** - Prefer interfaces for object shapes

### Security Best Practices
- **Never log PII** - Use PII tokenization before logging any user data
- **Never log API keys** - Keep credentials out of logs and version control
- **Validate auth tokens** - Always validate sandbox authentication tokens in production
- **Sandbox isolation** - Maintain non-root execution, read-only rootfs, resource limits
- **Input validation** - Validate all user inputs and API parameters
- **TODO markers** - Mark security-sensitive placeholder code with `// TODO: [Security]`

### File Organization
- One class per file with matching filename (e.g., `AgentManager.ts` contains `AgentManager` class)
- Export public APIs from `index.ts` in each directory
- Keep files focused and single-responsibility
- Group related functionality in directories

### Comments and Documentation
- Use JSDoc comments for public APIs and complex functions
- Add inline comments for non-obvious logic
- Reference architecture patterns in comments (e.g., "Dynamic tool discovery pattern")
- Mark TODOs clearly with context: `// TODO: [Category] Description`

## Key Patterns

### Dynamic Tool Discovery
Tools are discovered at runtime, not statically configured:
```typescript
// In sandbox code
const tools = await list_mcp_tools();
const toolDetails = await get_mcp_tool_details("tool__name");
const result = await callMCPTool("tool__name", params);
```

### PII Protection
All user data flows through PII tokenization:
```typescript
const piiCensor = new PiiCensor();
const { tokenized, mapping } = piiCensor.tokenize(userData);
// Use tokenized version with LLM
const detokenized = piiCensor.detokenize(result, mapping);
```

### Skills Pattern
Reusable agent code saved to `/skills`:
```typescript
// Agent saves code for future use
await fs.writeFile('/skills/my_skill.js', code);
// Later executions can require() this skill
const mySkill = require('/skills/my_skill.js');
```

### Sandbox Communication
Sandbox uses HTTP to call back to host for MCP tools:
```typescript
// Inside sandbox
const result = await callMCPTool(toolName, params);
// This makes authenticated HTTP request to /internal/mcp-call
```

## Development Workflow

### Build and Run
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm run dev          # Development mode with auto-reload
npm run clean        # Remove build artifacts
npm start            # Run production build
```

### Docker Sandbox
```bash
npm run build-sandbox    # Build the Docker sandbox image
npm run prepare-workspace # Create required directories
```

### Testing
- Integration tests should use actual sandbox execution
- Mock MCP servers for testing tool discovery
- Test PII tokenization/detokenization round-trips
- Validate Docker security settings (non-root, read-only, etc.)

## Common Scenarios

### Adding a New LLM Provider
1. Edit `src/agent_orchestrator/AgentManager.ts`
2. Implement the `callLLM()` method with your provider's SDK
3. Map provider's tool calling format to our internal structure
4. Handle streaming if supported

### Adding a New MCP Server
1. Edit `src/mcp_client/McpClient.ts`
2. Add server configuration in `initializeServers()`
3. Use `@modelcontextprotocol/sdk` for the connection
4. Tools are auto-discovered via `listTools()`

### Extending PII Detection
1. Edit `src/mcp_client/PiiCensor.ts`
2. Add new pattern to the patterns map
3. Test with sample data
4. Consider domain-specific patterns

### Creating a Custom Sandbox
1. Extend `src/sandbox_manager/SandboxManager.ts` abstract class
2. Implement `executeCode()` method
3. Ensure security isolation (network, filesystem, resources)
4. Inject runtime API for tool calling

## File Templates

### New Tool Interface
```typescript
export interface MyTool {
  name: string;
  description: string;
  inputSchema: object;
}

export class MyToolManager {
  async discoverTools(): Promise<MyTool[]> {
    // Implementation
  }
}
```

### New Sandbox Manager
```typescript
export class MySandboxManager extends SandboxManager {
  async executeCode(code: string, context: ExecutionContext): Promise<any> {
    // Ensure security isolation
    // Inject runtime API
    // Execute and return result
  }
}
```

## Important TODOs in Codebase

Search for `TODO` comments - these mark areas requiring implementation:
- LLM integration (placeholder in `AgentManager.ts`)
- MCP server connections (mock in `McpClient.ts`)
- Auth token validation (security critical in `index.ts`)
- Production hardening (monitoring, error handling, scaling)

## Documentation

Before implementing features, review:
- **`docs/PHILOSOPHY.md`** - Why code execution, token efficiency, design principles
- **`docs/ARCHITECTURE.md`** - Technical deep dive into components
- **`docs/SECURITY.md`** - Security best practices and hardening
- **`docs/DEPLOYMENT.md`** - Production deployment guides
- **`README.md`** - Quick start and examples

## External References

- [Anthropic's Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) - Original pattern
- [Model Context Protocol Docs](https://modelcontextprotocol.io) - MCP specification
- [Docker Security Best Practices](https://docs.docker.com/engine/security/) - Container hardening

## When Contributing

1. **Follow existing patterns** - Match the style and structure of existing code
2. **Security first** - Never compromise on security isolation or PII protection
3. **Test thoroughly** - Verify sandbox isolation, tool discovery, error handling
4. **Document decisions** - Add comments explaining "why" for complex logic
5. **Keep it minimal** - This is a template - avoid over-engineering
6. **Think about skills** - Consider if new functionality should be a skill vs. core feature

## Common Pitfalls to Avoid

- ❌ Don't hardcode tool definitions - use dynamic discovery
- ❌ Don't log raw user data - always tokenize PII first
- ❌ Don't run sandbox as root - maintain non-root security
- ❌ Don't skip input validation - sanitize all inputs
- ❌ Don't ignore resource limits - enforce memory/CPU quotas
- ❌ Don't create static tool configs - discover tools at runtime
- ❌ Don't commit secrets - use environment variables

## Environment Variables

Key configuration (see `.env.example`):
- `SANDBOX_IMAGE` - Docker image name for sandbox
- `SANDBOX_TIMEOUT_MS` - Execution timeout
- `SANDBOX_MEMORY_MB` - Memory limit
- `SANDBOX_CPU_QUOTA` - CPU quota
- `LLM_API_KEY` - LLM provider credentials
- `LLM_MODEL` - Model to use

## Code Quality Expectations

- Write clean, readable TypeScript with proper types
- Handle errors gracefully and provide meaningful messages
- Use async/await consistently
- Follow single responsibility principle
- Keep functions small and focused
- Add tests for new functionality
- Document public APIs with JSDoc
- Use meaningful variable and function names
- Avoid deep nesting - extract functions when needed
