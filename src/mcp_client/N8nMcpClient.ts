/**
 * n8n MCP Client - Integrates n8n services with MCP tool framework
 * 
 * This client exposes n8n functionality through MCP tools that can be
 * discovered dynamically by agents using the code execution paradigm.
 */

import { NodeService } from '../n8n_services/NodeService';
import { TemplateService } from '../n8n_services/TemplateService';
import { WorkflowService } from '../n8n_services/WorkflowService';

export interface N8nToolDefinition {
  name: string;
  category: string;
  description: string;
  parameters: any;
  handler: (input: any) => Promise<any>;
}

/**
 * n8n MCP Client
 * Provides MCP tools for n8n node, template, and workflow operations
 */
export class N8nMcpClient {
  private nodeService: NodeService;
  private templateService: TemplateService;
  private workflowService: WorkflowService;
  private tools: Map<string, N8nToolDefinition> = new Map();

  constructor() {
    console.log('[N8nMcpClient] Initializing n8n MCP client...');
    
    this.nodeService = new NodeService();
    this.templateService = new TemplateService();
    this.workflowService = new WorkflowService();
    
    this.registerAllTools();
    
    console.log(`[N8nMcpClient] Registered ${this.tools.size} n8n tools`);
  }

  /**
   * Register all n8n MCP tools
   */
  private registerAllTools(): void {
    // Node tools
    this.registerTool({
      name: 'n8n_nodes__list_nodes',
      category: 'n8n-nodes',
      description: 'List all available n8n node types',
      parameters: {},
      handler: async () => this.nodeService.listNodes()
    });

    this.registerTool({
      name: 'n8n_nodes__search_nodes',
      category: 'n8n-nodes',
      description: 'Search for n8n nodes by query (name, description, or tags)',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      },
      handler: async (input) => this.nodeService.searchNodes(input.query)
    });

    this.registerTool({
      name: 'n8n_nodes__get_node_info',
      category: 'n8n-nodes',
      description: 'Get comprehensive information about a specific n8n node',
      parameters: {
        type: 'object',
        properties: {
          nodeType: { type: 'string', description: 'Node type identifier (e.g., n8n-nodes-base.slack)' }
        },
        required: ['nodeType']
      },
      handler: async (input) => this.nodeService.getNodeInfo(input.nodeType)
    });

    this.registerTool({
      name: 'n8n_nodes__get_node_essentials',
      category: 'n8n-nodes',
      description: 'Get essential properties (top 10) for a node - token efficient',
      parameters: {
        type: 'object',
        properties: {
          nodeType: { type: 'string', description: 'Node type identifier' }
        },
        required: ['nodeType']
      },
      handler: async (input) => this.nodeService.getNodeEssentials(input.nodeType)
    });

    this.registerTool({
      name: 'n8n_nodes__validate_node_config',
      category: 'n8n-nodes',
      description: 'Validate a node configuration',
      parameters: {
        type: 'object',
        properties: {
          nodeType: { type: 'string', description: 'Node type identifier' },
          config: { type: 'object', description: 'Node configuration to validate' }
        },
        required: ['nodeType', 'config']
      },
      handler: async (input) => this.nodeService.validateNodeConfig(input.nodeType, input.config)
    });

    // Template tools
    this.registerTool({
      name: 'n8n_templates__list_templates',
      category: 'n8n-templates',
      description: 'List all available workflow templates',
      parameters: {},
      handler: async () => this.templateService.listTemplates()
    });

    this.registerTool({
      name: 'n8n_templates__search_templates',
      category: 'n8n-templates',
      description: 'Search workflow templates by text query',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      },
      handler: async (input) => this.templateService.searchTemplates(input.query)
    });

    this.registerTool({
      name: 'n8n_templates__get_template',
      category: 'n8n-templates',
      description: 'Get a workflow template by ID',
      parameters: {
        type: 'object',
        properties: {
          templateId: { type: 'string', description: 'Template identifier' }
        },
        required: ['templateId']
      },
      handler: async (input) => this.templateService.getTemplate(input.templateId)
    });

    this.registerTool({
      name: 'n8n_templates__search_by_metadata',
      category: 'n8n-templates',
      description: 'Search templates by tags or node types',
      parameters: {
        type: 'object',
        properties: {
          tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
          nodeTypes: { type: 'array', items: { type: 'string' }, description: 'Filter by node types' }
        }
      },
      handler: async (input) => this.templateService.searchByMetadata(input)
    });

    this.registerTool({
      name: 'n8n_templates__list_node_templates',
      category: 'n8n-templates',
      description: 'List templates that use a specific node type',
      parameters: {
        type: 'object',
        properties: {
          nodeType: { type: 'string', description: 'Node type to filter by' }
        },
        required: ['nodeType']
      },
      handler: async (input) => this.templateService.listNodeTemplates(input.nodeType)
    });

    // Workflow tools
    this.registerTool({
      name: 'n8n_workflows__create_workflow',
      category: 'n8n-workflows',
      description: 'Create a new workflow',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Workflow name' },
          nodes: { type: 'array', description: 'Array of workflow nodes' },
          connections: { type: 'object', description: 'Node connections' },
          active: { type: 'boolean', description: 'Whether workflow is active' }
        },
        required: ['name', 'nodes', 'connections']
      },
      handler: async (input) => this.workflowService.createWorkflow(input)
    });

    this.registerTool({
      name: 'n8n_workflows__update_workflow',
      category: 'n8n-workflows',
      description: 'Update an existing workflow',
      parameters: {
        type: 'object',
        properties: {
          workflowId: { type: 'string', description: 'Workflow ID to update' },
          updates: { type: 'object', description: 'Properties to update' }
        },
        required: ['workflowId', 'updates']
      },
      handler: async (input) => this.workflowService.updateWorkflow(input.workflowId, input.updates)
    });

    this.registerTool({
      name: 'n8n_workflows__get_workflow',
      category: 'n8n-workflows',
      description: 'Get a workflow by ID',
      parameters: {
        type: 'object',
        properties: {
          workflowId: { type: 'string', description: 'Workflow identifier' }
        },
        required: ['workflowId']
      },
      handler: async (input) => this.workflowService.getWorkflow(input.workflowId)
    });

    this.registerTool({
      name: 'n8n_workflows__delete_workflow',
      category: 'n8n-workflows',
      description: 'Delete a workflow',
      parameters: {
        type: 'object',
        properties: {
          workflowId: { type: 'string', description: 'Workflow identifier' }
        },
        required: ['workflowId']
      },
      handler: async (input) => this.workflowService.deleteWorkflow(input.workflowId)
    });

    this.registerTool({
      name: 'n8n_workflows__list_workflows',
      category: 'n8n-workflows',
      description: 'List all workflows',
      parameters: {},
      handler: async () => this.workflowService.listWorkflows()
    });

    this.registerTool({
      name: 'n8n_workflows__validate_workflow',
      category: 'n8n-workflows',
      description: 'Validate a workflow structure',
      parameters: {
        type: 'object',
        properties: {
          workflow: { type: 'object', description: 'Workflow to validate' }
        },
        required: ['workflow']
      },
      handler: async (input) => this.workflowService.validateWorkflow(input.workflow)
    });

    this.registerTool({
      name: 'n8n_workflows__execute_workflow',
      category: 'n8n-workflows',
      description: 'Execute a workflow',
      parameters: {
        type: 'object',
        properties: {
          workflowId: { type: 'string', description: 'Workflow identifier' },
          inputData: { type: 'object', description: 'Optional input data' }
        },
        required: ['workflowId']
      },
      handler: async (input) => this.workflowService.executeWorkflow(input.workflowId, input.inputData)
    });

    this.registerTool({
      name: 'n8n_workflows__get_workflow_structure',
      category: 'n8n-workflows',
      description: 'Get simplified workflow structure (token efficient)',
      parameters: {
        type: 'object',
        properties: {
          workflowId: { type: 'string', description: 'Workflow identifier' }
        },
        required: ['workflowId']
      },
      handler: async (input) => this.workflowService.getWorkflowStructure(input.workflowId)
    });
  }

  /**
   * Register a single tool
   */
  private registerTool(tool: N8nToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Execute an n8n tool
   */
  async executeTool(toolName: string, input: any): Promise<any> {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      throw new Error(`n8n tool not found: ${toolName}. Use list_n8n_tools() to see available tools.`);
    }

    console.log(`[N8nMcpClient] Executing n8n tool: ${toolName}`);
    return await tool.handler(input);
  }

  /**
   * List all available n8n tools
   */
  listTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): N8nToolDefinition[] {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  /**
   * Get tool definition
   */
  getToolDefinition(toolName: string): N8nToolDefinition | undefined {
    return this.tools.get(toolName);
  }

  /**
   * List tool categories
   */
  listCategories(): string[] {
    const categories = new Set<string>();
    for (const tool of this.tools.values()) {
      categories.add(tool.category);
    }
    return Array.from(categories);
  }
}
