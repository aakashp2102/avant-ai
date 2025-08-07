// CopilotX Popup JavaScript

// Load saved API key on popup open
document.addEventListener('DOMContentLoaded', function() {
    loadSavedApiKey();
});

function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 5000);
}

function loadSavedApiKey() {
    chrome.storage.local.get(['openai_api_key'], function(result) {
        if (result.openai_api_key) {
            document.getElementById('openaiKey').value = result.openai_api_key;
        }
    });
}

function saveApiKey() {
    const apiKey = document.getElementById('openaiKey').value.trim();
    
    if (!apiKey) {
        showStatus('Please enter an API key', 'error');
        return;
    }
    
    if (!apiKey.startsWith('sk-')) {
        showStatus('API key should start with "sk-"', 'error');
        return;
    }
    
    // Save to Chrome storage
    chrome.storage.local.set({ openai_api_key: apiKey }, function() {
        showStatus('API key saved successfully!', 'success');
    });
    
    // Send to background script
    chrome.runtime.sendMessage({
        type: 'SET_PROVIDER_API_KEY',
        providerId: 'openai',
        apiKey: apiKey
    }, function(response) {
        if (response && response.success) {
            showStatus('API key configured in background service!', 'success');
        } else {
            showStatus('Error configuring API key: ' + (response?.error || 'Unknown error'), 'error');
        }
    });
}

function testConnection() {
    const apiKey = document.getElementById('openaiKey').value.trim();
    
    if (!apiKey) {
        showStatus('Please enter an API key first', 'error');
        return;
    }
    
    showStatus('Testing connection...', 'info');
    
    // Test with a simple goal
    chrome.runtime.sendMessage({
        type: 'CREATE_PLAN',
        goal: 'Test connection',
        context: 'This is a test to verify the OpenAI API key is working.'
    }, function(response) {
        if (response && response.plan) {
            showStatus('✅ Connection successful! API key is working.', 'success');
        } else if (response && response.error) {
            showStatus('❌ Connection failed: ' + response.error, 'error');
        } else {
            showStatus('❌ Connection failed: Unknown error', 'error');
        }
    });
}

function testCreatePlan() {
    const goal = document.getElementById('goalInput').value.trim();
    
    if (!goal) {
        showStatus('Please enter a goal', 'error');
        return;
    }
    
    showStatus('Creating plan...', 'info');
    
    chrome.runtime.sendMessage({
        type: 'CREATE_PLAN',
        goal: goal
    }, function(response) {
        const resultDiv = document.getElementById('planResult');
        
        if (response && response.plan) {
            resultDiv.textContent = JSON.stringify(response.plan, null, 2);
            showStatus('✅ Plan created successfully!', 'success');
        } else if (response && response.error) {
            resultDiv.textContent = 'Error: ' + response.error;
            showStatus('❌ Failed to create plan: ' + response.error, 'error');
        } else {
            resultDiv.textContent = 'Error: Unknown response';
            showStatus('❌ Failed to create plan: Unknown error', 'error');
        }
    });
}

function testExecutePlan() {
    showStatus('Executing plan...', 'info');
    
    chrome.runtime.sendMessage({
        type: 'EXECUTE_PLAN',
        planId: 'current' // Execute the current plan
    }, function(response) {
        const resultDiv = document.getElementById('planResult');
        
        if (response && response.plan) {
            resultDiv.textContent = JSON.stringify(response.plan, null, 2);
            showStatus('✅ Plan executed successfully!', 'success');
        } else if (response && response.error) {
            resultDiv.textContent = 'Error: ' + response.error;
            showStatus('❌ Failed to execute plan: ' + response.error, 'error');
        } else {
            resultDiv.textContent = 'Error: Unknown response';
            showStatus('❌ Failed to execute plan: Unknown error', 'error');
        }
    });
}

function getTools() {
    chrome.runtime.sendMessage({
        type: 'GET_AVAILABLE_TOOLS'
    }, function(response) {
        const resultDiv = document.getElementById('toolsResult');
        
        if (response && Array.isArray(response)) {
            resultDiv.textContent = JSON.stringify(response, null, 2);
            showStatus('✅ Tools retrieved successfully!', 'success');
        } else if (response && response.error) {
            resultDiv.textContent = 'Error: ' + response.error;
            showStatus('❌ Failed to get tools: ' + response.error, 'error');
        } else {
            resultDiv.textContent = 'Error: Unknown response';
            showStatus('❌ Failed to get tools: Unknown error', 'error');
        }
    });
} 