/**
 * n8n Workflow Builder Skill
 * 
 * Demonstrates token-efficient workflow building using code execution paradigm
 */

const nodes = require('../../servers/n8n-nodes/index.js');
const workflows = require('../../servers/n8n-workflows/index.js');

/**
 * Build a Slack notification workflow
 * 
 * @param {Object} config - Configuration options
 * @param {string} config.channel - Slack channel (e.g., '#alerts')
 * @param {string} config.webhookPath - Webhook path (e.g., '/alert')
 * @param {string} [config.name] - Optional workflow name
 * @returns {Promise<Object>} Created workflow
 */
async function buildSlackNotificationWorkflow(config) {
  const { channel, webhookPath, name = 'Slack Notification' } = config;
  
  console.log('[Skill] Building Slack notification workflow...');
  
  // Step 1: Validate we have required nodes (token efficient)
  console.log('[Skill] Discovering required nodes...');
  const availableNodes = await nodes.searchNodes('slack');
  if (!availableNodes.includes('n8n-nodes-base.slack')) {
    throw new Error('Slack node not available');
  }
  
  // Step 2: Get essential properties only (not full definitions)
  console.log('[Skill] Getting node essentials...');
  const webhookEssentials = await nodes.getNodeEssentials('n8n-nodes-base.webhook');
  const slackEssentials = await nodes.getNodeEssentials('n8n-nodes-base.slack');
  
  // Step 3: Build workflow structure
  console.log('[Skill] Building workflow structure...');
  const workflow = {
    name: name,
    active: false, // Start inactive for safety
    nodes: [
      {
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        position: [250, 300],
        parameters: {
          path: webhookPath,
          httpMethod: 'POST'
        }
      },
      {
        name: 'Slack',
        type: 'n8n-nodes-base.slack',
        position: [450, 300],
        parameters: {
          resource: 'message',
          operation: 'post',
          channel: channel,
          text: '={{$json["message"] || "New notification"}}'
        }
      }
    ],
    connections: {
      'Webhook': {
        main: [[{ node: 'Slack', type: 'main', index: 0 }]]
      }
    }
  };
  
  // Step 4: Validate before creating
  console.log('[Skill] Validating workflow...');
  const validation = await workflows.validateWorkflow(workflow);
  if (!validation.valid) {
    throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Step 5: Create workflow
  console.log('[Skill] Creating workflow...');
  const created = await workflows.createWorkflow(workflow);
  
  console.log(`[Skill] Successfully created workflow: ${created.id}`);
  return created;
}

/**
 * Build an API data processing workflow
 * 
 * @param {Object} config - Configuration options
 * @param {string} config.apiUrl - API endpoint URL
 * @param {string} config.method - HTTP method (GET, POST, etc.)
 * @param {string} [config.name] - Optional workflow name
 * @returns {Promise<Object>} Created workflow
 */
async function buildApiProcessingWorkflow(config) {
  const { apiUrl, method = 'GET', name = 'API Processing' } = config;
  
  console.log('[Skill] Building API processing workflow...');
  
  // Build workflow with HTTP Request node
  const workflow = {
    name: name,
    active: false,
    nodes: [
      {
        name: 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        position: [250, 300],
        parameters: {
          method: method,
          url: apiUrl
        }
      }
    ],
    connections: {}
  };
  
  // Validate and create
  const validation = await workflows.validateWorkflow(workflow);
  if (!validation.valid) {
    throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
  }
  
  const created = await workflows.createWorkflow(workflow);
  console.log(`[Skill] Successfully created workflow: ${created.id}`);
  return created;
}

module.exports = {
  buildSlackNotificationWorkflow,
  buildApiProcessingWorkflow
};
