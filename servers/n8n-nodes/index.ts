/**
 * n8n Nodes - Node Discovery and Information Tools
 * 
 * This module provides tools for discovering and working with n8n nodes.
 * Agents can import these functions to interact with n8n node capabilities.
 */

import { callMCPTool } from '../../../dist/agent_runtime/runtime_api.js';

/**
 * List all available n8n node types
 * @returns Array of node type identifiers
 */
export async function listNodes(): Promise<string[]> {
  return callMCPTool<string[]>('n8n_nodes__list_nodes', {});
}

/**
 * Search for n8n nodes by query
 * @param query - Search query (searches name, description, and tags)
 * @returns Array of matching node type identifiers
 */
export async function searchNodes(query: string): Promise<string[]> {
  return callMCPTool<string[]>('n8n_nodes__search_nodes', { query });
}

/**
 * Get comprehensive information about a specific n8n node
 * @param nodeType - Node type identifier (e.g., 'n8n-nodes-base.slack')
 * @returns Complete node information including all properties and operations
 */
export async function getNodeInfo(nodeType: string): Promise<any> {
  return callMCPTool('n8n_nodes__get_node_info', { nodeType });
}

/**
 * Get essential properties for a node (token efficient)
 * Returns only the top 10 most important properties
 * @param nodeType - Node type identifier
 * @returns Essential node information with limited properties
 */
export async function getNodeEssentials(nodeType: string): Promise<any> {
  return callMCPTool('n8n_nodes__get_node_essentials', { nodeType });
}

/**
 * Validate a node configuration
 * @param nodeType - Node type identifier
 * @param config - Node configuration object to validate
 * @returns Validation result with errors if any
 */
export async function validateNodeConfig(nodeType: string, config: any): Promise<{ valid: boolean; errors: string[] }> {
  return callMCPTool('n8n_nodes__validate_node_config', { nodeType, config });
}
