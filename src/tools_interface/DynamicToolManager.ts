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
      },
      {
        name: 'introspect_servers',
        description: 'Discover available MCP server directories in the filesystem. Returns an array of server names that can be explored for tools.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_virtual_library',
        description: 'Get the complete virtual library structure showing all available servers and their tools. This provides a comprehensive view of the filesystem-based tool discovery system.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_server_index',
        description: 'Get the index file content for a specific server directory. This shows what capabilities are available in that server.',
        parameters: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'The name of the server to get index for'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'list_server_functions',
        description: 'List all available functions in a specific server module.',
        parameters: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'The name of the server to list functions for'
            }
          },
          required: ['serverName']
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

4. **introspect_servers()** - Discover available MCP server directories
   - No parameters required
   - Returns: Array of server names (strings)
   - Use this for filesystem-based tool discovery

5. **get_virtual_library()** - Get complete tool library structure
   - No parameters required
   - Returns: Object with all servers and their tools
   - Provides comprehensive view of available capabilities

6. **get_server_index(serverName)** - Get server index file content
   - Parameters: serverName (string)
   - Returns: Server module exports and documentation
   - Use this to explore a specific server's capabilities

7. **list_server_functions(serverName)** - List functions in a server
   - Parameters: serverName (string)
   - Returns: Array of function names (strings)
   - Use this to see what functions a server provides

These tools enable both dynamic MCP tool discovery and filesystem-based exploration of available capabilities.
    `.trim();
  }
}
