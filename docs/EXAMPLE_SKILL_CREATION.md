## Example: Creating a Data Processing Skill

This example shows how the agent can create reusable skills and save them for future use.

### User Request
```json
{
  "userId": "analyst123",
  "task": "Create a reusable data transformation skill that can normalize JSON arrays"
}
```

### Agent-Generated Code
```javascript
console.log("Creating data normalization skill...");

// Define the skill function
const skillCode = `
/**
 * Data Normalization Skill
 * Normalizes arrays of objects by applying transformations
 */

module.exports = async function normalizeData(data, config = {}) {
  const {
    lowercase = [],
    uppercase = [],
    trim = [],
    removeNulls = true
  } = config;

  return data.map(item => {
    const normalized = { ...item };
    
    // Apply lowercase transformations
    lowercase.forEach(field => {
      if (normalized[field] && typeof normalized[field] === 'string') {
        normalized[field] = normalized[field].toLowerCase();
      }
    });
    
    // Apply uppercase transformations
    uppercase.forEach(field => {
      if (normalized[field] && typeof normalized[field] === 'string') {
        normalized[field] = normalized[field].toUpperCase();
      }
    });
    
    // Apply trim transformations
    trim.forEach(field => {
      if (normalized[field] && typeof normalized[field] === 'string') {
        normalized[field] = normalized[field].trim();
      }
    });
    
    // Remove null values
    if (removeNulls) {
      Object.keys(normalized).forEach(key => {
        if (normalized[key] === null || normalized[key] === undefined) {
          delete normalized[key];
        }
      });
    }
    
    return normalized;
  });
};
`;

// Save the skill
await fs.writeFile('/skills/normalizeData.js', skillCode);
console.log("Skill saved to /skills/normalizeData.js");

// Test the skill
const testData = [
  { name: "  John Doe  ", email: "JOHN@EXAMPLE.COM", age: null },
  { name: "Jane Smith", email: "jane@example.com", age: 30 }
];

// Load and execute the skill
const normalize = require('/skills/normalizeData.js');
const result = await normalize(testData, {
  lowercase: ['email'],
  trim: ['name'],
  removeNulls: true
});

console.log("Test result:", JSON.stringify(result, null, 2));

return {
  success: true,
  skillPath: '/skills/normalizeData.js',
  testResult: result
};
```

### Expected Output
```json
{
  "success": true,
  "skillPath": "/skills/normalizeData.js",
  "testResult": [
    {
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "age": 30
    }
  ]
}
```

### Reusing the Skill in Future Tasks

Once saved, the skill can be loaded and reused:

```javascript
// In a future task
const normalize = require('/skills/normalizeData.js');
const cleanedData = await normalize(rawData, { lowercase: ['email'] });
```

## Benefits of This Pattern

1. **Token Efficiency** - Complex transformations done in code, not in LLM context
2. **Reusability** - Skills persist across sessions
3. **Performance** - Code execution is faster than repeated LLM calls
4. **Reliability** - Deterministic data processing
5. **Composability** - Skills can be combined and extended
