# Code Execution with MCP - Usage Examples

This document provides practical examples of using the Code Execution with MCP system for various tasks.

## Table of Contents

1. [Basic Tool Discovery](#basic-tool-discovery)
2. [Filesystem-Based Discovery](#filesystem-based-discovery)
3. [Building n8n Workflows](#building-n8n-workflows)
4. [Data Processing with Skills](#data-processing-with-skills)
5. [Progressive Disclosure Pattern](#progressive-disclosure-pattern)
6. [Advanced Routing Examples](#advanced-routing-examples)

## Basic Tool Discovery

### Example 1: List All Available Tools

**Agent Code (runs in sandbox):**
```javascript
// Discover all available MCP tools
const tools = await list_mcp_tools();
console.log('Available tools:', tools);

// Get details about a specific tool
const toolDetails = await get_mcp_tool_details('n8n_search_nodes');
console.log('Tool description:', toolDetails.description);
console.log('Tool schema:', toolDetails.schema);

return {
  totalTools: tools.length,
  exampleTool: toolDetails
};
```

**Expected Output:**
```json
{
  "totalTools": 15,
  "exampleTool": {
    "name": "n8n_search_nodes",
    "description": "Search for n8n nodes by keyword",
    "schema": {
      "input": {
        "query": "string"
      },
      "output": "array"
    }
  }
}
```

## Filesystem-Based Discovery

### Example 2: Discover MCP Servers

**Agent Code:**
```javascript
// Discover all available server directories
const servers = await introspect_servers();
console.log('Found servers:', servers);

// Get the complete virtual library structure
const library = await get_virtual_library();
console.log('Library structure:', JSON.stringify(library, null, 2));

// Explore a specific server
const n8nNodes = await get_server_index('n8n-nodes');
console.log('n8n-nodes server:', n8nNodes);

// List functions in the server
const functions = await list_server_functions('n8n-nodes');
console.log('Available functions:', functions);

return {
  servers,
  libraryStructure: library,
  n8nCapabilities: functions
};
```

**Expected Output:**
```json
{
  "servers": [
    "n8n-nodes",
    "n8n-templates",
    "n8n-workflows"
  ],
  "libraryStructure": {
    "type": "virtual-library",
    "description": "Filesystem-based MCP tool discovery",
    "servers": {
      "n8n-nodes": {
        "name": "n8n-nodes",
        "description": "n8n-nodes tools",
        "functions": ["searchNodes", "getNodeInfo", "getNodeEssentials"],
        "categories": ["nodes", "discovery"],
        "path": "./servers/n8n-nodes"
      }
    }
  },
  "n8nCapabilities": [
    "searchNodes",
    "getNodeInfo",
    "getNodeEssentials"
  ]
}
```

### Example 3: Token-Efficient Discovery

**Traditional Approach (Inefficient):**
```javascript
// All 100 tools loaded upfront: ~50,000 tokens
const allTools = await getAllToolDefinitions();

// Agent processes all definitions to find Slack tools
const slackTools = allTools.filter(t => t.name.includes('slack'));
```

**New Approach (Efficient):**
```javascript
// Only discover what's needed: ~2,000 tokens
const servers = await introspect_servers();
// ~500 tokens

const library = await get_virtual_library();
// ~1,000 tokens

// Search specifically for Slack-related tools
const slackNodes = await callMCPTool('n8n_search_nodes', { 
  query: 'slack' 
});
// ~500 tokens

return { slackNodes };
// Total: ~2,000 tokens vs 50,000 (96% reduction!)
```

## Building n8n Workflows

### Example 4: Create a Slack Notification Workflow

**Agent Code:**
```javascript
// Step 1: Discover n8n capabilities
const servers = await introspect_servers();
const workflowServer = servers.find(s => s.includes('workflow'));

// Step 2: Search for Slack nodes
const slackNodes = await callMCPTool('n8n_search_nodes', { 
  query: 'slack' 
});
console.log('Found Slack nodes:', slackNodes);

// Step 3: Get essential properties (not full schema - saves tokens!)
const slackInfo = await callMCPTool('n8n_get_node_essentials', {
  nodeType: 'n8n-nodes-base.slack'
});
console.log('Slack node properties:', slackInfo);

// Step 4: Build the workflow
const workflow = {
  name: 'Slack Alert Workflow',
  active: false,
  nodes: [
    {
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      position: [250, 300],
      parameters: {
        path: 'alert',
        httpMethod: 'POST'
      }
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
    'Webhook': {
      main: [[{ node: 'Slack', type: 'main', index: 0 }]]
    }
  }
};

// Step 5: Create the workflow
const created = await callMCPTool('n8n_create_workflow', workflow);
console.log('Created workflow:', created.id);

// Step 6: Save workflow creation logic to skills for reuse
await fs.writeFile(
  '/home/sandboxuser/skills/create_slack_alert.js',
  `module.exports = async function createSlackAlert(channel, webhookPath) {
    // Reusable workflow creation logic
    const workflow = {
      name: \`Slack Alert to \${channel}\`,
      active: false,
      nodes: [
        {
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          position: [250, 300],
          parameters: { path: webhookPath, httpMethod: 'POST' }
        },
        {
          name: 'Slack',
          type: 'n8n-nodes-base.slack',
          position: [450, 300],
          parameters: {
            resource: 'message',
            operation: 'post',
            channel: channel,
            text: '={{$json["message"]}}'
          }
        }
      ],
      connections: {
        'Webhook': { main: [[{ node: 'Slack', type: 'main', index: 0 }]] }
      }
    };
    return await callMCPTool('n8n_create_workflow', workflow);
  };`
);

return {
  workflowId: created.id,
  skillSaved: true
};
```

## Data Processing with Skills

### Example 5: Process Data and Save Reusable Logic

**Agent Code:**
```javascript
// Task: Process sales data and calculate summary statistics

// Step 1: Get the data using MCP tool
const salesData = await callMCPTool('database__query', {
  query: 'SELECT * FROM sales WHERE date > "2024-01-01"'
});

// Step 2: Process in code (not in LLM context!)
const summary = salesData.reduce((acc, sale) => {
  acc.total += sale.amount;
  acc.count += 1;
  
  // Track by category
  if (!acc.byCategory[sale.category]) {
    acc.byCategory[sale.category] = { total: 0, count: 0 };
  }
  acc.byCategory[sale.category].total += sale.amount;
  acc.byCategory[sale.category].count += 1;
  
  return acc;
}, { total: 0, count: 0, byCategory: {} });

// Step 3: Save processing logic as a reusable skill
await fs.writeFile(
  '/home/sandboxuser/skills/sales_analyzer.js',
  `module.exports = {
    summarize: function(salesData) {
      return salesData.reduce((acc, sale) => {
        acc.total += sale.amount;
        acc.count += 1;
        
        if (!acc.byCategory[sale.category]) {
          acc.byCategory[sale.category] = { total: 0, count: 0 };
        }
        acc.byCategory[sale.category].total += sale.amount;
        acc.byCategory[sale.category].count += 1;
        
        return acc;
      }, { total: 0, count: 0, byCategory: {} });
    },
    
    topCategories: function(summary, limit = 5) {
      return Object.entries(summary.byCategory)
        .sort(([,a], [,b]) => b.total - a.total)
        .slice(0, limit)
        .map(([category, data]) => ({ category, ...data }));
    }
  };`
);

// Step 4: Use the saved skill
const salesAnalyzer = require('/home/sandboxuser/skills/sales_analyzer.js');
const topCategories = salesAnalyzer.topCategories(summary, 3);

return {
  summary,
  topCategories,
  totalRecords: salesData.length
};
```

**Token Efficiency:**
- Without code execution: ~50,000 tokens (describing each transformation)
- With code execution: ~500 tokens (the code itself)
- **Savings: 99%**

## Progressive Disclosure Pattern

### Example 6: Incrementally Discover Needed Tools

**Agent Code:**
```javascript
// Progressive discovery: start broad, get specific as needed

// Level 1: What servers are available?
const servers = await introspect_servers();
console.log('Step 1 - Available servers:', servers);
// Tokens used: ~500

// Level 2: What's in the workflow server?
const workflowFunctions = await list_server_functions('n8n-workflows');
console.log('Step 2 - Workflow functions:', workflowFunctions);
// Tokens used: ~300

// Level 3: Get details only for the function I need
const createWorkflowDetails = await get_mcp_tool_details('n8n_create_workflow');
console.log('Step 3 - Create workflow details:', createWorkflowDetails);
// Tokens used: ~700

// Total tokens for progressive discovery: ~1,500
// vs loading all tools upfront: ~50,000
// Savings: 97%

// Now use the tool
const workflow = await callMCPTool('n8n_create_workflow', {
  name: 'My Workflow',
  nodes: [/* ... */],
  connections: {/* ... */}
});

return {
  discoverySteps: 3,
  tokensUsed: '~1,500',
  tokensSaved: '~48,500 (97%)',
  workflowId: workflow.id
};
```

## Advanced Routing Examples

### Example 7: Using the Tool Call Router Directly

**Host Code (not in sandbox):**
```typescript
import { McpClient } from './mcp_client/McpClient';
import { PiiCensor } from './mcp_client/PiiCensor';

const piiCensor = new PiiCensor();
const mcpClient = new McpClient(piiCensor);

// Access the router
const router = mcpClient.getRouter();

// Route a tool call with explicit strategy
const result = await router.routeToolCall({
  toolName: 'introspect_servers',
  input: {},
  userId: 'user123',
  strategy: 'filesystem' // Force filesystem strategy
});

console.log('Result:', result.result);
console.log('Strategy used:', result.strategy);
console.log('Execution time:', result.executionTimeMs);

// Get routing statistics
const stats = router.getStats();
console.log('Total calls:', stats.totalCalls);
console.log('Success rate:', stats.successRate);
console.log('Per-tool stats:', stats.callsByTool);
```

### Example 8: Custom Tool Discovery Pipeline

**Agent Code:**
```javascript
// Build a custom discovery pipeline

// Step 1: Get high-level library structure
const library = await get_virtual_library();

// Step 2: Filter to servers related to notifications
const notificationServers = Object.keys(library.servers).filter(name => 
  library.servers[name].categories?.includes('notification') ||
  library.servers[name].description?.toLowerCase().includes('notification')
);

console.log('Notification servers:', notificationServers);

// Step 3: Deep dive into each notification server
const notificationTools = {};
for (const serverName of notificationServers) {
  const functions = await list_server_functions(serverName);
  notificationTools[serverName] = functions;
}

console.log('All notification tools:', notificationTools);

// Step 4: Use discovered tools
const slackNodes = await callMCPTool('n8n_search_nodes', {
  query: 'slack'
});

return {
  discoveryPipeline: 'custom',
  notificationServers,
  notificationTools,
  slackNodes
};
```

## Complete Example: End-to-End Workflow

### Example 9: Build, Test, and Deploy an n8n Workflow

**Agent Code:**
```javascript
// Complete workflow: discovery → build → test → deploy

// === Phase 1: Discovery ===
console.log('=== PHASE 1: DISCOVERY ===');

// Discover available capabilities
const servers = await introspect_servers();
console.log('Available servers:', servers);

// Get virtual library for overview
const library = await get_virtual_library();
console.log('Library structure:', Object.keys(library.servers));

// === Phase 2: Planning ===
console.log('=== PHASE 2: PLANNING ===');

// Search for required nodes
const httpNodes = await callMCPTool('n8n_search_nodes', { query: 'http' });
const slackNodes = await callMCPTool('n8n_search_nodes', { query: 'slack' });

console.log('Found HTTP nodes:', httpNodes.length);
console.log('Found Slack nodes:', slackNodes.length);

// === Phase 3: Build ===
console.log('=== PHASE 3: BUILD ===');

const workflow = {
  name: 'API to Slack Pipeline',
  active: false,
  nodes: [
    {
      name: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      position: [250, 300],
      parameters: {
        url: 'https://api.example.com/data',
        method: 'GET'
      }
    },
    {
      name: 'Data Transform',
      type: 'n8n-nodes-base.function',
      position: [450, 300],
      parameters: {
        functionCode: `
          const data = items[0].json;
          return items.map(item => ({
            json: {
              message: \`New data: \${data.count} items\`
            }
          }));
        `
      }
    },
    {
      name: 'Slack',
      type: 'n8n-nodes-base.slack',
      position: [650, 300],
      parameters: {
        resource: 'message',
        operation: 'post',
        channel: '#notifications',
        text: '={{$json["message"]}}'
      }
    }
  ],
  connections: {
    'HTTP Request': {
      main: [[{ node: 'Data Transform', type: 'main', index: 0 }]]
    },
    'Data Transform': {
      main: [[{ node: 'Slack', type: 'main', index: 0 }]]
    }
  }
};

// Create the workflow
const created = await callMCPTool('n8n_create_workflow', workflow);
console.log('Created workflow:', created.id);

// === Phase 4: Test ===
console.log('=== PHASE 4: TEST ===');

// Validate workflow
const validation = await callMCPTool('n8n_validate_workflow', {
  workflowId: created.id
});
console.log('Validation result:', validation);

// === Phase 5: Deploy ===
console.log('=== PHASE 5: DEPLOY ===');

if (validation.valid) {
  // Activate workflow
  const activated = await callMCPTool('n8n_update_workflow', {
    workflowId: created.id,
    active: true
  });
  console.log('Workflow activated:', activated);
  
  // Save deployment script to skills
  await fs.writeFile(
    '/home/sandboxuser/skills/deploy_api_slack_pipeline.js',
    `module.exports = async function deployApiSlackPipeline(apiUrl, slackChannel) {
      // Complete deployment logic saved for reuse
      const workflow = ${JSON.stringify(workflow, null, 2)};
      workflow.nodes[0].parameters.url = apiUrl;
      workflow.nodes[2].parameters.channel = slackChannel;
      
      const created = await callMCPTool('n8n_create_workflow', workflow);
      const validation = await callMCPTool('n8n_validate_workflow', {
        workflowId: created.id
      });
      
      if (validation.valid) {
        await callMCPTool('n8n_update_workflow', {
          workflowId: created.id,
          active: true
        });
        return { success: true, workflowId: created.id };
      } else {
        return { success: false, errors: validation.errors };
      }
    };`
  );
}

// === Summary ===
return {
  phases: ['discovery', 'planning', 'build', 'test', 'deploy'],
  workflowId: created.id,
  status: validation.valid ? 'deployed' : 'validation_failed',
  skillSaved: true,
  tokensUsed: '~5,000',
  tokensSaved: '~45,000 (90%)'
};
```

## Summary

These examples demonstrate:

1. **Token Efficiency**: Progressive discovery reduces token usage by 90-99%
2. **Flexibility**: Dynamic discovery adapts to available capabilities
3. **Reusability**: Skills save code for future use
4. **Scalability**: No limits on discoverable tools
5. **Security**: All code runs in isolated sandbox with PII protection

The Code Execution with MCP pattern enables agents to write code instead of describing operations in natural language, making them dramatically more efficient and capable.
