# n8n MCP Integration Guide

This guide explains how to use the n8n MCP integration with the Code Execution paradigm.

## Overview

The n8n MCP integration provides a token-efficient way to build, manage, and execute n8n workflows. Instead of loading all tool definitions into context, agents discover tools progressively through filesystem exploration.

## Quick Start

### 1. Discover Available Tools

```javascript
// Explore the filesystem to find available tool categories
import * as fs from 'fs';

const categories = await fs.readdir('./servers/');
console.log(categories); 
// Output: ['n8n-nodes', 'n8n-templates', 'n8n-workflows']
```

### 2. Import Required Tools

```javascript
// Import only the tools you need
import * as nodes from './servers/n8n-nodes/index.js';
import * as workflows from './servers/n8n-workflows/index.js';
```

### 3. Build a Workflow

```javascript
// Search for nodes
const slackNodes = await nodes.searchNodes('slack');

// Get essential info (token efficient)
const slackInfo = await nodes.getNodeEssentials('n8n-nodes-base.slack');

// Create workflow
const workflow = await workflows.createWorkflow({
  name: 'My Workflow',
  active: false,
  nodes: [
    {
      name: 'Slack',
      type: 'n8n-nodes-base.slack',
      position: [250, 300],
      parameters: {
        resource: 'message',
        operation: 'post',
        channel: '#general',
        text: 'Hello!'
      }
    }
  ],
  connections: {}
});

console.log(`Created workflow: ${workflow.id}`);
```

## Available Tools

### n8n-nodes (Node Discovery)

**listNodes()**
- Lists all available n8n node types
- Returns: `string[]`

**searchNodes(query: string)**
- Search nodes by name, description, or tags
- Returns: `string[]` of matching node types

**getNodeInfo(nodeType: string)**
- Get complete node information
- Returns: Full node definition with all properties
- ⚠️ Use sparingly - can consume many tokens

**getNodeEssentials(nodeType: string)**
- Get essential node properties (top 10)
- Returns: Partial node info
- ✅ Recommended - token efficient

**validateNodeConfig(nodeType: string, config: any)**
- Validate a node configuration
- Returns: `{ valid: boolean, errors: string[] }`

### n8n-templates (Template Discovery)

**listTemplates()**
- List all available workflow templates
- Returns: `Array<Template>`

**searchTemplates(query: string)**
- Search templates by text query
- Returns: `Array<Template>`

**getTemplate(templateId: string)**
- Get a specific template by ID
- Returns: Complete template with nodes and connections

**searchByMetadata(filters: { tags?: string[], nodeTypes?: string[] })**
- Advanced search by metadata
- Returns: `Array<Template>`

**listNodeTemplates(nodeType: string)**
- Find templates using a specific node
- Returns: `Array<Template>`

### n8n-workflows (Workflow Management)

**createWorkflow(workflow: object)**
- Create a new workflow
- Returns: Created workflow with ID

**updateWorkflow(workflowId: string, updates: object)**
- Update existing workflow
- Returns: Updated workflow

**getWorkflow(workflowId: string)**
- Get workflow by ID
- Returns: Complete workflow

**deleteWorkflow(workflowId: string)**
- Delete a workflow
- Returns: void

**listWorkflows()**
- List all workflows
- Returns: `Array<Workflow>`

**validateWorkflow(workflow: object)**
- Validate workflow structure
- Returns: `{ valid: boolean, errors: string[] }`

**executeWorkflow(workflowId: string, inputData?: object)**
- Execute a workflow
- Returns: Execution result

**getWorkflowStructure(workflowId: string)**
- Get simplified workflow info (token efficient)
- Returns: Workflow summary

## Best Practices

### 1. Use Progressive Disclosure

Don't load everything at once. Discover what you need step-by-step:

```javascript
// ❌ Bad - loads all node info
const allNodes = await nodes.listNodes();
const nodeInfos = await Promise.all(
  allNodes.map(n => nodes.getNodeInfo(n))
);

// ✅ Good - search first, then get essentials
const slackNodes = await nodes.searchNodes('slack');
const slackInfo = await nodes.getNodeEssentials(slackNodes[0]);
```

### 2. Validate Before Creating

Always validate workflows before creating them:

```javascript
// Build workflow structure
const workflow = { /* ... */ };

// Validate first
const validation = await workflows.validateWorkflow(workflow);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  return;
}

// Create only if valid
const created = await workflows.createWorkflow(workflow);
```

### 3. Filter Data in Code

Process and filter data in your code, not in context:

```javascript
// Get all templates
const allTemplates = await templates.listTemplates();

// Filter in code (doesn't consume tokens)
const slackTemplates = allTemplates.filter(t => 
  t.nodes.some(n => n.type.includes('slack'))
);

// Return only what you need
console.log(`Found ${slackTemplates.length} Slack templates`);
console.log(slackTemplates.map(t => t.name));
```

### 4. Save Reusable Patterns to Skills

When you create a useful workflow pattern, save it to `/skills`:

```javascript
// After building a successful workflow pattern
const skillCode = `
async function createNotificationWorkflow(channel) {
  const workflows = require('../../servers/n8n-workflows/index.js');
  
  return await workflows.createWorkflow({
    name: \`Notification to \${channel}\`,
    // ... workflow definition
  });
}

module.exports = { createNotificationWorkflow };
`;

await fs.writeFile('/skills/notification-workflow/skill.js', skillCode);
```

## Common Patterns

### Pattern 1: Build from Template

```javascript
import * as templates from './servers/n8n-templates/index.js';
import * as workflows from './servers/n8n-workflows/index.js';

// Find a template
const notifyTemplates = await templates.searchTemplates('notification');
const template = notifyTemplates[0];

// Customize and create
const workflow = await workflows.createWorkflow({
  name: 'My Custom Notification',
  nodes: template.nodes, // Use template nodes
  connections: template.connections,
  active: true
});
```

### Pattern 2: Multi-Node Workflow

```javascript
import * as nodes from './servers/n8n-nodes/index.js';
import * as workflows from './servers/n8n-workflows/index.js';

// Get node info for multiple nodes
const webhookInfo = await nodes.getNodeEssentials('n8n-nodes-base.webhook');
const httpInfo = await nodes.getNodeEssentials('n8n-nodes-base.httpRequest');
const slackInfo = await nodes.getNodeEssentials('n8n-nodes-base.slack');

// Build multi-node workflow
const workflow = await workflows.createWorkflow({
  name: 'Webhook → API → Slack',
  nodes: [
    {
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      position: [250, 300],
      parameters: { path: '/trigger', httpMethod: 'POST' }
    },
    {
      name: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      position: [450, 300],
      parameters: { method: 'GET', url: 'https://api.example.com/data' }
    },
    {
      name: 'Slack',
      type: 'n8n-nodes-base.slack',
      position: [650, 300],
      parameters: {
        resource: 'message',
        operation: 'post',
        channel: '#alerts',
        text: '={{$json["message"]}}'
      }
    }
  ],
  connections: {
    'Webhook': { main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]] },
    'HTTP Request': { main: [[{ node: 'Slack', type: 'main', index: 0 }]] }
  },
  active: false
});
```

### Pattern 3: Workflow Evolution

```javascript
// Get existing workflow
const workflow = await workflows.getWorkflow('wf_123');

// Add a new node
workflow.nodes.push({
  name: 'New Node',
  type: 'n8n-nodes-base.httpRequest',
  position: [850, 300],
  parameters: { method: 'POST', url: 'https://api.example.com/log' }
});

// Update connections
workflow.connections['Slack'] = {
  main: [[{ node: 'New Node', type: 'main', index: 0 }]]
};

// Validate changes
const validation = await workflows.validateWorkflow(workflow);

// Update if valid
if (validation.valid) {
  await workflows.updateWorkflow(workflow.id, workflow);
}
```

## Token Efficiency Comparison

### Traditional Approach
```javascript
// Load all 18 n8n tools upfront: ~150,000 tokens
const tools = getAllN8nTools();

// Call tools with full context
const nodeInfo = await callTool('get_node_info', { nodeType: 'slack' });
// Returns 50,000 tokens of data

// Total: ~200,000 tokens
```

### Code Execution Approach
```javascript
// Discover via filesystem: ~500 tokens
import * as nodes from './servers/n8n-nodes/index.js';

// Get essentials only: ~2,000 tokens
const nodeInfo = await nodes.getNodeEssentials('n8n-nodes-base.slack');

// Process in code: ~100 tokens
const essentialProps = nodeInfo.properties.slice(0, 5);

// Total: ~2,600 tokens (98.7% reduction!)
```

## Error Handling

Always handle errors gracefully:

```javascript
try {
  const workflow = await workflows.createWorkflow(workflowDef);
  console.log(`Success: ${workflow.id}`);
} catch (error) {
  if (error.message.includes('validation')) {
    console.error('Validation failed. Check workflow structure.');
  } else if (error.message.includes('not found')) {
    console.error('Node type not available. Search for alternatives.');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Next Steps

1. Explore `/servers/README.md` for detailed tool documentation
2. Check `/skills/n8n-workflow-builder/` for example skill
3. Read `/docs/n8n_implementation.md` for full implementation details
4. See `/docs/PHILOSOPHY.md` for code execution paradigm explanation

## Support

For issues or questions:
- Check tool definitions in `/servers/n8n-*/index.ts`
- Review service implementations in `/src/n8n_services/`
- Examine example skill in `/skills/n8n-workflow-builder/`
