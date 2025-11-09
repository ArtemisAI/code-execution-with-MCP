/**
 * Type definitions for n8n MCP integration
 */

export interface N8nNodeInfo {
  name: string;
  displayName: string;
  description: string;
  properties: NodeProperty[];
  operations?: string[];
  credentials?: string[];
}

export interface NodeProperty {
  displayName: string;
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description?: string;
  options?: any[];
}

export interface N8nTemplate {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  connections: any;
  tags?: string[];
}

export interface N8nWorkflow {
  id?: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
}

export interface WorkflowExecutionResult {
  executionId: string;
  status: 'success' | 'error' | 'running';
  data?: any;
  error?: string;
}
