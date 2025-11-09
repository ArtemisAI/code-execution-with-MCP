---
name: template-skill
description: A basic template to use as a starting point for creating new skills
version: 1.0.0
author: Your Name
tags:
  - template
  - example
---

# Template Skill

This is a template skill following the Anthropic skills pattern. Use this as a starting point when creating new skills for your AI agent.

## What This Skill Does

[Describe what this skill does and when it should be used]

## When to Use This Skill

Use this skill when you need to:
- [Specific use case 1]
- [Specific use case 2]
- [Specific use case 3]

## How to Use This Skill

### Basic Usage

```javascript
// Example code showing how to use this skill
const result = await skillFunction(input);
console.log(result);
```

### Parameters

- `input` (type): Description of the input parameter
- `options` (type, optional): Description of optional parameters

### Return Value

Returns: Description of what the function returns

## Implementation

```javascript
/**
 * Skill implementation
 * @param {Object} input - Input data
 * @param {Object} options - Optional configuration
 * @returns {Object} Result of the operation
 */
async function skillFunction(input, options = {}) {
  // Input validation
  if (!input) {
    throw new Error('Input is required');
  }
  
  // Main logic
  const result = {
    // Your implementation here
  };
  
  // Return result
  return result;
}

// Export for reuse
module.exports = skillFunction;
```

## Examples

### Example 1: Basic Usage

```javascript
const skill = require('./template-skill.js');
const result = await skill({ data: 'example' });
console.log(result);
// Output: { ... }
```

### Example 2: Advanced Usage

```javascript
const skill = require('./template-skill.js');
const result = await skill(
  { data: 'complex example' },
  { option1: true, option2: 'value' }
);
console.log(result);
// Output: { ... }
```

## Tips and Best Practices

1. **Keep It Focused**: Each skill should do one thing well
2. **Document Clearly**: Include examples and edge cases
3. **Handle Errors**: Use try-catch and provide helpful error messages
4. **Make It Reusable**: Design for multiple use cases
5. **Test Thoroughly**: Include examples that demonstrate correctness

## Related Skills

- [Other related skills that work well with this one]

## Version History

- v1.0.0 (YYYY-MM-DD): Initial version

---

**Note**: This skill is based on the Anthropic skills pattern. See [Anthropic Skills Repository](https://github.com/anthropics/skills) for more examples.
