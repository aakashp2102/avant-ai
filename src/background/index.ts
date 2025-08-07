// Background service worker for CopilotX
// This handles extension lifecycle and communication between components

import { MemoryManager } from '../memory';
import { Planner } from '../agents/planner';
import { Executor } from '../agents/executor';
import { OpenAIProvider } from '../providers/openai';
import { ToolRegistry } from '../tools/registry';
import { BrowserScrapeTool, BrowserClickTool, BrowserTypeTool, BrowserNavigateTool } from '../tools/browser';

class CopilotXBackground {
  private memoryManager: MemoryManager;
  private planner!: Planner;
  private executor!: Executor;
  private toolRegistry: ToolRegistry;
  private currentProvider: OpenAIProvider | null = null;

  constructor() {
    this.memoryManager = new MemoryManager();
    this.toolRegistry = new ToolRegistry();
    this.initializeComponents();
  }

  async initializeComponents(): Promise<void> {
    try {
      // Initialize memory
      await this.memoryManager.initialize();

      // Initialize default provider (OpenAI)
      this.currentProvider = new OpenAIProvider();
      this.planner = new Planner(this.currentProvider);
      this.executor = new Executor();

      // Load saved API key if available
      chrome.storage.local.get(['openai_api_key'], (result) => {
        if (result.openai_api_key && this.currentProvider) {
          this.currentProvider.setApiKey(result.openai_api_key);
          console.log('OpenAI API key loaded from storage');
        }
      });

      // Register browser tools
      this.toolRegistry.registerTool(new BrowserScrapeTool());
      this.toolRegistry.registerTool(new BrowserClickTool());
      this.toolRegistry.registerTool(new BrowserTypeTool());
      this.toolRegistry.registerTool(new BrowserNavigateTool());

      // Register tools with executor
      this.toolRegistry.getAllTools().forEach(tool => {
        this.executor.registerTool(tool);
      });

      console.log('CopilotX background service initialized');
    } catch (error) {
      console.error('Failed to initialize CopilotX:', error);
    }
  }

  async handleMessage(request: any, _sender: chrome.runtime.MessageSender): Promise<any> {
    try {
      switch (request.type) {
        case 'CREATE_PLAN':
          return await this.handleCreatePlan(request.goal, request.context);

        case 'EXECUTE_PLAN':
          return await this.handleExecutePlan(request.planId);

        case 'SET_PROVIDER_API_KEY':
          return await this.handleSetProviderApiKey(request.providerId, request.apiKey);

        case 'GET_AVAILABLE_TOOLS':
          return this.toolRegistry.getToolDefinitions();

        case 'EXECUTE_TOOL':
          return await this.toolRegistry.executeTool(request.toolCall);

        case 'GET_MEMORY':
          return await this.memoryManager.exportData();

        case 'SAVE_CONVERSATION':
          return await this.memoryManager.addConversation(request.conversation);

        default:
          throw new Error(`Unknown message type: ${request.type}`);
      }
    } catch (error) {
      console.error('Background message handling error:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async handleCreatePlan(goal: string, context?: string): Promise<any> {
    if (!this.currentProvider) {
      throw new Error('No LLM provider configured');
    }

    const plan = await this.planner.createPlan(goal, context);
    
    // Save plan to memory
    await this.memoryManager.updateAgentState({
      activePlan: plan
    });

    return { plan };
  }

  private async handleExecutePlan(planId: string): Promise<any> {
    const agentState = await this.memoryManager.getAgentState();
    const plan = agentState?.activePlan;

    if (!plan || plan.id !== planId) {
      throw new Error('Plan not found');
    }

    try {
      const updatedPlan = await this.executor.executePlan(plan);
      
      // Save execution results
      await this.memoryManager.updateAgentState({
        activePlan: updatedPlan
      });

      return { plan: updatedPlan };
    } catch (error) {
      // Handle plan failure
      const failedPlan = { ...plan, status: 'failed' as const };
      await this.memoryManager.updateAgentState({
        activePlan: failedPlan
      });
      throw error;
    }
  }

  private async handleSetProviderApiKey(providerId: string, apiKey: string): Promise<any> {
    if (providerId === 'openai' && this.currentProvider instanceof OpenAIProvider) {
      this.currentProvider.setApiKey(apiKey);
      
      // Save auth token
      await this.memoryManager.saveAuthToken({
        providerId,
        token: apiKey,
        expiresAt: undefined
      });

      return { success: true };
    }

    throw new Error(`Provider ${providerId} not supported`);
  }
}

// Initialize background service
const background = new CopilotXBackground();

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  background.handleMessage(request, sender)
    .then(sendResponse)
    .catch(error => sendResponse({ error: error.message }));
  
  return true; // Keep message channel open for async response
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('CopilotX extension installed');
    // Initialize default settings will be handled in initializeComponents
  }
});

// Handle tab updates for context awareness
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Could update context with tab information
    console.log('Tab updated:', tab.url);
  }
});

export default background; 