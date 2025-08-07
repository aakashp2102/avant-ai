# CopilotX

A modular, agentic, cross-platform personal assistant that automates browser and app workflows using any user-supplied or accessible LLM.

## 🎯 Vision

CopilotX is designed to be a local-first, privacy-focused AI assistant that can:
- Connect to any LLM via BYOK, OAuth, or local models
- Delegate multi-step tasks via natural language
- Automate browser and app workflows contextually
- Sync context and memory across devices (opt-in)
- Support community-built tools, agents, and relays

## 🏗️ Architecture

```
User ↔ UI (Sidebar, Popup)
     ↕
  Planner Agent ←→ Executor Agent ←→ Tool Interface
     ↕                     ↕
  LLM Provider Layer ←→ Local Memory Store
     ↕
Optional Cloud Sync & Event Scheduler
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Chrome/Chromium browser
- TypeScript knowledge

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd copilotx
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📁 Project Structure

```
src/
├── agents/           # Planner and Executor agents
├── memory/          # Local storage and memory management
├── providers/       # LLM provider implementations
├── tools/           # Tool registry and implementations
├── ui/              # React UI components
│   ├── popup/       # Extension popup
│   ├── sidebar/     # Sidebar interface
│   └── shared/      # Shared components
├── background/      # Service worker
├── content/         # Content scripts
└── types/           # TypeScript type definitions
```

## 🔧 Core Components

### Agents

- **Planner**: Converts natural language prompts into structured execution plans
- **Executor**: Handles sequential and parallel execution of plan steps

### Memory System

- **Local Storage**: IndexedDB for task logs, chat history, and agent state
- **Secure Storage**: Encrypted API keys and auth tokens
- **Optional Sync**: Cloud synchronization with user consent

### LLM Providers

- **OpenAI**: GPT-3.5/4 with API key authentication
- **Anthropic**: Claude with API key authentication
- **Ollama**: Local models with WebGPU support
- **Gemini**: Google's model with OAuth authentication
- **Relay Support**: Custom relay endpoints with OAuth

### Tools

- **Browser Tools**: DOM manipulation, scraping, navigation
- **Communication**: Gmail, Notion, Calendar integration
- **System Tools**: Clipboard, file operations
- **Web Tools**: API calls, web scraping

## 🛡️ Security & Privacy

- **Local-First**: All data stored locally by default
- **Encrypted Storage**: API keys encrypted in local storage
- **Opt-in Sync**: Cloud synchronization requires explicit consent
- **No Tracking**: No analytics without user permission
- **Secure Auth**: OAuth flows for supported providers

## 🧪 Testing Strategy

- **Unit Tests**: Core agent logic and provider adapters
- **Integration Tests**: Full agent flow with mocked tools
- **E2E Tests**: Simulated tasks in Chromium
- **Golden Tests**: Prompt → plan → result snapshots

## 📋 MVP Features (v0.1)

- [x] Chrome extension with sidebar and popup UI
- [x] Planner + executor agents
- [x] OpenAI and Ollama provider support
- [x] Browser tools (scraping, clicking, typing)
- [x] Secure memory store (IndexedDB)
- [ ] Notion + Gmail tools
- [ ] Gemini OAuth support
- [ ] Relay provider support

## 🔮 Future Roadmap

- **Relay SDK**: Community-hosted model relays
- **Mobile App**: Cross-platform with shared memory
- **Agent Marketplace**: Community tools and workflows
- **Advanced Planning**: Multi-agent coordination
- **Visual Tools**: Screenshot analysis and UI automation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Guidelines

- Follow TypeScript strict mode
- Write unit tests for new features
- Use conventional commits
- Document new tools and providers
- Respect privacy and security requirements

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built with React, TypeScript, and Vite
- Uses IndexedDB for local storage
- Chrome Extension Manifest V3 compliant
- Inspired by modern AI agent architectures

---

**Note**: This is an MVP version. The project is actively developed and may have breaking changes between versions. 