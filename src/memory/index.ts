import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { 
  MemoryStore, 
  ExecutionHistory, 
  Conversation, 
  AgentState, 
  AuthToken,
  VectorStore,
  UserPreferences 
} from '../types';

interface CopilotXDB extends DBSchema {
  taskLog: {
    key: string;
    value: ExecutionHistory;
  };
  chatLog: {
    key: string;
    value: Conversation;
  };
  agentState: {
    key: string;
    value: AgentState;
  };
  authTokens: {
    key: string;
    value: AuthToken;
  };
  preferences: {
    key: string;
    value: UserPreferences;
  };
  embeddings: {
    key: string;
    value: VectorStore;
  };
}

export class MemoryManager {
  private db: IDBPDatabase<CopilotXDB> | null = null;
  private readonly DB_NAME = 'CopilotXDB';
  private readonly DB_VERSION = 1;

  async initialize(): Promise<void> {
    try {
      this.db = await openDB<CopilotXDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Task execution history
          if (!db.objectStoreNames.contains('taskLog')) {
            db.createObjectStore('taskLog', { keyPath: 'id' });
          }

          // Chat conversations
          if (!db.objectStoreNames.contains('chatLog')) {
            db.createObjectStore('chatLog', { keyPath: 'id' });
          }

          // Agent state and active plans
          if (!db.objectStoreNames.contains('agentState')) {
            db.createObjectStore('agentState', { keyPath: 'id' });
          }

          // Authentication tokens
          if (!db.objectStoreNames.contains('authTokens')) {
            db.createObjectStore('authTokens', { keyPath: 'providerId' });
          }

          // User preferences
          if (!db.objectStoreNames.contains('preferences')) {
            db.createObjectStore('preferences', { keyPath: 'id' });
          }

          // Vector embeddings (optional)
          if (!db.objectStoreNames.contains('embeddings')) {
            db.createObjectStore('embeddings', { keyPath: 'id' });
          }
        },
      });
      console.log('Memory manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize memory manager:', error);
      throw error;
    }
  }

  // Task Log Management
  async addExecutionHistory(history: ExecutionHistory): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.add('taskLog', history);
  }

  async getExecutionHistory(planId?: string): Promise<ExecutionHistory[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    if (planId) {
      const allHistory = await this.db.getAll('taskLog');
      return allHistory.filter(h => h.planId === planId);
    }
    
    return await this.db.getAll('taskLog');
  }

  async getExecutionHistoryByStep(stepId: string): Promise<ExecutionHistory[]> {
    if (!this.db) throw new Error('Database not initialized');
    const allHistory = await this.db.getAll('taskLog');
    return allHistory.filter(h => h.stepId === stepId);
  }

  // Chat Log Management
  async addConversation(conversation: Conversation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('chatLog', conversation);
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('chatLog', id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('chatLog');
  }

  async updateConversation(id: string, conversation: Partial<Conversation>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const existing = await this.db.get('chatLog', id);
    if (existing) {
      await this.db.put('chatLog', { ...existing, ...conversation });
    }
  }

  // Agent State Management
  async saveAgentState(state: AgentState): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('agentState', { id: 'current', ...state } as any);
  }

  async getAgentState(): Promise<AgentState | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('agentState', 'current');
  }

  async updateAgentState(updates: Partial<AgentState>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const existing = await this.db.get('agentState', 'current');
    if (existing) {
      await this.db.put('agentState', { ...existing, ...updates });
    } else {
      await this.db.put('agentState', { id: 'current', ...updates } as any);
    }
  }

  // Authentication Token Management
  async saveAuthToken(token: AuthToken): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('authTokens', token);
  }

  async getAuthToken(providerId: string): Promise<AuthToken | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('authTokens', providerId);
  }

  async getAllAuthTokens(): Promise<AuthToken[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('authTokens');
  }

  async removeAuthToken(providerId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('authTokens', providerId);
  }

  // User Preferences Management
  async savePreferences(preferences: UserPreferences): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('preferences', { id: 'user', ...preferences } as any);
  }

  async getPreferences(): Promise<UserPreferences | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('preferences', 'user');
  }

  // Vector Store Management (Optional)
  async saveEmbeddings(embeddings: VectorStore): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('embeddings', embeddings);
  }

  async getEmbeddings(id: string): Promise<VectorStore | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('embeddings', id);
  }

  // Utility Methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.clear('taskLog');
    await this.db.clear('chatLog');
    await this.db.clear('agentState');
    await this.db.clear('authTokens');
    await this.db.clear('preferences');
    await this.db.clear('embeddings');
  }

  async exportData(): Promise<MemoryStore> {
    const taskLog = await this.getExecutionHistory();
    const chatLog = await this.getAllConversations();
    const agentState = await this.getAgentState();
    const authTokens = await this.getAllAuthTokens();
    // const _preferences = await this.getPreferences(); // Unused for now

    return {
      taskLog,
      chatLog,
      agentState: agentState || { memory: {}, preferences: {} },
      authTokens,
      embeddingStore: undefined // Optional for MVP
    };
  }

  async importData(data: Partial<MemoryStore>): Promise<void> {
    if (data.taskLog) {
      for (const history of data.taskLog) {
        await this.addExecutionHistory(history);
      }
    }

    if (data.chatLog) {
      for (const conversation of data.chatLog) {
        await this.addConversation(conversation);
      }
    }

    if (data.agentState) {
      await this.saveAgentState(data.agentState);
    }

    if (data.authTokens) {
      for (const token of data.authTokens) {
        await this.saveAuthToken(token);
      }
    }
  }
} 