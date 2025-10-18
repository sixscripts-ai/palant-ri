import Anthropic from '@anthropic-ai/sdk'

export class AnthropicProvider {
  constructor(apiKey, model = 'claude-sonnet-4-20250514') {
    this.apiKey = apiKey
    this.model = model
    this.client = new Anthropic({ apiKey })
  }

  async chat(message, systemContext = '') {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemContext || undefined,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })

      return response.content[0]?.text || 'No response generated'
    } catch (error) {
      console.error('Anthropic chat error:', error)
      throw new Error(`Anthropic: ${error.message}`)
    }
  }

  async streamChat(message, systemContext = '', onChunk) {
    try {
      const stream = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemContext || undefined,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        stream: true
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          onChunk(event.delta.text)
        }
      }
    } catch (error) {
      console.error('Anthropic stream error:', error)
      throw new Error(`Anthropic streaming: ${error.message}`)
    }
  }

  async validateKey() {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'test'
          }
        ]
      })

      return !!response.content[0]?.text
    } catch (error) {
      console.error('Anthropic validation error:', error)
      return false
    }
  }
}
