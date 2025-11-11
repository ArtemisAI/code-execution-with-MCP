# Archived MCP Servers

This directory contains MCP servers that have been archived by the Model Context Protocol team. While these are no longer actively maintained in the official repository, they remain useful for specific use cases and as reference implementations.

## ⚠️ Important Notes

- These servers are **archived** and may not receive regular updates
- For production use, consider using actively maintained alternatives when available
- Community forks may provide enhanced or actively maintained versions
- Use with caution and test thoroughly before deploying

## Available Servers

### 1. PostgreSQL Server (`postgresql/`)
**Purpose:** PostgreSQL database operations  
**Source:** https://github.com/modelcontextprotocol/servers-archived/tree/main/src/postgres

SQL queries, table management, and data operations for PostgreSQL databases.

**Alternative:** See `community/postgresql-community/` for an actively maintained community fork.

### 2. Redis Server (`redis/`)
**Purpose:** Redis key-value store operations  
**Source:** https://github.com/modelcontextprotocol/servers-archived/tree/main/src/redis

Key-value operations, caching, and data structure management for Redis.

### 3. SQLite Server (`sqlite/`)
**Purpose:** SQLite database operations  
**Source:** https://github.com/modelcontextprotocol/servers-archived/tree/main/src/sqlite

Lightweight SQL database operations, queries, and data management.

### 4. Puppeteer Server (`puppeteer/`)
**Purpose:** Browser automation and web scraping  
**Source:** https://github.com/modelcontextprotocol/servers-archived/tree/main/src/puppeteer

Headless browser automation for web scraping, testing, and interaction.

### 5. Sentry Server (`sentry/`)
**Purpose:** Error tracking and monitoring  
**Source:** https://github.com/modelcontextprotocol/servers-archived/tree/main/src/sentry

Integration with Sentry for error tracking, issue management, and monitoring.

## Why Archived?

Servers are typically archived for several reasons:
- Superseded by better alternatives
- Low usage or community interest
- Maintenance burden
- Integration complexity
- Better suited as community-maintained projects

## Using Archived Servers

While these servers are archived, they can still be used:

1. **Review the Code**: Understand what the server does and its limitations
2. **Test Thoroughly**: Ensure compatibility with your MCP client and use case
3. **Monitor for Issues**: Watch for bugs or security concerns
4. **Consider Alternatives**: Look for maintained alternatives when available

### Installation

```bash
cd <server-directory>
npm install
npx <server-command> [options]
```

Refer to individual server READMEs for specific installation instructions.

## Community Alternatives

For some archived servers, community-maintained alternatives are available in the `community/` directory:

| Archived Server | Community Alternative |
|----------------|----------------------|
| PostgreSQL | `community/postgresql-community/` |
| (others) | Check community directory for alternatives |

## Contributing

If you'd like to maintain or enhance an archived server:

1. **Fork the Server**: Create your own maintained version
2. **Add to Community**: Submit a PR to add it to `community/`
3. **Document Changes**: Clearly document improvements and maintenance status
4. **Share with Community**: Help others by sharing your enhanced version

## Source Repository

All archived servers originate from: https://github.com/modelcontextprotocol/servers-archived

For historical context and original documentation, refer to the archived repository.

---

**Note:** While archived, these servers represent valuable implementations and can serve as excellent references for building custom MCP servers.
