# CopilotX Basic Usage Examples

This document shows how to use CopilotX for common automation tasks.

## Example 1: Web Scraping and Data Extraction

**Goal**: "Extract all product names and prices from this e-commerce page"

**Expected Plan**:
```json
[
  {
    "id": "step_1",
    "type": "tool",
    "tool": "browser_scrape",
    "input": {
      "selector": ".product-item",
      "textOnly": false
    },
    "description": "Scrape all product elements from the page"
  },
  {
    "id": "step_2",
    "type": "compute",
    "input": {
      "expression": "Extract product names and prices from scraped data"
    },
    "description": "Process scraped data to extract structured information"
  }
]
```

## Example 2: Form Automation

**Goal**: "Fill out this contact form with my information"

**Expected Plan**:
```json
[
  {
    "id": "step_1",
    "type": "tool",
    "tool": "browser_type",
    "input": {
      "selector": "input[name='name']",
      "text": "John Doe",
      "clearFirst": true
    },
    "description": "Fill in the name field"
  },
  {
    "id": "step_2",
    "type": "tool",
    "tool": "browser_type",
    "input": {
      "selector": "input[name='email']",
      "text": "john@example.com",
      "clearFirst": true
    },
    "description": "Fill in the email field"
  },
  {
    "id": "step_3",
    "type": "tool",
    "tool": "browser_click",
    "input": {
      "selector": "button[type='submit']"
    },
    "description": "Submit the form"
  }
]
```

## Example 3: Multi-Step Workflow

**Goal**: "Search for 'AI tools' on Google, click the first result, and extract the main content"

**Expected Plan**:
```json
[
  {
    "id": "step_1",
    "type": "tool",
    "tool": "browser_navigate",
    "input": {
      "url": "https://www.google.com"
    },
    "description": "Navigate to Google"
  },
  {
    "id": "step_2",
    "type": "tool",
    "tool": "browser_type",
    "input": {
      "selector": "input[name='q']",
      "text": "AI tools",
      "clearFirst": true
    },
    "description": "Enter search query"
  },
  {
    "id": "step_3",
    "type": "tool",
    "tool": "browser_click",
    "input": {
      "selector": "input[name='btnK']"
    },
    "description": "Submit search"
  },
  {
    "id": "step_4",
    "type": "wait",
    "input": {
      "duration": 2000
    },
    "description": "Wait for search results to load"
  },
  {
    "id": "step_5",
    "type": "tool",
    "tool": "browser_click",
    "input": {
      "selector": ".g a"
    },
    "description": "Click first search result"
  },
  {
    "id": "step_6",
    "type": "wait",
    "input": {
      "duration": 3000
    },
    "description": "Wait for page to load"
  },
  {
    "id": "step_7",
    "type": "tool",
    "tool": "browser_scrape",
    "input": {
      "selector": "main, article, .content",
      "textOnly": true
    },
    "description": "Extract main content from the page"
  }
]
```

## Example 4: Error Handling and Recovery

**Goal**: "Click the login button, but if it's not found, look for a sign-in link instead"

**Expected Plan**:
```json
[
  {
    "id": "step_1",
    "type": "tool",
    "tool": "browser_click",
    "input": {
      "selector": ".login-button"
    },
    "condition": "success",
    "description": "Try to click login button"
  },
  {
    "id": "step_2",
    "type": "tool",
    "tool": "browser_click",
    "input": {
      "selector": ".sign-in-link"
    },
    "condition": "failure",
    "description": "Fallback to sign-in link if login button not found"
  }
]
```

## Example 5: Data Processing and Storage

**Goal**: "Extract all headlines from this news site and save them to my Notion database"

**Expected Plan**:
```json
[
  {
    "id": "step_1",
    "type": "tool",
    "tool": "browser_scrape",
    "input": {
      "selector": "h1, h2, h3",
      "textOnly": true
    },
    "description": "Extract all headlines from the page"
  },
  {
    "id": "step_2",
    "type": "compute",
    "input": {
      "expression": "Filter and clean headline data"
    },
    "description": "Process headlines to remove duplicates and clean text"
  },
  {
    "id": "step_3",
    "type": "tool",
    "tool": "notion_create_page",
    "input": {
      "database_id": "{{user.notion_database_id}}",
      "title": "News Headlines - {{current_date}}",
      "content": "{{step_2.data}}"
    },
    "description": "Create a new page in Notion with the headlines"
  }
]
```

## Usage Tips

### 1. Be Specific with Goals
- ❌ "Help me with this website"
- ✅ "Extract all product prices from this e-commerce page"

### 2. Provide Context
- Include relevant information about the current page
- Mention any specific requirements or constraints

### 3. Handle Errors Gracefully
- Use conditional steps for fallback actions
- Include wait steps for dynamic content

### 4. Test Incrementally
- Start with simple single-step tasks
- Gradually build up to complex multi-step workflows

### 5. Monitor Execution
- Watch the plan execution in real-time
- Review tool results and adjust as needed

## Advanced Features

### Custom Tools
You can create custom tools for specific websites or APIs:

```typescript
export class CustomTool implements Tool {
  getDefinition(): ToolDef {
    return {
      name: 'custom_api_call',
      description: 'Make a custom API call',
      category: 'web',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          endpoint: { type: 'string' },
          method: { type: 'string' },
          data: { type: 'object' }
        },
        required: ['endpoint']
      }
    };
  }

  async execute(call: ToolCall): Promise<ToolResult> {
    // Custom implementation
  }
}
```

### Provider Configuration
Configure different LLM providers based on your needs:

```typescript
// OpenAI (requires API key)
const openaiProvider = new OpenAIProvider('your-api-key');

// Ollama (local models)
const ollamaProvider = new OllamaProvider('http://localhost:11434');

// Gemini (OAuth)
const geminiProvider = new GeminiProvider();
```

This provides a foundation for building sophisticated automation workflows with CopilotX! 