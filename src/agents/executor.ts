import { AgentPlan, PlanStep, ToolCall, ToolResult, Tool } from '../types';

export class Executor {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    // Register default tools
    this.registerTools();
  }

  registerTool(tool: Tool): void {
    const definition = tool.getDefinition();
    this.tools.set(definition.name, tool);
  }

  async executePlan(plan: AgentPlan): Promise<AgentPlan> {
    const updatedPlan = { ...plan, status: 'executing' as const };
    const results: Record<string, any> = {};

    try {
      for (let i = 0; i < updatedPlan.steps.length; i++) {
        const step = updatedPlan.steps[i];
        updatedPlan.currentStep = i;

        console.log(`Executing step ${i + 1}: ${step.description || step.type}`);

        const result = await this.executeStep(step, results);
        results[step.id] = result;

        if (!result.success) {
          (updatedPlan as any).status = 'failed';
          throw new Error(`Step ${step.id} failed: ${result.error}`);
        }

        // Handle conditional branching
        if (step.condition && !this.evaluateCondition(step.condition, result)) {
          console.log(`Condition failed for step ${step.id}, skipping`);
          continue;
        }

        // Handle wait steps
        if (step.type === 'wait') {
          await this.handleWaitStep(step);
        }

        // Handle ask steps
        if (step.type === 'ask') {
          const userInput = await this.handleAskStep(step);
          results[step.id] = { success: true, data: userInput };
        }
      }

      (updatedPlan as any).status = 'complete';
      updatedPlan.results = results;
      return updatedPlan;

    } catch (error) {
      console.error('Plan execution failed:', error);
      (updatedPlan as any).status = 'failed';
      throw error;
    }
  }

  private async executeStep(step: PlanStep, previousResults: Record<string, any>): Promise<ToolResult> {
    switch (step.type) {
      case 'tool':
        return this.executeToolStep(step, previousResults);
      case 'compute':
        return this.executeComputeStep(step, previousResults);
      case 'wait':
        return { success: true, data: 'wait completed' };
      case 'ask':
        return { success: true, data: 'user input requested' };
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeToolStep(step: PlanStep, previousResults: Record<string, any>): Promise<ToolResult> {
    if (!step.tool) {
      throw new Error('Tool step missing tool name');
    }

    const tool = this.tools.get(step.tool);
    if (!tool) {
      throw new Error(`Tool not found: ${step.tool}`);
    }

    // Prepare tool call with parameter substitution
    const toolCall: ToolCall = {
      name: step.tool,
      arguments: this.substituteParameters(step.input || {}, previousResults)
    };

    const startTime = Date.now();
    try {
      const result = await tool.execute(toolCall);
      const executionTime = Date.now() - startTime;
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  private async executeComputeStep(step: PlanStep, _previousResults: Record<string, any>): Promise<ToolResult> {
    try {
      // Simple computation - could be extended with a safe eval or expression parser
      const expression = step.input?.expression;
      if (!expression) {
        throw new Error('Compute step missing expression');
      }

      // For now, just return the expression as data
      // In a real implementation, you'd want a safe expression evaluator
      return {
        success: true,
        data: expression,
        metadata: {
          executionTime: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          executionTime: 0
        }
      };
    }
  }

  private async handleWaitStep(step: PlanStep): Promise<void> {
    const waitTime = step.input?.duration || 1000; // Default 1 second
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  private async handleAskStep(step: PlanStep): Promise<string> {
    // This would integrate with the UI to get user input
    // For now, return a placeholder
    return step.input?.prompt || 'User input requested';
  }

  private substituteParameters(input: any, previousResults: Record<string, any>): any {
    if (typeof input === 'string') {
      // Replace {{step_id.field}} with actual values
      return input.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const [stepId, field] = path.split('.');
        const stepResult = previousResults[stepId];
        return stepResult?.data?.[field] || stepResult?.data || match;
      });
    } else if (typeof input === 'object' && input !== null) {
      const result: any = Array.isArray(input) ? [] : {};
      for (const [key, value] of Object.entries(input)) {
        result[key] = this.substituteParameters(value, previousResults);
      }
      return result;
    }
    return input;
  }

  private evaluateCondition(condition: string, result: ToolResult): boolean {
    // Simple condition evaluation - could be extended with a proper expression parser
    if (condition === 'success') {
      return result.success;
    }
    if (condition === 'failure') {
      return !result.success;
    }
    // Add more condition types as needed
    return true;
  }

  private registerTools(): void {
    // This will be populated by tool registration
    // Tools will be registered by the tool registry
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }
} 