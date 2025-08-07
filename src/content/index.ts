// Content script for CopilotX
// Handles DOM interactions and browser automation

console.log('CopilotX content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  switch (request.type) {
    case 'EXECUTE_BROWSER_TOOL':
      handleBrowserTool(request.toolCall)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true; // Keep message channel open
      
    case 'GET_PAGE_CONTEXT':
      const context = getPageContext();
      sendResponse({ context });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

async function handleBrowserTool(toolCall: any): Promise<any> {
  const { name, arguments: args } = toolCall;
  
  switch (name) {
    case 'browser_scrape':
      return executeScrape(args);
      
    case 'browser_click':
      return executeClick(args);
      
    case 'browser_type':
      return executeType(args);
      
    case 'browser_navigate':
      return executeNavigate(args);
      
    default:
      throw new Error(`Unknown browser tool: ${name}`);
  }
}

function executeScrape(args: any): any {
  const { selector, attribute, textOnly } = args;
  
  try {
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

function executeClick(args: any): any {
  const { selector } = args;
  
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

function executeType(args: any): any {
  const { selector, text, clearFirst } = args;
  
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

function executeNavigate(args: any): any {
  const { url } = args;
  
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

function getPageContext(): any {
  return {
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
}

// Inject a script to enable communication with the page
// TODO: Add injected script when needed
// const script = document.createElement('script');
// script.src = chrome.runtime.getURL('injected.js');
// script.onload = () => script.remove();
// (document.head || document.documentElement).appendChild(script); 