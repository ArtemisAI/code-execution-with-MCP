# n8n MCP Server Implementation Plan

**Code Execution with MCP Architecture - n8n Integration**

---

## 🎯 Objective

Implement the n8n MCP server following the **Code Execution with MCP** paradigm from Anthropic, transforming direct tool calls into a filesystem-based code execution approach for maximum efficiency and scalability.

**Source Materials:**
- Base Implementation: `_Import/n8n-mcp/` (ArtemisAI fork with 541 nodes, 2,709 templates)
- Architecture Reference: `docs/CODE_EXECUTION_WITH_MCP.md`
- Target Structure: Match existing `src/` directory pattern

---

## 📋 Current n8n-MCP Analysis

### Existing Structure (From `_Import/n8n-mcp/`)

**Core Components:**
```
src/
├── mcp/                    # MCP server implementation
│   ├── index.ts           # Main MCP server entry
│   ├── tools/             # Direct tool call implementations
│   └── handlers/          # Tool request handlers
├── database/              # SQLite storage (68MB)
│   ├── repositories/      # Data access layer
│   └── adapters/          # Database connections
├── services/              # Business logic
│   ├── NodeService.ts     # Node operations
│   ├── TemplateService.ts # Template management
│   └── ValidationService.ts # Config validation
├── n8n/                   # n8n API client
│   └── N8nApiClient.ts    # Workflow management
├── parsers/               # Node parsing logic
└── types/                 # TypeScript definitions
```

**Current Approach (Direct Tool Calls):**
- 40+ MCP tools exposed directly
- All tool definitions loaded upfront into context
- Each tool call passes through model
- Intermediate results consume tokens

**Database Coverage:**
- 541 nodes (100% coverage)
- 2,709 workflow templates (100% metadata)
- 2,646 pre-extracted configurations
- 271 AI-capable nodes
- ~12ms average response time

---

## 🏗️ Target Architecture

### Code Execution Paradigm

Transform n8n-MCP from **direct tool calling** to **code execution** model:

**Before (Current):**
```
LLM → MCP Tool Call → n8n-mcp → Response → LLM
```

**After (Code Execution):**
```
LLM → Write Code → Execute in Sandbox → Process Data → Return Results → LLM
```

### Filesystem Structure

Present n8n MCP tools as a **code filesystem** for progressive disclosure:

```
servers/
├── n8n-nodes/
│   ├── getNodeInfo.ts          # Get node details
│   ├── searchNodes.ts          # Find nodes by query
│   ├── getNodeEssentials.ts    # Top 10-20 properties
│   ├── validateNodeMinimal.ts  # Quick validation
│   ├── validateNodeOperation.ts # Full validation
│   └── index.ts                # Node discovery tools
├── n8n-templates/
│   ├── searchTemplates.ts      # Text search
│   ├── searchByMetadata.ts     # Advanced filtering
│   ├── getTemplate.ts          # Get workflow JSON
│   ├── listNodeTemplates.ts    # Templates by node
│   └── index.ts                # Template discovery tools
├── n8n-workflows/
│   ├── createWorkflow.ts       # Deploy workflow
│   ├── updatePartialWorkflow.ts # Diff operations
│   ├── validateWorkflow.ts     # Complete validation
│   ├── getWorkflowStructure.ts # Simplified view
│   └── index.ts                # Workflow management tools
├── n8n-executions/
│   ├── triggerWebhook.ts       # Execute via webhook
│   ├── listExecutions.ts       # Get execution history
│   ├── retryExecution.ts       # Retry failed runs
│   └── index.ts                # Execution management
└── index.ts                    # Root discovery
```

### Implementation Layers

**1. Sandbox Manager** (New)
- Secure Docker-based execution environment
- Resource limits (CPU, memory, timeout)
- Filesystem isolation for `./workspace/`
- Network restrictions (localhost webhooks configurable)

**2. MCP Client Adapter** (Modified)
- Transform tool calls into TypeScript function imports
- Map existing `src/services/` to `./servers/n8n-*/` structure
- Maintain backward compatibility for direct calls

**3. Runtime API Injection** (New)
- Inject n8n MCP functions into code execution context
- Provide `callMCPTool<T>(toolName, params)` wrapper
- Handle authentication and API routing

**4. PII Censoring** (Optional - for privacy-preserving operations)
- Tokenize sensitive data before passing to LLM
- Maintain lookup table in sandbox environment
- Untokenize when making actual n8n API calls

---

## 📂 File Structure Mapping

### Phase 1: Core Infrastructure

**Create New Files:**

```
src/
├── sandbox_manager/
│   ├── DockerSandbox.ts       # Docker container management
│   ├── SandboxManager.ts      # Sandbox lifecycle
│   └── resource_limits.ts     # CPU/memory/timeout configs
├── agent_runtime/
│   ├── runtime_api.ts         # Inject n8n functions into sandbox
│   ├── callMCPTool.ts        # Wrapper for tool execution
│   └── filesystem_setup.ts    # Create ./servers/ structure
├── mcp_client/
│   ├── McpClientAdapter.ts    # Transform tools to filesystem
│   ├── ToolDiscovery.ts       # Generate file tree from services
│   └── PiiCensor.ts          # Optional: tokenize sensitive data
└── agent_orchestrator/
    ├── AgentManager.ts        # Main orchestration logic
    └── prompt_templates.ts    # Agent prompts for code execution
```

**Modify Existing Files:**

```
src/
├── mcp/
│   ├── index.ts              # Add code execution mode switch
│   └── tools/                # Wrap existing tools for both modes
├── services/                 # No changes - reuse as-is
├── database/                 # No changes - reuse as-is
└── n8n/
    └── N8nApiClient.ts       # Add webhook security modes
```

### Phase 2: Filesystem Tool Generation

**Auto-generate from existing services:**

For each service in `src/services/`:
- `NodeService.ts` → `servers/n8n-nodes/*.ts`
- `TemplateService.ts` → `servers/n8n-templates/*.ts`
- `WorkflowService.ts` → `servers/n8n-workflows/*.ts` (from n8n API client)

**Generated File Pattern:**
```typescript
// servers/n8n-nodes/getNodeInfo.ts
import { callMCPTool } from "../../../runtime_api.js";

interface GetNodeInfoInput {
  nodeType: string;
  includeExamples?: boolean;
}

interface GetNodeInfoResponse {
  name: string;
  properties: Record<string, any>;
  operations?: string[];
  documentation?: string;
}

/** Get comprehensive information about a specific n8n node */
export async function getNodeInfo(input: GetNodeInfoInput): Promise<GetNodeInfoResponse> {
  return callMCPTool<GetNodeInfoResponse>('get_node_info', input);
}
```

---

## 🔄 Progressive Disclosure Strategy

### Level 1: Discovery (Minimal Token Usage)

**Agent explores filesystem:**
```typescript
// Agent code in sandbox
import * as fs from 'fs';

// Discover available servers
const servers = await fs.readdir('./servers/');
console.log(servers); // ['n8n-nodes', 'n8n-templates', 'n8n-workflows']

// Explore n8n-nodes tools
const nodeTools = await fs.readdir('./servers/n8n-nodes/');
console.log(nodeTools); // ['getNodeInfo.ts', 'searchNodes.ts', ...]
```

**Token usage:** ~500 tokens (vs 150,000 for all tool definitions)

### Level 2: Tool Loading (On-Demand)

**Agent reads only needed tools:**
```typescript
// Read specific tool definition
const toolDef = await fs.readFile('./servers/n8n-nodes/getNodeInfo.ts', 'utf-8');
// Parse interface to understand parameters
```

**Token usage:** ~100 tokens per tool (loaded only when needed)

### Level 3: Execution (Context Efficient)

**Agent writes code using tools:**
```typescript
import * as n8nNodes from './servers/n8n-nodes';

// Get node info
const slackNode = await n8nNodes.getNodeInfo({
  nodeType: 'n8n-nodes-base.slack',
  includeExamples: true
});

// Filter to essential properties (in code, not in context)
const essentialProps = slackNode.properties
  .filter(p => p.required || p.displayName.includes('Channel'))
  .slice(0, 10);

console.log(`Found ${essentialProps.length} essential properties`);
console.log(essentialProps); // Only 10 properties logged
```

**Token usage:** ~2,000 tokens (vs 50,000+ with full node data)

---

## 🔐 Security & Privacy Implementation

### Sandbox Security

**Docker Container Constraints:**
```typescript
// sandbox_manager/resource_limits.ts
export const SANDBOX_LIMITS = {
  memory: '512m',
  cpus: '1.0',
  timeout: 30000, // 30 seconds
  networkMode: 'none', // Disable network by default
  readOnly: false, // Allow ./workspace/ writes
  tmpfs: {
    '/tmp': 'rw,noexec,nosuid,size=100m'
  }
};
```

**Webhook Security Modes:**
```typescript
// n8n/N8nApiClient.ts
export enum WebhookSecurityMode {
  STRICT = 'strict',     // Block all localhost/private IPs
  MODERATE = 'moderate', // Allow localhost, block private networks
  DISABLED = 'disabled'  // Allow all (dev only)
}
```

### PII Protection (Optional)

**Tokenization Pattern:**
```typescript
// mcp_client/PiiCensor.ts
class PiiCensor {
  private tokenMap = new Map<string, string>();

  censorEmail(email: string): string {
    const token = `[EMAIL_${this.tokenMap.size + 1}]`;
    this.tokenMap.set(token, email);
    return token;
  }

  untokenize(data: any): any {
    // Replace tokens with real values before n8n API call
    let str = JSON.stringify(data);
    this.tokenMap.forEach((real, token) => {
      str = str.replace(new RegExp(token, 'g'), real);
    });
    return JSON.parse(str);
  }
}
```

---

## 📊 Performance Optimization

### Token Efficiency Gains

**Before (Direct Tool Calls):**
- Load all 40+ tool definitions: 150,000 tokens
- Each intermediate result: 10,000-50,000 tokens
- Total for complex workflow: 300,000+ tokens

**After (Code Execution):**
- Discover tools via filesystem: 500 tokens
- Load 2-3 needed tools: 200 tokens
- Execute and filter in code: 2,000 tokens
- Total for same workflow: ~3,000 tokens

**Efficiency Gain:** 98.7% reduction (matches Anthropic's findings)

### Database Optimization

**Maintain existing optimizations:**
- SQLite with better-sqlite3 (native bindings)
- FTS5 full-text search (12ms average)
- Pre-built database in Docker (~68MB)
- Configurable save intervals for sql.js fallback

**No changes needed** - database layer remains identical

---

## 🛠️ Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

**Tasks:**
1. Create `sandbox_manager/` with Docker integration
2. Implement `agent_runtime/` with function injection
3. Build `mcp_client/McpClientAdapter.ts` for tool transformation
4. Add code execution mode to `mcp/index.ts`

**Deliverables:**
- Working Docker sandbox with n8n functions injected
- Filesystem-based tool discovery working
- Backward compatibility maintained (both modes supported)

**Testing:**
- Execute simple code importing `./servers/n8n-nodes/`
- Verify tool calls route correctly through sandbox
- Validate resource limits and timeouts

### Phase 2: Tool Filesystem Generation (Week 2-3)

**Tasks:**
1. Create generator script for `./servers/` structure
2. Map all `src/services/` methods to TypeScript files
3. Generate `index.ts` files for each server category
4. Add interface documentation as JSDoc comments

**Deliverables:**
- Complete `./servers/` directory structure
- Auto-generated from existing services
- Full TypeScript type definitions

**Testing:**
- Agent can discover all tools via filesystem
- Importing tools works in sandbox
- Type checking passes for all generated files

### Phase 3: Progressive Disclosure (Week 3-4)

**Tasks:**
1. Implement `search_tools` functionality in each server
2. Add detail level parameter (name, description, full schema)
3. Create agent prompts for progressive tool loading
4. Optimize token usage tracking

**Deliverables:**
- Smart tool search across categories
- Configurable detail levels
- Agent prompts teaching progressive disclosure pattern

**Testing:**
- Compare token usage before/after
- Measure latency improvements
- Validate agent can build workflows efficiently

### Phase 4: Privacy & Security (Week 4-5)

**Tasks:**
1. Implement PII censoring (optional feature)
2. Add webhook security modes to n8n client
3. Enhance sandbox security (network isolation, tmpfs)
4. Add audit logging for sensitive operations

**Deliverables:**
- PII tokenization working end-to-end
- Configurable webhook security
- Comprehensive security documentation

**Testing:**
- Verify PII never reaches LLM context
- Test webhook security modes
- Security audit of sandbox escapes

### Phase 5: Skills & State Persistence (Week 5-6)

**Tasks:**
1. Enable `./workspace/` persistence across executions
2. Implement `./skills/` directory for reusable functions
3. Create SKILL.md template for n8n workflows
4. Build skill discovery and import system

**Deliverables:**
- Persistent workspace filesystem
- Skills library with n8n-specific patterns
- Agent can save and reuse workflow code

**Testing:**
- Skills persist across sessions
- Agent can discover and import saved skills
- Workflow evolution over time works

### Phase 6: Integration & Optimization (Week 6-7)

**Tasks:**
1. Integrate with existing n8n API management tools
2. Add batch operations support (diff updates)
3. Optimize Docker image size and startup time
4. Performance benchmarking and tuning

**Deliverables:**
- Full n8n workflow lifecycle in code execution mode
- Optimized Docker images (<300MB)
- Performance metrics and comparisons

**Testing:**
- End-to-end workflow creation and deployment
- Load testing with concurrent executions
- Memory and CPU profiling

---

## 🎯 Success Metrics

### Token Efficiency
- **Target:** 95%+ reduction in token usage for complex workflows
- **Measurement:** Compare direct tool calls vs code execution for same task

### Performance
- **Target:** <100ms filesystem discovery, <2s tool loading
- **Measurement:** Instrument filesystem operations and tool imports

### Security
- **Target:** Zero sandbox escapes, PII never in LLM logs
- **Measurement:** Security audit, PII detection tests

### Developer Experience
- **Target:** <5 minutes from idea to deployed workflow
- **Measurement:** Time tracking for common workflow tasks

---

## 📚 Documentation Requirements

### For Developers

**Architecture Documentation:**
- System design diagrams (filesystem structure, data flow)
- Code execution vs direct tool call comparison
- Security model and threat analysis

**API Documentation:**
- All generated `./servers/` functions with examples
- TypeScript interfaces and type definitions
- Error handling and retry strategies

### For AI Agents

**Prompt Templates:**
- Progressive disclosure pattern instructions
- Code execution best practices
- n8n-specific workflow patterns

**Examples:**
- Simple workflows (webhook → Slack)
- Complex workflows (data processing pipelines)
- Error handling and validation patterns

### For End Users

**Deployment Guides:**
- Docker setup with code execution enabled
- Environment variable configuration
- Security hardening for production

**Use Case Examples:**
- Building workflows with code execution
- Migrating from direct tool calls
- Performance optimization tips

---

## 🚨 Risk Mitigation

### Backward Compatibility

**Risk:** Breaking existing n8n-mcp users on direct tool calls

**Mitigation:**
- Support both modes via `CODE_EXECUTION_MODE` env var
- Default to direct tool calls initially
- Gradual migration path with documentation

### Security Vulnerabilities

**Risk:** Sandbox escape or privilege escalation

**Mitigation:**
- Docker security best practices (user namespaces, seccomp)
- Regular security audits
- Rate limiting and resource quotas
- Network isolation by default

### Performance Regression

**Risk:** Code execution slower than direct calls for simple tasks

**Mitigation:**
- Container pooling for reduced startup time
- Warm sandbox instances
- Benchmark suite for continuous monitoring
- Fallback to direct calls for single-tool operations

---

## 🎓 Learning from Anthropic's Research

### Key Insights Applied

1. **Progressive Disclosure Works**
   - Filesystem navigation is intuitive for LLMs
   - On-demand tool loading saves tokens
   - Agent-driven discovery beats upfront loading

2. **Code Execution is More Efficient**
   - Filtering data in code (not context) saves tokens
   - Control flow in code (not tool chaining) reduces latency
   - State persistence enables workflow evolution

3. **Privacy by Design**
   - Intermediate results stay in sandbox
   - Explicit logging controls what LLM sees
   - PII tokenization prevents leaks

4. **Skills Enable Growth**
   - Reusable code beats repeating patterns
   - Accumulated knowledge improves over time
   - Community can share best practices

---

## 🔗 Integration Points

### With Existing Code Execution Framework

**Reuse from `src/`:**
- `agent_orchestrator/AgentManager.ts` - Main orchestration
- `sandbox_manager/DockerSandbox.ts` - Container management
- `agent_runtime/runtime_api.ts` - Function injection
- `mcp_client/McpClient.ts` - Tool routing

**Extend for n8n:**
- Add n8n-specific tool filesystem generation
- Integrate with existing `src/services/` layer
- Maintain database optimizations
- Preserve template and validation systems

### With n8n API

**Workflow Management:**
- Create, update, delete workflows via code
- Validate before deployment
- Batch operations with diff updates

**Execution Control:**
- Trigger webhooks from sandbox
- Monitor execution status
- Retry failed runs

**Template Integration:**
- Search and filter 2,709 templates
- Extract configurations for reuse
- Attribution and credits management

---

## 📦 Deliverables Checklist

### Code
- [ ] `sandbox_manager/` - Docker sandbox implementation
- [ ] `agent_runtime/` - Runtime API injection
- [ ] `mcp_client/McpClientAdapter.ts` - Tool transformation
- [ ] `./servers/` - Auto-generated filesystem tools
- [ ] Skills library with n8n patterns
- [ ] PII censoring (optional)

### Documentation
- [ ] Architecture diagrams (filesystem, data flow)
- [ ] API reference for all `./servers/` functions
- [ ] Agent prompt templates
- [ ] Deployment guides (Docker, security)
- [ ] Migration guide from direct tool calls

### Testing
- [ ] Unit tests for all new components
- [ ] Integration tests for code execution mode
- [ ] Security audit and penetration tests
- [ ] Performance benchmarks (token usage, latency)
- [ ] End-to-end workflow creation tests

### Infrastructure
- [ ] Optimized Docker images (<300MB)
- [ ] Environment variable configuration
- [ ] Logging and monitoring setup
- [ ] CI/CD pipeline updates

---

## 🎯 Next Steps

1. **Review this plan** with team and stakeholders
2. **Set up development environment** with Docker and TypeScript
3. **Start Phase 1** with core infrastructure
4. **Iterate based on feedback** from early testing
5. **Document learnings** throughout implementation

**Target completion:** 7 weeks from start

**Key milestone:** Working code execution mode with filesystem-based tool discovery by Week 3

---

*This implementation plan follows the Code Execution with MCP paradigm from Anthropic's research, adapted specifically for the n8n workflow automation platform. All architectural decisions prioritize token efficiency, security, and developer experience.*
