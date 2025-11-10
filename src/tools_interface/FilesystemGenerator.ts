/**
 * Filesystem Generator
 * 
 * Introspects MCP server tool definitions and generates a virtual code library
 * that agents can discover and use at runtime through the filesystem.
 * 
 * This implements the "Filesystem Generator" component from the architecture,
 * enabling token-efficient tool discovery by allowing agents to explore
 * the servers/ directory structure instead of loading all tool definitions.
 */

import path from 'path';
import fs from 'fs';

export interface ServerToolDefinition {
  name: string;
  description: string;
  category: string;
  functions: ServerFunction[];
}

export interface ServerFunction {
  name: string;
  description: string;
  parameters?: any;
  returns?: string;
}

/**
 * Filesystem Generator - Manages the virtual code library for tool discovery
 */
export class FilesystemGenerator {
  private serversPath: string;
  private toolCache: Map<string, ServerToolDefinition> = new Map();
  private cacheTimestamp: number = 0;
  private cacheTTL: number = 60000; // 1 minute cache

  constructor(serversPath?: string) {
    this.serversPath = serversPath || path.resolve(__dirname, '../../servers');
  }

  /**
   * Introspect all available MCP servers in the filesystem
   */
  async introspectServers(): Promise<string[]> {
    this.refreshCacheIfNeeded();
    
    const serverDirs: string[] = [];
    
    if (!fs.existsSync(this.serversPath)) {
      console.warn(`[FilesystemGenerator] Servers path does not exist: ${this.serversPath}`);
      return serverDirs;
    }

    const entries = fs.readdirSync(this.serversPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        serverDirs.push(entry.name);
      }
    }

    console.log(`[FilesystemGenerator] Found ${serverDirs.length} server directories`);
    return serverDirs;
  }

  /**
   * Get the index file content for a server directory
   * This provides the entry point for discovering what tools are available
   */
  async getServerIndex(serverName: string): Promise<any> {
    this.refreshCacheIfNeeded();
    
    // Security: Validate serverName to prevent path traversal
    if (!this.isValidServerName(serverName)) {
      throw new Error(`Invalid server name: ${serverName}. Server names must be alphanumeric with hyphens only.`);
    }
    
    const indexPath = path.join(this.serversPath, serverName, 'index.ts');
    
    // Security: Verify the resolved path is within serversPath
    const resolvedPath = path.resolve(indexPath);
    const resolvedServersPath = path.resolve(this.serversPath);
    if (!resolvedPath.startsWith(resolvedServersPath)) {
      throw new Error(`Access denied: Path traversal attempt detected for ${serverName}`);
    }
    
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Server index not found: ${serverName}`);
    }

    // Try to dynamically load the module
    try {
      const modulePath = path.resolve(indexPath);
      
      // Clear require cache for fresh load
      delete require.cache[modulePath];
      
      const module = require(modulePath);
      return module;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[FilesystemGenerator] Error loading server:', errorMessage);
      
      // Fallback: return file contents as string
      const content = fs.readFileSync(indexPath, 'utf-8');
      return { 
        content,
        error: 'Could not load module, returning source code'
      };
    }
  }

  /**
   * List available functions in a server module
   */
  async listServerFunctions(serverName: string): Promise<string[]> {
    // Security: Validate serverName
    if (!this.isValidServerName(serverName)) {
      throw new Error(`Invalid server name: ${serverName}`);
    }
    
    const module = await this.getServerIndex(serverName);
    
    if (module.error) {
      // Parse function names from source code if module didn't load
      return this.parseFunctionNamesFromSource(module.content);
    }

    // Extract exported function names
    const functions: string[] = [];
    for (const key in module) {
      if (typeof module[key] === 'function') {
        functions.push(key);
      }
    }

    return functions;
  }

  /**
   * Get detailed information about a specific tool/function
   */
  async getToolDetails(serverName: string, functionName: string): Promise<ServerFunction | null> {
    // Security: Validate inputs
    if (!this.isValidServerName(serverName)) {
      throw new Error(`Invalid server name: ${serverName}`);
    }
    if (!this.isValidFunctionName(functionName)) {
      throw new Error(`Invalid function name: ${functionName}`);
    }
    
    const module = await this.getServerIndex(serverName);
    
    if (!module[functionName]) {
      return null;
    }

    // Extract function signature and JSDoc if available
    const func = module[functionName];
    
    return {
      name: functionName,
      description: func.description || `Function ${functionName} from ${serverName}`,
      parameters: func.parameters || {},
      returns: func.returns || 'any'
    };
  }

  /**
   * Generate a virtual code library structure that agents can explore
   * Returns a tree structure showing available tools
   */
  async generateVirtualLibrary(): Promise<any> {
    const servers = await this.introspectServers();
    const library: any = {
      type: 'virtual-library',
      description: 'Filesystem-based MCP tool discovery',
      servers: {}
    };

    for (const serverName of servers) {
      try {
        const functions = await this.listServerFunctions(serverName);
        const module = await this.getServerIndex(serverName);
        
        library.servers[serverName] = {
          name: serverName,
          description: module.description || `${serverName} tools`,
          functions: functions,
          categories: module.categories || [],
          path: `./servers/${serverName}`
        };
      } catch (error) {
        console.error(`[FilesystemGenerator] Error processing ${serverName}:`, error);
        library.servers[serverName] = {
          name: serverName,
          error: (error as Error).message
        };
      }
    }

    return library;
  }

  /**
   * Refresh cache if needed
   */
  private refreshCacheIfNeeded(): void {
    const now = Date.now();
    if (now - this.cacheTimestamp > this.cacheTTL) {
      this.toolCache.clear();
      this.cacheTimestamp = now;
    }
  }

  /**
   * Parse function names from source code (fallback method)
   */
  private parseFunctionNamesFromSource(source: string): string[] {
    const functions: string[] = [];
    
    // Match exported function declarations
    const exportedFunctions = source.match(/export\s+(async\s+)?function\s+(\w+)/g);
    if (exportedFunctions) {
      for (const match of exportedFunctions) {
        const name = match.replace(/export\s+(async\s+)?function\s+/, '');
        functions.push(name);
      }
    }

    // Match exported const arrow functions
    const exportedConsts = source.match(/export\s+const\s+(\w+)\s*=\s*(async\s+)?\(/g);
    if (exportedConsts) {
      for (const match of exportedConsts) {
        const name = match.replace(/export\s+const\s+(\w+)\s*=\s*(async\s+)?\(/, '$1');
        functions.push(name);
      }
    }

    return functions;
  }

  /**
   * Get usage statistics for tool discovery
   */
  getStats(): any {
    return {
      cachedTools: this.toolCache.size,
      cacheAge: Date.now() - this.cacheTimestamp,
      cacheTTL: this.cacheTTL,
      serversPath: this.serversPath
    };
  }

  /**
   * Validate server name to prevent path traversal
   * Server names must be alphanumeric with hyphens only
   */
  private isValidServerName(serverName: string): boolean {
    // Only allow alphanumeric characters, hyphens, and underscores
    // No path separators, dots, or other special characters
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(serverName) && 
           !serverName.includes('..') && 
           !serverName.includes('/') && 
           !serverName.includes('\\');
  }

  /**
   * Validate function name to prevent code injection
   */
  private isValidFunctionName(functionName: string): boolean {
    // Only allow valid JavaScript identifier characters
    const validPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    return validPattern.test(functionName);
  }
}
