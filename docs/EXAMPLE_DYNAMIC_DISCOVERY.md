## Example: Dynamic Tool Discovery and Multi-Tool Workflow

This example demonstrates how the agent discovers and uses multiple MCP tools dynamically.

### User Request
```json
{
  "userId": "user456",
  "task": "Find all tools related to data processing, then use them to process a dataset"
}
```

### Agent-Generated Code

```javascript
console.log("Starting multi-tool workflow...");

// Step 1: Discover all available tools
console.log("Discovering available tools...");
const allTools = await list_mcp_tools();
console.log(`Found ${allTools.length} tools:`, allTools);

// Step 2: Filter tools related to data processing
const dataTools = allTools.filter(name => 
  name.includes('data') || 
  name.includes('process') || 
  name.includes('transform')
);

console.log(`Found ${dataTools.length} data-related tools:`, dataTools);

// Step 3: Get detailed information about each tool
const toolDetails = [];
for (const toolName of dataTools) {
  const details = await get_mcp_tool_details(toolName);
  toolDetails.push(details);
  console.log(`Tool: ${toolName}`);
  console.log(`  Description: ${details.description}`);
  console.log(`  Schema:`, JSON.stringify(details.schema, null, 2));
}

// Step 4: Save tool catalog to workspace for reference
const catalog = {
  discoveryDate: new Date().toISOString(),
  totalTools: allTools.length,
  dataTools: toolDetails
};

await fs.writeFile(
  '/workspace/tool_catalog.json', 
  JSON.stringify(catalog, null, 2)
);

console.log("Tool catalog saved to /workspace/tool_catalog.json");

// Step 5: Execute a workflow using discovered tools
// Example: If we found a data__fetch and data__transform tool

if (allTools.includes('data__fetch')) {
  console.log("Fetching data using data__fetch...");
  const rawData = await callMCPTool('data__fetch', {
    source: 'sample_database',
    limit: 100
  });
  
  console.log(`Fetched ${rawData.length} records`);
  
  // Step 6: Transform the data if transform tool exists
  if (allTools.includes('data__transform')) {
    console.log("Transforming data using data__transform...");
    const transformed = await callMCPTool('data__transform', {
      data: rawData,
      operations: [
        { type: 'filter', field: 'status', value: 'active' },
        { type: 'sort', field: 'created_at', order: 'desc' }
      ]
    });
    
    console.log(`Transformed to ${transformed.length} records`);
    
    // Save results
    await fs.writeFile(
      '/workspace/processed_data.json',
      JSON.stringify(transformed, null, 2)
    );
  }
}

// Step 7: Create a reusable workflow skill
const workflowSkill = `
/**
 * Multi-Tool Data Processing Workflow
 * Automatically discovers and uses available data tools
 */

module.exports = async function processWithAvailableTools(config) {
  const { fetchParams, transformParams } = config;
  
  // Discover tools
  const tools = await list_mcp_tools();
  
  let data = null;
  
  // Fetch if available
  if (tools.includes('data__fetch')) {
    data = await callMCPTool('data__fetch', fetchParams);
  }
  
  // Transform if available
  if (data && tools.includes('data__transform')) {
    data = await callMCPTool('data__transform', {
      data,
      operations: transformParams
    });
  }
  
  return data;
};
`;

await fs.writeFile('/skills/multiToolWorkflow.js', workflowSkill);
console.log("Workflow skill saved to /skills/multiToolWorkflow.js");

return {
  success: true,
  discoveredTools: allTools.length,
  dataTools: dataTools.length,
  catalogPath: '/workspace/tool_catalog.json',
  skillPath: '/skills/multiToolWorkflow.js'
};
```

### Expected Output

```json
{
  "success": true,
  "discoveredTools": 15,
  "dataTools": 3,
  "catalogPath": "/workspace/tool_catalog.json",
  "skillPath": "/skills/multiToolWorkflow.js",
  "logs": [
    "Starting multi-tool workflow...",
    "Discovering available tools...",
    "Found 15 tools: [...]",
    "Found 3 data-related tools: [...]",
    "Tool catalog saved to /workspace/tool_catalog.json",
    "Workflow skill saved to /skills/multiToolWorkflow.js"
  ]
}
```

### Generated Files

**`/workspace/tool_catalog.json`** (ephemeral):
```json
{
  "discoveryDate": "2024-11-09T10:30:00.000Z",
  "totalTools": 15,
  "dataTools": [
    {
      "name": "data__fetch",
      "description": "Fetch data from various sources",
      "schema": {
        "input": {
          "source": "string",
          "limit": "number"
        }
      }
    },
    {
      "name": "data__transform",
      "description": "Transform and filter data",
      "schema": {
        "input": {
          "data": "array",
          "operations": "array"
        }
      }
    }
  ]
}
```

**`/skills/multiToolWorkflow.js`** (persistent):
```javascript
module.exports = async function processWithAvailableTools(config) {
  const { fetchParams, transformParams } = config;
  
  const tools = await list_mcp_tools();
  
  let data = null;
  
  if (tools.includes('data__fetch')) {
    data = await callMCPTool('data__fetch', fetchParams);
  }
  
  if (data && tools.includes('data__transform')) {
    data = await callMCPTool('data__transform', {
      data,
      operations: transformParams
    });
  }
  
  return data;
};
```

## Key Concepts Demonstrated

1. **Dynamic Discovery** - Agent discovers tools at runtime, not from static files
2. **Tool Exploration** - Gets detailed information about each tool before using
3. **Adaptive Workflows** - Adjusts behavior based on available tools
4. **Documentation** - Saves tool catalog for future reference
5. **Skill Creation** - Packages the workflow as a reusable skill
6. **File Management** - Uses both `/workspace` (ephemeral) and `/skills` (persistent)

## Benefits

- **Flexibility** - Works with any set of MCP tools
- **Discoverability** - Agent learns what's available
- **Adaptability** - Handles missing or unavailable tools gracefully
- **Efficiency** - Reusable workflows saved as skills
- **Documentation** - Self-documenting through tool catalogs
