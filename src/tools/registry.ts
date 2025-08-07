import { Tool, ToolDef, ToolCall, ToolResult } from '../types';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private categories: Map<string, string[]> = new Map();

  registerTool(tool: Tool): void {
    const definition = tool.getDefinition();
    this.tools.set(definition.name, tool);
    
    // Add to category
    const category = definition.category || 'general';
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(definition.name);
  }

  unregisterTool(toolName: string): void {
    this.tools.delete(toolName);
    
    // Remove from all categories
    for (const [_category, tools] of this.categories.entries()) {
      const index = tools.indexOf(toolName);
      if (index > -1) {
        tools.splice(index, 1);
      }
    }
  }

  getTool(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  getToolDefinitions(): ToolDef[] {
    return Array.from(this.tools.values()).map(tool => tool.getDefinition());
  }

  getToolsByCategory(category: string): Tool[] {
    const toolNames = this.categories.get(category) || [];
    return toolNames.map(name => this.tools.get(name)!).filter(Boolean);
  }

  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  async executeTool(call: ToolCall): Promise<ToolResult> {
    const tool = this.getTool(call.name);
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${call.name}`,
        metadata: { executionTime: 0 }
      };
    }

    try {
      return await tool.execute(call);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: 0 }
      };
    }
  }

  validateToolCall(call: ToolCall): { valid: boolean; errors: string[] } {
    const tool = this.getTool(call.name);
    if (!tool) {
      return { valid: false, errors: [`Tool not found: ${call.name}`] };
    }

    // const _definition = tool.getDefinition(); // Unused for now
    const errors: string[] = [];

    // Basic validation - could be extended with JSON Schema validation
    if (!call.arguments || typeof call.arguments !== 'object') {
      errors.push('Tool arguments must be an object');
    }

    return { valid: errors.length === 0, errors };
  }

  getAvailableToolsForPlan(): string[] {
    return Array.from(this.tools.keys());
  }
} 