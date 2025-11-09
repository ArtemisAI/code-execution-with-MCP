/**
 * Main server entry point
 * Handles user requests and routes internal calls from the sandbox
 */

import express from 'express';
import { AgentManager } from './agent_orchestrator/AgentManager';

const app = express();
app.use(express.json());

const agentManager = new AgentManager();

// Public endpoint for a user to submit a task
app.post('/task', async (req, res) => {
  try {
    const { userId, task } = req.body;
    
    if (!userId || !task) {
      return res.status(400).json({ error: 'userId and task are required' });
    }
    
    console.log(`[API] Received task from user ${userId}: ${task}`);
    const result = await agentManager.runTask(userId, task);
    return res.json(result);
  } catch (error) {
    console.error('[API] Error processing task:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// Internal endpoint for the sandbox to call MCP tools
// This MUST be firewalled from public access in production
app.post('/internal/mcp-call', async (req, res) => {
  try {
    // A real implementation MUST validate this auth token
    const { authToken, toolName, input } = req.body;
    
    if (!authToken || !toolName) {
      return res.status(400).json({ error: 'authToken and toolName are required' });
    }
    
    // TODO: Validate authToken here...
    console.log(`[Internal API] MCP tool call: ${toolName}`);
    
    const result = await agentManager.mcpClient.callTool(toolName, input);
    return res.json(result);
  } catch (error) {
    console.error('[Internal API] Error calling MCP tool:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  MCP Code Execution Harness - Agent Orchestrator          ║
║  Listening on port ${PORT}                                    ║
║                                                            ║
║  Endpoints:                                                ║
║    POST /task          - Submit task for agent execution   ║
║    POST /internal/mcp-call - Internal MCP tool calls       ║
║    GET  /health        - Health check                      ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
