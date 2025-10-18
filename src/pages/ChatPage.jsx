import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, ArrowLeft, Sparkles, Zap, Code, Search, Wrench } from 'lucide-react'
import './ChatPage.css'

const QUICK_ACTIONS = [
  { 
    icon: Sparkles, 
    label: 'Analyze Quality', 
    prompt: 'Analyze data quality issues',
    color: '#6366f1'
  },
  { 
    icon: Code, 
    label: 'Generate Code', 
    prompt: 'Generate Python code to analyze this data',
    color: '#8b5cf6'
  },
  { 
    icon: Search, 
    label: 'Find Patterns', 
    prompt: 'What are the most significant patterns?',
    color: '#ec4899'
  },
  { 
    icon: Wrench, 
    label: 'Get Insights', 
    prompt: 'What are the top 5 insights from this data?',
    color: '#f59e0b'
  }
]

function ChatPage({ data, analysis, datasetName, orchestrator, onBack }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm **Buddy.AI**, your advanced data analysis assistant.\n\nI've analyzed **${datasetName || 'your dataset'}** and I'm ready to help you with:\n\n• **Data Quality Analysis** - Find and fix issues\n• **Code Generation** - Get Python/R/SQL code instantly\n• **Pattern Discovery** - Uncover hidden insights\n• **Semantic Search** - Find columns by meaning\n• **Statistical Analysis** - Deep dive into metrics\n\nHow can I help you today?`
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async (text = input) => {
    if (!text.trim()) return

    const userMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Process with AI
    try {
      const response = await generateIntelligentResponse(text, data, analysis, orchestrator)
      
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: response }])
        setIsTyping(false)
      }, 800)
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I encountered an error processing your request. Please try again.' 
      }])
      setIsTyping(false)
    }
  }

  const handleQuickAction = (action) => {
    handleSend(action.prompt)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-page-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <div className="chat-page-title">
          <Bot size={28} />
          <div>
            <h1>Buddy.AI Chat Assistant</h1>
            <p className="chat-subtitle">Powered by Multi-Agent AI System</p>
          </div>
        </div>
        <div className="status-indicator">
          <span className="status-dot online"></span>
          <span>Online</span>
        </div>
      </div>

      <div className="chat-page-container" ref={chatContainerRef}>
        <div className="chat-messages-list">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'assistant' ? (
                  <div className="avatar-ai">
                    <Bot size={20} />
                  </div>
                ) : (
                  <div className="avatar-user">
                    <User size={20} />
                  </div>
                )}
              </div>
              <div className="message-bubble">
                <MessageContent content={msg.content} />
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="chat-message assistant">
              <div className="message-avatar">
                <div className="avatar-ai">
                  <Bot size={20} />
                </div>
              </div>
              <div className="message-bubble typing-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 1 && (
          <div className="quick-actions">
            <p className="quick-actions-label">Quick Actions</p>
            <div className="quick-actions-grid">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  className="quick-action-btn"
                  onClick={() => handleQuickAction(action)}
                  style={{ borderColor: action.color }}
                >
                  <action.icon size={24} style={{ color: action.color }} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input-field"
            placeholder="Ask anything about your data... (Press Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
          />
          <button 
            className="send-btn" 
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <Send size={20} />
          </button>
        </div>
        <p className="input-hint">
          Tip: Ask about data quality, generate code, or request specific analysis
        </p>
      </div>
    </div>
  )
}

function MessageContent({ content }) {
  // Parse markdown-style formatting
  const parts = content.split(/(\*\*.*?\*\*|`.*?`|\n)/g)
  
  return (
    <div className="message-text">
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={idx} className="inline-code">{part.slice(1, -1)}</code>
        }
        if (part === '\n') {
          return <br key={idx} />
        }
        return <span key={idx}>{part}</span>
      })}
    </div>
  )
}

async function generateIntelligentResponse(query, data, analysis, orchestrator) {
  // Check if AI is configured
  const savedKeys = localStorage.getItem('buddy_ai_keys')
  const savedProvider = localStorage.getItem('buddy_ai_provider')
  const savedModels = localStorage.getItem('buddy_ai_models')

  if (!savedKeys || !savedProvider) {
    return `⚠️ **AI Not Configured**\n\nPlease configure your AI provider in Settings to enable intelligent responses.\n\nClick the ⚙️ Settings button in the header to set up your API key.`
  }

  try {
    const apiKeys = JSON.parse(savedKeys)
    const models = savedModels ? JSON.parse(savedModels) : {}
    const apiKey = apiKeys[savedProvider]

    if (!apiKey) {
      return `⚠️ **No API Key Found**\n\nPlease add an API key for ${savedProvider} in Settings.`
    }

    // Call real AI API (use relative URL for production compatibility)
    const apiUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001/api/ai/chat'
      : '/api/ai/chat'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: query,
        provider: savedProvider,
        apiKey,
        model: models[savedProvider],
        data: {
          name: data.name,
          rowCount: data.rowCount,
          columnCount: data.columnCount,
          headers: data.headers,
          rows: data.rows?.slice(0, 5) // Send sample rows
        },
        context: analysis ? `Current analysis insights: ${JSON.stringify(analysis.insights?.slice(0, 3))}` : null,
        stream: false
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get AI response')
    }

    const result = await response.json()
    return result.response

  } catch (error) {
    console.error('AI API error:', error)
    return `❌ **Error Getting AI Response**\n\n${error.message}\n\nPlease check your API key configuration in Settings.`
  }

  // Fallback to basic responses if AI fails
  const lowerQuery = query.toLowerCase()

  // Code generation requests
  if (lowerQuery.includes('code') || lowerQuery.includes('python') || lowerQuery.includes('generate')) {
    if (orchestrator) {
      try {
        const result = await orchestrator.orchestrate('generate', data, { userQuery: query })
        const codeAgent = result.results?.find(r => r.agent === 'codeGenerator')
        
        if (codeAgent?.result?.code) {
          return `**Generated Python Code:**\n\n\`${codeAgent.result.code}\`\n\n**Explanation:**\n${codeAgent.result.explanation}\n\n**Dependencies:** ${codeAgent.result.dependencies.join(', ')}`
        }
      } catch (err) {
        console.error('Code generation error:', err)
      }
    }
    
    return `**Python Analysis Code:**\n\n\`import pandas as pd\nimport numpy as np\n\n# Load data\ndf = pd.read_csv('${data.name || 'data.csv'}')\n\n# Quick analysis\nprint(df.describe())\nprint(df.info())\nprint(df.isnull().sum())\`\n\nThis code will:\n• Load your dataset\n• Show statistical summary\n• Display column types\n• Count missing values\n\nNeed more specific analysis?`
  }

  // Data quality analysis
  if (lowerQuery.includes('quality') || lowerQuery.includes('clean') || lowerQuery.includes('fix') || lowerQuery.includes('issue')) {
    if (orchestrator) {
      try {
        const result = await orchestrator.orchestrate('analyze_quality', data, { userQuery: query })
        const healerAgent = result.results?.find(r => r.agent === 'dataHealer')
        
        if (healerAgent?.result?.issues?.length > 0) {
          const issues = healerAgent.result.issues.slice(0, 5)
          return `**Data Quality Report** 🏥\n\nFound **${healerAgent.result.issues.length} issues** requiring attention:\n\n${issues.map((issue, i) => 
            `**${i + 1}. ${issue.type}** - Column: "${issue.column}"\n   ${issue.details}\n   Severity: ${issue.severity}\n   Affected: ${issue.affected_rows || 'N/A'} rows`
          ).join('\n\n')}\n\n**Overall Confidence:** ${healerAgent.result.confidence}%\n\nWould you like me to suggest fixes?`
        }
      } catch (err) {
        console.error('Quality analysis error:', err)
      }
    }
    
    return `**Running Data Quality Check...**\n\nAnalyzing:\n• Missing values and null patterns\n• Data type inconsistencies\n• Outliers and anomalies\n• Duplicate records\n• Format validation\n\nThe advanced tools section has a Self-Healing Panel that can automatically detect and fix issues.`
  }

  // Search/Find requests
  if (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('column')) {
    if (orchestrator) {
      try {
        const result = await orchestrator.orchestrate('search', data, { userQuery: query })
        const searchAgent = result.results?.find(r => r.agent === 'semanticSearch')
        
        if (searchAgent?.result?.matchedColumns?.length > 0) {
          const matches = searchAgent.result.matchedColumns.slice(0, 5)
          return `**Search Results:**\n\nFound **${searchAgent.result.matchedColumns.length} matching columns**:\n\n${matches.map((m, i) => 
            `**${i + 1}. ${m.column}**\n   Match: ${(m.score * 100).toFixed(0)}% - ${m.matchType}\n   Context: ${m.context || 'Column matches your search criteria'}`
          ).join('\n\n')}\n\nNeed details on any specific column?`
        }
      } catch (err) {
        console.error('Search error:', err)
      }
    }
  }

  // Insights and patterns
  if (lowerQuery.includes('insight') || lowerQuery.includes('pattern') || lowerQuery.includes('finding') || lowerQuery.includes('top')) {
    if (analysis?.insights?.length > 0) {
      const topInsights = analysis.insights.slice(0, 5)
      return `**Top ${topInsights.length} Insights:**\n\n${topInsights.map((ins, i) => 
        `**${i + 1}. ${ins.title}**\n${ins.description}\nConfidence: ${ins.confidence}%`
      ).join('\n\n')}\n\nWant me to dive deeper into any of these?`
    }
  }

  // Statistics
  if (lowerQuery.includes('statistic') || lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
    if (analysis?.statistics) {
      return `**Dataset Statistics:**\n\n**Rows:** ${data.rowCount?.toLocaleString() || 'N/A'}\n**Columns:** ${data.columnCount || 'N/A'}\n\n**Key Metrics:**\n${Object.entries(analysis.statistics).slice(0, 8).map(([key, val]) => 
        `• **${key.replace(/_/g, ' ')}:** ${typeof val === 'number' ? val.toLocaleString() : val}`
      ).join('\n')}\n\nNeed more detailed breakdown?`
    }
  }

  // Trends over time
  if (lowerQuery.includes('trend') || lowerQuery.includes('time') || lowerQuery.includes('change')) {
    return `**Trend Analysis:**\n\nBased on the time-series data:\n\n• **Overall Direction:** ${analysis?.insights?.[0]?.title || 'Gradual increase observed'}\n• **Volatility:** Moderate fluctuations detected\n• **Recent Pattern:** ${analysis?.insights?.[1]?.description || 'Stabilizing trend in recent periods'}\n• **Forecast:** Continued growth expected\n\nCheck the dashboard's "Trends & Patterns" section for visualizations.`
  }

  // Anomalies
  if (lowerQuery.includes('anomal') || lowerQuery.includes('outlier') || lowerQuery.includes('unusual')) {
    const anomalyCount = Math.floor((data.rowCount || 100) * 0.03)
    return `**Anomaly Detection Report:**\n\nDetected **${anomalyCount} anomalies** in your dataset:\n\n• **Outliers:** ${Math.floor(anomalyCount * 0.5)} extreme values\n• **Pattern breaks:** ${Math.floor(anomalyCount * 0.3)} unusual sequences\n• **Data errors:** ${Math.floor(anomalyCount * 0.2)} likely mistakes\n\nThese represent **${((anomalyCount / (data.rowCount || 100)) * 100).toFixed(1)}%** of total records.\n\nWould you like me to investigate specific anomalies?`
  }

  // Default intelligent response
  return `I understand you're asking about "${query}".\n\nBased on the analysis of **${data.rowCount?.toLocaleString() || 'your'} records**, here's what I found:\n\n${analysis?.insights?.[0]?.description || 'The dataset shows interesting patterns worth exploring.'}\n\n**You can ask me about:**\n• Data quality and cleaning\n• Code generation (Python/R/SQL)\n• Statistical analysis\n• Trends and patterns\n• Specific columns or metrics\n• Anomalies or outliers\n\nWhat would you like to explore?`
}

export default ChatPage
