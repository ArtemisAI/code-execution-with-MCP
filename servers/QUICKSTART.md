# MCP Servers Quick Start Guide

This guide helps you quickly get started with the MCP servers collection.

## 🚀 Quick Setup

### 1. Choose a Server Category

- **official/** - Stable, well-maintained servers from the MCP team
- **archived/** - Reference implementations, use with caution
- **community/** - Specialized servers for specific use cases

### 2. Pick a Server

Browse the [catalog.json](./catalog.json) or [README.md](./README.md) to find a server that matches your needs.

### 3. Install and Configure

Each server has its own installation requirements. Generally:

```bash
# Navigate to the server directory
cd servers/<category>/<server-name>

# Install dependencies
npm install  # for TypeScript/Node.js servers
# or
pip install -r requirements.txt  # for Python servers

# Configure (environment variables, config files, etc.)
export SERVER_CONFIG="value"

# Run the server
npm start  # or appropriate command
```

## 📖 Common Use Cases

### File Operations
**Server:** `official/filesystem`

```bash
cd servers/official/filesystem
npm install
npx @modelcontextprotocol/server-filesystem /path/to/allowed/directory
```

### Git Operations
**Server:** `official/git`

```bash
cd servers/official/git
npm install
npx mcp-server-git
```

### Database Operations (MongoDB)
**Server:** `community/mongodb`

```bash
export MDB_MCP_CONNECTION_STRING="mongodb://localhost:27017"
npx -y mongodb-mcp-server --readOnly
```

### Database Operations (PostgreSQL)
**Server:** `community/postgresql-community`

```bash
cd servers/community/postgresql-community
npm install
# Follow server-specific configuration
```

### Time-Series Database
**Server:** `community/greptimedb`

```bash
pip install greptimedb-mcp-server
export GREPTIMEDB_HOST=localhost
python -m greptimedb_mcp_server
```

### HTTP Requests
**Server:** `official/fetch`

```bash
cd servers/official/fetch
npm install
npx @modelcontextprotocol/server-fetch
```

### Persistent Memory
**Server:** `official/memory`

```bash
cd servers/official/memory
npm install
npx @modelcontextprotocol/server-memory
```

## 🔧 Integration with Code Execution Harness

### Method 1: Configuration File

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/workspace"]
    },
    "mongodb": {
      "command": "npx",
      "args": ["-y", "mongodb-mcp-server", "--readOnly"],
      "env": {
        "MDB_MCP_CONNECTION_STRING": "mongodb://localhost:27017"
      }
    }
  }
}
```

### Method 2: Programmatic Setup

In `src/mcp_client/McpClient.ts`:

```typescript
async initializeServers(): Promise<void> {
  // Add filesystem server
  await this.addServer({
    name: 'filesystem',
    command: 'npx',
    args: ['@modelcontextprotocol/server-filesystem', '/workspace', '/skills']
  });

  // Add MongoDB server
  await this.addServer({
    name: 'mongodb',
    command: 'npx',
    args: ['-y', 'mongodb-mcp-server', '--readOnly'],
    env: {
      MDB_MCP_CONNECTION_STRING: process.env.MONGODB_URI
    }
  });

  // Add Git server
  await this.addServer({
    name: 'git',
    command: 'npx',
    args: ['mcp-server-git']
  });
}
```

## 🎯 Dynamic Discovery Pattern

Once servers are running, agents can discover and use them dynamically:

```javascript
// 1. Discover all available tools
const tools = await list_mcp_tools();
console.log("Available tools:", tools);

// 2. Get details about a specific tool
const toolInfo = await get_mcp_tool_details("filesystem__read_file");
console.log("Tool description:", toolInfo.description);
console.log("Input schema:", toolInfo.inputSchema);

// 3. Execute the tool
const fileContent = await callMCPTool("filesystem__read_file", {
  path: "/workspace/data.txt"
});

// 4. Use results in your workflow
console.log("File content:", fileContent);

// 5. Save successful patterns to skills
await fs.writeFile('/skills/file_reader.js', `
  module.exports = async function readWorkspaceFile(filename) {
    return await callMCPTool("filesystem__read_file", {
      path: \`/workspace/\${filename}\`
    });
  };
`);
```

## 📊 Server Capabilities Reference

### Data Storage
- **MongoDB** (`community/mongodb`) - NoSQL document database
- **PostgreSQL** (`community/postgresql-community`) - Relational SQL database
- **Redis** (`archived/redis`) - Key-value store and cache
- **SQLite** (`archived/sqlite`) - Lightweight embedded database
- **GreptimeDB** (`community/greptimedb`) - Time-series database

### File & Content
- **Filesystem** (`official/filesystem`) - File operations
- **Git** (`official/git`) - Version control
- **Fetch** (`official/fetch`) - HTTP requests and web content
- **Unstructured** (`community/unstructured`) - Document processing

### Utilities
- **Memory** (`official/memory`) - Knowledge graphs and persistent memory
- **Time** (`official/time`) - Date and time operations
- **Sequential Thinking** (`official/sequential-thinking`) - Extended reasoning

### Development & Testing
- **Everything** (`official/everything`) - Full protocol demonstration
- **MCP Installer** (`community/mcp-installer`) - Server management

### Security & Monitoring
- **Semgrep** (`community/semgrep`) - Code security scanning (deprecated)
- **Sentry** (`archived/sentry`) - Error tracking
- **Puppeteer** (`archived/puppeteer`) - Browser automation

## 🔍 Finding the Right Server

### By Use Case

**I need to...**

- **Store and query data** → MongoDB, PostgreSQL, SQLite, Redis
- **Work with files** → Filesystem
- **Make HTTP requests** → Fetch
- **Track version control** → Git
- **Remember information** → Memory
- **Process documents** → Unstructured
- **Work with time-series data** → GreptimeDB
- **Scan code for security** → Semgrep (use main binary)
- **Automate browsers** → Puppeteer (archived)

### By Language

**TypeScript/Node.js servers:**
- All official servers
- MongoDB
- PostgreSQL Community
- MCP Installer

**Python servers:**
- GreptimeDB
- Unstructured
- Semgrep (deprecated)

## 🛠️ Troubleshooting

### Server Won't Start

1. Check dependencies are installed: `npm install` or `pip install`
2. Verify environment variables are set
3. Check server logs for error messages
4. Ensure required services (databases, etc.) are running

### Tool Not Discovered

1. Verify server is running: check process list
2. Check MCP client configuration
3. Ensure server is properly registered with the client
4. Review server logs for initialization errors

### Permission Errors

1. Check file/directory permissions
2. Verify user has necessary access rights
3. Review server access control configuration
4. Check environment variables and credentials

### Connection Issues

1. Verify network connectivity
2. Check firewall settings
3. Ensure correct host and port
4. Validate authentication credentials

## 📚 Next Steps

1. **Explore Server READMEs** - Each server has detailed documentation
2. **Check Examples** - Look for example configurations and usage patterns
3. **Review catalog.json** - Browse the complete server catalog
4. **Test Integration** - Try servers with the Code Execution harness
5. **Build Skills** - Create reusable workflows using discovered tools

## 🔗 Resources

- [Main README](./README.md) - Complete server collection documentation
- [Catalog](./catalog.json) - Structured server index
- [MCP Documentation](https://modelcontextprotocol.io) - Protocol specification
- [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) - Architecture pattern

---

**Quick Tip:** Start with official servers (`official/`) for stable, well-documented functionality, then explore community servers for specialized capabilities.
