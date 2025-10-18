import React, { useState } from 'react'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import LeftPane from './components/LeftPane'
import Dashboard from './components/Dashboard'
import ChatPane from './components/ChatPane'
import ChartRecommender from './components/ChartRecommender'
import ConversationalTransformer from './components/ConversationalTransformer'
import AgentActivityMonitor from './components/AgentActivityMonitor'
import SelfHealingPanel from './components/SelfHealingPanel'
import CodeGenerator from './components/CodeGenerator'
import { analyzeData } from './utils/analyzer'
import AgentOrchestrator from './agents/AgentOrchestrator'
import './App.css'

function App() {
  const [datasetName, setDatasetName] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [orchestrator] = useState(new AgentOrchestrator())
  const [showAdvancedTools, setShowAdvancedTools] = useState(false)
  const [agentActivity, setAgentActivity] = useState(false)

  const handleFileUpload = async (file, data) => {
    setLoading(true)
    setDatasetName(file.name)
    setParsedData(data)
    setAgentActivity(true)

    // Run multi-agent analysis
    setTimeout(async () => {
      const analysisResult = analyzeData(data)
      
      // Trigger autonomous agents
      await orchestrator.orchestrate('analyze_quality', data, {
        userQuery: 'Analyze data quality and provide insights'
      })
      
      setAnalysis(analysisResult)
      setLoading(false)
      
      // Keep agent activity visible for a bit
      setTimeout(() => setAgentActivity(false), 3000)
    }, 1500)
  }

  const handleReset = () => {
    setDatasetName(null)
    setParsedData(null)
    setAnalysis(null)
    setLoading(false)
  }

  return (
    <div className="app">
      <Header 
        datasetName={datasetName} 
        onReset={handleReset}
        analysis={analysis}
        onToggleAdvanced={() => setShowAdvancedTools(!showAdvancedTools)}
        showAdvanced={showAdvancedTools}
        onOpenChat={() => setShowChatPage(true)}
        onOpenSettings={() => setShowSettingsPage(true)}
        showChat={parsedData !== null}
      />
      
      {!parsedData ? (
        <UploadZone onFileUpload={handleFileUpload} />
      ) : (
        <>
          <AgentActivityMonitor 
            orchestrator={orchestrator}
            isActive={agentActivity}
          />
          
          <div className="main-layout">
            <LeftPane 
              data={parsedData} 
              analysis={analysis}
              loading={loading}
            />
            <Dashboard 
              data={parsedData} 
              analysis={analysis}
              loading={loading}
            />
          </div>

          {showAdvancedTools && (
            <div className="advanced-tools-section">
              <SelfHealingPanel 
                data={parsedData}
                onDataFixed={handleTransform}
              />
              
              <CodeGenerator 
                data={parsedData}
              />
              
              <ChartRecommender 
                data={parsedData}
                analysis={analysis}
              />
              
              <ConversationalTransformer 
                data={parsedData}
                onTransform={handleTransform}
              />
            </div>
          )}
        </>
      )}
      </div>
    </ErrorBoundary>
  )
}

export default App
