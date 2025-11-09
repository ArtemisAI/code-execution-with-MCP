/**
 * Node Service - Provides access to n8n node information
 * 
 * This is a minimal implementation that simulates n8n node operations.
 * In a full implementation, this would connect to an actual n8n database
 * or API to retrieve node information.
 */

import { N8nNodeInfo } from './types';

export class NodeService {
  private mockNodes: Map<string, N8nNodeInfo> = new Map();

  constructor() {
    this.initializeMockNodes();
  }

  /**
   * Initialize with some mock n8n nodes for demonstration
   */
  private initializeMockNodes(): void {
    // Mock Slack node
    this.mockNodes.set('n8n-nodes-base.slack', {
      name: 'n8n-nodes-base.slack',
      displayName: 'Slack',
      description: 'Send messages and interact with Slack',
      properties: [
        {
          displayName: 'Resource',
          name: 'resource',
          type: 'options',
          required: true,
          default: 'message',
          options: [
            { name: 'Message', value: 'message' },
            { name: 'Channel', value: 'channel' },
            { name: 'User', value: 'user' }
          ]
        },
        {
          displayName: 'Operation',
          name: 'operation',
          type: 'options',
          required: true,
          default: 'post',
          options: [
            { name: 'Post', value: 'post' },
            { name: 'Update', value: 'update' }
          ]
        },
        {
          displayName: 'Channel',
          name: 'channel',
          type: 'string',
          required: true,
          default: '',
          description: 'The channel to send the message to'
        },
        {
          displayName: 'Text',
          name: 'text',
          type: 'string',
          required: true,
          default: '',
          description: 'The text to send'
        }
      ],
      operations: ['post', 'update', 'delete'],
      credentials: ['slackApi']
    });

    // Mock HTTP Request node
    this.mockNodes.set('n8n-nodes-base.httpRequest', {
      name: 'n8n-nodes-base.httpRequest',
      displayName: 'HTTP Request',
      description: 'Makes HTTP requests to external APIs',
      properties: [
        {
          displayName: 'Method',
          name: 'method',
          type: 'options',
          required: true,
          default: 'GET',
          options: [
            { name: 'GET', value: 'GET' },
            { name: 'POST', value: 'POST' },
            { name: 'PUT', value: 'PUT' },
            { name: 'DELETE', value: 'DELETE' }
          ]
        },
        {
          displayName: 'URL',
          name: 'url',
          type: 'string',
          required: true,
          default: '',
          description: 'The URL to make the request to'
        }
      ],
      operations: ['request']
    });

    // Mock Webhook node
    this.mockNodes.set('n8n-nodes-base.webhook', {
      name: 'n8n-nodes-base.webhook',
      displayName: 'Webhook',
      description: 'Receive data via webhook',
      properties: [
        {
          displayName: 'Path',
          name: 'path',
          type: 'string',
          required: true,
          default: '',
          description: 'The webhook path'
        },
        {
          displayName: 'Method',
          name: 'httpMethod',
          type: 'options',
          required: true,
          default: 'POST',
          options: [
            { name: 'GET', value: 'GET' },
            { name: 'POST', value: 'POST' }
          ]
        }
      ]
    });

    console.log(`[NodeService] Initialized with ${this.mockNodes.size} mock nodes`);
  }

  /**
   * Get information about a specific node
   */
  async getNodeInfo(nodeType: string): Promise<N8nNodeInfo> {
    const node = this.mockNodes.get(nodeType);
    
    if (!node) {
      throw new Error(`Node type not found: ${nodeType}. Use searchNodes() to find available nodes.`);
    }

    return node;
  }

  /**
   * Get essential properties (top 10) for a node
   */
  async getNodeEssentials(nodeType: string): Promise<Partial<N8nNodeInfo>> {
    const node = await this.getNodeInfo(nodeType);
    
    return {
      name: node.name,
      displayName: node.displayName,
      description: node.description,
      properties: node.properties.slice(0, 10), // Top 10 properties
      operations: node.operations
    };
  }

  /**
   * Search for nodes by query
   */
  async searchNodes(query: string): Promise<string[]> {
    const lowerQuery = query.toLowerCase();
    const results: string[] = [];

    for (const [nodeType, nodeInfo] of this.mockNodes) {
      if (
        nodeType.toLowerCase().includes(lowerQuery) ||
        nodeInfo.displayName.toLowerCase().includes(lowerQuery) ||
        nodeInfo.description.toLowerCase().includes(lowerQuery)
      ) {
        results.push(nodeType);
      }
    }

    return results;
  }

  /**
   * List all available node types
   */
  async listNodes(): Promise<string[]> {
    return Array.from(this.mockNodes.keys());
  }

  /**
   * Validate node configuration
   */
  async validateNodeConfig(nodeType: string, config: any): Promise<{ valid: boolean; errors: string[] }> {
    const node = await this.getNodeInfo(nodeType);
    const errors: string[] = [];

    // Check required properties
    for (const prop of node.properties) {
      if (prop.required && !config[prop.name]) {
        errors.push(`Required property missing: ${prop.displayName} (${prop.name})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
