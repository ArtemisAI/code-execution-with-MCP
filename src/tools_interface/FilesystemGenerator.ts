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
    
    const indexPath = path.join(this.serversPath, serverName, 'index.ts');
    
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
      console.error(`[FilesystemGenerator] Error loading server ${serverName}:`, error);
      
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
}
