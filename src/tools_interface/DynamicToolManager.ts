/**
 * Dynamic Tool Manager
 * Provides the agent with dynamic tool discovery capabilities
 * 
 * Instead of static tool files, tools are discovered at runtime using:
 * - list_mcp_tools()
 * - get_mcp_tool_details(name)
 */

import { McpClient } from '../mcp_client/McpClient';

/**
 * Tool definition for the agent
 */
interface AgentTool {
  name: string;
  description: string;
  parameters?: any;
}

export class DynamicToolManager {
  // Keep reference for future extensibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private mcpClient: McpClient;

  constructor(mcpClient: McpClient) {
    this.mcpClient = mcpClient;
  }

  /**
   * Get the tool definitions that the agent can use
   * These are META tools for discovery, not the actual MCP tools
   */
  getToolDefinitions(): AgentTool[] {
    return [
      {
        name: 'list_mcp_tools',
        description: 'Dynamically discover all available MCP tools. Returns an array of tool names.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_mcp_tool_details',
        description: 'Get detailed information about a specific MCP tool including its description, parameters, and schema.',
        parameters: {
          type: 'object',
          properties: {
            toolName: {
              type: 'string',
              description: 'The name of the tool to get details for'
            }
          },
          required: ['toolName']
        }
      },
      {
        name: 'callMCPTool',
        description: 'Execute an MCP tool with the specified parameters. This function is available globally in the sandbox.',
        parameters: {
          type: 'object',
          properties: {
            toolName: {
              type: 'string',
              description: 'The name of the tool to execute'
            },
            input: {
              type: 'object',
              description: 'The input parameters for the tool'
            }
          },
          required: ['toolName', 'input']
        }
      }
    ];
  }

  /**
   * Format tool definitions for LLM consumption
   * Customize this based on your LLM's expected format
   */
  formatForLLM(format: 'openai' | 'anthropic' | 'generic' = 'generic'): any[] {
    const tools = this.getToolDefinitions();
    
    switch (format) {
      case 'openai':
        return tools.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }
        }));
      
      case 'anthropic':
        return tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.parameters
        }));
      
      case 'generic':
      default:
        return tools;
    }
  }

  /**
   * Get a human-readable description of available capabilities
   */
  getCapabilitiesDescription(): string {
    return `
The agent has access to the following dynamic tool discovery functions:

1. **list_mcp_tools()** - Returns a list of all available MCP tools
   - No parameters required
   - Returns: Array of tool names (strings)
   - Use this to discover what tools are available

2. **get_mcp_tool_details(toolName)** - Get detailed info about a specific tool
   - Parameters: toolName (string)
   - Returns: Object with tool description, schema, and examples
   - Use this to understand how to use a specific tool

3. **callMCPTool(toolName, input)** - Execute an MCP tool
   - Parameters: 
     * toolName (string) - Name of the tool to execute
     * input (object) - Input parameters for the tool
   - Returns: Tool execution result
   - This function is globally available in the execution sandbox

These tools enable dynamic discovery and execution of MCP tools without static configuration.
    `.trim();
  }
}
