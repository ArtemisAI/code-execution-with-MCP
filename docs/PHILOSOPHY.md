# Design Philosophy

This template is based on Anthropic's "Code Execution with MCP" pattern and incorporates key principles from their engineering approach to agentic systems.

## References & Inspiration

This implementation draws heavily from:

1. **[Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)** - Anthropic's engineering blog post describing the dynamic execution model
2. **[Anthropic Skills Repository](https://github.com/anthropics/skills)** - Open-source examples of skills that extend agent capabilities
3. **[Equipping Agents for the Real World with Agent Skills](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)** - Philosophy behind persistent agent capabilities

## Core Philosophy

### The Token Efficiency Problem

Traditional AI agents face a fundamental challenge: **token consumption for computation**. When an agent needs to perform complex operations—like transforming thousands of data records, orchestrating multiple API calls, or implementing business logic—it must describe every step in natural language within its context window.

This approach is:
- **Inefficient**: Wastes tokens describing computation rather than reasoning
- **Limited**: Context windows constrain the complexity of operations
- **Brittle**: Natural language descriptions of algorithms are error-prone
- **Non-reusable**: Each task requires re-describing the same operations

### The Code Execution Solution

**Code execution enables agents to delegate computation to traditional software while focusing their intelligence on high-level reasoning and decision-making.**

Instead of describing an algorithm in natural language, the agent:
1. **Writes code** that performs the computation
2. **Executes** that code in a secure sandbox
3. **Receives** the results to inform further reasoning

This shifts the agent's role from "computer" to "programmer" - a more natural and powerful abstraction.

## Key Principles

### 1. Dynamic Discovery Over Static Generation

**Traditional Approach (Static)**:
```
Generate tool files → Agent loads → Agent uses
Problem: When tools change, regenerate everything
```

**Our Approach (Dynamic)**:
```typescript
// Agent discovers tools at runtime
const tools = await list_mcp_tools();
const schema = await get_mcp_tool_details("database__query");

// Agent uses tools based on current availability
const result = await callMCPTool("database__query", { query: "SELECT *" });
```

**Benefits**:
- **Flexibility**: Tools can be added/removed without regenerating client code
- **Maintainability**: Single source of truth (the MCP server itself)
- **Scalability**: No limit to the number of tools
- **Runtime Adaptation**: Agent adapts to available capabilities

**Reference**: This is the core insight from Anthropic's "Code Execution with MCP" blog post - avoid static file generation and embrace runtime discovery.

### 2. Token Efficiency Through Code

**Example - Data Transformation**:

❌ **Without Code Execution** (Token-Intensive):
```
LLM: "I'll process each record:
- Record 1: transform field A to uppercase, add field B...
- Record 2: transform field A to uppercase, add field B...
- [repeat 1000 times]
- Result: [massive JSON output]"

Tokens Used: ~50,000
Context Remaining: Limited
```

✅ **With Code Execution** (Token-Efficient):
```
LLM: "I'll write code to process all records"
Code:
  const results = data.map(record => ({
    ...record,
    fieldA: record.fieldA.toUpperCase(),
    fieldB: calculateValue(record)
  }));
  return results;

Tokens Used: ~500
Context Remaining: Plenty for reasoning
```

**Key Insight**: Complex computation happens in code, not in the LLM's context. The agent focuses on **what** to compute, not **how** to compute it.

### 3. Persistent Skills - Learning Over Time

Agents can save reusable code to the `/skills` directory, building a library of capabilities over time.

**The Skills Pattern** (from [Anthropic Skills](https://github.com/anthropics/skills)):

```
/skills/
  └── user123/
      ├── data_processor.js      # Reusable data transformation
      ├── api_authenticator.js   # OAuth flow implementation
      └── report_generator.js    # Custom reporting logic
```

Each skill is:
- **Self-contained**: Complete implementation in one place
- **Reusable**: Can be loaded and used in future tasks
- **Composable**: Skills can build on other skills
- **Documented**: Includes usage examples and descriptions

**Example Workflow**:
```
Task 1: "Process sales data"
→ Agent writes data_processor.js, saves to /skills

Task 2: "Process customer data" 
→ Agent reuses data_processor.js from /skills
→ Extends with customer-specific logic

Task 3: "Generate sales report"
→ Agent combines data_processor.js + report_generator.js
→ Saves new combined workflow
```

**Result**: The agent becomes more capable over time, accumulating domain-specific knowledge as code.

### 4. Ephemeral Workspace - Clean Separation

The `/workspace` directory provides temporary storage for task-specific files.

```
/workspace/
  └── user123_1699524000/        # Timestamped session
      ├── temp_data.json         # Intermediate results
      ├── processing_log.txt     # Debug logs
      └── scratch_calculations   # Temporary work
```

**Key Distinction**:
- **`/skills`**: Permanent, reusable capabilities (the "library")
- **`/workspace`**: Temporary, task-specific files (the "scratch pad")

After task completion, `/workspace` is cleaned up, but `/skills` persists.

### 5. PII Protection via Tokenization

**The Privacy Challenge**: Agents need to work with sensitive data (emails, phone numbers, SSNs) but shouldn't expose raw PII to LLMs.

**Our Solution**: Bidirectional tokenization

```
User Data (raw PII)
    ↓
[Tokenize] → Sanitized for LLM
    ↓
LLM sees: "Contact [EMAIL_1] at [PHONE_1]"
LLM generates code
    ↓
[De-tokenize] → Restore for MCP tools
    ↓
MCP Tool receives: "Contact john@example.com at 555-1234"
```

**Flow**:
1. **Before LLM**: Tokenize PII → `[EMAIL_1]`, `[PHONE_1]`
2. **LLM Processing**: Works with tokens, not raw data
3. **Before Tool Execution**: De-tokenize → Restore original values
4. **After Tool Response**: Tokenize again before returning to LLM

**Result**: The LLM never sees raw PII, but tools receive the actual values they need to function.

## Security - RCE by Design

**Critical Insight from Anthropic**: Code execution is **Remote Code Execution (RCE) by design**. The agent writes arbitrary code that runs on your infrastructure. This is not a bug—it's the feature.

**Therefore**: Security must be **defense in depth**, not surface-level.

### Security Layers

1. **Isolation** (Docker Container)
   - Separate process namespace
   - Separate network namespace
   - Separate filesystem namespace

2. **Privilege Reduction**
   - Non-root user execution
   - Capability dropping (CAP_DROP: ALL)
   - Read-only root filesystem

3. **Resource Limits**
   - CPU quota (prevent CPU exhaustion)
   - Memory limit (prevent memory exhaustion)
   - Execution timeout (prevent infinite loops)

4. **Network Restrictions**
   - No network access by default
   - Explicit allowlist if needed
   - No access to host services

5. **Filesystem Controls**
   - Only `/skills` and `/workspace` writable
   - Path validation on all file operations
   - Cleanup of ephemeral data

6. **Authentication**
   - Session-specific tokens
   - Validation on every sandbox→host call
   - Token expiration

**Key Point**: Treat the sandbox as **untrusted** at all times. Every communication from the sandbox must be authenticated and validated.

## Design Patterns

### Pattern 1: Discovery Before Use

```javascript
// Always discover before using
const tools = await list_mcp_tools();
console.log("Available tools:", tools);

if (tools.includes('database__query')) {
  const schema = await get_mcp_tool_details('database__query');
  console.log("Expected input:", schema.inputSchema);
  
  const result = await callMCPTool('database__query', {
    query: "SELECT * FROM users"
  });
}
```

### Pattern 2: Skills as Functions

```javascript
// Save reusable logic as a skill
const skillCode = `
module.exports = async function validateEmail(email) {
  const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return regex.test(email);
};
`;

await fs.writeFile('/skills/validateEmail.js', skillCode);

// Reuse in future tasks
const validate = require('/skills/validateEmail.js');
```

### Pattern 3: Workspace for Intermediates

```javascript
// Use workspace for task-specific data
const rawData = await callMCPTool('fetch_data', { source: 'api' });

// Save intermediate results
await fs.writeFile('/workspace/raw_data.json', JSON.stringify(rawData));

// Process
const processed = processData(rawData);

// Save final results  
await fs.writeFile('/workspace/processed_data.json', JSON.stringify(processed));

// Return summary (not full data) to LLM
return { recordsProcessed: processed.length, status: 'complete' };
```

### Pattern 4: Error Handling in Code

```javascript
// Handle errors in code, not in LLM context
try {
  const data = await callMCPTool('risky_operation', params);
  const result = processData(data);
  return { success: true, result };
} catch (error) {
  console.error('Operation failed:', error.message);
  
  // Try alternative approach
  const fallbackData = await callMCPTool('fallback_operation', params);
  return { success: true, result: fallbackData, usedFallback: true };
}
```

## Comparison with Traditional Approaches

### Traditional Agent (No Code Execution)

**Task**: "Process 1000 customer records and generate a summary report"

```
Agent: "I'll analyze each record:
Record 1: Customer John Doe, email john@example.com, purchased $150...
Record 2: Customer Jane Smith, email jane@example.com, purchased $200...
[998 more records described in natural language]

Summary: Total revenue: $X, Average: $Y, Top customer: Z"

Issues:
❌ Consumes ~50,000 tokens describing data
❌ Can't process more records than fit in context
❌ Error-prone string manipulation
❌ No reusability
❌ Exposes all PII to LLM
```

### Our Approach (Code Execution with MCP)

```
Agent: "I'll write code to process the records"

Code:
  const records = await callMCPTool('fetch_customers', { limit: 1000 });
  
  const summary = {
    totalRevenue: records.reduce((sum, r) => sum + r.purchase, 0),
    averagePurchase: records.reduce((sum, r) => sum + r.purchase, 0) / records.length,
    topCustomer: records.reduce((top, r) => r.purchase > top.purchase ? r : top)
  };
  
  await fs.writeFile('/workspace/full_report.json', JSON.stringify(records));
  return summary;

Result:
✅ Uses ~500 tokens for code
✅ Can process millions of records
✅ Reliable computation
✅ Code saved to /skills for reuse
✅ PII tokenized, LLM never sees raw data
✅ Full results in /workspace, summary to LLM
```

## Why This Matters

1. **Scalability**: Handle tasks of any complexity within token limits
2. **Reliability**: Code execution is deterministic and testable
3. **Efficiency**: More computation, less context consumption
4. **Privacy**: PII protection built into the architecture
5. **Learning**: Agent capabilities grow over time through skills
6. **Flexibility**: Dynamic discovery allows for evolving toolsets

## Acknowledgments

This template implements the architectural patterns and design philosophy described in:

- **Anthropic's "Code Execution with MCP"** engineering blog post, which introduced the dynamic discovery model and explained the token efficiency benefits
- **Anthropic's Skills Repository**, which demonstrated how persistent capabilities can extend agent functionality over time
- **The Model Context Protocol (MCP)** specification, which provides the foundation for tool integration

We are grateful to Anthropic for openly sharing these patterns and making this work possible.

---

**Bottom Line**: This isn't just a code execution harness. It's a framework for building agents that **think in code**, **learn over time**, and **respect privacy**—following the principles Anthropic pioneered.
