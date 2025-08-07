import React, { useState, useRef, useEffect } from 'react';
import { AssistantMessage } from '../../types';

interface ChatInterfaceProps {
  messages: AssistantMessage[];
  onSendMessage: (message: string) => void;
  onGoalSubmit?: (goal: string) => void;
  isLoading?: boolean;
  currentPlan?: any;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onGoalSubmit,
  isLoading = false,
  currentPlan
}) => {
  const [inputValue, setInputValue] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalInput.trim() && onGoalSubmit) {
      onGoalSubmit(goalInput.trim());
      setGoalInput('');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">CopilotX Assistant</h2>
        {currentPlan && (
          <div className="mt-2 p-2 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              <strong>Current Goal:</strong> {currentPlan.goal}
            </p>
            <p className="text-xs text-blue-600">
              Status: {currentPlan.status} | Step: {currentPlan.currentStep || 0}/{currentPlan.steps?.length || 0}
            </p>
          </div>
        )}
      </div>

      {/* Goal Input */}
      {onGoalSubmit && (
        <div className="border-b border-gray-200 p-4">
          <form onSubmit={handleGoalSubmit} className="flex gap-2">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="What would you like me to help you with?"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!goalInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Set Goal
            </button>
          </form>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'tool'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {formatTimestamp(message.timestamp)}
              </div>
              {message.metadata?.toolResult && (
                <div className="mt-2 p-2 bg-white rounded text-xs">
                  <strong>Tool Result:</strong> {message.metadata.toolResult.success ? 'Success' : 'Failed'}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}; 