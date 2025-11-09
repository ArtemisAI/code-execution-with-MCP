/**
 * Workflow Service - Manages n8n workflow operations
 * 
 * This is a minimal implementation that simulates workflow operations.
 * In a full implementation, this would connect to an actual n8n API.
 */

import { N8nWorkflow, WorkflowExecutionResult } from './types';

export class WorkflowService {
  private workflows: Map<string, N8nWorkflow> = new Map();
  private executionCounter = 0;

  constructor() {
    console.log('[WorkflowService] Initialized');
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: N8nWorkflow): Promise<N8nWorkflow> {
    const id = `wf_${Date.now()}`;
    const newWorkflow = { ...workflow, id };
    
    this.workflows.set(id, newWorkflow);
    console.log(`[WorkflowService] Created workflow: ${id} (${workflow.name})`);
    
    return newWorkflow;
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(workflowId: string, updates: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const updated = { ...workflow, ...updates, id: workflowId };
    this.workflows.set(workflowId, updated);
    
    console.log(`[WorkflowService] Updated workflow: ${workflowId}`);
    return updated;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<N8nWorkflow> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    return workflow;
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    this.workflows.delete(workflowId);
    console.log(`[WorkflowService] Deleted workflow: ${workflowId}`);
  }

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<N8nWorkflow[]> {
    return Array.from(this.workflows.values());
  }

  /**
   * Validate workflow structure
   */
  async validateWorkflow(workflow: N8nWorkflow): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation
    if (!workflow.name || workflow.name.trim() === '') {
      errors.push('Workflow name is required');
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Check for duplicate node names
    const nodeNames = new Set<string>();
    for (const node of workflow.nodes || []) {
      if (!node.name) {
        errors.push('All nodes must have a name');
      } else if (nodeNames.has(node.name)) {
        errors.push(`Duplicate node name: ${node.name}`);
      } else {
        nodeNames.add(node.name);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Execute a workflow (mock implementation)
   */
  async executeWorkflow(workflowId: string, inputData?: any): Promise<WorkflowExecutionResult> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow.active) {
      throw new Error(`Workflow is not active: ${workflowId}`);
    }

    const executionId = `exec_${++this.executionCounter}_${Date.now()}`;
    
    console.log(`[WorkflowService] Executing workflow: ${workflowId} (execution: ${executionId})`);
    
    // Mock execution - in real implementation, this would trigger actual n8n execution
    return {
      executionId,
      status: 'success',
      data: {
        message: 'Workflow executed successfully (mock)',
        workflowId,
        inputData
      }
    };
  }

  /**
   * Get workflow structure (simplified view)
   */
  async getWorkflowStructure(workflowId: string): Promise<any> {
    const workflow = await this.getWorkflow(workflowId);
    
    return {
      id: workflow.id,
      name: workflow.name,
      active: workflow.active,
      nodeCount: workflow.nodes.length,
      nodeTypes: workflow.nodes.map(n => n.type),
      connections: Object.keys(workflow.connections || {})
    };
  }
}
