import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import aiRouter from './routes/ai.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const server = createServer(app)

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  })
})

// API Routes
app.use('/api/ai', aiRouter)

// Error handling
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 Buddy.AI Backend API running on port ${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/health`)
  console.log(`🤖 AI endpoint: http://localhost:${PORT}/api/ai/chat`)
})

export default app
