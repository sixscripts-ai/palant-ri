import React, { useState } from 'react'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import LeftPane from './components/LeftPane'
import Dashboard from './components/Dashboard'
import ChatPane from './components/ChatPane'
import { analyzeData } from './utils/analyzer'
import './App.css'

function App() {
  const [datasetName, setDatasetName] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFileUpload = async (file, data) => {
    setLoading(true)
    setDatasetName(file.name)
    setParsedData(data)

    // Simulate AI analysis
    setTimeout(() => {
      const analysisResult = analyzeData(data)
      setAnalysis(analysisResult)
      setLoading(false)
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
      />
      
      {!parsedData ? (
        <UploadZone onFileUpload={handleFileUpload} />
      ) : (
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
          <ChatPane 
            data={parsedData}
            analysis={analysis}
            datasetName={datasetName}
          />
        </div>
      )}
    </div>
  )
}

export default App
