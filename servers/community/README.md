# Community MCP Servers

This directory contains MCP servers contributed and maintained by the community. These servers extend the MCP ecosystem with specialized capabilities for various databases, tools, and services.

## Available Servers

### 1. MongoDB Server (`mongodb/`)
**Maintainer:** MongoDB, Inc.  
**Source:** https://github.com/mongodb-js/mongodb-mcp-server  
**Status:** ✅ Active

MCP server for MongoDB and MongoDB Atlas integration.

**Features:**
- MongoDB database operations (CRUD)
- MongoDB Atlas API integration
- Collection management
- Query execution
- Aggregation pipelines
- Read-only mode support

**Installation:**
```bash
npm install -g mongodb-mcp-server
# or
npx -y mongodb-mcp-server --readOnly
```

**Configuration:**
- Set `MDB_MCP_CONNECTION_STRING` environment variable
- Supports both MongoDB and MongoDB Atlas
- Optional Atlas API credentials for cluster management

### 2. GreptimeDB Server (`greptimedb/`)
**Maintainer:** Greptime Team  
**Source:** https://github.com/GreptimeTeam/greptimedb-mcp-server  
**Status:** ✅ Active (Experimental)

MCP server for GreptimeDB time-series database.

**Features:**
- Time-series data queries
- SQL execution
- Table exploration (list and read)
- Secure database access
- Resource and tool listing
- Prompt support

**Installation:**
```bash
pip install greptimedb-mcp-server
```

**Configuration:**
```bash
GREPTIMEDB_HOST=localhost
GREPTIMEDB_PORT=4002
GREPTIMEDB_USER=root
GREPTIMEDB_PASSWORD=
GREPTIMEDB_DATABASE=public
GREPTIMEDB_TIMEZONE=UTC
```

### 3. Unstructured Server (`unstructured/`)
**Maintainer:** Unstructured.io  
**Source:** https://github.com/Unstructured-IO/UNS-MCP  
**Status:** ✅ Active

Document processing and unstructured data extraction.

**Features:**
- Document parsing (PDF, DOCX, HTML, etc.)
- Text extraction
- Structured data conversion
- Multiple format support
- Element classification
- Table extraction

**Use Cases:**
- Document analysis
- Data extraction from unstructured sources
- Content processing pipelines

### 4. Semgrep Server (`semgrep/`)
**Maintainer:** Semgrep Inc.  
**Source:** https://github.com/semgrep/mcp  
**Status:** ⚠️ Deprecated (Moved to main Semgrep repo)

Code security scanning and vulnerability detection.

**Features:**
- Security vulnerability scanning
- Code pattern matching
- Multiple language support
- Integration with Semgrep rules
- SAST (Static Application Security Testing)

**Note:** This standalone repository has been deprecated. The Semgrep MCP server is now maintained as part of the main Semgrep binary. Future updates will be made via the official `semgrep` repository.

**New Installation:**
```bash
# Install Semgrep binary which includes MCP server
pip install semgrep
semgrep --mcp
```

### 5. MCP Installer (`mcp-installer/`)
**Maintainer:** Anais Betts (@anaisbetts)  
**Source:** https://github.com/anaisbetts/mcp-installer  
**Status:** ✅ Active

Tool for installing and managing MCP servers.

**Features:**
- Automated MCP server installation
- Configuration management
- Version management
- Dependency handling
- Multi-server support

**Use Cases:**
- Simplified MCP server deployment
- Managing multiple server installations
- Automated server updates

### 6. PostgreSQL Community Fork (`postgresql-community/`)
**Maintainer:** Marco Palladino (@subnetmarco)  
**Source:** https://github.com/subnetmarco/pgmcp  
**Status:** ✅ Active

Community-maintained PostgreSQL MCP server with active development.

**Features:**
- PostgreSQL database operations
- SQL query execution
- Schema exploration
- Active maintenance and updates
- Enhanced features beyond archived version

**Why Use This?**
The official PostgreSQL server is archived. This community fork provides:
- Active maintenance
- Bug fixes
- New features
- Community support

## Adding Community Servers

To add your MCP server to this collection:

1. **Create a Directory**: Add your server in this directory with a descriptive name
2. **Include Source**: Either copy the full source or add as a git submodule
3. **Add Documentation**: Create or copy the server's README
4. **Update Parent README**: Add an entry to `../README.md` and this file
5. **Test Integration**: Verify the server works with the Code Execution harness
6. **Submit PR**: Submit a pull request with your addition

### Requirements for Community Servers

- Must implement the MCP protocol specification
- Should include comprehensive documentation
- Must specify license (preferably open source)
- Should provide installation instructions
- Must declare maintainer and support information
- Should include usage examples

## Maintenance Status Legend

- ✅ **Active**: Regularly maintained and updated
- ⚠️ **Experimental**: Under development, use with caution
- ⚠️ **Deprecated**: No longer recommended, alternative available
- ❌ **Inactive**: No recent updates or maintenance

## Integration with MCP Harness

All community servers can be integrated with the Code Execution with MCP harness:

```typescript
// Example: Adding MongoDB server to harness
await mcpClient.addServer({
  name: 'mongodb',
  command: 'npx',
  args: ['-y', 'mongodb-mcp-server', '--readOnly'],
  env: {
    MDB_MCP_CONNECTION_STRING: process.env.MONGODB_URI
  }
});

// Example: Adding GreptimeDB server
await mcpClient.addServer({
  name: 'greptimedb',
  command: 'python',
  args: ['-m', 'greptimedb_mcp_server'],
  env: {
    GREPTIMEDB_HOST: 'localhost',
    GREPTIMEDB_PORT: '4002',
    GREPTIMEDB_USER: 'root',
    GREPTIMEDB_DATABASE: 'public'
  }
});
```

## Support and Issues

Each server is maintained independently. For issues or questions:

1. **Check Server README**: Most questions are answered in the server's documentation
2. **Visit Source Repository**: Each server has its own GitHub repository
3. **Open an Issue**: Report issues in the respective repository
4. **Community Discussion**: Use GitHub Discussions for general questions

## Contributing to Community Servers

To contribute to a specific server:

1. Visit the server's source repository
2. Follow their contribution guidelines
3. Submit pull requests to their repository
4. Help improve documentation and examples

## Security Considerations

When using community servers:

- **Review Code**: Understand what the server does before deploying
- **Check Credentials**: Use appropriate authentication and access control
- **Limit Permissions**: Grant minimal necessary permissions
- **Monitor Activity**: Track server usage and logs
- **Update Regularly**: Keep servers updated to latest versions
- **Report Issues**: Report security concerns to maintainers

## License Information

Each community server has its own license. Common licenses include:

- MIT License (most common)
- Apache 2.0
- BSD License

Refer to individual server directories for specific license information.

---

**Community-powered, enterprise-ready** - Extending the MCP ecosystem with specialized tools and services.
