/**
 * Runtime API - Code injected into the sandbox
 * Provides helper functions available to agent code running in the container
 */

export function getRuntimeApi(): string {
  return `
    // Runtime API for agent code execution
    // This code runs INSIDE the Docker sandbox
    
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');
    
    /**
     * Call an MCP tool from within the sandbox
     * This function communicates back to the host to execute the actual tool
     */
    global.callMCPTool = async function(toolName, input) {
      try {
        const response = await axios.post(HOST_INTERNAL_URL, {
          authToken: HOST_AUTH_TOKEN,
          toolName: toolName,
          input: input
        });
        
        return response.data;
      } catch (error) {
        console.error(\`[callMCPTool] Error calling tool \${toolName}:\`, error.message);
        throw new Error(\`Failed to call MCP tool \${toolName}: \${error.message}\`);
      }
    };
    
    /**
     * File system helpers with security restrictions
     * Only allow access to /skills and /workspace directories
     */
    global.fs = {
      /**
       * Write a file (restricted to /skills or /workspace)
       */
      writeFile: async function(filePath, data) {
        const resolvedPath = path.resolve(filePath);
        const skillsPath = '/home/sandboxuser/skills';
        const workspacePath = '/home/sandboxuser/workspace';
        
        if (!resolvedPath.startsWith(skillsPath) && !resolvedPath.startsWith(workspacePath)) {
          throw new Error(\`Access denied: Can only write to \${skillsPath} or \${workspacePath}\`);
        }
        
        const dir = path.dirname(resolvedPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(resolvedPath, data);
        return true;
      },
      
      /**
       * Read a file (restricted to /skills or /workspace)
       */
      readFile: async function(filePath) {
        const resolvedPath = path.resolve(filePath);
        const skillsPath = '/home/sandboxuser/skills';
        const workspacePath = '/home/sandboxuser/workspace';
        
        if (!resolvedPath.startsWith(skillsPath) && !resolvedPath.startsWith(workspacePath)) {
          throw new Error(\`Access denied: Can only read from \${skillsPath} or \${workspacePath}\`);
        }
        
        return fs.readFileSync(resolvedPath, 'utf8');
      },
      
      /**
       * List files in a directory
       */
      listFiles: async function(dirPath) {
        const resolvedPath = path.resolve(dirPath);
        const skillsPath = '/home/sandboxuser/skills';
        const workspacePath = '/home/sandboxuser/workspace';
        
        if (!resolvedPath.startsWith(skillsPath) && !resolvedPath.startsWith(workspacePath)) {
          throw new Error(\`Access denied: Can only list files in \${skillsPath} or \${workspacePath}\`);
        }
        
        if (!fs.existsSync(resolvedPath)) {
          return [];
        }
        
        return fs.readdirSync(resolvedPath);
      },
      
      /**
       * Check if file exists
       */
      exists: async function(filePath) {
        const resolvedPath = path.resolve(filePath);
        return fs.existsSync(resolvedPath);
      },
      
      /**
       * Delete a file
       */
      deleteFile: async function(filePath) {
        const resolvedPath = path.resolve(filePath);
        const skillsPath = '/home/sandboxuser/skills';
        const workspacePath = '/home/sandboxuser/workspace';
        
        if (!resolvedPath.startsWith(skillsPath) && !resolvedPath.startsWith(workspacePath)) {
          throw new Error(\`Access denied: Can only delete from \${skillsPath} or \${workspacePath}\`);
        }
        
        if (fs.existsSync(resolvedPath)) {
          fs.unlinkSync(resolvedPath);
        }
        return true;
      }
    };
    
    /**
     * Utility functions available to agent code
     */
    global.utils = {
      /**
       * Sleep for specified milliseconds
       */
      sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      },
      
      /**
       * Parse JSON safely
       */
      parseJSON: function(str) {
        try {
          return JSON.parse(str);
        } catch (e) {
          console.error('[utils.parseJSON] Failed to parse JSON:', e.message);
          return null;
        }
      },
      
      /**
       * Get current timestamp
       */
      timestamp: function() {
        return new Date().toISOString();
      },
      
      /**
       * Safely require a module from the servers directory
       * This enables filesystem-based tool discovery
       */
      requireServer: function(modulePath) {
        try {
          // Only allow requiring from servers directory
          if (!modulePath.startsWith('./servers/') && !modulePath.startsWith('../servers/')) {
            throw new Error('Can only require modules from servers directory');
          }
          return require(modulePath);
        } catch (e) {
          console.error('[utils.requireServer] Failed to require module:', e.message);
          return null;
        }
      }
    };
    
    // Make console methods available
    global.console = console;
  `;
}
