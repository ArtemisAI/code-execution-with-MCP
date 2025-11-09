/**
 * Sandbox Manager Interface
 * Defines the contract for secure code execution environments
 */

export interface SandboxResult {
  output: any;
  logs: string[];
  error?: string;
}

/**
 * Abstract base class for sandbox implementations
 * Extend this to create custom sandbox environments
 */
export abstract class SandboxManager {
  /**
   * Execute code in a secure, isolated environment
   * 
   * @param code - The code to execute
   * @param authToken - Session-specific authentication token
   * @param userId - User identifier for persistent storage
   * @returns Execution result including output, logs, and any errors
   */
  abstract executeCode(code: string, authToken: string, userId: string): Promise<SandboxResult>;
}

// Re-export the concrete Docker implementation
export { DockerSandbox } from './DockerSandbox';
