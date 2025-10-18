import React, { useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, Activity, AlertCircle, Download, Maximize2 } from 'lucide-react'
import './Dashboard.css'

const COLORS = ['#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#fbbf24']

function Dashboard({ data, analysis, loading }) {
  const [viewMode, setViewMode] = useState('summary')

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Generating insights and visualizations...</p>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="view-selector">
          <button 
            className={viewMode === 'summary' ? 'active' : ''}
            onClick={() => setViewMode('summary')}
          >
            Executive Summary
          </button>
          <button 
            className={viewMode === 'full' ? 'active' : ''}
            onClick={() => setViewMode('full')}
          >
            Full Report
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {viewMode === 'summary' && (
          <SummaryView analysis={analysis} />
        )}
        {viewMode === 'full' && (
          <FullReportView analysis={analysis} data={data} />
        )}
      </div>
    </div>
  )
}

function SummaryView({ analysis }) {
  return (
    <div className="summary-view">
      <div className="executive-summary">
        <h2>Executive Summary</h2>
        <p className="summary-text">{analysis.summary}</p>
      </div>

      <div className="insights-grid">
        <h3>Key Insights</h3>
        <div className="insights-list">
          {analysis.insights.map((insight, idx) => (
            <div key={idx} className="insight-card">
              <div className="insight-header">
                <div className="insight-priority">#{idx + 1}</div>
                <TrendingUp size={20} />
              </div>
              <h4>{insight.title}</h4>
              <p>{insight.description}</p>
              <div className="insight-meta">
                <span className="impact-badge">{insight.impact} impact</span>
                <span className="confidence-badge">{insight.confidence}% confidence</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="quick-stats">
        <h3>Quick Statistics</h3>
        <div className="stats-grid">
          {Object.entries(analysis.statistics).map(([key, value], idx) => (
            <div key={idx} className="stat-box">
              <span className="stat-key">{formatKey(key)}</span>
              <span className="stat-val">{formatStatValue(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FullReportView({ analysis, data }) {
  return (
    <div className="full-report">
      <div className="report-section">
        <h3>Data Distribution</h3>
        <div className="chart-grid">
          {analysis.visualizations.slice(0, 2).map((viz, idx) => (
            <ChartCard key={idx} visualization={viz} />
          ))}
        </div>
      </div>

      <div className="report-section">
        <h3>Trends & Patterns</h3>
        <div className="chart-grid">
          {analysis.visualizations.slice(2, 4).map((viz, idx) => (
            <ChartCard key={idx} visualization={viz} />
          ))}
        </div>
      </div>

      <div className="report-section">
        <h3>Correlations & Analysis</h3>
        <div className="chart-grid">
          {analysis.visualizations.slice(4).map((viz, idx) => (
            <ChartCard key={idx} visualization={viz} />
          ))}
        </div>
      </div>

      <div className="report-section">
        <h3>Detailed Findings</h3>
        <div className="findings-list">
          {analysis.insights.map((insight, idx) => (
            <div key={idx} className="finding-card">
              <div className="finding-header">
                <h4>{insight.title}</h4>
                <span className={`priority-badge priority-${insight.impact.toLowerCase()}`}>
                  {insight.impact} Priority
                </span>
              </div>
              <p className="finding-description">{insight.description}</p>
              <div className="finding-meta">
                <Activity size={16} />
                <span>Confidence: {insight.confidence}%</span>
              </div>
              {insight.provenance && (
                <div className="provenance">
                  <AlertCircle size={14} />
                  <span>Based on: {insight.provenance}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChartCard({ visualization }) {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h4>{visualization.title}</h4>
        <div className="chart-actions">
          <button className="chart-action-btn">
            <Download size={16} />
          </button>
          <button className="chart-action-btn">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(visualization)}
        </ResponsiveContainer>
      </div>
      <p className="chart-description">{visualization.description}</p>
    </div>
  )
}

function renderChart(viz) {
  switch (viz.type) {
    case 'bar':
      return (
        <BarChart data={viz.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(15, 23, 42, 0.95)', 
              border: '1px solid rgba(96, 165, 250, 0.3)',
              borderRadius: '8px',
              color: '#e4e7eb'
            }} 
          />
          <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} />
        </BarChart>
      )
    case 'line':
      return (
        <LineChart data={viz.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(15, 23, 42, 0.95)', 
              border: '1px solid rgba(96, 165, 250, 0.3)',
              borderRadius: '8px',
              color: '#e4e7eb'
            }} 
          />
          <Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa' }} />
        </LineChart>
      )
    case 'pie':
      return (
        <PieChart>
          <Pie 
            data={viz.data} 
            dataKey="value" 
            nameKey="name" 
            cx="50%" 
            cy="50%" 
            outerRadius={80}
            label
          >
            {viz.data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(15, 23, 42, 0.95)', 
              border: '1px solid rgba(96, 165, 250, 0.3)',
              borderRadius: '8px',
              color: '#e4e7eb'
            }} 
          />
        </PieChart>
      )
    default:
      return null
  }
}

function formatKey(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatStatValue(value) {
  if (typeof value === 'number') {
    if (value > 1000000) return (value / 1000000).toFixed(2) + 'M'
    if (value > 1000) return (value / 1000).toFixed(2) + 'K'
    return value.toLocaleString()
  }
  return String(value)
}

export default Dashboard
