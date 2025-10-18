import React, { useState, useEffect } from 'react'
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp, Sparkles, Plus, Layout } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import './ChartRecommender.css'

const COLORS = ['#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#fbbf24', '#8b5cf6', '#ec4899']

function ChartRecommender({ data, analysis }) {
  const [recommendations, setRecommendations] = useState([])
  const [selectedCharts, setSelectedCharts] = useState([])
  const [dashboardMode, setDashboardMode] = useState(false)

  useEffect(() => {
    if (data && analysis) {
      const recs = generateChartRecommendations(data, analysis)
      setRecommendations(recs)
    }
  }, [data, analysis])

  const addToDashboard = (chart) => {
    setSelectedCharts([...selectedCharts, { ...chart, id: Date.now() }])
  }

  const removeFromDashboard = (id) => {
    setSelectedCharts(selectedCharts.filter(c => c.id !== id))
  }

  return (
    <div className="chart-recommender">
      <div className="recommender-header">
        <div className="header-left">
          <Sparkles size={24} />
          <div>
            <h3>Intelligent Chart Recommender</h3>
            <p>{recommendations.length} visualizations suggested based on your data</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className={`mode-toggle ${dashboardMode ? 'active' : ''}`}
            onClick={() => setDashboardMode(!dashboardMode)}
          >
            <Layout size={16} />
            {dashboardMode ? 'View Recommendations' : 'Build Dashboard'}
          </button>
        </div>
      </div>

      {!dashboardMode ? (
        <div className="recommendations-grid">
          {recommendations.map((rec, idx) => (
            <RecommendationCard 
              key={idx} 
              recommendation={rec} 
              onAdd={addToDashboard}
            />
          ))}
        </div>
      ) : (
        <DashboardBuilder 
          charts={selectedCharts}
          onRemove={removeFromDashboard}
          recommendations={recommendations}
          onAdd={addToDashboard}
        />
      )}
    </div>
  )
}

function RecommendationCard({ recommendation, onAdd }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="recommendation-card">
      <div className="card-header">
        <div className="chart-icon">
          {getChartIcon(recommendation.type)}
        </div>
        <div className="card-title">
          <h4>{recommendation.title}</h4>
          <span className={`confidence-badge level-${recommendation.confidenceLevel}`}>
            {recommendation.confidence}% match
          </span>
        </div>
      </div>

      <div className="chart-preview">
        <ResponsiveContainer width="100%" height={180}>
          {renderChartPreview(recommendation)}
        </ResponsiveContainer>
      </div>

      <p className="recommendation-reason">{recommendation.reason}</p>

      <div className="card-meta">
        <div className="meta-item">
          <span className="meta-label">Best for:</span>
          <span className="meta-value">{recommendation.useCase}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Complexity:</span>
          <span className="meta-value">{recommendation.complexity}</span>
        </div>
      </div>

      {expanded && (
        <div className="expanded-details">
          <div className="detail-section">
            <h5>Why this chart?</h5>
            <p>{recommendation.explanation}</p>
          </div>
          <div className="detail-section">
            <h5>Insights revealed:</h5>
            <ul>
              {recommendation.insights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="card-actions">
        <button 
          className="expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Less' : 'More'} Details
        </button>
        <button 
          className="add-btn"
          onClick={() => onAdd(recommendation)}
        >
          <Plus size={16} />
          Add to Dashboard
        </button>
      </div>
    </div>
  )
}

function DashboardBuilder({ charts, onRemove, recommendations, onAdd }) {
  const [layout, setLayout] = useState('grid') // grid, rows, columns

  return (
    <div className="dashboard-builder">
      <div className="builder-controls">
        <div className="layout-selector">
          <span>Layout:</span>
          <button 
            className={layout === 'grid' ? 'active' : ''}
            onClick={() => setLayout('grid')}
          >
            Grid
          </button>
          <button 
            className={layout === 'rows' ? 'active' : ''}
            onClick={() => setLayout('rows')}
          >
            Rows
          </button>
          <button 
            className={layout === 'columns' ? 'active' : ''}
            onClick={() => setLayout('columns')}
          >
            Columns
          </button>
        </div>
        <div className="dashboard-actions">
          <button className="export-btn">Export Dashboard</button>
          <button className="share-btn">Share</button>
        </div>
      </div>

      {charts.length === 0 ? (
        <div className="empty-dashboard">
          <Layout size={48} />
          <h4>Your dashboard is empty</h4>
          <p>Add charts from the recommendations below</p>
          
          <div className="quick-add-suggestions">
            <h5>Quick suggestions:</h5>
            <div className="suggestion-buttons">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <button 
                  key={idx}
                  className="suggestion-btn"
                  onClick={() => onAdd(rec)}
                >
                  <Plus size={14} />
                  {rec.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={`dashboard-canvas layout-${layout}`}>
          {charts.map((chart) => (
            <div key={chart.id} className="dashboard-chart">
              <div className="chart-controls">
                <button 
                  className="remove-btn"
                  onClick={() => onRemove(chart.id)}
                >
                  ×
                </button>
              </div>
              <h4>{chart.title}</h4>
              <div className="chart-container-dashboard">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChartPreview(chart)}
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function generateChartRecommendations(data, analysis) {
  const recommendations = []
  const numericCols = getNumericColumns(data)
  const categoricalCols = getCategoricalColumns(data)
  const dateColumns = getDateColumns(data)

  // Time series line chart
  if (dateColumns.length > 0 && numericCols.length > 0) {
    recommendations.push({
      type: 'line',
      title: `${numericCols[0]} Trend Over Time`,
      reason: 'Time-series data detected - perfect for showing trends',
      confidence: 95,
      confidenceLevel: 'high',
      useCase: 'Temporal trends',
      complexity: 'Simple',
      explanation: 'Line charts excel at showing how values change over time, making patterns and trends immediately visible.',
      insights: [
        'Identify growth or decline patterns',
        'Spot seasonal variations',
        'Detect anomalies in timeline'
      ],
      data: generateTimeSeriesData(data, numericCols[0], dateColumns[0]),
      dataKey: numericCols[0]
    })
  }

  // Category breakdown pie chart
  if (categoricalCols.length > 0) {
    recommendations.push({
      type: 'pie',
      title: `${categoricalCols[0]} Distribution`,
      reason: 'Categorical data perfect for showing proportions',
      confidence: 92,
      confidenceLevel: 'high',
      useCase: 'Category distribution',
      complexity: 'Simple',
      explanation: 'Pie charts show how different categories contribute to the whole, ideal for understanding composition.',
      insights: [
        'Visualize market share',
        'Compare segment sizes',
        'Identify dominant categories'
      ],
      data: generateCategoryData(data, categoricalCols[0])
    })
  }

  // Comparison bar chart
  if (numericCols.length > 0 && categoricalCols.length > 0) {
    recommendations.push({
      type: 'bar',
      title: `${numericCols[0]} by ${categoricalCols[0]}`,
      reason: 'Compare values across categories',
      confidence: 90,
      confidenceLevel: 'high',
      useCase: 'Category comparison',
      complexity: 'Simple',
      explanation: 'Bar charts are ideal for comparing values across different categories side by side.',
      insights: [
        'Compare performance across segments',
        'Identify top and bottom performers',
        'Spot significant differences'
      ],
      data: generateComparisonData(data, numericCols[0], categoricalCols[0]),
      dataKey: numericCols[0]
    })
  }

  // Scatter plot for correlation
  if (numericCols.length >= 2) {
    recommendations.push({
      type: 'scatter',
      title: `${numericCols[0]} vs ${numericCols[1]} Correlation`,
      reason: 'Two numeric variables - explore relationships',
      confidence: 85,
      confidenceLevel: 'medium',
      useCase: 'Correlation analysis',
      complexity: 'Medium',
      explanation: 'Scatter plots reveal correlations and patterns between two numeric variables.',
      insights: [
        'Discover correlations',
        'Identify clusters',
        'Spot outliers in 2D space'
      ],
      data: generateScatterData(data, numericCols[0], numericCols[1]),
      xKey: numericCols[0],
      yKey: numericCols[1]
    })
  }

  // Area chart for cumulative trends
  if (numericCols.length > 0) {
    recommendations.push({
      type: 'area',
      title: `Cumulative ${numericCols[0]}`,
      reason: 'Show accumulation and overall magnitude',
      confidence: 80,
      confidenceLevel: 'medium',
      useCase: 'Cumulative trends',
      complexity: 'Simple',
      explanation: 'Area charts emphasize magnitude and cumulative totals over time.',
      insights: [
        'Visualize total accumulation',
        'Compare multiple series stacked',
        'Show volume of change'
      ],
      data: generateTimeSeriesData(data, numericCols[0]),
      dataKey: numericCols[0]
    })
  }

  // Stacked bar for composition over categories
  if (numericCols.length >= 2 && categoricalCols.length > 0) {
    recommendations.push({
      type: 'stacked-bar',
      title: `Multi-metric Comparison by ${categoricalCols[0]}`,
      reason: 'Compare multiple metrics across categories',
      confidence: 88,
      confidenceLevel: 'high',
      useCase: 'Multi-dimensional comparison',
      complexity: 'Medium',
      explanation: 'Stacked bars show both individual values and total composition across categories.',
      insights: [
        'Compare total and parts simultaneously',
        'Understand component contribution',
        'Identify patterns across metrics'
      ],
      data: generateMultiMetricData(data, numericCols.slice(0, 3), categoricalCols[0]),
      metrics: numericCols.slice(0, 3)
    })
  }

  // Radar chart for multi-dimensional comparison
  if (numericCols.length >= 3 && categoricalCols.length > 0) {
    const categories = getCategoryValues(data, categoricalCols[0]).slice(0, 3)
    if (categories.length >= 2) {
      recommendations.push({
        type: 'radar',
        title: `Multi-dimensional Profile Comparison`,
        reason: 'Compare entities across multiple dimensions',
        confidence: 75,
        confidenceLevel: 'medium',
        useCase: 'Profile comparison',
        complexity: 'Complex',
        explanation: 'Radar charts show multi-dimensional profiles, perfect for comparing entities holistically.',
        insights: [
          'Compare overall profiles',
          'Identify strengths and weaknesses',
          'Spot pattern differences'
        ],
        data: generateRadarData(data, numericCols.slice(0, 5), categoricalCols[0], categories),
        categories: categories
      })
    }
  }

  return recommendations.sort((a, b) => b.confidence - a.confidence)
}

function getChartIcon(type) {
  const icons = {
    line: <LineChartIcon size={20} />,
    bar: <BarChart3 size={20} />,
    pie: <PieChartIcon size={20} />,
    scatter: <TrendingUp size={20} />,
    area: <LineChartIcon size={20} />,
    'stacked-bar': <BarChart3 size={20} />,
    radar: <TrendingUp size={20} />
  }
  return icons[type] || <BarChart3 size={20} />
}

function renderChartPreview(rec) {
  switch (rec.type) {
    case 'line':
      return (
        <LineChart data={rec.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '6px' }} />
          <Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2} dot={false} />
        </LineChart>
      )

    case 'bar':
      return (
        <BarChart data={rec.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '6px' }} />
          <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} />
        </BarChart>
      )

    case 'pie':
      return (
        <PieChart>
          <Pie data={rec.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={false}>
            {rec.data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '6px' }} />
        </PieChart>
      )

    case 'scatter':
      return (
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="x" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis dataKey="y" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '6px' }} />
          <Scatter data={rec.data} fill="#60a5fa" />
        </ScatterChart>
      )

    case 'area':
      return (
        <AreaChart data={rec.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '6px' }} />
          <Area type="monotone" dataKey="value" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.3} />
        </AreaChart>
      )

    case 'stacked-bar':
      return (
        <BarChart data={rec.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '6px' }} />
          {rec.metrics?.map((metric, idx) => (
            <Bar key={metric} dataKey={metric} stackId="a" fill={COLORS[idx % COLORS.length]} />
          ))}
        </BarChart>
      )

    case 'radar':
      return (
        <RadarChart data={rec.data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '6px' }} />
          {rec.categories?.map((cat, idx) => (
            <Radar key={cat} name={cat} dataKey={cat} stroke={COLORS[idx]} fill={COLORS[idx]} fillOpacity={0.3} />
          ))}
        </RadarChart>
      )

    default:
      return null
  }
}

// Helper functions for data generation
function getNumericColumns(data) {
  return data.headers.filter(h => {
    const vals = data.rows.map(r => r[h]).filter(v => v != null)
    return vals.length > 0 && typeof vals[0] === 'number'
  })
}

function getCategoricalColumns(data) {
  return data.headers.filter(h => {
    const vals = data.rows.map(r => r[h]).filter(v => v != null && v !== '')
    if (vals.length === 0) return false
    const uniqueCount = new Set(vals).size
    return uniqueCount < vals.length * 0.5 && typeof vals[0] === 'string'
  })
}

function getDateColumns(data) {
  return data.headers.filter(h => {
    const vals = data.rows.map(r => r[h]).filter(v => v != null && v !== '')
    if (vals.length === 0) return false
    const sample = vals[0]
    if (typeof sample !== 'string') return false
    return sample.match(/\d{4}[-\/]\d{2}[-\/]\d{2}/)
  })
}

function getCategoryValues(data, column) {
  const values = data.rows.map(r => r[column]).filter(v => v != null)
  return [...new Set(values)]
}

function generateTimeSeriesData(data, numericCol, dateCol) {
  const sampleSize = Math.min(20, data.rows.length)
  const step = Math.floor(data.rows.length / sampleSize)
  const result = []
  
  for (let i = 0; i < data.rows.length; i += step) {
    const row = data.rows[i]
    result.push({
      name: dateCol ? String(row[dateCol]).slice(0, 10) : `#${i + 1}`,
      value: row[numericCol] || 0
    })
  }
  
  return result
}

function generateCategoryData(data, categoryCol) {
  const distribution = {}
  data.rows.forEach(row => {
    const cat = row[categoryCol] || 'Unknown'
    distribution[cat] = (distribution[cat] || 0) + 1
  })
  
  return Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }))
}

function generateComparisonData(data, numericCol, categoryCol) {
  const grouped = {}
  data.rows.forEach(row => {
    const cat = row[categoryCol] || 'Unknown'
    if (!grouped[cat]) grouped[cat] = []
    if (row[numericCol] != null) grouped[cat].push(row[numericCol])
  })
  
  return Object.entries(grouped)
    .map(([name, values]) => ({
      name,
      value: values.reduce((a, b) => a + b, 0) / values.length
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
}

function generateScatterData(data, col1, col2) {
  return data.rows
    .filter(r => r[col1] != null && r[col2] != null)
    .slice(0, 100)
    .map(r => ({ x: r[col1], y: r[col2] }))
}

function generateMultiMetricData(data, metrics, categoryCol) {
  const grouped = {}
  data.rows.forEach(row => {
    const cat = row[categoryCol] || 'Unknown'
    if (!grouped[cat]) {
      grouped[cat] = metrics.reduce((acc, m) => ({ ...acc, [m]: [] }), {})
    }
    metrics.forEach(metric => {
      if (row[metric] != null) grouped[cat][metric].push(row[metric])
    })
  })
  
  return Object.entries(grouped)
    .map(([name, metricArrays]) => {
      const result = { name }
      metrics.forEach(metric => {
        const values = metricArrays[metric]
        result[metric] = values.length > 0 
          ? values.reduce((a, b) => a + b, 0) / values.length 
          : 0
      })
      return result
    })
    .slice(0, 8)
}

function generateRadarData(data, metrics, categoryCol, categories) {
  const grouped = {}
  data.rows.forEach(row => {
    const cat = row[categoryCol]
    if (categories.includes(cat)) {
      if (!grouped[cat]) {
        grouped[cat] = metrics.reduce((acc, m) => ({ ...acc, [m]: [] }), {})
      }
      metrics.forEach(metric => {
        if (row[metric] != null) grouped[cat][metric].push(row[metric])
      })
    }
  })
  
  return metrics.map(metric => {
    const point = { metric }
    categories.forEach(cat => {
      const values = grouped[cat]?.[metric] || []
      point[cat] = values.length > 0 
        ? values.reduce((a, b) => a + b, 0) / values.length 
        : 0
    })
    return point
  })
}

export default ChartRecommender
