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

# Install serve for static files and pm2 for process management
RUN npm install -g serve pm2

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'node server/index.js &' >> /app/start.sh && \
    echo 'serve -s dist -l 3000' >> /app/start.sh && \
    echo 'wait' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000
EXPOSE 3001

CMD ["/app/start.sh"]
