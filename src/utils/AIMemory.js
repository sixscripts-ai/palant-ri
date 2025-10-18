// AI Memory & Learning System
// Maintains conversation context, user preferences, and learns from interactions

export class AIMemory {
  constructor() {
    this.conversations = []
    this.userPreferences = this.loadPreferences()
    this.knowledgeGraph = {
      entities: new Map(),
      relationships: new Map(),
      metrics: new Map(),
      insights: []
    }
    this.sessionContext = {}
  }

  // Store conversation with context
  addConversation(userMessage, aiResponse, context = {}) {
    const conversation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: userMessage,
      ai: aiResponse,
      context,
      feedback: null
    }

    this.conversations.push(conversation)
    this.updateKnowledgeGraph(conversation)
    this.saveToStorage()

    return conversation.id
  }

  // Get conversation history
  getConversationHistory(limit = 10) {
    return this.conversations.slice(-limit)
  }

  // Add feedback to learn from
  addFeedback(conversationId, isPositive, reason = '') {
    const conv = this.conversations.find(c => c.id === conversationId)
    if (conv) {
      conv.feedback = { isPositive, reason, timestamp: new Date().toISOString() }
      this.learnFromFeedback(conv)
      this.saveToStorage()
    }
  }

  // Learn from user feedback
  learnFromFeedback(conversation) {
    if (!conversation.feedback) return

    const { isPositive, reason } = conversation.feedback
    const queryType = this.classifyQuery(conversation.user)

    // Update preferences based on feedback
    if (!this.userPreferences.queryPatterns) {
      this.userPreferences.queryPatterns = {}
    }

    if (!this.userPreferences.queryPatterns[queryType]) {
      this.userPreferences.queryPatterns[queryType] = {
        successCount: 0,
        failureCount: 0,
        preferredResponses: []
      }
    }

    const pattern = this.userPreferences.queryPatterns[queryType]
    if (isPositive) {
      pattern.successCount++
      pattern.preferredResponses.push({
        response: conversation.ai,
        context: conversation.context
      })
    } else {
      pattern.failureCount++
    }

    this.savePreferences()
  }

  // Classify query type
  classifyQuery(query) {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('trend') || lowerQuery.includes('over time')) return 'temporal'
    if (lowerQuery.includes('correlat') || lowerQuery.includes('relationship')) return 'correlation'
    if (lowerQuery.includes('anomal') || lowerQuery.includes('outlier')) return 'anomaly'
    if (lowerQuery.includes('code') || lowerQuery.includes('generate')) return 'code_generation'
    if (lowerQuery.includes('why') || lowerQuery.includes('explain')) return 'explanation'
    if (lowerQuery.includes('compare') || lowerQuery.includes('versus')) return 'comparison'
    if (lowerQuery.includes('predict') || lowerQuery.includes('forecast')) return 'prediction'
    
    return 'general'
  }

  // Build knowledge graph from conversation
  updateKnowledgeGraph(conversation) {
    const entities = this.extractEntities(conversation.user, conversation.context)
    
    entities.forEach(entity => {
      if (!this.knowledgeGraph.entities.has(entity.name)) {
        this.knowledgeGraph.entities.set(entity.name, {
          type: entity.type,
          mentions: 0,
          relatedQueries: []
        })
      }
      
      const entityData = this.knowledgeGraph.entities.get(entity.name)
      entityData.mentions++
      entityData.relatedQueries.push(conversation.user)
    })

    // Extract metrics from context
    if (conversation.context.data) {
      const metrics = this.extractMetrics(conversation.context.data)
      metrics.forEach(metric => {
        this.knowledgeGraph.metrics.set(metric.name, {
          type: metric.type,
          statistics: metric.stats,
          lastUpdated: new Date().toISOString()
        })
      })
    }

    // Store insights
    if (conversation.context.insights) {
      this.knowledgeGraph.insights.push({
        content: conversation.ai,
        query: conversation.user,
        timestamp: conversation.timestamp,
        confidence: conversation.context.confidence || 0.8
      })
    }
  }

  // Extract entities from text
  extractEntities(text, context) {
    const entities = []
    const words = text.toLowerCase().split(/\s+/)

    // Common business entities
    const entityPatterns = {
      metric: ['revenue', 'sales', 'profit', 'cost', 'price', 'value', 'amount'],
      dimension: ['region', 'category', 'product', 'customer', 'time', 'date'],
      action: ['increase', 'decrease', 'trend', 'change', 'growth', 'decline'],
      attribute: ['high', 'low', 'top', 'bottom', 'best', 'worst']
    }

    Object.entries(entityPatterns).forEach(([type, patterns]) => {
      patterns.forEach(pattern => {
        if (words.includes(pattern)) {
          entities.push({ name: pattern, type })
        }
      })
    })

    // Extract from context
    if (context.data?.headers) {
      context.data.headers.forEach(header => {
        if (text.toLowerCase().includes(header.toLowerCase())) {
          entities.push({ name: header, type: 'column' })
        }
      })
    }

    return entities
  }

  // Extract metrics from data
  extractMetrics(data) {
    const metrics = []

    if (data.headers) {
      const numericCols = data.headers.filter(h => {
        const vals = data.rows?.map(r => r[h]).filter(v => v != null) || []
        return vals.length > 0 && typeof vals[0] === 'number'
      })

      numericCols.forEach(col => {
        const values = data.rows?.map(r => r[col]).filter(v => v != null) || []
        if (values.length > 0) {
          metrics.push({
            name: col,
            type: 'numeric',
            stats: {
              mean: values.reduce((a, b) => a + b, 0) / values.length,
              min: Math.min(...values),
              max: Math.max(...values),
              count: values.length
            }
          })
        }
      })
    }

    return metrics
  }

  // Get personalized suggestions based on history
  getSuggestedQueries(currentContext = {}) {
    const suggestions = []

    // Based on query patterns
    const patterns = this.userPreferences.queryPatterns || {}
    Object.entries(patterns).forEach(([type, pattern]) => {
      if (pattern.successCount > 0 && pattern.preferredResponses.length > 0) {
        suggestions.push({
          query: this.generateQueryFromPattern(type, currentContext),
          reason: `You've found this type of analysis helpful before`,
          confidence: pattern.successCount / (pattern.successCount + pattern.failureCount)
        })
      }
    })

    // Based on knowledge graph
    const frequentEntities = Array.from(this.knowledgeGraph.entities.entries())
      .sort((a, b) => b[1].mentions - a[1].mentions)
      .slice(0, 3)

    frequentEntities.forEach(([entity, data]) => {
      suggestions.push({
        query: `Tell me more about ${entity}`,
        reason: `You've frequently asked about ${entity}`,
        confidence: 0.7
      })
    })

    // Based on recent insights
    const recentInsights = this.knowledgeGraph.insights.slice(-3)
    recentInsights.forEach(insight => {
      suggestions.push({
        query: `Dive deeper into: ${insight.content.slice(0, 50)}...`,
        reason: 'Follow up on recent insights',
        confidence: insight.confidence
      })
    })

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }

  // Generate query from pattern type
  generateQueryFromPattern(patternType, context) {
    const templates = {
      temporal: 'Show me how this changed over time',
      correlation: 'What relationships exist in this data?',
      anomaly: 'Are there any unusual patterns?',
      code_generation: 'Generate code to analyze this further',
      explanation: 'Explain the key findings',
      comparison: 'Compare the different segments',
      prediction: 'What trends can we expect?',
      general: 'What insights are most important?'
    }

    return templates[patternType] || templates.general
  }

  // Get context for current query
  getContextForQuery(query, data) {
    const queryType = this.classifyQuery(query)
    const relevantConversations = this.conversations
      .filter(c => this.classifyQuery(c.user) === queryType)
      .slice(-3)

    const relevantEntities = Array.from(this.knowledgeGraph.entities.entries())
      .filter(([name]) => query.toLowerCase().includes(name.toLowerCase()))

    return {
      queryType,
      similarPastQueries: relevantConversations.map(c => c.user),
      relevantEntities: relevantEntities.map(([name, data]) => ({ name, ...data })),
      userPreferences: this.userPreferences.queryPatterns?.[queryType],
      knownMetrics: Array.from(this.knowledgeGraph.metrics.entries())
    }
  }

  // Adapt response based on user preferences
  adaptResponse(response, queryType) {
    const preferences = this.userPreferences.queryPatterns?.[queryType]
    
    if (preferences?.preferredResponses?.length > 0) {
      // User prefers detailed responses
      if (preferences.preferredResponses.some(r => r.response.length > 500)) {
        return this.expandResponse(response)
      }
      // User prefers concise responses
      if (preferences.preferredResponses.every(r => r.response.length < 200)) {
        return this.summarizeResponse(response)
      }
    }

    return response
  }

  expandResponse(response) {
    // Add more detail to response
    return response + '\n\nWould you like me to elaborate on any specific aspect?'
  }

  summarizeResponse(response) {
    // Keep response concise
    const lines = response.split('\n')
    return lines.slice(0, 3).join('\n')
  }

  // Storage management
  saveToStorage() {
    try {
      localStorage.setItem('buddy_ai_conversations', JSON.stringify(this.conversations.slice(-50)))
      localStorage.setItem('buddy_ai_knowledge_graph', JSON.stringify({
        entities: Array.from(this.knowledgeGraph.entities.entries()),
        metrics: Array.from(this.knowledgeGraph.metrics.entries()),
        insights: this.knowledgeGraph.insights.slice(-20)
      }))
    } catch (e) {
      console.warn('Failed to save to localStorage:', e)
    }
  }

  loadFromStorage() {
    try {
      const convs = localStorage.getItem('buddy_ai_conversations')
      if (convs) {
        this.conversations = JSON.parse(convs)
      }

      const kg = localStorage.getItem('buddy_ai_knowledge_graph')
      if (kg) {
        const parsed = JSON.parse(kg)
        this.knowledgeGraph = {
          entities: new Map(parsed.entities),
          relationships: new Map(),
          metrics: new Map(parsed.metrics),
          insights: parsed.insights
        }
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e)
    }
  }

  loadPreferences() {
    try {
      const prefs = localStorage.getItem('buddy_ai_preferences')
      return prefs ? JSON.parse(prefs) : {
        queryPatterns: {},
        responseStyle: 'balanced',
        theme: 'dark'
      }
    } catch (e) {
      return {
        queryPatterns: {},
        responseStyle: 'balanced',
        theme: 'dark'
      }
    }
  }

  savePreferences() {
    try {
      localStorage.setItem('buddy_ai_preferences', JSON.stringify(this.userPreferences))
    } catch (e) {
      console.warn('Failed to save preferences:', e)
    }
  }

  // Clear all memory
  clearMemory() {
    this.conversations = []
    this.knowledgeGraph = {
      entities: new Map(),
      relationships: new Map(),
      metrics: new Map(),
      insights: []
    }
    localStorage.removeItem('buddy_ai_conversations')
    localStorage.removeItem('buddy_ai_knowledge_graph')
  }

  // Get summary of learned knowledge
  getKnowledgeSummary() {
    return {
      totalConversations: this.conversations.length,
      entitiesKnown: this.knowledgeGraph.entities.size,
      metricsTracked: this.knowledgeGraph.metrics.size,
      insightsStored: this.knowledgeGraph.insights.length,
      queryPatternsLearned: Object.keys(this.userPreferences.queryPatterns || {}).length,
      mostAskedAbout: this.getMostAskedAbout(),
      preferredQueryTypes: this.getPreferredQueryTypes()
    }
  }

  getMostAskedAbout() {
    return Array.from(this.knowledgeGraph.entities.entries())
      .sort((a, b) => b[1].mentions - a[1].mentions)
      .slice(0, 5)
      .map(([name, data]) => ({ name, mentions: data.mentions }))
  }

  getPreferredQueryTypes() {
    const patterns = this.userPreferences.queryPatterns || {}
    return Object.entries(patterns)
      .map(([type, data]) => ({
        type,
        successRate: data.successCount / (data.successCount + data.failureCount + 1)
      }))
      .sort((a, b) => b.successRate - a.successRate)
  }
}

export default AIMemory
