# Skills Examples

This directory contains example skills following the Anthropic skills pattern. Each skill demonstrates best practices for creating reusable agent capabilities.

## What Are Skills?

Skills are self-contained folders of instructions and code that agents can load dynamically to improve performance on specialized tasks. They teach the agent how to complete specific tasks in a repeatable way.

**Key Insight**: Skills enable **learning over time**. As your agent accumulates skills, it becomes more capable without consuming additional tokens for each task.

## Skills Pattern (from Anthropic)

Each skill follows a simple structure:

```
skill-name/
├── SKILL.md          # Instructions and metadata
└── skill-name.js     # (optional) Reusable code implementation
```

The `SKILL.md` file contains:
- **YAML frontmatter**: Metadata (name, description, tags, version)
- **Documentation**: What the skill does and when to use it
- **Examples**: Concrete usage patterns
- **Implementation**: Code or instructions

## Example Skills in This Directory

### 1. **template-skill/**
A basic template to use as a starting point for creating new skills.

- **Use as**: Copy this template when creating new skills
- **Demonstrates**: Basic skill structure and documentation pattern

### 2. **data-processor/**
Process and transform arrays of data with filtering, mapping, aggregation, and sorting.

- **Use for**: Working with large datasets token-efficiently
- **Demonstrates**: Token efficiency through code (1,000 records in ~500 tokens)
- **Pattern**: Save once, reuse across tasks

## Creating Your Own Skills

1. **Copy the template**:
   ```bash
   cp -r skills/examples/template-skill skills/my-skill
   ```

2. **Edit SKILL.md**:
   - Update the YAML frontmatter (name, description, tags)
   - Describe what the skill does
   - Provide clear examples
   - Document parameters and return values

3. **Add implementation** (optional):
   - Create a `.js` file with reusable code
   - Export a function or module
   - Include error handling

4. **Test your skill**:
   - Load in agent code: `const skill = require('/skills/my-skill/my-skill.js')`
   - Verify it works as documented
   - Iterate and improve

## Best Practices

Based on Anthropic's skills philosophy:

1. **Self-Contained**: Each skill should be complete in its directory
2. **Well-Documented**: Include clear instructions and examples
3. **Focused**: Do one thing well, not many things poorly
4. **Composable**: Skills can build on other skills
5. **Reusable**: Design for multiple use cases, not just one
6. **Example-Rich**: Show, don't just tell

## Token Efficiency

**Traditional Approach** (describing every step):
```
Agent: "I'll process each record:
- Record 1: apply transformation...
- Record 2: apply transformation...
[Repeat 1,000 times]"

Tokens: ~50,000
```

**Skills Approach** (write once, reuse forever):
```
Agent: "I'll use the data-processor skill"
Code: const process = require('/skills/data-processor.js');

Tokens: ~500 (first use) + ~100 (subsequent uses)
```

**Result**: 99% token reduction on repeated tasks.

## Skills Accumulate Over Time

```
Day 1: Create email-validator skill
Day 2: Create data-processor skill
Day 3: Create report-generator skill
Week 2: Have 20+ skills available
Month 1: 100+ domain-specific skills

Each new task is faster and cheaper.
```

## Integration with MCP Tools

Skills work best when combined with MCP tools:

```javascript
// Discover and use MCP tools
const data = await callMCPTool('database__query', { query: 'SELECT *...' });

// Process with your skill
const processData = require('/skills/data-processor.js');
const result = await processData(data, { filter: ..., sort: ... });

// Save with MCP tool
await callMCPTool('storage__save', { key: 'results', value: result });
```

## Learn More

- **[Anthropic Skills Repository](https://github.com/anthropics/skills)** - Open-source examples
- **[Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)** - Philosophy and architecture
- **[Agent Skills Blog](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)** - Real-world applications

## Contributing Skills

Want to share your skills?

1. Create a well-documented skill following the pattern
2. Test thoroughly with examples
3. Add to this directory with a pull request
4. Help others build better agents!

---

**Remember**: Skills are not just code - they're **persistent knowledge** that makes your agent smarter over time. Following the Anthropic skills pattern ensures they're discoverable, reusable, and compose well together.
