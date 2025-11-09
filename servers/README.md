# n8n MCP Server Tools

This directory contains filesystem-based tools for n8n MCP integration following the **Code Execution with MCP** paradigm.

## Progressive Disclosure Pattern

Instead of loading all tool definitions into context, agents discover tools by exploring this filesystem structure:

```
servers/
├── index.ts              # Root discovery - lists available categories
├── n8n-nodes/            # Node discovery and information
│   └── index.ts          # Node-related tools
├── n8n-templates/        # Workflow template search
│   └── index.ts          # Template-related tools
└── n8n-workflows/        # Workflow management
    └── index.ts          # Workflow-related tools
```

## Token Efficiency

### Traditional Approach (150,000+ tokens)
```typescript
// Load all 40+ tool definitions upfront
const tools = getAllTools(); // 150,000 tokens
```

### Code Execution Approach (~500 tokens)
```typescript
// Discover tools via filesystem
import * as fs from 'fs';
const categories = await fs.readdir('./servers/');
// Only ~500 tokens to discover structure
```

## Usage Examples

### Example 1: Discover Available Tools

```typescript
import * as fs from 'fs';

// Step 1: Discover categories (~50 tokens)
const categories = await fs.readdir('./servers/');
console.log(categories); // ['n8n-nodes', 'n8n-templates', 'n8n-workflows']

// Step 2: Explore specific category (~100 tokens)
const nodeTools = await fs.readFile('./servers/n8n-nodes/index.ts', 'utf-8');
// Read only the tools you need
```

### Example 2: Search and Use Nodes

```typescript
import * as nodes from './servers/n8n-nodes/index.js';

// Search for nodes
const slackNodes = await nodes.searchNodes('slack');
console.log(slackNodes); // ['n8n-nodes-base.slack']

// Get essential info (token efficient)
const essentials = await nodes.getNodeEssentials('n8n-nodes-base.slack');
console.log(essentials.properties.slice(0, 5)); // Only 5 properties
```

### Example 3: Build a Workflow from Template

```typescript
import * as templates from './servers/n8n-templates/index.js';
import * as workflows from './servers/n8n-workflows/index.js';

// Find notification templates
const notifyTemplates = await templates.searchTemplates('notification');

// Get a template
const template = await templates.getTemplate('slack-notification');

// Create workflow from template
const workflow = await workflows.createWorkflow({
  name: 'My Notification Workflow',
  nodes: template.nodes,
  connections: template.connections,
  active: true
});

console.log(`Created workflow: ${workflow.id}`);
```

### Example 4: Complete Workflow Creation

```typescript
import * as nodes from './servers/n8n-nodes/index.js';
import * as workflows from './servers/n8n-workflows/index.js';

// Step 1: Discover what nodes you need
const httpNode = await nodes.getNodeEssentials('n8n-nodes-base.httpRequest');
const slackNode = await nodes.getNodeEssentials('n8n-nodes-base.slack');

// Step 2: Build workflow structure
const workflow = {
  name: 'API to Slack',
  nodes: [
    {
      name: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      position: [250, 300],
      parameters: {
        method: 'GET',
        url: 'https://api.example.com/data'
      }
    },
    {
      name: 'Slack',
      type: 'n8n-nodes-base.slack',
      position: [450, 300],
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
      main: [[{ node: 'Slack', type: 'main', index: 0 }]]
    }
  },
  active: true
};

// Step 3: Validate before creating
const validation = await workflows.validateWorkflow(workflow);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
} else {
  // Step 4: Create the workflow
  const created = await workflows.createWorkflow(workflow);
  console.log(`Workflow created: ${created.id}`);
  
  // Step 5: Execute it
  const result = await workflows.executeWorkflow(created.id);
  console.log('Execution result:', result);
}
```

## Tool Categories

### n8n-nodes
- `listNodes()` - List all available node types
- `searchNodes(query)` - Search for nodes
- `getNodeInfo(nodeType)` - Get complete node information
- `getNodeEssentials(nodeType)` - Get essential properties only (token efficient)
- `validateNodeConfig(nodeType, config)` - Validate node configuration

### n8n-templates
- `listTemplates()` - List all templates
- `searchTemplates(query)` - Search templates by text
- `getTemplate(templateId)` - Get template by ID
- `searchByMetadata(filters)` - Advanced search by tags/node types
- `listNodeTemplates(nodeType)` - Find templates using specific nodes

### n8n-workflows
- `createWorkflow(workflow)` - Create new workflow
- `updateWorkflow(workflowId, updates)` - Update existing workflow
- `getWorkflow(workflowId)` - Get workflow by ID
- `deleteWorkflow(workflowId)` - Delete workflow
- `listWorkflows()` - List all workflows
- `validateWorkflow(workflow)` - Validate workflow structure
- `executeWorkflow(workflowId, inputData)` - Execute workflow
- `getWorkflowStructure(workflowId)` - Get simplified structure (token efficient)

## Best Practices

1. **Start with essentials** - Use `getNodeEssentials()` instead of `getNodeInfo()` when exploring
2. **Search before listing** - Use search functions to narrow results
3. **Validate early** - Always validate before creating workflows
4. **Filter in code** - Process data in your code, not in context
5. **Save patterns** - Save successful workflows to `/skills` for reuse

## Token Savings

| Task | Traditional | Code Execution | Savings |
|------|------------|----------------|---------|
| Tool Discovery | 150,000 | 500 | 99.7% |
| Node Info | 50,000 | 2,000 | 96% |
| Workflow Build | 300,000 | 3,000 | 99% |

## Related Documentation

- `/docs/n8n_implementation.md` - Full implementation plan
- `/docs/PHILOSOPHY.md` - Code execution paradigm explanation
- `/skills/` - Example skills using these tools
