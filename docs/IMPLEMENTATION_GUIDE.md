# Implementation Guide for Code Execution with MCP System

## Overview

This document provides a comprehensive implementation guide for the "Code Execution with MCP" system architecture. The system enables AI agents to dynamically discover and execute tools through secure, sandboxed code execution.

## Architecture Components

### 1. Filesystem Generator (`src/tools_interface/FilesystemGenerator.ts`)

**Purpose**: Introspects MCP server tool definitions and generates a virtual code library that agents can discover at runtime.

**Key Features**:
- Discovers MCP servers by scanning the `servers/` directory
- Loads and introspects server modules to extract available functions
- Provides a virtual library structure for token-efficient tool discovery
- Caches tool definitions with configurable TTL

**Usage Example**:
```typescript
const fsGen = new FilesystemGenerator();

// Discover all available servers
const servers = await fsGen.introspectServers();
console.log('Available servers:', servers);

// Get the complete virtual library
const library = await fsGen.generateVirtualLibrary();
console.log('Tool library:', library);

// Get details about a specific server
const serverIndex = await fsGen.getServerIndex('n8n-nodes');
console.log('Server capabilities:', serverIndex);
```

**From Agent Code (in sandbox)**:
```javascript
// Agent can discover servers at runtime
const servers = await introspect_servers();
console.log('Available servers:', servers);

// Get the complete virtual library structure
const library = await get_virtual_library();
console.log('All available tools:', library);

// Explore a specific server
const nodeServer = await get_server_index('n8n-nodes');
console.log('n8n capabilities:', nodeServer);
```

### 2. Tool Call Router (`src/tools_interface/ToolCallRouter.ts`)

**Purpose**: Manages routing of tool calls between different execution strategies.

**Routing Strategies**:
1. **meta** - Internal discovery tools (`list_mcp_tools`, `get_mcp_tool_details`, etc.)
2. **filesystem** - Filesystem-based tool discovery (`introspect_servers`, `get_virtual_library`, etc.)
3. **mcp-direct** - Direct MCP server tool execution
4. **auto** - Automatically determines the best strategy

**Key Features**:
- Intelligent routing based on tool name patterns
- Call statistics and performance tracking
- Strategy override capability for advanced use cases
- Unified error handling across all strategies

**Usage Example**:
```typescript
const router = new ToolCallRouter(mcpClient, filesystemGenerator);

// Route a tool call (strategy determined automatically)
const result = await router.routeToolCall({
  toolName: 'list_mcp_tools',
  input: {},
  userId: 'user123'
});

// Override strategy explicitly
const result2 = await router.routeToolCall({
  toolName: 'custom_tool',
  input: { param: 'value' },
  userId: 'user123',
  strategy: 'mcp-direct'
});

// Get routing statistics
const stats = router.getStats();
console.log('Success rate:', stats.successRate);
```

### 3. Enhanced Runtime API (`src/agent_runtime/runtime_api.ts`)

**Purpose**: Provides helper functions available to agent code running in the sandbox.

**New Functions Added**:
```javascript
// Filesystem-based tool discovery
await introspect_servers()           // List all MCP server directories
await get_virtual_library()          // Get complete tool library structure
await get_server_index(serverName)   // Get server index file content
await list_server_functions(serverName) // List functions in a server

// Utility enhancement
utils.requireServer(modulePath)      // Safely require modules from servers/
```

**Complete Runtime API**:
```javascript
// Tool Discovery & Execution
await list_mcp_tools()               // List all MCP tools
await get_mcp_tool_details(name)     // Get tool details
await callMCPTool(toolName, input)   // Execute a tool

// Filesystem Discovery
await introspect_servers()           // Discover server directories
await get_virtual_library()          // Get virtual library structure
await get_server_index(serverName)   // Get server index
await list_server_functions(serverName) // List server functions

// File System Operations (restricted to /skills and /workspace)
await fs.writeFile(path, data)       // Write a file
await fs.readFile(path)              // Read a file
await fs.listFiles(dirPath)          // List files in directory
await fs.exists(path)                // Check if file exists
await fs.deleteFile(path)            // Delete a file

// Utilities
utils.sleep(ms)                      // Sleep for milliseconds
utils.parseJSON(str)                 // Safe JSON parsing
utils.timestamp()                    // Get current timestamp
utils.requireServer(modulePath)      // Require server module
```

### 4. Enhanced Dynamic Tool Manager (`src/tools_interface/DynamicToolManager.ts`)

**Purpose**: Provides meta-tools for dynamic discovery to the agent.

**Extended Tool Definitions**:
- `list_mcp_tools` - Discover all MCP tools
- `get_mcp_tool_details` - Get tool details
- `callMCPTool` - Execute a tool
- `introspect_servers` - Discover server directories
- `get_virtual_library` - Get complete library structure
- `get_server_index` - Get server index content
- `list_server_functions` - List server functions

### 5. Enhanced MCP Client (`src/mcp_client/McpClient.ts`)

**Purpose**: Manages MCP server connections and tool execution with integrated routing.

**New Features**:
- Integrated `ToolCallRouter` for intelligent call routing
- Integrated `FilesystemGenerator` for tool introspection
- Accessor methods for router and filesystem generator
- Enhanced tool execution with automatic PII protection

**Usage Example**:
```typescript
const mcpClient = new McpClient(piiCensor);

// Call a tool (routing handled automatically)
const result = await mcpClient.callTool('some_tool', { param: 'value' }, 'user123');

// Access the router for advanced use cases
const router = mcpClient.getRouter();
const stats = router.getStats();

// Access the filesystem generator
const fsGen = mcpClient.getFilesystemGenerator();
const library = await fsGen.generateVirtualLibrary();
```

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User / Application                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Agent Orchestrator                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ AgentManager │◄─┤ PII Censor   │◄─┤ MCP Client      │   │
│  └──────┬───────┘  └──────────────┘  └────────┬────────┘   │
│         │                                      │             │
│         ▼                                      ▼             │
│  ┌──────────────┐                    ┌──────────────────┐   │
│  │ LLM Provider │                    │ Tool Call Router │   │
│  └──────┬───────┘                    └────────┬─────────┘   │
│         │                                      │             │
│         ▼                                      ▼             │
│  ┌──────────────────────────────┐    ┌──────────────────┐   │
│  │   Sandbox Manager (Docker)   │    │Filesystem Gen.   │   │
│  └──────┬───────────────────────┘    └──────────────────┘   │
└─────────┼────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              Secure Docker Container                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Agent Code Execution                                 │   │
│  │  - Enhanced Runtime API                              │   │
│  │  - Dynamic Tool Discovery                            │   │
│  │  - Filesystem-based Discovery                        │   │
│  │  - /skills (persistent, mounted)                     │   │
│  │  - /workspace (ephemeral, mounted)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Security: Non-root user, read-only rootfs, resource limits │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Servers                               │
│  (File System, Databases, APIs, Custom Tools)               │
│                                                              │
│  servers/                                                    │
│  ├── n8n-nodes/      - n8n node discovery                   │
│  ├── n8n-templates/  - Template search                      │
│  └── n8n-workflows/  - Workflow management                  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Complete Request Flow with New Components

```
1. HTTP Request
   ↓
2. Express Server (index.ts)
   ↓
3. AgentManager.runTask()
   ↓
4. Get Dynamic Tools (DynamicToolManager)
   ├─ Meta tools (list, get_details)
   └─ Filesystem discovery tools (introspect, get_library)
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
   ├─ Inject Enhanced Runtime API
   │  ├─ Tool discovery functions
   │  ├─ Filesystem discovery functions
   │  └─ Utility functions
   └─ Execute Code
      ↓
10. Agent Code Runs
    ├─ Calls introspect_servers()
    ├─ Calls get_virtual_library()
    ├─ Calls list_mcp_tools()
    ├─ Calls get_mcp_tool_details()
    └─ Calls callMCPTool()
       ↓
11. callMCPTool() → HTTP to Host /internal/mcp-call
    ↓
12. McpClient.callTool()
    ├─ Routes through ToolCallRouter
    │  ├─ Determines strategy (meta/filesystem/mcp-direct)
    │  └─ Executes via appropriate handler
    ├─ De-tokenize PII
    ├─ Execute on MCP Server or FilesystemGenerator
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

## Token Efficiency Improvements

### Traditional Approach (Without Filesystem Generator)
```javascript
// Agent must receive ALL tool definitions upfront
// For 100 tools with detailed schemas: ~50,000 tokens
const tools = [
  { name: "tool1", description: "...", parameters: {...} },
  { name: "tool2", description: "...", parameters: {...} },
  // ... 98 more tools
];
```

### New Approach (With Filesystem Generator)
```javascript
// Agent discovers only what it needs
// Initial discovery: ~500 tokens
const servers = await introspect_servers();
// Returns: ['n8n-nodes', 'n8n-templates', 'n8n-workflows']

// Explore specific server: ~1,000 tokens
const library = await get_virtual_library();
// Returns structured view of what's available

// Get details only when needed: ~500 tokens per tool
const nodeInfo = await get_server_index('n8n-nodes');
const functions = await list_server_functions('n8n-nodes');

// Total: ~2,000 tokens vs 50,000 tokens (96% reduction!)
```

## Agent Workflow Examples

### Example 1: Discovering and Using n8n Tools

```javascript
// Step 1: Discover available servers
const servers = await introspect_servers();
console.log('Available servers:', servers);
// Output: ['n8n-nodes', 'n8n-templates', 'n8n-workflows']

// Step 2: Get the virtual library to see structure
const library = await get_virtual_library();
console.log('Library structure:', library);

// Step 3: Explore n8n-nodes server
const nodeServer = await get_server_index('n8n-nodes');
console.log('n8n-nodes capabilities:', nodeServer);

// Step 4: List available functions
const functions = await list_server_functions('n8n-nodes');
console.log('Available functions:', functions);

// Step 5: Use MCP tools to work with n8n
const slackNodes = await callMCPTool('n8n_search_nodes', { query: 'slack' });
console.log('Found Slack nodes:', slackNodes);
```

### Example 2: Building a Workflow with Progressive Disclosure

```javascript
// Start with high-level discovery
const servers = await introspect_servers();

// Find workflow-related server
const workflowServer = servers.find(s => s.includes('workflow'));

// Get available workflow operations
const workflowFunctions = await list_server_functions(workflowServer);
console.log('Workflow operations:', workflowFunctions);

// Create a workflow using discovered tools
const workflow = await callMCPTool('n8n_create_workflow', {
  name: 'Notification Pipeline',
  nodes: [/* ... */],
  connections: {/* ... */}
});

console.log('Created workflow:', workflow.id);
```

## Integration Points

### 1. Integrating with Your LLM Provider

Update `src/agent_orchestrator/AgentManager.ts`:

```typescript
async function callLLM(prompt: string, tools: any[]): Promise<LLMResponse> {
  // Example: OpenAI integration
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    tools: tools
  });
  
  // Parse response and return structured format
  return {
    type: 'code_execution',
    code: extractCodeFromResponse(response)
  };
}
```

### 2. Adding New MCP Servers to Filesystem

1. Create a new directory in `servers/`:
```bash
mkdir servers/my-custom-server
```

2. Create an `index.ts` file:
```typescript
// servers/my-custom-server/index.ts
export const description = 'My custom MCP server tools';

export const categories = ['data', 'api'];

export async function myFunction(param: string): Promise<any> {
  // Implementation
}

export async function anotherFunction(data: any): Promise<any> {
  // Implementation
}
```

3. The FilesystemGenerator will automatically discover it:
```javascript
const servers = await introspect_servers();
// Now includes: 'my-custom-server'

const myServer = await get_server_index('my-custom-server');
// Returns: { description, categories, myFunction, anotherFunction }
```

### 3. Extending the Runtime API

To add custom runtime functions, edit `src/agent_runtime/runtime_api.ts`:

```typescript
global.myCustomFunction = async function(param) {
  // Your custom logic available to agent code
};
```

## Security Considerations

### Filesystem Generator Security

The FilesystemGenerator only allows access to the `servers/` directory:
- Prevents directory traversal attacks
- No access to system files or parent directories
- Cached results to prevent excessive filesystem operations

### Tool Call Router Security

- Validates all tool calls before execution
- Enforces PII tokenization/de-tokenization
- Tracks call statistics for anomaly detection
- Supports strategy whitelisting for production

### Runtime API Security

Enhanced security in the sandbox:
- `utils.requireServer()` restricted to `servers/` directory only
- All filesystem operations remain restricted to `/skills` and `/workspace`
- No access to host filesystem or sensitive directories

## Performance Optimization

### Caching Strategy

```typescript
// FilesystemGenerator uses TTL-based caching
const fsGen = new FilesystemGenerator();

// First call: reads from filesystem
const library1 = await fsGen.generateVirtualLibrary();

// Subsequent calls within TTL: uses cache
const library2 = await fsGen.generateVirtualLibrary();

// Get cache statistics
const stats = fsGen.getStats();
console.log('Cached tools:', stats.cachedTools);
console.log('Cache age:', stats.cacheAge);
```

### Router Performance Tracking

```typescript
const router = mcpClient.getRouter();

// Execute several tool calls
// ...

// Analyze performance
const stats = router.getStats();
console.log('Total calls:', stats.totalCalls);
console.log('Success rate:', stats.successRate);
console.log('Per-tool stats:', stats.callsByTool);
```

## Testing

### Unit Testing New Components

```bash
# Test FilesystemGenerator
npm test -- FilesystemGenerator.test.ts

# Test ToolCallRouter
npm test -- ToolCallRouter.test.ts
```

### Integration Testing

```bash
# Start the server
npm start

# Test filesystem discovery
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "task": "Discover available MCP servers using introspect_servers and show me the virtual library structure"
  }'
```

## Troubleshooting

### FilesystemGenerator Issues

**Problem**: Servers not being discovered
```typescript
// Check filesystem generator status
const fsGen = mcpClient.getFilesystemGenerator();
const stats = fsGen.getStats();
console.log('Servers path:', stats.serversPath);

// Manually introspect
const servers = await fsGen.introspectServers();
console.log('Found servers:', servers);
```

**Problem**: Module loading errors
- Ensure `index.ts` files in server directories export properly
- Check for syntax errors in server modules
- Verify TypeScript compilation of server files

### ToolCallRouter Issues

**Problem**: Wrong strategy being selected
```typescript
// Override strategy explicitly
const result = await router.routeToolCall({
  toolName: 'my_tool',
  input: {},
  userId: 'user123',
  strategy: 'mcp-direct' // Force specific strategy
});
```

**Problem**: Tool calls failing
```typescript
// Check router statistics
const stats = router.getStats();
console.log('Failure rates:', stats.callsByTool);

// Check available meta-tools
const metaTools = router.getMetaTools();
console.log('Available meta-tools:', metaTools);
```

## Conclusion

The enhanced Code Execution with MCP system provides:

1. **Token Efficiency**: Filesystem-based discovery reduces token usage by 90-99%
2. **Flexibility**: Dynamic tool discovery adapts to available capabilities
3. **Scalability**: No limits on the number of tools that can be discovered
4. **Maintainability**: Single source of truth in filesystem structure
5. **Security**: Multiple layers of isolation and validation

The architecture successfully implements the principles from Anthropic's "Code Execution with MCP" pattern while adding filesystem-based progressive disclosure for even greater token efficiency.
