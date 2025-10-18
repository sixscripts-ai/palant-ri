import { GoogleGenerativeAI } from '@google/generative-ai'

export class GeminiProvider {
  constructor(apiKey, model = 'gemini-2.0-flash-exp') {
    this.apiKey = apiKey
    this.model = model
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  async chat(message, systemContext = '') {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model })

      const prompt = systemContext 
        ? `${systemContext}\n\nUser: ${message}` 
        : message

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return text || 'No response generated'
    } catch (error) {
      console.error('Gemini chat error:', error)
      throw new Error(`Gemini: ${error.message}`)
    }
  }

  async streamChat(message, systemContext = '', onChunk) {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model })

      const prompt = systemContext 
        ? `${systemContext}\n\nUser: ${message}` 
        : message

      const result = await model.generateContentStream(prompt)

      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        if (chunkText) {
          onChunk(chunkText)
        }
      }
    } catch (error) {
      console.error('Gemini stream error:', error)
      throw new Error(`Gemini streaming: ${error.message}`)
    }
  }

  async validateKey() {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model })
      const result = await model.generateContent('test')
      const response = await result.response
      return !!response.text()
    } catch (error) {
      console.error('Gemini validation error:', error)
      return false
    }
  }
}
