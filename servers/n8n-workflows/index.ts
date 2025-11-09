/**
 * n8n Workflows - Workflow Management Tools
 * 
 * This module provides tools for creating, managing, and executing n8n workflows.
 * Agents can import these functions to build and deploy workflows.
 */

import { callMCPTool } from '../../../dist/agent_runtime/runtime_api.js';

/**
 * Create a new workflow
 * @param workflow - Workflow definition
 * @returns Created workflow with generated ID
 */
export async function createWorkflow(workflow: {
  name: string;
  nodes: any[];
  connections: any;
  active?: boolean;
  settings?: any;
}): Promise<any> {
  return callMCPTool('n8n_workflows__create_workflow', workflow);
}

/**
 * Update an existing workflow
 * @param workflowId - Workflow identifier
 * @param updates - Properties to update
 * @returns Updated workflow
 */
export async function updateWorkflow(workflowId: string, updates: any): Promise<any> {
  return callMCPTool('n8n_workflows__update_workflow', { workflowId, updates });
}

/**
 * Get a workflow by ID
 * @param workflowId - Workflow identifier
 * @returns Complete workflow definition
 */
export async function getWorkflow(workflowId: string): Promise<any> {
  return callMCPTool('n8n_workflows__get_workflow', { workflowId });
}

/**
 * Delete a workflow
 * @param workflowId - Workflow identifier
 */
export async function deleteWorkflow(workflowId: string): Promise<void> {
  return callMCPTool('n8n_workflows__delete_workflow', { workflowId });
}

/**
 * List all workflows
 * @returns Array of all workflows
 */
export async function listWorkflows(): Promise<any[]> {
  return callMCPTool('n8n_workflows__list_workflows', {});
}

/**
 * Validate a workflow structure
 * @param workflow - Workflow to validate
 * @returns Validation result with errors if any
 */
export async function validateWorkflow(workflow: any): Promise<{ valid: boolean; errors: string[] }> {
  return callMCPTool('n8n_workflows__validate_workflow', { workflow });
}

/**
 * Execute a workflow
 * @param workflowId - Workflow identifier
 * @param inputData - Optional input data for the workflow
 * @returns Execution result
 */
export async function executeWorkflow(workflowId: string, inputData?: any): Promise<any> {
  return callMCPTool('n8n_workflows__execute_workflow', { workflowId, inputData });
}

/**
 * Get simplified workflow structure (token efficient)
 * @param workflowId - Workflow identifier
 * @returns Simplified workflow information
 */
export async function getWorkflowStructure(workflowId: string): Promise<any> {
  return callMCPTool('n8n_workflows__get_workflow_structure', { workflowId });
}
