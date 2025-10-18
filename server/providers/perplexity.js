import fetch from 'node-fetch'

export class PerplexityProvider {
  constructor(apiKey, model = 'llama-3.1-sonar-large-128k-online') {
    this.apiKey = apiKey
    this.model = model
    this.baseURL = 'https://api.perplexity.ai'
  }

  async chat(message, systemContext = '') {
    try {
      const messages = []
      
      if (systemContext) {
        messages.push({
          role: 'system',
          content: systemContext
        })
      }

      messages.push({
        role: 'user',
        content: message
      })

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Perplexity API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || 'No response generated'
    } catch (error) {
      console.error('Perplexity chat error:', error)
      throw new Error(`Perplexity: ${error.message}`)
    }
  }

  async streamChat(message, systemContext = '', onChunk) {
    try {
      const messages = []
      
      if (systemContext) {
        messages.push({
          role: 'system',
          content: systemContext
        })
      }

      messages.push({
        role: 'user',
        content: message
      })

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Perplexity API error: ${response.status} - ${error}`)
      }

      const reader = response.body
      let buffer = ''

      for await (const chunk of reader) {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                onChunk(content)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Perplexity stream error:', error)
      throw new Error(`Perplexity streaming: ${error.message}`)
    }
  }

  async validateKey() {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      })

      return response.ok
    } catch (error) {
      console.error('Perplexity validation error:', error)
      return false
    }
  }
}
