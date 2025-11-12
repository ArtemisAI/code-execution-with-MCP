# Agent Modes for Code Execution with MCP

This directory contains specialized agent modes that provide domain-specific expertise for working on different aspects of this project.

## Available Agent Modes

### 1. TypeScript Expert (`typescript-expert.md`)
**Expertise**: TypeScript development, Node.js patterns, async/await, type safety

**Use when**:
- Writing or refactoring TypeScript code
- Implementing new classes or interfaces
- Working with async/await patterns
- Ensuring type safety and strict mode compliance
- Following project naming conventions

**Key Topics**: Class-based architecture, interface-first design, error handling, file organization

---

### 2. Docker Security Expert (`docker-security-expert.md`)
**Expertise**: Container security, sandbox hardening, resource isolation, defense-in-depth

**Use when**:
- Configuring Docker sandbox security
- Implementing resource limits (CPU, memory, PIDs)
- Setting up network isolation
- Hardening container configurations
- Preventing container breakout
- Auditing security settings

**Key Topics**: Non-root execution, read-only filesystems, capability dropping, volume security, network isolation

---

### 3. MCP Integration Expert (`mcp-integration-expert.md`)
**Expertise**: Model Context Protocol, dynamic tool discovery, MCP server integration

**Use when**:
- Connecting new MCP servers
- Implementing dynamic tool discovery
- Working with stdio/SSE transports
- Building custom MCP servers
- Debugging MCP communication
- Understanding tool naming conventions

**Key Topics**: Dynamic discovery pattern, MCP SDK usage, PII flow in tool calls, transport options

---

### 4. LLM Integration Expert (`llm-integration-expert.md`)
**Expertise**: LLM provider integration, tool calling, prompt engineering, multi-turn conversations

**Use when**:
- Implementing OpenAI, Anthropic, Google, or other LLM providers
- Setting up tool/function calling
- Crafting system prompts for agents
- Handling streaming responses
- Managing conversation history
- Implementing rate limiting and retries

**Key Topics**: Provider-specific APIs, meta-tool approach, prompt templates, error recovery, cost tracking

---

### 5. PII Privacy Expert (`pii-privacy-expert.md`)
**Expertise**: PII detection, tokenization/de-tokenization, privacy regulations, secure storage

**Use when**:
- Implementing PII protection
- Adding new PII detection patterns
- Setting up encrypted storage (Redis)
- Ensuring GDPR/CCPA/HIPAA compliance
- Auditing PII handling
- Preventing PII leakage in logs

**Key Topics**: Bidirectional tokenization, PII patterns, secure storage, lifecycle management, compliance

---

### 6. Agent Skills Expert (`agent-skills-expert.md`)
**Expertise**: Building persistent agent capabilities, skills pattern, reusable code modules

**Use when**:
- Creating new agent skills
- Implementing skill discovery
- Building composable capabilities
- Designing self-documenting code
- Teaching agents to learn and improve
- Organizing skills by category

**Key Topics**: Skills template, skill composition, versioning, self-tests, discovery patterns

---

### 7. Testing Expert (`testing-expert.md`)
**Expertise**: Integration testing, security testing, Docker testing, performance testing

**Use when**:
- Writing tests for new features
- Testing sandbox isolation
- Verifying security measures
- Performance benchmarking
- Testing PII protection
- Integration testing with Docker

**Key Topics**: Jest/Mocha setup, Docker testing, security tests, mocking strategies, test utilities

---

## How to Use Agent Modes

### In GitHub Copilot Chat

Reference an agent mode in your Copilot Chat:
```
@workspace Use the docker-security-expert.md agent to help me harden the sandbox configuration
```

### In Claude Desktop or Cursor

1. Select the relevant agent mode file
2. Include it in your context
3. Ask questions specific to that domain

### General Workflow

1. **Identify your task domain** (e.g., TypeScript development, security, MCP integration)
2. **Select the appropriate agent mode** from the list above
3. **Reference the agent mode** in your conversation with AI coding assistants
4. **Follow the patterns and best practices** outlined in the agent mode
5. **Refer to key topics and examples** provided

## Agent Mode Philosophy

These agent modes are designed following best practices:

- **Specialized Expertise**: Each mode focuses on a specific domain
- **Project-Specific**: Tailored to this codebase's architecture and patterns
- **Actionable**: Provides concrete examples and code snippets
- **Contextual**: Explains the "why" behind decisions
- **Comprehensive**: Covers common tasks and edge cases

## Contributing New Agent Modes

When adding new agent modes:

1. **Follow the template structure**:
   - Introduction and expertise
   - Project context
   - Key patterns and examples
   - Common tasks
   - Best practices
   - Resources

2. **Be specific to this project**: Reference actual files and patterns from the codebase

3. **Provide concrete examples**: Show real code, not generic advice

4. **Link to resources**: Reference documentation and external guides

5. **Test your agent mode**: Verify examples work and guidance is accurate

## Additional Resources

- Main project documentation: `/docs/`
- Architecture overview: `/docs/ARCHITECTURE.md`
- Security guidelines: `/docs/SECURITY.md`
- Philosophy and design principles: `/docs/PHILOSOPHY.md`
- General Copilot instructions: `../.github/copilot-instructions.md`

---

**Remember**: These agent modes are tools to help you work more effectively with this codebase. Use them as guides, not rigid rules. Adapt the patterns to your specific needs while maintaining the project's core principles.
