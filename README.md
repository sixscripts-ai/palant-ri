# Buddy.AI - Spreadsheet Intelligence Platform

An advanced AI-powered data analysis platform that helps you understand your spreadsheet data through conversation.

## 🌐 Live Demo

**GitHub Pages**: [https://sixscripts-ai.github.io/palant-ri/](https://sixscripts-ai.github.io/palant-ri/)

> **Note**: To enable the live site, go to [Repository Settings → Pages](https://github.com/sixscripts-ai/palant-ri/settings/pages) and select "GitHub Actions" as the deployment source.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd palant-ri
```

2. Install dependencies:
```bash
npm install
```

3. Configure API keys:
   - Copy `.env.example` to `.env`
   - Add your AI provider API keys to `.env`
   - Or configure them in the Settings UI after starting the application

4. Start the development servers:
```bash
npm start
```

This will start:
- **Backend API**: http://localhost:3001
- **Frontend UI**: http://localhost:7777

### Individual Server Commands

Start only the backend:
```bash
npm run server
```

Start only the frontend:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## 🔑 API Key Configuration

The application supports three AI providers:

1. **Google Gemini** - Get your key at https://aistudio.google.com/app/apikey
2. **Anthropic Claude** - Get your key at https://console.anthropic.com/settings/keys
3. **Perplexity** - Get your key at https://www.perplexity.ai/settings/api

You can configure these either:
- In the `.env` file (server-side, for development)
- In the Settings UI (client-side, stored in browser localStorage)

## 🏗️ Architecture

- **Frontend**: React + Vite (Port 7777)
- **Backend**: Express.js API (Port 3001)
- **AI Providers**: Gemini, Anthropic Claude, Perplexity
- **Data Analysis**: Multi-agent orchestration system

## 📦 Docker Deployment

Build and run with Docker:
```bash
docker build -t buddy-ai .
docker run -p 7777:7777 -p 3001:3001 buddy-ai
```

## 🔒 Security

- API keys stored in browser localStorage (client-side) are never sent to our servers except for validation
- Server-side .env keys are only used for backend operations
- All API communication happens directly between your browser and the AI providers

## 📝 Features

- **Upload & Analyze** - Support for CSV, TSV, XLSX, XLS, ODS formats
- **AI Chat** - Natural language queries about your data
- **Code Generation** - Generate Python/R/SQL code for analysis
- **Data Quality** - Automatic issue detection and healing
- **Pattern Discovery** - Uncover hidden insights
- **Multi-Agent System** - Specialized agents for different analysis tasks

## 🛠️ Development

The project uses ES modules throughout. Key directories:

- `/src` - React frontend components
- `/server` - Express backend API
- `/server/providers` - AI provider integrations
- `/server/routes` - API endpoints

## 📄 License

[Add your license here]
