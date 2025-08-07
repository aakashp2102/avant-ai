import { AgentPlan, PlanStep, LLMProvider } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class Planner {
  private llmProvider: LLMProvider;

  constructor(llmProvider: LLMProvider) {
    this.llmProvider = llmProvider;
  }

  async createPlan(goal: string, context?: string): Promise<AgentPlan> {
    const planId = uuidv4();
    
    // Create system prompt for plan generation
    const systemPrompt = this.buildSystemPrompt();
    
    const userPrompt = this.buildUserPrompt(goal, context);
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    try {
      const response = await this.llmProvider.chat({
        messages,
        temperature: 0.1, // Low temperature for consistent planning
        maxTokens: 2000
      });

      const steps = this.parsePlanResponse(response.content);
      
      return {
        id: planId,
        goal,
        steps,
        createdAt: new Date().toISOString(),
        status: 'pending',
        currentStep: 0
      };
    } catch (error) {
      console.error('Failed to create plan:', error);
      
      // Fallback: Create a simple plan based on keywords
      if (error instanceof Error && error.message.includes('quota')) {
        console.log('Using fallback plan due to quota issues');
        return this.createFallbackPlan(goal);
      }
      
      throw new Error(`Failed to create plan: ${error}`);
    }
  }

  private createFallbackPlan(goal: string): AgentPlan {
    const planId = uuidv4();
    
    // Simple keyword-based plan
    const lowerGoal = goal.toLowerCase();
    const steps: PlanStep[] = [];
    
    if (lowerGoal.includes('extract') || lowerGoal.includes('scrape')) {
      if (lowerGoal.includes('head') || lowerGoal.includes('title')) {
        steps.push({
          id: 'step_1',
          type: 'tool',
          tool: 'browser_scrape',
          input: { selector: 'h1, h2, h3', textOnly: true },
          description: 'Extract all headings from the page'
        });
      } else if (lowerGoal.includes('link')) {
        steps.push({
          id: 'step_1',
          type: 'tool',
          tool: 'browser_scrape',
          input: { selector: 'a', textOnly: true },
          description: 'Extract all links from the page'
        });
      } else {
        steps.push({
          id: 'step_1',
          type: 'tool',
          tool: 'browser_scrape',
          input: { selector: 'body', textOnly: true },
          description: 'Extract text content from the page'
        });
      }
    } else if (lowerGoal.includes('click')) {
      steps.push({
        id: 'step_1',
        type: 'tool',
        tool: 'browser_click',
        input: { selector: 'button, a' },
        description: 'Click the first button or link found'
      });
    } else {
      // Default fallback
      steps.push({
        id: 'step_1',
        type: 'tool',
        tool: 'browser_scrape',
        input: { selector: 'body', textOnly: true },
        description: 'Extract page content'
      });
    }
    
    return {
      id: planId,
      goal,
      steps,
      createdAt: new Date().toISOString(),
      status: 'pending',
      currentStep: 0
    };
  }

  private buildSystemPrompt(): string {
    return `You are a task planning agent. Your job is to break down user goals into executable steps.

Available step types:
- tool: Execute a tool with parameters
- wait: Wait for a specified time or condition
- ask: Request user input or clarification
- compute: Perform calculations or data processing

Tool categories available:
- browser: DOM manipulation, navigation, scraping
- communication: Gmail, Notion, Calendar
- system: clipboard, file operations
- web: API calls, web scraping

Format your response as a JSON array of step objects:
[
  {
    "id": "step_1",
    "type": "tool",
    "tool": "tool_name",
    "input": { "param1": "value1" },
    "description": "What this step does"
  }
]

Each step should be specific and actionable. Include error handling and user confirmation for write operations.`;
  }

  private buildUserPrompt(goal: string, context?: string): string {
    let prompt = `Create a plan to: ${goal}`;
    
    if (context) {
      prompt += `\n\nContext: ${context}`;
    }
    
    prompt += `\n\nProvide a JSON array of steps to accomplish this goal.`;
    
    return prompt;
  }

  private parsePlanResponse(response: string): PlanStep[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const steps = JSON.parse(jsonStr) as PlanStep[];

      // Validate and enhance steps
      return steps.map((step, index) => ({
        id: step.id || `step_${index + 1}`,
        type: step.type,
        tool: step.tool,
        input: step.input,
        description: step.description,
        next: step.next || (index < steps.length - 1 ? `step_${index + 2}` : undefined)
      }));
    } catch (error) {
      console.error('Failed to parse plan response:', error);
      throw new Error(`Failed to parse plan: ${error}`);
    }
  }

  async replan(plan: AgentPlan, failureReason: string): Promise<AgentPlan> {
    const context = `Previous plan failed: ${failureReason}\nCurrent plan: ${JSON.stringify(plan.steps)}`;
    return this.createPlan(plan.goal, context);
  }
} 