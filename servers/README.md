# MCP Servers Collection

A curated collection of Model Context Protocol (MCP) servers organized for easy progressive discovery. This collection includes official servers from the MCP project, archived implementations, and community-contributed servers.

## 📁 Directory Structure

```
servers/
├── official/           # Official MCP servers from modelcontextprotocol/servers
├── archived/           # Archived servers from modelcontextprotocol/servers-archived
└── community/          # Community-contributed MCP servers
```

## 🎯 Progressive Discovery

This collection is organized to support the **dynamic discovery paradigm** described in the [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) pattern. Rather than statically defining tools, agents can:

1. **Discover** available MCP servers at runtime
2. **Explore** their capabilities dynamically
3. **Utilize** tools based on current needs
4. **Adapt** to changing tool availability

### Usage Pattern

```javascript
// Discover available tools from MCP servers
const tools = await list_mcp_tools();

// Get detailed information about a specific tool
const toolDetails = await get_mcp_tool_details("database__query");

// Execute the tool with appropriate parameters
const result = await callMCPTool("database__query", {
  query: "SELECT * FROM users"
});
```

## 📚 Official Servers

Located in `official/` - These are the canonical MCP server implementations maintained by the Model Context Protocol team.

### Filesystem Server
**Path:** `official/filesystem/`  
**Purpose:** File system operations including read/write, directory management, and file search  
**Source:** https://github.com/modelcontextprotocol/servers

**Features:**
- Read/write files
- Create/list/delete directories
- Move files/directories
- Search files
- Get file metadata
- Dynamic directory access control via Roots

### Git Server
**Path:** `official/git/`  
**Purpose:** Git repository interaction and automation  
**Source:** https://github.com/modelcontextprotocol/servers

**Features:**
- Repository status checking
- View diffs (staged and unstaged)
- Commit operations
- Log inspection
- Repository search

### Memory Server
**Path:** `official/memory/`  
**Purpose:** Knowledge graph-based persistent memory system  
**Source:** https://github.com/modelcontextprotocol/servers

**Features:**
- Entity management (create, read, update)
- Relationship tracking
- Knowledge graph queries
- Persistent memory across sessions

### Fetch Server
**Path:** `official/fetch/`  
**Purpose:** HTTP request handling and web content fetching  
**Source:** https://github.com/modelcontextprotocol/servers

**Features:**
- GET/POST HTTP requests
- Custom headers support
- Response parsing
- Error handling

### Everything Server
**Path:** `official/everything/`  
**Purpose:** Comprehensive example server demonstrating all MCP capabilities  
**Source:** https://github.com/modelcontextprotocol/servers

**Features:**
- Demonstrates all MCP protocol features
- Useful for testing and development
- Reference implementation

### Time Server
**Path:** `official/time/`  
**Purpose:** Time and date operations  
**Source:** https://github.com/modelcontextprotocol/servers

**Features:**
- Current time queries
- Timezone conversions
- Date calculations
- Time formatting

### Sequential Thinking Server
**Path:** `official/sequential-thinking/`  
**Purpose:** Extended thinking and reasoning capabilities  
**Source:** https://github.com/modelcontextprotocol/servers

**Features:**
- Multi-step reasoning support
- Thought process tracking
- Complex problem decomposition

## 🗄️ Archived Servers

Located in `archived/` - Previously maintained servers that are now archived but still useful for reference or specific use cases.

### PostgreSQL Server
**Path:** `archived/postgresql/`  
**Purpose:** PostgreSQL database interaction  
**Source:** https://github.com/modelcontextprotocol/servers-archived

**Note:** For production use, consider the community PostgreSQL fork (see Community Servers section)

### Redis Server
**Path:** `archived/redis/`  
**Purpose:** Redis key-value store operations  
**Source:** https://github.com/modelcontextprotocol/servers-archived

### SQLite Server
**Path:** `archived/sqlite/`  
**Purpose:** SQLite database operations  
**Source:** https://github.com/modelcontextprotocol/servers-archived

### Puppeteer Server
**Path:** `archived/puppeteer/`  
**Purpose:** Browser automation and web scraping  
**Source:** https://github.com/modelcontextprotocol/servers-archived

### Sentry Server
**Path:** `archived/sentry/`  
**Purpose:** Error tracking and monitoring integration  
**Source:** https://github.com/modelcontextprotocol/servers-archived

## 🌍 Community Servers

Located in `community/` - MCP servers contributed by the community for various specialized use cases.

### MongoDB Server
**Path:** `community/mongodb/`  
**Purpose:** MongoDB and MongoDB Atlas integration  
**Source:** https://github.com/mongodb-js/mongodb-mcp-server

**Features:**
- MongoDB database operations
- MongoDB Atlas API integration
- Collection management
- Query execution
- Aggregation pipelines

**Maintainer:** MongoDB, Inc.

### GreptimeDB Server
**Path:** `community/greptimedb/`  
**Purpose:** GreptimeDB time-series database integration  
**Source:** https://github.com/GreptimeTeam/greptimedb-mcp-server

**Features:**
- Time-series data queries
- SQL execution
- Table exploration
- Secure database access

**Maintainer:** Greptime Team

### Unstructured Server
**Path:** `community/unstructured/`  
**Purpose:** Document processing and unstructured data extraction  
**Source:** https://github.com/Unstructured-IO/UNS-MCP

**Features:**
- Document parsing
- Text extraction
- Structured data conversion
- Multiple format support

**Maintainer:** Unstructured.io

### Semgrep Server
**Path:** `community/semgrep/`  
**Purpose:** Code security scanning and vulnerability detection  
**Source:** https://github.com/semgrep/mcp

**Features:**
- Security vulnerability scanning
- Code pattern matching
- Multiple language support
- Integration with Semgrep rules

**Maintainer:** Semgrep Inc.

**Note:** This server has been moved to the main Semgrep repository. Updates will be made via the official `semgrep` binary.

### MCP Installer
**Path:** `community/mcp-installer/`  
**Purpose:** Tool for installing and managing MCP servers  
**Source:** https://github.com/anaisbetts/mcp-installer

**Features:**
- Automated MCP server installation
- Configuration management
- Version management

**Maintainer:** Anais Betts

### PostgreSQL Community Fork
**Path:** `community/postgresql-community/`  
**Purpose:** Community-maintained PostgreSQL MCP server  
**Source:** https://github.com/subnetmarco/pgmcp

**Features:**
- PostgreSQL database operations
- Active maintenance
- Enhanced features beyond archived version

**Maintainer:** Marco Palladino (subnetmarco)

## 🚀 Getting Started

### Installation

Each server has its own installation requirements. Generally:

1. Navigate to the specific server directory
2. Follow the installation instructions in the server's README
3. Configure connection parameters (environment variables or config files)
4. Start the server using the appropriate command

### Example: Using the Filesystem Server

```bash
# Navigate to the server directory
cd servers/official/filesystem

# Install dependencies
npm install

# Run the server with allowed directories
npx @modelcontextprotocol/server-filesystem /path/to/allowed/dir
```

### Example: Using the MongoDB Server

```bash
# Navigate to the server directory
cd servers/community/mongodb

# Install dependencies
npm install

# Set environment variables
export MDB_MCP_CONNECTION_STRING="mongodb://localhost:27017"

# Run the server
npx mongodb-mcp-server --readOnly
```

## 🔧 Integration with Code Execution Harness

These MCP servers can be integrated with the Code Execution with MCP harness for dynamic tool discovery:

1. **Configure MCP Servers**: Add server configurations to your MCP client setup
2. **Dynamic Discovery**: Agents automatically discover available tools at runtime
3. **Execute Tools**: Use `callMCPTool()` to execute discovered tools
4. **Save Skills**: Save frequently-used workflows to `/skills` for reuse

### Configuration Example

In your `src/mcp_client/McpClient.ts`:

```typescript
// Add MCP server configurations
async initializeServers(): Promise<void> {
  // Filesystem server
  await this.addServer({
    name: 'filesystem',
    command: 'npx',
    args: ['@modelcontextprotocol/server-filesystem', '/workspace']
  });

  // MongoDB server
  await this.addServer({
    name: 'mongodb',
    command: 'npx',
    args: ['-y', 'mongodb-mcp-server', '--readOnly'],
    env: {
      MDB_MCP_CONNECTION_STRING: process.env.MONGODB_URI
    }
  });
}
```

## 📖 Documentation

Each server directory contains its own README with:
- Detailed feature descriptions
- Installation instructions
- Configuration options
- Usage examples
- API documentation

Refer to individual server documentation for specific details.

## 🤝 Contributing

### Adding New Servers

To add a new MCP server to this collection:

1. **Determine Category**: Choose the appropriate category (official/archived/community)
2. **Create Directory**: Add a directory with a descriptive name
3. **Copy Source**: Include the server source code
4. **Update Documentation**: Add entry to this README
5. **Test Integration**: Verify the server works with the harness

### Updating Servers

To update existing servers:

1. Pull latest changes from the source repository
2. Test compatibility with the harness
3. Update documentation if features have changed
4. Submit a pull request

## 📋 Server Catalog Index

Quick reference table of all available servers:

| Server | Category | Language | Status | Primary Use Case |
|--------|----------|----------|--------|------------------|
| Filesystem | Official | TypeScript | Active | File operations |
| Git | Official | TypeScript | Active | Version control |
| Memory | Official | TypeScript | Active | Knowledge graphs |
| Fetch | Official | TypeScript | Active | HTTP requests |
| Everything | Official | TypeScript | Active | Testing/reference |
| Time | Official | TypeScript | Active | Date/time operations |
| Sequential Thinking | Official | TypeScript | Active | Complex reasoning |
| PostgreSQL | Archived | TypeScript | Archived | SQL database |
| Redis | Archived | TypeScript | Archived | Key-value store |
| SQLite | Archived | TypeScript | Archived | SQL database |
| Puppeteer | Archived | TypeScript | Archived | Browser automation |
| Sentry | Archived | TypeScript | Archived | Error tracking |
| MongoDB | Community | TypeScript | Active | NoSQL database |
| GreptimeDB | Community | Python | Active | Time-series DB |
| Unstructured | Community | Python | Active | Document processing |
| Semgrep | Community | Python | Deprecated* | Security scanning |
| MCP Installer | Community | TypeScript | Active | Server management |
| PostgreSQL (Community) | Community | TypeScript | Active | SQL database |

\* Semgrep MCP server has been moved to the main Semgrep repository

## 🔗 Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Code Execution with MCP (Anthropic)](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Official MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [Archived MCP Servers](https://github.com/modelcontextprotocol/servers-archived)

## 📝 License

Each server has its own license. Refer to individual server directories for license information. Most are MIT licensed.

## ⚠️ Security Considerations

When using MCP servers:

1. **Access Control**: Configure appropriate access restrictions for each server
2. **Authentication**: Use proper authentication mechanisms
3. **Network Security**: Run servers in isolated network environments when possible
4. **Data Privacy**: Be mindful of sensitive data when using database servers
5. **Resource Limits**: Set appropriate resource limits for server processes
6. **Regular Updates**: Keep servers updated to latest versions for security patches

---

**Built for the Code Execution with MCP paradigm** - Dynamic discovery, secure execution, persistent capabilities.
