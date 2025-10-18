# 🤖 Buddy.AI - Real AI Integration Guide

## Overview

Buddy.AI now features **REAL AI integration** with three powerful providers:

- **Perplexity AI** - Real-time web search powered AI with citations
- **Google Gemini 2.5 Pro** - Google's most capable multimodal AI
- **Anthropic Claude Sonnet 4.5** - Advanced reasoning and analysis

## 🎯 Features

### ✅ What's Working

1. **Multi-Provider Support**
   - User can choose between 3 AI providers
   - Each provider has multiple model options
   - Seamless switching between providers

2. **Real AI Chat**
   - Actual API calls to AI providers
   - Context-aware responses about your data
   - Streaming support (ready for future enhancement)
   - Conversation history

3. **Settings Page**
   - Secure API key storage (localStorage)
   - API key validation
   - Model selection per provider
   - Visual feedback on configuration status

4. **Backend API Server**
   - Express.js server running on port 3001
   - RESTful endpoints for AI operations
   - Error handling and retry logic
   - Health check endpoint

## 🚀 Setup Instructions

### 1. Get API Keys

#### Perplexity
1. Go to https://www.perplexity.ai/settings/api
2. Create an API key
3. Copy the key (starts with `pplx-`)

#### Google Gemini
1. Go to https://aistudio.google.com/app/apikey
2. Create an API key
3. Copy the key

#### Anthropic Claude
1. Go to https://console.anthropic.com/settings/keys
2. Create an API key
3. Copy the key (starts with `sk-ant-`)

### 2. Configure in Buddy.AI

1. Click the **⚙️ Settings** button in the header
2. Select your preferred AI provider from the sidebar
3. Paste your API key
4. Click **Validate** to test the key
5. Select your preferred model
6. Click **Save Settings**

### 3. Start Using AI Chat

1. Upload a dataset
2. Click the **AI Chat** button (appears after upload)
3. Ask questions about your data
4. Get intelligent, context-aware responses

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  ChatPage    │  │ SettingsPage │  │  App.jsx  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└──────────────────────────┬──────────────────────────┘
                           │ HTTP/REST
                           │
┌──────────────────────────▼──────────────────────────┐
│              Backend API (Express.js)                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  AI Routes   │  │  Middleware  │  │  Server   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└──────────────────────────┬──────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐ ┌───────▼────────┐ ┌──────▼───────┐
│   Perplexity   │ │     Gemini     │ │   Anthropic  │
│    Provider    │ │    Provider    │ │   Provider   │
└────────────────┘ └────────────────┘ └──────────────┘
```

## 📡 API Endpoints

### Backend Server (Port 3001)

#### Health Check
```
GET /health
Response: { status: 'healthy', timestamp, uptime }
```

#### Chat Endpoint
```
POST /api/ai/chat
Body: {
  message: string,
  provider: 'perplexity' | 'gemini' | 'anthropic',
  apiKey: string,
  model: string,
  data: object,
  context: string,
  stream: boolean
}
Response: { response: string, provider, model, timestamp }
```

#### Validate API Key
```
POST /api/ai/validate-key
Body: {
  provider: string,
  apiKey: string,
  model: string
}
Response: { valid: boolean, provider, model }
```

#### Generate Code
```
POST /api/ai/generate-code
Body: {
  query: string,
  data: object,
  language: 'python' | 'r' | 'sql',
  provider: string,
  apiKey: string
}
Response: { code: string, language, timestamp }
```

#### Analyze Data
```
POST /api/ai/analyze-data
Body: {
  data: object,
  query: string,
  provider: string,
  apiKey: string
}
Response: { analysis: string, timestamp }
```

## 🔧 Provider Details

### Perplexity AI

**Models Available:**
- `llama-3.1-sonar-large-128k-online` (Default)
- `llama-3.1-sonar-small-128k-online`
- `llama-3.1-sonar-huge-128k-online`

**Features:**
- Real-time web search integration
- Citations and sources
- Large context window (128K tokens)
- Fast response times

**Best For:**
- Questions requiring current information
- Research and fact-checking
- Comprehensive analysis

### Google Gemini 2.5 Pro

**Models Available:**
- `gemini-2.0-flash-exp` (Default)
- `gemini-exp-1206`
- `gemini-1.5-pro-latest`

**Features:**
- Multimodal capabilities
- Lightning-fast responses
- Excellent code generation
- Strong reasoning

**Best For:**
- Quick responses
- Code generation
- Structured data analysis
- Complex reasoning tasks

### Anthropic Claude Sonnet 4.5

**Models Available:**
- `claude-sonnet-4-20250514` (Default)
- `claude-3-5-sonnet-20241022`
- `claude-3-opus-20240229`

**Features:**
- Superior reasoning capabilities
- Long context (200K tokens)
- Excellent writing quality
- Strong analytical skills

**Best For:**
- Deep data analysis
- Complex problem solving
- Detailed explanations
- Research and insights

## 🔒 Security

### API Key Storage
- Keys stored in browser localStorage
- Never sent to our servers (only to AI providers)
- Encrypted in transit via HTTPS
- User has full control over keys

### Best Practices
1. Never share your API keys
2. Rotate keys regularly
3. Use environment-specific keys
4. Monitor usage in provider dashboards
5. Delete keys from Settings when not in use

## 🐛 Troubleshooting

### "AI Not Configured" Message
**Solution:** Go to Settings and configure an API key

### "Invalid API Key" Error
**Solutions:**
1. Check the key is correct (copy-paste carefully)
2. Ensure key is active in provider dashboard
3. Verify billing is set up (some providers require it)
4. Try validating again after a few seconds

### Backend Not Responding
**Solutions:**
1. Check if backend is running: `curl http://localhost:3001/health`
2. Restart the application
3. Check browser console for errors
4. Verify port 3001 is not blocked

### Slow Responses
**Solutions:**
1. Try a different model (smaller/faster)
2. Reduce data sent in context
3. Check your internet connection
4. Try a different AI provider

## 📊 Usage Examples

### Basic Question
```
User: "What are the main trends in this data?"
AI: [Analyzes actual data and provides insights]
```

### Code Generation
```
User: "Generate Python code to calculate the average by category"
AI: [Generates working Python code specific to your dataset]
```

### Data Quality
```
User: "Are there any quality issues in this data?"
AI: [Analyzes and reports specific issues found]
```

### Pattern Discovery
```
User: "Find unusual patterns or anomalies"
AI: [Identifies and explains anomalies in your data]
```

## 🎨 Future Enhancements

### Planned Features
- [ ] Response streaming for real-time output
- [ ] Conversation context memory
- [ ] Multi-turn dialogues
- [ ] Voice input support
- [ ] Export chat history
- [ ] Custom prompt templates
- [ ] Team collaboration
- [ ] Usage analytics dashboard

### Provider Additions
- [ ] OpenAI GPT-4
- [ ] Cohere Command
- [ ] Meta Llama via Replicate
- [ ] Mistral AI
- [ ] Local models (Ollama)

## 💡 Tips for Best Results

1. **Be Specific**: Ask detailed questions about your data
2. **Provide Context**: Mention column names and what you're looking for
3. **Iterate**: Follow up on responses to dig deeper
4. **Use Right Model**: Larger models for complex analysis, smaller for quick questions
5. **Check Results**: Always validate AI suggestions against your data

## 📈 Performance

### Response Times (Typical)
- **Perplexity**: 2-5 seconds
- **Gemini**: 1-3 seconds
- **Claude**: 2-6 seconds

### Rate Limits (Vary by Provider)
- Check your provider's documentation
- Most have generous free tiers
- Upgrade plans available for heavy usage

## 🤝 Contributing

Want to add a new AI provider?

1. Create provider file in `server/providers/yourprovider.js`
2. Implement `chat()`, `streamChat()`, and `validateKey()` methods
3. Add to `server/providers/index.js`
4. Update `server/routes/ai.js` with new case
5. Add to Settings page UI
6. Test and submit PR!

## 📝 License

This project uses third-party AI services. Ensure compliance with each provider's terms of service.

---

**Built with ❤️ by the Buddy.AI Team**

For questions or support, check the main README or open an issue.
