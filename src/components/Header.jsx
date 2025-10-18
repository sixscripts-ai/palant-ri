import React, { useState } from 'react'
import { Lock, Upload, Download, Trash2, FileSpreadsheet, Sparkles, MessageCircle, Settings } from 'lucide-react'
import './Header.css'

function Header({ datasetName, onReset, analysis, onToggleAdvanced, showAdvanced, onOpenChat, showChat, onOpenSettings }) {
  const [ttl, setTtl] = useState(30)

  const handleExport = () => {
    if (!analysis) return
    
    const exportData = {
      dataset: datasetName,
      timestamp: new Date().toISOString(),
      summary: analysis.summary,
      insights: analysis.insights,
      statistics: analysis.statistics
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `buddy-ai-analysis-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <FileSpreadsheet size={24} />
          <span className="logo-text">Buddy.AI</span>
        </div>
        <div className="badge">
          <Lock size={12} />
          <span>Hidden Admin Page</span>
        </div>
      </div>

      {datasetName && (
        <div className="header-center">
          <div className="dataset-info">
            <span className="dataset-label">Dataset:</span>
            <span className="dataset-name">{datasetName}</span>
          </div>
        </div>
      )}

      <div className="header-right">
        <button 
          className="header-btn settings-btn"
          onClick={onOpenSettings}
          title="Configure AI Settings"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
        {datasetName && (
          <>
            <div className="ttl-indicator">
              <span>TTL: {ttl} days</span>
            </div>
            {showChat && (
              <button 
                className="header-btn chat-btn"
                onClick={onOpenChat}
              >
                <MessageCircle size={18} />
                <span>AI Chat</span>
              </button>
            )}
            <button 
              className={`header-btn ${showAdvanced ? 'active' : ''}`}
              onClick={onToggleAdvanced}
            >
              <Sparkles size={18} />
              <span>AI Tools</span>
            </button>
            <button className="header-btn" onClick={handleExport} disabled={!analysis}>
              <Download size={18} />
              <span>Export</span>
            </button>
            <button className="header-btn danger" onClick={onReset}>
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}

export default Header
