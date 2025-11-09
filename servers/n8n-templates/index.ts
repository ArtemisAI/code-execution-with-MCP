/**
 * n8n Templates - Workflow Template Discovery Tools
 * 
 * This module provides tools for discovering and using n8n workflow templates.
 * Agents can import these functions to find and use pre-built workflow patterns.
 */

import { callMCPTool } from '../../../dist/agent_runtime/runtime_api.js';

/**
 * List all available workflow templates
 * @returns Array of all templates
 */
export async function listTemplates(): Promise<any[]> {
  return callMCPTool('n8n_templates__list_templates', {});
}

/**
 * Search workflow templates by text query
 * @param query - Search query (searches name, description, and tags)
 * @returns Array of matching templates
 */
export async function searchTemplates(query: string): Promise<any[]> {
  return callMCPTool('n8n_templates__search_templates', { query });
}

/**
 * Get a specific workflow template by ID
 * @param templateId - Template identifier
 * @returns Complete template with nodes and connections
 */
export async function getTemplate(templateId: string): Promise<any> {
  return callMCPTool('n8n_templates__get_template', { templateId });
}

/**
 * Search templates by metadata (advanced filtering)
 * @param filters - Filter criteria (tags and/or nodeTypes)
 * @returns Array of matching templates
 */
export async function searchByMetadata(filters: { tags?: string[]; nodeTypes?: string[] }): Promise<any[]> {
  return callMCPTool('n8n_templates__search_by_metadata', filters);
}

/**
 * List templates that use a specific node type
 * @param nodeType - Node type to filter by
 * @returns Array of templates using the specified node
 */
export async function listNodeTemplates(nodeType: string): Promise<any[]> {
  return callMCPTool('n8n_templates__list_node_templates', { nodeType });
}
