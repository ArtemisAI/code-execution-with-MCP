/**
 * MCP Client - Manages connections to MCP servers and tool execution
 * 
 * This is a template implementation. Customize to connect to your actual MCP servers.
 * Supports multiple MCP server connections and tool routing.
 */

import { PiiCensor } from './PiiCensor';
import { N8nMcpClient } from './N8nMcpClient';
import { ToolCallRouter } from '../tools_interface/ToolCallRouter';
import { FilesystemGenerator } from '../tools_interface/FilesystemGenerator';

/**
 * Tool definition interface
 */
interface ToolDefinition {
  name: string;
  description: string;
  schema: any;
}

/**
 * MCP Server configuration
 */
interface MCPServerConfig {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
}

/**
 * Main MCP Client class
 * Handles communication with one or more MCP servers
 */
export class McpClient {
  private piiCensor: PiiCensor;
  private servers: Map<string, any> = new Map();
  private tools: Map<string, ToolDefinition> = new Map();
  private n8nClient: N8nMcpClient;
  private router: ToolCallRouter;
  private filesystemGenerator: FilesystemGenerator;

  constructor(piiCensor: PiiCensor) {
    this.piiCensor = piiCensor;
    this.n8nClient = new N8nMcpClient();
    this.filesystemGenerator = new FilesystemGenerator();
    this.router = new ToolCallRouter(this, this.filesystemGenerator);
    this.initializeServers();
  }

  /**
   * Initialize MCP server connections
   * TODO: Replace with actual MCP server initialization
   */
  private initializeServers(): void {
    // TODO: Connect to your MCP servers here
    // Example:
    // - File system MCP server
    // - Database MCP server
    // - API integration MCP server
    // - Custom tool MCP servers
    
    console.log('[McpClient] Initializing MCP servers...');
    
    // For template purposes, we'll use a mock implementation
    // Replace this with actual MCP SDK connections
    this.registerMockServers();
    
    console.log(`[McpClient] Initialized ${this.tools.size} tools from ${this.servers.size} servers`);
  }

  /**
   * Mock server registration for template
   * Replace this with actual MCP server connections
   */
  private registerMockServers(): void {
    // Example tool registration - replace with actual MCP discovery
    this.registerTool({
      name: '__internal_list_tools',
      description: 'List all available MCP tools',
      schema: { output: 'string[]' }
    });
    
    this.registerTool({
      name: '__internal_get_tool_details',
      description: 'Get detailed information about a specific tool',
      schema: { input: { name: 'string' }, output: 'ToolDefinition' }
    });

    // Register n8n tools
    this.registerN8nTools();
  }

  /**
   * Register n8n MCP tools
   */
  private registerN8nTools(): void {
    const n8nTools = this.n8nClient.listTools();
    
    for (const toolName of n8nTools) {
      const toolDef = this.n8nClient.getToolDefinition(toolName);
      if (toolDef) {
        this.registerTool({
          name: toolName,
          description: toolDef.description,
          schema: toolDef.parameters
        });
      }
    }
    
    console.log(`[McpClient] Registered ${n8nTools.length} n8n tools`);
  }

  /**
   * Register a tool in the client
   */
  private registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Call an MCP tool with PII protection
   * Routes through the ToolCallRouter for intelligent strategy selection
   */
  async callTool(toolName: string, input: any, userId: string = 'default'): Promise<any> {
    console.log(`[McpClient] Calling tool: ${toolName}`);
    
    // De-tokenize any PII from agent code before sending to real tools
    const detokenizedInput = this.piiCensor.detokenize(userId, input);
    
    // Route the tool call through the router
    const routingResult = await this.router.routeToolCall({
      toolName,
      input: detokenizedInput,
      userId
    });
    
    if (!routingResult.success) {
      throw new Error(routingResult.error || 'Tool call failed');
    }
    
    // Tokenize any PII in the response before sending to agent
    const tokenizedResult = this.piiCensor.tokenize(userId, routingResult.result);
    
    return tokenizedResult;
  }

  /**
   * Execute a tool on the appropriate MCP server
   * TODO: Implement actual MCP tool execution
   */
  async executeToolOnServer(toolName: string, input: any): Promise<any> {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}. Use list_mcp_tools() to see available tools.`);
    }
    
    // Route n8n tools to n8n client
    if (toolName.startsWith('n8n_')) {
      return await this.n8nClient.executeTool(toolName, input);
    }
    
    // TODO: Route other tools to appropriate MCP server and execute
    // Example:
    // const server = this.getServerForTool(toolName);
    // const result = await server.callTool(toolName, input);
    // return result;
    
    console.log(`[McpClient] Executing tool ${toolName} with input:`, input);
    
    // Template mock response
    return {
      success: true,
      message: `Tool ${toolName} executed (mock implementation - replace with actual MCP call)`,
      input: input
    };
  }

  /**
   * Get the tool call router for advanced use cases
   */
  getRouter(): ToolCallRouter {
    return this.router;
  }

  /**
   * Get the filesystem generator for tool introspection
   */
  getFilesystemGenerator(): FilesystemGenerator {
    return this.filesystemGenerator;
  }

  /**
   * List all available tools
   */
  async listTools(): Promise<string[]> {
    const toolNames = Array.from(this.tools.keys()).filter(
      name => !name.startsWith('__internal_')
    );
    
    console.log(`[McpClient] Listing ${toolNames.length} tools`);
    return toolNames;
  }

  /**
   * Get detailed information about a specific tool
   */
  async getToolDetails(toolName: string): Promise<ToolDefinition> {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    console.log(`[McpClient] Getting details for tool: ${toolName}`);
    return tool;
  }

  /**
   * Add a new MCP server connection
   * TODO: Implement actual MCP server connection
   */
  async addServer(config: MCPServerConfig): Promise<void> {
    console.log(`[McpClient] Adding server: ${config.name}`);
    
    // TODO: Connect to MCP server using @modelcontextprotocol/sdk
    // Example:
    // const client = new Client(...);
    // const transport = new StdioClientTransport({ command: config.command, args: config.args });
    // await client.connect(transport);
    // const serverTools = await client.listTools();
    // serverTools.forEach(tool => this.registerTool(tool));
    
    throw new Error('addServer() not implemented - add your MCP server connection logic here');
  }

  /**
   * Disconnect from all servers
   */
  async disconnect(): Promise<void> {
    console.log('[McpClient] Disconnecting from all servers...');
    
    for (const [name] of this.servers) {
      // TODO: Disconnect from each server
      console.log(`[McpClient] Disconnecting from ${name}`);
    }
    
    this.servers.clear();
    this.tools.clear();
  }
}
