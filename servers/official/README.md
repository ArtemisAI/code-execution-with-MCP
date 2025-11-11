# Official MCP Servers

This directory contains the official Model Context Protocol servers maintained by the MCP team.

## Available Servers

### 1. Filesystem Server (`filesystem/`)
**Purpose:** File system operations  
**Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem

File operations including read/write, directory management, move, search, and metadata operations with dynamic access control.

### 2. Git Server (`git/`)
**Purpose:** Git repository management  
**Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/git

Interact with Git repositories: status, diffs, commits, logs, and repository search.

### 3. Memory Server (`memory/`)
**Purpose:** Persistent knowledge graphs  
**Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/memory

Knowledge graph-based memory system for storing entities, relationships, and observations across sessions.

### 4. Fetch Server (`fetch/`)
**Purpose:** HTTP operations  
**Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/fetch

Make HTTP requests with custom headers, handle responses, and manage web content fetching.

### 5. Everything Server (`everything/`)
**Purpose:** Reference implementation  
**Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/everything

Comprehensive example demonstrating all MCP protocol capabilities. Useful for testing and development.

### 6. Time Server (`time/`)
**Purpose:** Time and date operations  
**Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/time

Handle time queries, timezone conversions, date calculations, and formatting.

### 7. Sequential Thinking Server (`sequential-thinking/`)
**Purpose:** Extended reasoning  
**Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking

Support for multi-step reasoning, thought process tracking, and complex problem decomposition.

## Installation

Each server can be installed and run independently. Generally:

```bash
cd <server-directory>
npm install
npx <server-command> [options]
```

For specific installation instructions, refer to the README in each server's directory.

## Integration

These servers are designed to work with the Code Execution with MCP harness through dynamic discovery. Agents can discover available tools at runtime and execute them as needed.

## Maintenance

These servers are actively maintained by the Model Context Protocol team. For issues or contributions, visit the [official repository](https://github.com/modelcontextprotocol/servers).

---

**Note:** All servers in this directory follow the MCP specification and are regularly updated to maintain compatibility with the latest protocol version.
