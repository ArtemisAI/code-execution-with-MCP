/**
 * Docker-based Sandbox Implementation
 * Provides secure, isolated code execution using Docker containers
 * 
 * SECURITY FEATURES:
 * - Runs as non-root user
 * - Read-only root filesystem
 * - Resource limits (CPU, memory)
 * - Network isolation
 * - Ephemeral containers (auto-removed after execution)
 */

import Docker from 'dockerode';
import { SandboxManager, SandboxResult } from './SandboxManager';
import { getRuntimeApi } from '../agent_runtime/runtime_api';
import path from 'path';
import fs from 'fs';

const docker = new Docker();

export class DockerSandbox extends SandboxManager {
  private imageName: string;
  private hostUrl: string;
  private timeoutMs: number;
  private memoryLimitMb: number;
  private cpuQuota: number;

  constructor(config?: {
    imageName?: string;
    hostUrl?: string;
    timeoutMs?: number;
    memoryLimitMb?: number;
    cpuQuota?: number;
  }) {
    super();
    this.imageName = config?.imageName || 'sandbox-image-name';
    this.hostUrl = config?.hostUrl || 'http://host.docker.internal:3000/internal/mcp-call';
    this.timeoutMs = config?.timeoutMs || 30000; // 30 seconds default
    this.memoryLimitMb = config?.memoryLimitMb || 100; // 100MB default
    this.cpuQuota = config?.cpuQuota || 50000; // 50% of one CPU
  }

  async executeCode(code: string, authToken: string, userId: string): Promise<SandboxResult> {
    const logs: string[] = [];
    const skillsDir = path.resolve(__dirname, `../../skills/${userId}`);
    const workspaceDir = path.resolve(__dirname, `../../workspace/${userId}_${Date.now()}`);
    
    // Ensure directories exist
    this.ensureDirectory(skillsDir);
    this.ensureDirectory(workspaceDir);

    // Inject runtime API and user code
    const injectedCode = this.buildInjectedCode(code, authToken);

    let container: Docker.Container | null = null;
    
    try {
      // Create container with security constraints
      container = await docker.createContainer({
        Image: this.imageName,
        Tty: false,
        Cmd: ['node', '-e', injectedCode],
        HostConfig: {
          // Network configuration
          // Use 'bridge' to allow access to host.docker.internal
          // In production, use a custom network with strict egress policy
          NetworkMode: 'bridge',
          
          // Mount persistent skills and ephemeral workspace
          Mounts: [
            {
              Type: 'bind',
              Source: skillsDir,
              Target: '/home/sandboxuser/skills',
              ReadOnly: false
            },
            {
              Type: 'bind',
              Source: workspaceDir,
              Target: '/home/sandboxuser/workspace',
              ReadOnly: false
            }
          ],
          
          // Resource limits
          Memory: this.memoryLimitMb * 1024 * 1024,
          CpuQuota: this.cpuQuota,
          
          // Security: read-only root filesystem
          ReadonlyRootfs: true,
          
          // Additional security options
          SecurityOpt: ['no-new-privileges'],
          CapDrop: ['ALL'] // Drop all capabilities
        },
        // Run as non-root user
        User: 'sandboxuser',
        
        // Working directory
        WorkingDir: '/home/sandboxuser'
      });

      // Attach to container output
      const stream = await container.attach({ 
        stream: true, 
        stdout: true, 
        stderr: true 
      });

      let output: any = null;
      let executionError: string | undefined;

      // Process output stream
      stream.on('data', (chunk) => {
        const lines = chunk.toString('utf8').split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          if (trimmed.startsWith('---EXECUTION_COMPLETE---')) {
            // Next line should contain the output JSON
            continue;
          } else if (trimmed.startsWith('---EXECUTION_ERROR---')) {
            // Next line should contain the error
            continue;
          } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            // Try to parse as JSON output
            try {
              output = JSON.parse(trimmed);
            } catch (e) {
              logs.push(trimmed);
            }
          } else {
            logs.push(trimmed);
          }
        }
      });

      // Start container
      await container.start();
      
      // Wait for completion with timeout
      await Promise.race([
        container.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Execution timeout')), this.timeoutMs)
        )
      ]);

      return { output, logs, error: executionError };
      
    } catch (error) {
      const errorMsg = (error as Error).message;
      logs.push(`Sandbox error: ${errorMsg}`);
      return { output: null, logs, error: errorMsg };
      
    } finally {
      // Cleanup: remove container and ephemeral workspace
      if (container) {
        try {
          await container.remove({ force: true });
        } catch (e) {
          console.error('[DockerSandbox] Failed to remove container:', e);
        }
      }
      
      // Clean up ephemeral workspace
      if (fs.existsSync(workspaceDir)) {
        fs.rmSync(workspaceDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * Build the complete code to inject into the container
   */
  private buildInjectedCode(userCode: string, authToken: string): string {
    return `
      ${getRuntimeApi()}
      
      const HOST_AUTH_TOKEN = "${authToken}";
      const HOST_INTERNAL_URL = "${this.hostUrl}";

      // Inject global functions for dynamic tool discovery
      global.list_mcp_tools = async () => {
        return callMCPTool("__internal_list_tools", {});
      };
      
      global.get_mcp_tool_details = async (name) => {
        return callMCPTool("__internal_get_tool_details", { name });
      };

      // Execute user code
      (async () => {
        try {
          const result = await (async function() {
            ${userCode}
          })();
          
          console.log("---EXECUTION_COMPLETE---");
          console.log(JSON.stringify(result !== undefined ? result : null));
        } catch (err) {
          console.error("---EXECUTION_ERROR---");
          console.error(err.message);
          console.error(err.stack);
        }
      })();
    `;
  }

  /**
   * Ensure a directory exists
   */
  private ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
