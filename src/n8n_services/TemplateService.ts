/**
 * Template Service - Provides access to n8n workflow templates
 * 
 * This is a minimal implementation that simulates template operations.
 * In a full implementation, this would connect to an actual n8n template database.
 */

import { N8nTemplate } from './types';

export class TemplateService {
  private mockTemplates: Map<string, N8nTemplate> = new Map();

  constructor() {
    this.initializeMockTemplates();
  }

  /**
   * Initialize with some mock templates
   */
  private initializeMockTemplates(): void {
    // Mock Slack notification template
    this.mockTemplates.set('slack-notification', {
      id: 'slack-notification',
      name: 'Slack Notification Workflow',
      description: 'Send notifications to Slack channel',
      tags: ['slack', 'notification', 'communication'],
      nodes: [
        {
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          position: [250, 300],
          parameters: {
            path: 'notify',
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
            channel: '#notifications',
            text: '={{$json["message"]}}'
          }
        }
      ],
      connections: {
        'Webhook': {
          main: [[{ node: 'Slack', type: 'main', index: 0 }]]
        }
      }
    });

    // Mock data processing template
    this.mockTemplates.set('data-processing', {
      id: 'data-processing',
      name: 'Data Processing Pipeline',
      description: 'Fetch, process, and store data',
      tags: ['data', 'api', 'processing'],
      nodes: [
        {
          name: 'HTTP Request',
          type: 'n8n-nodes-base.httpRequest',
          position: [250, 300],
          parameters: {
            method: 'GET',
            url: 'https://api.example.com/data'
          }
        }
      ],
      connections: {}
    });

    console.log(`[TemplateService] Initialized with ${this.mockTemplates.size} mock templates`);
  }

  /**
   * Search templates by text query
   */
  async searchTemplates(query: string): Promise<N8nTemplate[]> {
    const lowerQuery = query.toLowerCase();
    const results: N8nTemplate[] = [];

    for (const template of this.mockTemplates.values()) {
      if (
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      ) {
        results.push(template);
      }
    }

    return results;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<N8nTemplate> {
    const template = this.mockTemplates.get(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return template;
  }

  /**
   * Search templates by metadata
   */
  async searchByMetadata(filters: { tags?: string[]; nodeTypes?: string[] }): Promise<N8nTemplate[]> {
    const results: N8nTemplate[] = [];

    for (const template of this.mockTemplates.values()) {
      let matches = true;

      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag =>
          template.tags?.includes(tag)
        );
        if (!hasMatchingTag) matches = false;
      }

      // Filter by node types
      if (filters.nodeTypes && filters.nodeTypes.length > 0) {
        const hasMatchingNode = filters.nodeTypes.some(nodeType =>
          template.nodes.some(node => node.type === nodeType)
        );
        if (!hasMatchingNode) matches = false;
      }

      if (matches) {
        results.push(template);
      }
    }

    return results;
  }

  /**
   * List templates that use a specific node
   */
  async listNodeTemplates(nodeType: string): Promise<N8nTemplate[]> {
    const results: N8nTemplate[] = [];

    for (const template of this.mockTemplates.values()) {
      const usesNode = template.nodes.some(node => node.type === nodeType);
      if (usesNode) {
        results.push(template);
      }
    }

    return results;
  }

  /**
   * Get all templates
   */
  async listTemplates(): Promise<N8nTemplate[]> {
    return Array.from(this.mockTemplates.values());
  }
}
