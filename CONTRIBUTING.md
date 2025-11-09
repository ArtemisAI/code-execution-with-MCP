# Contributing

## 🎯 How to Contribute

### Code
- **LLM Integrations**: OpenAI, Claude, Gemini, local models in `src/agent_orchestrator/`
- **MCP Connectors**: Database, API, cloud adapters in `src/mcp_client/`
- **Security/Performance**: Sandbox hardening, optimization, tests
- **Bugs/Features**: Open issues, submit PRs

### Skills
Create reusable agent capabilities using the [Skills for GitHub Copilot](https://github.com/ArtemisAI/skills-for-copilot) pattern:

1. Copy `skills/examples/template-skill/`
2. Implement your skill (TypeScript/JavaScript)
3. Submit PR to this repo or directly to [skills-for-copilot](https://github.com/ArtemisAI/skills-for-copilot)
4. Your skill becomes available to all users

See [skills-for-copilot](https://github.com/ArtemisAI/skills-for-copilot) for full skill submission guidelines and community library.

### Documentation
- Tutorials, deployment guides, fixes, examples
- Update docs/ or add to README

### Testing & QA
- Unit/integration tests, benchmarks, bug reports

## 🚀 Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/code-execution-with-MCP.git
cd code-execution-with-MCP
npm install && npm run build

# Create branch
git checkout -b feature/your-feature

# Make changes, commit, push
git push origin feature/your-feature

# Create PR
```

## 📋 Guidelines

- TypeScript strict mode, clear code, error handling
- Never log PII/API keys
- Add tests for new features
- Reference issues in commits
- Follow existing patterns

## 🏆 Recognition

Contributors mentioned in README, releases, and community highlights.

## ❓ Need Help?

- GitHub Discussions for questions
- GitHub Issues for bugs
- security@example.com for security issues
- See README for more info

**Let's build this together! 🚀**
