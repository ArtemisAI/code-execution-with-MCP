/**
 * Tool Call Router
 * 
 * Manages routing of tool calls between different execution strategies:
 * - Direct MCP server calls
 * - Filesystem-based tool discovery and execution
 * - Internal meta-tools for discovery
 * 
 * This implements the "Tool Call Router" component from the architecture.
 */

import { McpClient } from '../mcp_client/McpClient';
import { FilesystemGenerator } from './FilesystemGenerator';

export type ToolCallStrategy = 'mcp-direct' | 'filesystem' | 'meta' | 'auto';

export interface ToolCallContext {
  toolName: string;
  input: any;
  userId: string;
  strategy?: ToolCallStrategy;
}

export interface ToolCallResult {
  success: boolean;
  result?: any;
  error?: string;
  strategy: ToolCallStrategy;
  executionTimeMs: number;
}

/**
 * Tool Call Router - Routes tool calls to appropriate execution strategy
 */
export class ToolCallRouter {
  private mcpClient: McpClient;
  private filesystemGenerator: FilesystemGenerator;
  private callStats: Map<string, number> = new Map();

  constructor(mcpClient: McpClient, filesystemGenerator?: FilesystemGenerator) {
    this.mcpClient = mcpClient;
    this.filesystemGenerator = filesystemGenerator || new FilesystemGenerator();
  }

  /**
   * Route a tool call to the appropriate execution strategy
   */
  async routeToolCall(context: ToolCallContext): Promise<ToolCallResult> {
    const startTime = Date.now();
    const strategy = context.strategy || this.determineStrategy(context.toolName);

    console.log(`[ToolCallRouter] Routing ${context.toolName} via ${strategy} strategy`);

    try {
      let result: any;

      switch (strategy) {
        case 'meta':
          result = await this.executeMetaTool(context);
          break;
        
        case 'filesystem':
          result = await this.executeFilesystemTool(context);
          break;
        
        case 'mcp-direct':
        case 'auto':
        default:
          result = await this.executeMcpTool(context);
          break;
      }

      this.recordCall(context.toolName, true);

      return {
        success: true,
        result,
        strategy,
        executionTimeMs: Date.now() - startTime
      };

    } catch (error) {
      this.recordCall(context.toolName, false);

      return {
        success: false,
        error: (error as Error).message,
        strategy,
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Determine the best strategy for a given tool
   */
  private determineStrategy(toolName: string): ToolCallStrategy {
    // Internal meta tools
    if (toolName.startsWith('__internal_') || 
        toolName === 'list_mcp_tools' || 
        toolName === 'get_mcp_tool_details') {
      return 'meta';
    }

    // Filesystem discovery tools
    if (toolName.startsWith('filesystem_') || 
        toolName === 'introspect_servers' ||
        toolName === 'get_virtual_library') {
      return 'filesystem';
    }

    // Default to MCP direct
    return 'mcp-direct';
  }

  /**
   * Execute a meta-tool (internal discovery tools)
   */
  private async executeMetaTool(context: ToolCallContext): Promise<any> {
    const { toolName, input } = context;

    switch (toolName) {
      case '__internal_list_tools':
      case 'list_mcp_tools':
        return await this.mcpClient.listTools();

      case '__internal_get_tool_details':
      case 'get_mcp_tool_details':
        return await this.mcpClient.getToolDetails(input.name || input.toolName);

      case 'introspect_servers':
        return await this.filesystemGenerator.introspectServers();

      case 'get_virtual_library':
        return await this.filesystemGenerator.generateVirtualLibrary();

      case 'get_server_index':
        return await this.filesystemGenerator.getServerIndex(input.serverName);

      case 'list_server_functions':
        return await this.filesystemGenerator.listServerFunctions(input.serverName);

      case 'get_tool_details':
        return await this.filesystemGenerator.getToolDetails(
          input.serverName,
          input.functionName
        );

      default:
        throw new Error(`Unknown meta-tool: ${toolName}`);
    }
  }

  /**
   * Execute a filesystem-based tool
   */
  private async executeFilesystemTool(context: ToolCallContext): Promise<any> {
    // Filesystem tools are primarily for discovery
    // Actual execution still happens through MCP
    return await this.executeMetaTool(context);
  }

  /**
   * Execute a tool via direct MCP call
   */
  private async executeMcpTool(context: ToolCallContext): Promise<any> {
    return await this.mcpClient.callTool(
      context.toolName,
      context.input,
      context.userId
    );
  }

  /**
   * Record tool call statistics
   */
  private recordCall(toolName: string, success: boolean): void {
    const key = `${toolName}:${success ? 'success' : 'failure'}`;
    this.callStats.set(key, (this.callStats.get(key) || 0) + 1);
  }

  /**
   * Get routing statistics
   */
  getStats(): any {
    const stats: any = {
      totalCalls: 0,
      successRate: 0,
      callsByTool: {}
    };

    let totalSuccess = 0;
    let totalFailure = 0;

    for (const [key, count] of this.callStats) {
      const [toolName, status] = key.split(':');
      
      if (!stats.callsByTool[toolName]) {
        stats.callsByTool[toolName] = { success: 0, failure: 0 };
      }

      if (status === 'success') {
        stats.callsByTool[toolName].success += count;
        totalSuccess += count;
      } else {
        stats.callsByTool[toolName].failure += count;
        totalFailure += count;
      }
    }

    stats.totalCalls = totalSuccess + totalFailure;
    stats.successRate = stats.totalCalls > 0 
      ? (totalSuccess / stats.totalCalls) * 100 
      : 0;

    return stats;
  }

  /**
   * Get available meta-tools for agent discovery
   */
  getMetaTools(): string[] {
    return [
      'list_mcp_tools',
      'get_mcp_tool_details',
      'introspect_servers',
      'get_virtual_library',
      'get_server_index',
      'list_server_functions',
      'get_tool_details'
    ];
  }
}
