// Core types for CopilotX based on TRD

export interface Capabilities {
  streaming: boolean;
  vision: boolean;
  functionCalling: boolean;
  maxTokens: number;
  model: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface GenerateArgs {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  onToken?: (token: string) => void;
}

export interface LLMProvider {
  id: string;
  authMode: 'api_key' | 'oauth' | 'relay_oauth' | 'local_webgpu' | 'local_ollama';
  getCapabilities(): Promise<Capabilities>;
  getAuthState(): Promise<{ status: 'connected' | 'disconnected'; expiresAt?: string }>;
  beginAuth?(options?: any): Promise<void>;
  chat(args: GenerateArgs): Promise<LLMResponse>;
}

// Plan and Execution Types
export type PlanStepType = 'tool' | 'wait' | 'ask' | 'compute';

export interface PlanStep {
  id: string;
  type: PlanStepType;
  tool?: string;
  input?: any;
  condition?: string;
  next?: string | string[];
  description?: string;
}

export interface AgentPlan {
  id: string;
  goal: string;
  steps: PlanStep[];
  createdAt: string;
  status: 'pending' | 'executing' | 'complete' | 'failed';
  currentStep?: number;
  results?: Record<string, any>;
}

// Tool System Types
export interface ToolDef {
  name: string;
  description: string;
  parametersJsonSchema: Record<string, any>;
  requiresAuth?: boolean;
  category?: string;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
  };
}

export interface Tool {
  execute(call: ToolCall): Promise<ToolResult>;
  getDefinition(): ToolDef;
}

// Memory System Types
export interface VectorStore {
  id: string;
  embeddings: number[][];
  metadata: Record<string, any>[];
}

export interface MemoryStore {
  taskLog: ExecutionHistory[];
  chatLog: Conversation[];
  agentState: AgentState;
  embeddingStore?: VectorStore;
  authTokens: AuthToken[];
}

export interface ExecutionHistory {
  id: string;
  planId: string;
  stepId: string;
  timestamp: string;
  result: ToolResult;
  metadata: Record<string, any>;
}

export interface Conversation {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  metadata: {
    tabId?: number;
    url?: string;
    title?: string;
  };
}

export interface AgentState {
  activePlan?: AgentPlan;
  memory: Record<string, any>;
  preferences: UserPreferences;
}

export interface AuthToken {
  providerId: string;
  token: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string[];
}

export interface UserPreferences {
  defaultProvider?: string;
  autoSync?: boolean;
  analytics?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

// UI Types
export interface TabMetadata {
  id: number;
  url: string;
  title: string;
  favicon?: string;
  summary?: string;
}

export interface AssistantMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  metadata?: {
    planId?: string;
    stepId?: string;
    toolResult?: ToolResult;
  };
}

// Security and Privacy Types
export interface SecurityConfig {
  encryptApiKeys: boolean;
  enableCloudSync: boolean;
  allowAnalytics: boolean;
  requireAuthForWrites: boolean;
}

export interface RelayConfig {
  operator: string;
  retentionPolicy: string;
  privacyPolicy: string;
  termsOfService: string;
} 