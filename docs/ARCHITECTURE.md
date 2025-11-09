## Architecture Overview

Complete technical architecture of the MCP Code Execution Harness.

## System Components

### 1. Agent Orchestrator (`src/agent_orchestrator/`)

**Purpose**: Manages the LLM interaction and agent execution loop.

**Key Files**:
- `AgentManager.ts` - Main orchestration logic
- `prompt_templates.ts` - System prompts and templates

**Responsibilities**:
- Accept user tasks
- Format prompts for LLM
- Process LLM responses
- Coordinate sandbox execution
- Handle multi-turn conversations (extensible)

**Flow**:
```
User Request → AgentManager → LLM → Response Processing
                    ↓
              (if code execution)
                    ↓
              SandboxManager → Secure Execution
```

### 2. Sandbox Manager (`src/sandbox_manager/`)

**Purpose**: Provides secure, isolated code execution environment.

**Key Files**:
- `SandboxManager.ts` - Abstract interface
- `DockerSandbox.ts` - Docker implementation

**Security Features**:
- Non-root execution
- Read-only root filesystem
- Resource limits (CPU, memory)
- Network isolation options
- Ephemeral containers
- Volume mounting for `/skills` and `/workspace`

**Execution Flow**:
```
Code → Inject Runtime API → Create Container → Execute → Collect Output → Cleanup
```

### 3. MCP Client (`src/mcp_client/`)

**Purpose**: Manages connections to MCP servers and handles tool execution.

**Key Files**:
- `McpClient.ts` - Main MCP communication layer
- `PiiCensor.ts` - Privacy protection via tokenization

**Features**:
- Dynamic server connections
- Tool discovery and registration
- PII tokenization/de-tokenization
- Tool execution with privacy protection

**PII Flow**:
```
Agent Code → Tokenize PII → Send to LLM
MCP Tool ← De-tokenize PII ← Receive from Agent
```

### 4. Agent Runtime (`src/agent_runtime/`)

**Purpose**: Code injected into sandbox providing helper functions.

**Key File**:
- `runtime_api.ts` - Runtime environment definition

**Provides**:
- `callMCPTool()` - Execute MCP tools
- `list_mcp_tools()` - Discover available tools
- `get_mcp_tool_details()` - Get tool information
- `fs` - Sandboxed filesystem operations
- `utils` - Helper utilities

**Injection Process**:
```javascript
// Runtime API is injected as a string into the container
const injectedCode = `
  ${getRuntimeApi()}
  ${userCode}
`;
```

### 5. Tools Interface (`src/tools_interface/`)

**Purpose**: Manages dynamic tool discovery capabilities.

**Key File**:
- `DynamicToolManager.ts` - Tool discovery abstraction

**Pattern**:
Instead of static tool files, provides:
- Meta-tools for discovery (`list_mcp_tools`, `get_mcp_tool_details`)
- Dynamic tool execution (`callMCPTool`)
- LLM-agnostic tool formatting

## Data Flow

### Complete Request Flow

```
1. HTTP Request
   ↓
2. Express Server (index.ts)
   ↓
3. AgentManager.runTask()
   ↓
4. Get Dynamic Tools (DynamicToolManager)
   ↓
5. Format System Prompt
   ↓
6. Call LLM → Receives Code/Instructions
   ↓
7. Generate Auth Token
   ↓
8. SandboxManager.executeCode()
   ↓
9. Create Docker Container
   ├─ Mount /skills (persistent)
   ├─ Mount /workspace (ephemeral)
   ├─ Inject Runtime API
   └─ Execute Code
      ↓
10. Agent Code Runs
    ├─ Calls list_mcp_tools()
    ├─ Calls get_mcp_tool_details()
    └─ Calls callMCPTool()
       ↓
11. callMCPTool() → HTTP to Host /internal/mcp-call
    ↓
12. McpClient.callTool()
    ├─ De-tokenize PII
    ├─ Execute on MCP Server
    ├─ Tokenize PII in result
    └─ Return to Sandbox
       ↓
13. Sandbox Execution Completes
    ↓
14. Collect Logs and Output
    ↓
15. Tokenize PII in Logs
    ↓
16. Return Response to User
```

### Security Boundaries

```
┌─────────────────────────────────────────┐
│  User/Application (Untrusted)           │
└────────────┬────────────────────────────┘
             │ HTTPS/TLS
             ↓
┌─────────────────────────────────────────┐
│  Express Server (Trusted)                │
│  - Authentication                        │
│  - Input Validation                      │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  Agent Orchestrator (Trusted)            │
│  - PII Tokenization                      │
│  - Prompt Engineering                    │
└────────────┬────────────────────────────┘
             │
             ├──→ LLM (External Service)
             │
             ↓
┌─────────────────────────────────────────┐
│  Docker Sandbox (Isolated/Untrusted)     │
│  - Non-root user                         │
│  - Resource limits                       │
│  - Read-only rootfs                      │
│  - Network restrictions                  │
└────────────┬────────────────────────────┘
             │ Authenticated Channel
             ↓
┌─────────────────────────────────────────┐
│  MCP Client (Trusted)                    │
│  - PII De-tokenization                   │
│  - Tool Execution                        │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  MCP Servers (External Services)         │
│  - File System                           │
│  - Databases                             │
│  - APIs                                  │
└─────────────────────────────────────────┘
```

## State Management

### Persistent State (`/skills`)

- User-specific directories: `/skills/{userId}/`
- Contains reusable agent-created functions
- Survives across sessions
- Backed by persistent volume
- Read/write access in sandbox

**Example Structure**:
```
skills/
├── user123/
│   ├── dataProcessor.js
│   ├── emailValidator.js
│   └── reportGenerator.js
└── user456/
    └── customAnalyzer.js
```

### Ephemeral State (`/workspace`)

- Session-specific directories: `/workspace/{userId}_{timestamp}/`
- Temporary files for current task
- Deleted after execution
- Read/write access in sandbox

**Example Structure**:
```
workspace/
├── user123_1699524000/
│   ├── temp_data.json
│   └── processing_log.txt
└── user456_1699524100/
    └── intermediate_results.csv
```

### In-Memory State

**PII Cache**:
- Development: In-memory Map
- Production: Redis with expiring keys

**Tool Cache**:
- Cached tool definitions
- Configurable TTL
- Automatic refresh

## Extension Points

### 1. Add New LLM Provider

```typescript
// In AgentManager.ts
async function callLLM(prompt: string, tools: any[]): Promise<LLMResponse> {
  // Implement your LLM integration here
  // Examples: OpenAI, Anthropic, Google, Azure
}
```

### 2. Add New MCP Server

```typescript
// In McpClient.ts
async addServer(config: MCPServerConfig): Promise<void> {
  // Connect to MCP server
  // Discover and register tools
}
```

### 3. Custom Sandbox Implementation

```typescript
// Create new sandbox implementation
class CustomSandbox extends SandboxManager {
  async executeCode(code: string, authToken: string, userId: string): Promise<SandboxResult> {
    // Your custom execution environment
    // Examples: WebAssembly, VM-based, cloud functions
  }
}
```

### 4. Additional Runtime Functions

```typescript
// In runtime_api.ts - add to getRuntimeApi()
global.customFunction = async function(...) {
  // Your custom runtime function
};
```

### 5. Custom PII Patterns

```typescript
// In PiiCensor.ts
piiCensor.addPattern('custom_id', /\bCUST-\d{8}\b/g);
```

## Performance Considerations

### Bottlenecks

1. **LLM API Latency** - External API calls (1-10s)
2. **Container Creation** - Docker overhead (1-3s)
3. **Code Execution** - User code runtime (variable)
4. **MCP Tool Calls** - External service calls (variable)

### Optimization Strategies

1. **Container Pooling** - Pre-create warm containers
2. **Caching** - Cache tool definitions, LLM responses
3. **Async Execution** - Non-blocking operations
4. **Resource Limits** - Prevent resource exhaustion
5. **Connection Pooling** - Reuse MCP connections

### Scaling Patterns

**Horizontal Scaling**:
- Stateless application design
- Shared `/skills` volume (NFS, EFS, etc.)
- Redis for shared PII cache
- Load balancer distribution

**Vertical Scaling**:
- Increase container resources
- Optimize Docker host
- Tune Node.js memory limits

## Error Handling

### Error Types

1. **Validation Errors** - Invalid input
2. **LLM Errors** - API failures, rate limits
3. **Sandbox Errors** - Execution failures, timeouts
4. **MCP Errors** - Tool not found, execution failures
5. **System Errors** - Docker unavailable, resource exhaustion

### Recovery Strategies

- Retry with exponential backoff
- Graceful degradation
- Error logging and monitoring
- User-friendly error messages

## Monitoring & Observability

### Key Metrics

- Request rate and latency
- LLM API calls and costs
- Sandbox execution time
- MCP tool usage
- Error rates by type
- Resource utilization

### Logging Levels

- **DEBUG**: Detailed execution traces
- **INFO**: Normal operations
- **WARN**: Degraded performance, recoverable errors
- **ERROR**: Failures requiring attention

### Traces

Implement distributed tracing for:
- Request → LLM → Sandbox → MCP flow
- Performance bottleneck identification
- Error root cause analysis

## Security Model

### Defense in Depth

1. **Input Layer**: Validation, sanitization
2. **Application Layer**: Authentication, authorization
3. **Execution Layer**: Sandbox isolation
4. **Data Layer**: PII tokenization
5. **Network Layer**: Firewall rules, TLS
6. **Audit Layer**: Comprehensive logging

### Trust Boundaries

- **Trusted**: Host application, MCP client
- **Semi-Trusted**: LLM (tokenized data)
- **Untrusted**: User input, agent-generated code
- **External**: MCP servers (validated through client)

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5+
- **Container**: Docker
- **Web Framework**: Express
- **LLM**: Pluggable (OpenAI, Anthropic, etc.)
- **MCP**: Model Context Protocol SDK
- **Cache**: Redis (production)
- **Logging**: Console (extensible)
- **Monitoring**: Prometheus (optional)
