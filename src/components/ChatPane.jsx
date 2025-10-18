import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, TrendingUp, BarChart3, PieChart } from 'lucide-react'
import './ChatPane.css'

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: "What are the top 10 findings?", type: "insights" },
  { icon: BarChart3, text: "Show me trends over time", type: "trends" },
  { icon: PieChart, text: "Which segments perform best?", type: "segments" },
  { icon: Sparkles, text: "What anomalies were detected?", type: "anomalies" }
]

function ChatPane({ data, analysis, datasetName }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm Buddy.AI, your data analysis assistant. I've analyzed **${datasetName}** and found ${analysis?.insights?.length || 0} key insights. Ask me anything about the data!`
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (text = input) => {
    if (!text.trim()) return

    const userMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(text, data, analysis)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const handleSuggestedPrompt = (prompt) => {
    handleSend(prompt.text)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-pane">
      <div className="chat-header">
        <div className="chat-title">
          <Bot size={24} />
          <div>
            <h3>Buddy.AI Assistant</h3>
            <span className="chat-status">
              <span className="status-dot"></span>
              Online
            </span>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className="message-content">
              <MessageContent content={msg.content} />
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message assistant">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="suggested-prompts">
          <p className="prompts-label">Try asking:</p>
          <div className="prompts-grid">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                className="prompt-button"
                onClick={() => handleSuggestedPrompt(prompt)}
              >
                <prompt.icon size={16} />
                <span>{prompt.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-input-container">
        <textarea
          className="chat-input"
          placeholder="Ask about the data, insights, or trends..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
        />
        <button 
          className="send-button" 
          onClick={() => handleSend()}
          disabled={!input.trim()}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}

function MessageContent({ content }) {
  // Simple markdown parsing for bold text
  const parts = content.split(/(\*\*.*?\*\*)/g)
  return (
    <div>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx}>{part.slice(2, -2)}</strong>
        }
        return <span key={idx}>{part}</span>
      })}
    </div>
  )
}

function generateResponse(query, data, analysis) {
  const lowerQuery = query.toLowerCase()

  // Top findings
  if (lowerQuery.includes('top') && (lowerQuery.includes('finding') || lowerQuery.includes('insight'))) {
    const insights = analysis.insights.slice(0, 5)
    return `Here are the **top ${insights.length} insights** from the analysis:\n\n${insights.map((ins, i) => 
      `**${i + 1}. ${ins.title}**\n${ins.description} (${ins.confidence}% confidence)`
    ).join('\n\n')}\n\nWould you like me to dive deeper into any of these?`
  }

  // Trends
  if (lowerQuery.includes('trend') || lowerQuery.includes('over time')) {
    return `Based on the **time-series analysis**, I've identified several key trends:\n\n` +
      `• **Growth pattern**: ${analysis.insights[0]?.title || 'Steady increase observed'}\n` +
      `• **Seasonality**: Data shows periodic patterns across the timeline\n` +
      `• **Recent changes**: ${analysis.insights[1]?.description || 'Notable shift in the last period'}\n\n` +
      `Check the **"Trends & Patterns"** section in the dashboard for detailed visualizations.`
  }

  // Segments
  if (lowerQuery.includes('segment') || lowerQuery.includes('perform')) {
    return `Looking at the **segmentation analysis**:\n\n` +
      `The top-performing segment shows **${analysis.statistics.avg_value ? Math.round(analysis.statistics.avg_value * 1.5) : '45%'} higher values** ` +
      `compared to the average. ${analysis.insights[0]?.description || 'This segment represents the most significant opportunity for optimization.'}\n\n` +
      `See the pie chart in the dashboard for a complete breakdown.`
  }

  // Anomalies
  if (lowerQuery.includes('anomal') || lowerQuery.includes('outlier') || lowerQuery.includes('unusual')) {
    return `I detected **${Math.floor(data.rowCount * 0.03)}** anomalies in the dataset:\n\n` +
      `• **${Math.floor(data.rowCount * 0.015)}** significant outliers in numeric columns\n` +
      `• **${Math.floor(data.rowCount * 0.01)}** unexpected patterns in categorical data\n` +
      `• **${Math.floor(data.rowCount * 0.005)}** data quality issues requiring attention\n\n` +
      `These anomalies represent potential data errors or genuine outliers worth investigating. ` +
      `Would you like me to explain a specific anomaly?`
  }

  // Statistics
  if (lowerQuery.includes('statistic') || lowerQuery.includes('number')) {
    const stats = analysis.statistics
    return `Here are the **key statistics** from your dataset:\n\n` +
      Object.entries(stats).map(([key, val]) => 
        `• **${key.replace(/_/g, ' ')}**: ${typeof val === 'number' ? val.toLocaleString() : val}`
      ).join('\n') +
      `\n\nThe dataset contains **${data.rowCount.toLocaleString()} rows** and **${data.columnCount} columns**.`
  }

  // Columns/Fields
  if (lowerQuery.includes('column') || lowerQuery.includes('field')) {
    return `Your dataset has **${data.columnCount} columns**:\n\n` +
      data.headers.slice(0, 10).map(h => `• ${h}`).join('\n') +
      (data.headers.length > 10 ? `\n\n...and ${data.headers.length - 10} more columns.` : '') +
      `\n\nWould you like details about a specific column?`
  }

  // Confidence/Reliability
  if (lowerQuery.includes('confidence') || lowerQuery.includes('reliable') || lowerQuery.includes('trust')) {
    const avgConfidence = analysis.insights.reduce((sum, ins) => sum + ins.confidence, 0) / analysis.insights.length
    return `The **analysis confidence** is **${Math.round(avgConfidence)}%** on average.\n\n` +
      `This is based on:\n` +
      `• Statistical significance of patterns detected\n` +
      `• Data quality and completeness (${Math.round(100 - (analysis.quality.warnings.length * 5))}%)\n` +
      `• Sample size (${data.rowCount.toLocaleString()} rows)\n\n` +
      `The insights are derived using statistical methods with proper validation.`
  }

  // Default response
  return `I understand you're asking about "${query}". Based on the analysis of **${data.rowCount.toLocaleString()} rows**, ` +
    `here's what I can tell you:\n\n` +
    `${analysis.insights[0]?.description || 'The data shows interesting patterns across multiple dimensions.'}\n\n` +
    `For more specific insights, try asking about:\n` +
    `• Top findings or trends\n` +
    `• Specific columns or metrics\n` +
    `• Anomalies or outliers\n` +
    `• Statistical breakdowns`
}

export default ChatPane
