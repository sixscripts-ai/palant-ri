# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including server dependencies)
RUN npm install

# Copy source files
COPY . .

# Build the frontend application
RUN npm run build

# Production stage with Node.js to run both frontend and backend
FROM node:18-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server

# Install serve for static files
RUN npm install -g serve

# Create startup script that runs both backend API and frontend
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Starting Buddy.AI Backend API..."' >> /app/start.sh && \
    echo 'node server/index.js &' >> /app/start.sh && \
    echo 'SERVER_PID=$!' >> /app/start.sh && \
    echo 'echo "📡 Backend API running on port 3001"' >> /app/start.sh && \
    echo 'sleep 2' >> /app/start.sh && \
    echo 'echo "🌐 Starting Frontend Server..."' >> /app/start.sh && \
    echo 'serve -s dist -l 3000 --cors' >> /app/start.sh && \
    echo 'wait $SERVER_PID' >> /app/start.sh && \
    chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

EXPOSE 3000
EXPOSE 3001

CMD ["/app/start.sh"]
