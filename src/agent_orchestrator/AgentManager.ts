/**
 * AgentManager - The main "brain" that runs the agent loop
 * Orchestrates the LLM, sandbox execution, and MCP tool calls
 */

import { SandboxManager, DockerSandbox } from '../sandbox_manager/SandboxManager';
import { McpClient } from '../mcp_client/McpClient';
import { DynamicToolManager } from '../tools_interface/DynamicToolManager';
import { getSystemPrompt } from './prompt_templates';
import { PiiCensor } from '../mcp_client/PiiCensor';

/**
 * LLM Interface - Replace with your actual LLM provider
 * Examples: OpenAI, Anthropic Claude, Google Gemini, Azure OpenAI, etc.
 */
interface LLMResponse {
  type: 'code_execution' | 'text' | 'tool_call';
  code?: string;
  text?: string;
  toolName?: string;
  toolInput?: any;
}

/**
 * Call your LLM of choice
 * This is a placeholder - integrate with your preferred LLM API
 */
async function callLLM(prompt: string, tools: any[]): Promise<LLMResponse> {
  // TODO: Replace with actual LLM API call
  // Example integrations:
  // - OpenAI: const response = await openai.chat.completions.create({...})
  // - Anthropic: const response = await anthropic.messages.create({...})
  // - Google: const response = await model.generateContent({...})
  
  console.log("[LLM] Prompt length:", prompt.length);
  console.log("[LLM] Available tools:", tools.length);
  
  // Placeholder response - replace with actual LLM integration
  throw new Error("LLM integration not implemented. Please implement callLLM() with your LLM provider.");
}

export class AgentManager {
  public mcpClient: McpClient;
  private sandboxManager: SandboxManager;
  private toolManager: DynamicToolManager;
  private piiCensor: PiiCensor;

  constructor() {
    console.log('[AgentManager] Initializing...');
    this.piiCensor = new PiiCensor();
    this.mcpClient = new McpClient(this.piiCensor);
    this.sandboxManager = new DockerSandbox();
    this.toolManager = new DynamicToolManager(this.mcpClient);
    console.log('[AgentManager] Initialized successfully');
  }

  /**
   * Main agent loop - executes a user task
   * This can be extended to support multi-turn conversations
   */
  async runTask(userId: string, task: string) {
    console.log(`[AgentManager] Starting task for user ${userId}`);
    
    try {
      // 1. Get the dynamic tools the agent can use for discovery
      const discoveryTools = this.toolManager.getToolDefinitions();
      console.log(`[AgentManager] Loaded ${discoveryTools.length} discovery tools`);
      
      // 2. Format the system prompt with instructions
      const systemPrompt = getSystemPrompt();
      const userPrompt = `User ID: ${userId}\nTask: ${task}`;
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      // 3. Call the LLM with the prompt and available tools
      console.log('[AgentManager] Calling LLM...');
      const response = await callLLM(fullPrompt, discoveryTools);

      // 4. Process the LLM response based on type
      return await this.processLLMResponse(response, userId);
      
    } catch (error) {
      console.error('[AgentManager] Error in runTask:', error);
      throw error;
    }
  }

  /**
   * Process different types of LLM responses
   */
  private async processLLMResponse(response: LLMResponse, userId: string): Promise<any> {
    switch (response.type) {
      case 'code_execution':
        return await this.executeCode(response.code!, userId);
      
      case 'tool_call':
        return await this.executeToolCall(response.toolName!, response.toolInput!, userId);
      
      case 'text':
        return { message: response.text };
      
      default:
        throw new Error(`Unknown response type: ${(response as any).type}`);
    }
  }

  /**
   * Execute code in the secure sandbox
   */
  private async executeCode(code: string, userId: string): Promise<any> {
    console.log('[AgentManager] LLM returned code for execution');
    
    // Generate a session-specific auth token for the sandbox
    const sandboxAuthToken = `session_${userId}_${Date.now()}`;
    console.log(`[AgentManager] Generated sandbox auth token: ${sandboxAuthToken}`);

    // Execute the code securely in Docker sandbox
    console.log('[AgentManager] Executing code in sandbox...');
    const result = await this.sandboxManager.executeCode(
      code, 
      sandboxAuthToken,
      userId // Used for mounting persistent /skills
    );

    // Tokenize any PII in the logs before returning
    const tokenizedLogs = this.piiCensor.tokenize(userId, result.logs.join('\n'));

    console.log('[AgentManager] Code execution complete');
    return {
      message: "Code executed successfully.",
      logs: tokenizedLogs,
      output: result.output,
      error: result.error
    };
  }

  /**
   * Execute a direct tool call (alternative to code execution)
   */
  private async executeToolCall(toolName: string, toolInput: any, userId: string): Promise<any> {
    console.log(`[AgentManager] Executing tool call: ${toolName}`);
    
    const result = await this.mcpClient.callTool(toolName, toolInput);
    const tokenizedResult = this.piiCensor.tokenize(userId, result);
    
    return {
      message: "Tool executed successfully.",
      result: tokenizedResult
    };
  }
}
