/**
 * n8n MCP Server - Root Index
 * 
 * This is the entry point for discovering n8n MCP tools.
 * Agents can explore this directory structure to find available capabilities.
 */

/**
 * Available n8n MCP tool categories:
 * 
 * - n8n-nodes/     - Discover and work with n8n node types
 * - n8n-templates/ - Find and use workflow templates
 * - n8n-workflows/ - Create, manage, and execute workflows
 * 
 * Usage Example:
 * 
 * ```typescript
 * import * as nodes from './n8n-nodes/index.js';
 * import * as templates from './n8n-templates/index.js';
 * import * as workflows from './n8n-workflows/index.js';
 * 
 * // Search for Slack-related nodes
 * const slackNodes = await nodes.searchNodes('slack');
 * 
 * // Get node information
 * const slackInfo = await nodes.getNodeInfo('n8n-nodes-base.slack');
 * 
 * // Search for notification templates
 * const notificationTemplates = await templates.searchTemplates('notification');
 * 
 * // Create a workflow
 * const workflow = await workflows.createWorkflow({
 *   name: 'My Workflow',
 *   nodes: [...],
 *   connections: {...}
 * });
 * ```
 */

export const categories = [
  'n8n-nodes',
  'n8n-templates', 
  'n8n-workflows'
];

export const description = 'n8n MCP Server - Build and manage n8n workflows programmatically';
