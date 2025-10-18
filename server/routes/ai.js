import express from 'express'
import { 
  PerplexityProvider, 
  GeminiProvider, 
  AnthropicProvider 
} from '../providers/index.js'

const router = express.Router()

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'AI routes working', timestamp: new Date().toISOString() })
})

// Chat endpoint with streaming support
router.post('/chat', async (req, res) => {
  try {
    const { 
      message, 
      provider, 
      apiKey, 
      model, 
      data,
      context,
      stream = false 
    } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' })
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' })
    }

    // Initialize the correct provider
    let aiProvider
    switch (provider.toLowerCase()) {
      case 'perplexity':
        aiProvider = new PerplexityProvider(apiKey, model || 'llama-3.1-sonar-large-128k-online')
        break
      case 'gemini':
        aiProvider = new GeminiProvider(apiKey, model || 'gemini-2.0-flash-exp')
        break
      case 'anthropic':
        aiProvider = new AnthropicProvider(apiKey, model || 'claude-sonnet-4-20250514')
        break
      default:
        return res.status(400).json({ error: `Unknown provider: ${provider}` })
    }

    // Build context for AI
    const systemContext = buildSystemContext(data, context)

    if (stream) {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      try {
        await aiProvider.streamChat(message, systemContext, (chunk) => {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
        })
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
        res.end()
      } catch (streamError) {
        console.error('Streaming error:', streamError)
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`)
        res.end()
      }
    } else {
      // Regular non-streaming response
      const response = await aiProvider.chat(message, systemContext)
      res.json({ 
        response, 
        provider, 
        model: aiProvider.model,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to process chat request',
      details: error.toString()
    })
  }
})

// Code generation endpoint
router.post('/generate-code', async (req, res) => {
  try {
    const { query, data, language, provider, apiKey, model } = req.body

    if (!query || !provider || !apiKey) {
      return res.status(400).json({ error: 'Query, provider, and API key are required' })
    }

    let aiProvider
    switch (provider.toLowerCase()) {
      case 'perplexity':
        aiProvider = new PerplexityProvider(apiKey, model)
        break
      case 'gemini':
        aiProvider = new GeminiProvider(apiKey, model)
        break
      case 'anthropic':
        aiProvider = new AnthropicProvider(apiKey, model)
        break
      default:
        return res.status(400).json({ error: `Unknown provider: ${provider}` })
    }

    const systemPrompt = `You are an expert code generator. Generate ${language || 'Python'} code based on the user's request.
    
Dataset info:
- Columns: ${data?.headers?.join(', ') || 'Unknown'}
- Row count: ${data?.rowCount || 'Unknown'}

Return ONLY the code with brief comments. No explanations outside the code.`

    const response = await aiProvider.chat(query, systemPrompt)

    res.json({ 
      code: response,
      language: language || 'python',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Code generation error:', error)
    res.status(500).json({ error: error.message || 'Failed to generate code' })
  }
})

// Data analysis endpoint
router.post('/analyze-data', async (req, res) => {
  try {
    const { data, query, provider, apiKey, model } = req.body

    if (!data || !provider || !apiKey) {
      return res.status(400).json({ error: 'Data, provider, and API key are required' })
    }

    let aiProvider
    switch (provider.toLowerCase()) {
      case 'perplexity':
        aiProvider = new PerplexityProvider(apiKey, model)
        break
      case 'gemini':
        aiProvider = new GeminiProvider(apiKey, model)
        break
      case 'anthropic':
        aiProvider = new AnthropicProvider(apiKey, model)
        break
      default:
        return res.status(400).json({ error: `Unknown provider: ${provider}` })
    }

    const systemPrompt = `You are a data analysis expert. Analyze the following dataset and provide insights.

Dataset Summary:
- Rows: ${data.rowCount}
- Columns: ${data.columnCount}
- Headers: ${data.headers?.slice(0, 10).join(', ')}${data.headers?.length > 10 ? '...' : ''}

Sample data (first 3 rows):
${JSON.stringify(data.rows?.slice(0, 3), null, 2)}

${query || 'Provide a comprehensive analysis with key insights, patterns, and anomalies.'}`

    const response = await aiProvider.chat(systemPrompt, '')

    res.json({ 
      analysis: response,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Data analysis error:', error)
    res.status(500).json({ error: error.message || 'Failed to analyze data' })
  }
})

// Validate API key endpoint
router.post('/validate-key', async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and API key are required' })
    }

    let aiProvider
    switch (provider.toLowerCase()) {
      case 'perplexity':
        aiProvider = new PerplexityProvider(apiKey, model)
        break
      case 'gemini':
        aiProvider = new GeminiProvider(apiKey, model)
        break
      case 'anthropic':
        aiProvider = new AnthropicProvider(apiKey, model)
        break
      default:
        return res.status(400).json({ error: `Unknown provider: ${provider}` })
    }

    const isValid = await aiProvider.validateKey()

    res.json({ 
      valid: isValid,
      provider,
      model: aiProvider.model,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Key validation error:', error)
    res.status(400).json({ 
      valid: false,
      error: error.message || 'Invalid API key'
    })
  }
})

function buildSystemContext(data, additionalContext) {
  let context = `You are Buddy.AI, an advanced data analysis assistant. You help users understand their data through conversation.`

  if (data) {
    context += `\n\nCurrent Dataset Information:
- Total Rows: ${data.rowCount?.toLocaleString() || 'Unknown'}
- Total Columns: ${data.columnCount || 'Unknown'}
- Column Names: ${data.headers?.join(', ') || 'Not available'}
- Dataset Name: ${data.name || 'Uploaded Dataset'}`

    if (data.rows && data.rows.length > 0) {
      context += `\n\nSample Data (first 3 rows):
${JSON.stringify(data.rows.slice(0, 3), null, 2)}`
    }
  }

  if (additionalContext) {
    context += `\n\nAdditional Context: ${additionalContext}`
  }

  context += `\n\nYou should:
- Provide accurate, data-driven insights
- Use markdown formatting for better readability
- Be concise but thorough
- Suggest actionable next steps
- When generating code, ensure it's production-ready
- If you see data quality issues, point them out`

  return context
}

export default router
