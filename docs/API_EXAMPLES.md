## API Examples

Collection of example API requests and responses for the MCP Code Execution Harness.

## Submit a Task

### Request

```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "task": "List all available tools and create a summary"
  }'
```

```json
{
  "userId": "user123",
  "task": "List all available tools and create a summary"
}
```

### Response (Success)

```json
{
  "message": "Code executed successfully.",
  "logs": [
    "Starting task...",
    "Discovering tools...",
    "Found 5 tools",
    "Task complete"
  ],
  "output": {
    "totalTools": 5,
    "tools": ["data__fetch", "data__transform", "file__read", "file__write", "api__call"]
  }
}
```

### Response (Error)

```json
{
  "message": "Code executed successfully.",
  "logs": [
    "Starting task...",
    "Error: Tool not found"
  ],
  "error": "Execution timeout"
}
```

## Complex Workflow Example

### Request

```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "userId": "data-analyst",
  "task": "Fetch sales data from the last 30 days, calculate total revenue by product category, and save a summary to the skills directory for future reference"
}
EOF
```

### Expected Behavior

The agent will:
1. Discover available tools using `list_mcp_tools()`
2. Get details about data tools with `get_mcp_tool_details()`
3. Fetch sales data using appropriate MCP tool
4. Process data using code (JavaScript/TypeScript)
5. Save reusable summary function to `/skills/`
6. Return results

## Create a Skill

### Request

```json
{
  "userId": "developer",
  "task": "Create a reusable email validation skill that checks if an email is valid and saves it to /skills/validateEmail.js"
}
```

### Agent-Generated Code

```javascript
// This is what the agent might generate

const skillCode = `
module.exports = function validateEmail(email) {
  const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return regex.test(email);
};
`;

await fs.writeFile('/skills/validateEmail.js', skillCode);

// Test the skill
const validate = require('/skills/validateEmail.js');
const testCases = [
  'test@example.com',
  'invalid.email',
  'another@test.org'
];

const results = testCases.map(email => ({
  email,
  valid: validate(email)
}));

return {
  skillSaved: true,
  path: '/skills/validateEmail.js',
  testResults: results
};
```

## Health Check

### Request

```bash
curl http://localhost:3000/health
```

### Response

```json
{
  "status": "ok",
  "timestamp": "2024-11-09T10:30:00.000Z"
}
```

## Error Examples

### Invalid Request (Missing userId)

```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{"task": "Do something"}'
```

Response:
```json
{
  "error": "userId and task are required"
}
```

### Sandbox Timeout

Request with long-running code:
```json
{
  "userId": "user123",
  "task": "Run an infinite loop"
}
```

Response:
```json
{
  "message": "Code executed successfully.",
  "logs": ["Starting infinite loop..."],
  "error": "Execution timeout",
  "output": null
}
```

## Advanced: Multi-Turn Conversation

While the current implementation is single-turn, you can extend it for multi-turn:

### Turn 1

```json
{
  "userId": "user456",
  "task": "What tools are available for working with databases?"
}
```

Response:
```json
{
  "message": "Text response.",
  "text": "I found the following database tools: database__query, database__insert, database__update"
}
```

### Turn 2

```json
{
  "userId": "user456",
  "task": "Use database__query to get all users created in the last week",
  "context": {
    "previousTools": ["database__query", "database__insert", "database__update"]
  }
}
```

## Testing Internal MCP Call (Development Only)

⚠️ This endpoint should be firewalled in production!

```bash
curl -X POST http://localhost:3000/internal/mcp-call \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "session_user123_1699524000000",
    "toolName": "data__fetch",
    "input": {
      "source": "test",
      "limit": 10
    }
  }'
```

## Python-Style Client

Example client library usage:

```python
import requests

class MCPHarnessClient:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
    
    def execute_task(self, user_id, task):
        response = requests.post(
            f"{self.base_url}/task",
            json={"userId": user_id, "task": task}
        )
        return response.json()
    
    def health_check(self):
        response = requests.get(f"{self.base_url}/health")
        return response.json()

# Usage
client = MCPHarnessClient()
result = client.execute_task("user123", "Analyze the data")
print(result)
```

## JavaScript/TypeScript Client

```typescript
class MCPHarnessClient {
  constructor(private baseUrl: string = 'http://localhost:3000') {}

  async executeTask(userId: string, task: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, task })
    });
    return response.json();
  }

  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

// Usage
const client = new MCPHarnessClient();
const result = await client.executeTask('user123', 'Process the data');
console.log(result);
```
