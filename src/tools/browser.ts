import { Tool, ToolDef, ToolCall, ToolResult } from '../types';

export class BrowserScrapeTool implements Tool {
  getDefinition(): ToolDef {
    return {
      name: 'browser_scrape',
      description: 'Scrape content from the current webpage',
      category: 'browser',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector to target elements'
          },
          attribute: {
            type: 'string',
            description: 'Attribute to extract (optional)'
          },
          textOnly: {
            type: 'boolean',
            description: 'Extract only text content'
          }
        },
        required: ['selector']
      }
    };
  }

  async execute(call: ToolCall): Promise<ToolResult> {
    const { selector, attribute, textOnly } = call.arguments;
    
    try {
      // This would be executed in the content script context
      const elements = document.querySelectorAll(selector);
      const results: any[] = [];

      for (const element of Array.from(elements)) {
        if (attribute) {
          results.push(element.getAttribute(attribute));
        } else if (textOnly) {
          results.push(element.textContent?.trim());
        } else {
          results.push({
            text: element.textContent?.trim(),
            html: element.innerHTML,
            tagName: element.tagName,
            attributes: Object.fromEntries(
              Array.from(element.attributes).map(attr => [(attr as Attr).name, (attr as Attr).value])
            )
          });
        }
      }

      return {
        success: true,
        data: results,
        metadata: { executionTime: 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: 0 }
      };
    }
  }
}

export class BrowserClickTool implements Tool {
  getDefinition(): ToolDef {
    return {
      name: 'browser_click',
      description: 'Click an element on the current webpage',
      category: 'browser',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the element to click'
          }
        },
        required: ['selector']
      }
    };
  }

  async execute(call: ToolCall): Promise<ToolResult> {
    const { selector } = call.arguments;
    
    try {
      const element = document.querySelector(selector);
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`,
          metadata: { executionTime: 0 }
        };
      }

      element.click();
      
      return {
        success: true,
        data: { clicked: true, element: selector },
        metadata: { executionTime: 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: 0 }
      };
    }
  }
}

export class BrowserTypeTool implements Tool {
  getDefinition(): ToolDef {
    return {
      name: 'browser_type',
      description: 'Type text into an input field',
      category: 'browser',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the input field'
          },
          text: {
            type: 'string',
            description: 'Text to type'
          },
          clearFirst: {
            type: 'boolean',
            description: 'Clear the field before typing'
          }
        },
        required: ['selector', 'text']
      }
    };
  }

  async execute(call: ToolCall): Promise<ToolResult> {
    const { selector, text, clearFirst } = call.arguments;
    
    try {
      const element = document.querySelector(selector) as HTMLInputElement;
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`,
          metadata: { executionTime: 0 }
        };
      }

      if (clearFirst) {
        element.value = '';
      }

      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      return {
        success: true,
        data: { typed: text, element: selector },
        metadata: { executionTime: 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: 0 }
      };
    }
  }
}

export class BrowserNavigateTool implements Tool {
  getDefinition(): ToolDef {
    return {
      name: 'browser_navigate',
      description: 'Navigate to a URL',
      category: 'browser',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to navigate to'
          }
        },
        required: ['url']
      }
    };
  }

  async execute(call: ToolCall): Promise<ToolResult> {
    const { url } = call.arguments;
    
    try {
      window.location.href = url;
      
      return {
        success: true,
        data: { navigated: true, url },
        metadata: { executionTime: 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: 0 }
      };
    }
  }
} 