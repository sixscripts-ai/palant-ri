import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Zap, ChevronDown, ChevronRight, Info, Play, Undo } from 'lucide-react'
import { SelfHealingAgent } from '../agents/SelfHealingAgent'
import './SelfHealingPanel.css'

function SelfHealingPanel({ data, onDataFixed }) {
  const [agent] = useState(new SelfHealingAgent())
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedFixes, setSelectedFixes] = useState([])
  const [expandedIssues, setExpandedIssues] = useState(new Set())
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (data) {
      runAnalysis()
    }
  }, [data])

  const runAnalysis = () => {
    setAnalyzing(true)
    setTimeout(() => {
      const qualityAnalysis = agent.analyzeQuality(data)
      setAnalysis(qualityAnalysis)
      
      // Auto-select recommended fixes
      const autoSelected = []
      Object.values(qualityAnalysis.issues).flat().forEach(issue => {
        if (issue.strategies) {
          const recommended = issue.strategies.find(s => s.recommended)
          if (recommended) {
            autoSelected.push({
              type: issue.type,
              column: issue.column,
              strategy: recommended,
              issueData: issue
            })
          }
        }
      })
      setSelectedFixes(autoSelected)
      setAnalyzing(false)
    }, 800)
  }

  const toggleIssue = (issueId) => {
    const newExpanded = new Set(expandedIssues)
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId)
    } else {
      newExpanded.add(issueId)
    }
    setExpandedIssues(newExpanded)
  }

  const selectStrategy = (issue, strategy) => {
    const newFixes = selectedFixes.filter(f => !(f.type === issue.type && f.column === issue.column))
    newFixes.push({
      type: issue.type,
      column: issue.column,
      strategy,
      issueData: issue
    })
    setSelectedFixes(newFixes)
  }

  const applyFixes = () => {
    setApplying(true)
    setTimeout(() => {
      const fixResult = agent.applyFixes(data, selectedFixes)
      setResult(fixResult)
      setApplying(false)
      
      if (fixResult.success && onDataFixed) {
        onDataFixed(fixResult.data)
      }
    }, 1500)
  }

  const undoFixes = () => {
    setResult(null)
    runAnalysis()
  }

  if (analyzing) {
    return (
      <div className="self-healing-panel">
        <div className="panel-loading">
          <div className="spinner"></div>
          <p>Analyzing data quality...</p>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ff3b30'
      case 'high': return '#ff9500'
      case 'medium': return '#ffcc00'
      case 'low': return '#34c759'
      default: return '#8e8e93'
    }
  }

  const getSeverityIcon = (severity) => {
    if (severity === 'critical' || severity === 'high') {
      return <AlertTriangle size={20} color={getSeverityColor(severity)} />
    }
    return <Info size={20} color={getSeverityColor(severity)} />
  }

  return (
    <div className="self-healing-panel">
      <div className="panel-header">
        <div className="header-title">
          <Zap size={24} color="#007aff" />
          <div>
            <h2>Self-Healing Data Pipeline</h2>
            <p className="subtitle">
              {analysis.totalIssues} issues detected • {analysis.severity.toUpperCase()} severity
            </p>
          </div>
        </div>
        {result && (
          <button className="undo-button" onClick={undoFixes}>
            <Undo size={18} />
            Undo Changes
          </button>
        )}
      </div>

      {result ? (
        <div className="result-section">
          <div className="result-header success">
            <CheckCircle size={24} />
            <div>
              <h3>Data Successfully Healed</h3>
              <p>{result.changes.length} fixes applied</p>
            </div>
          </div>
          
          <div className="changes-list">
            {result.changes.map((change, idx) => (
              <div key={idx} className="change-item">
                <CheckCircle size={16} color="#34c759" />
                <span>{change.description}</span>
              </div>
            ))}
          </div>

          {result.errors.length > 0 && (
            <div className="errors-section">
              <h4>Errors</h4>
              {result.errors.map((error, idx) => (
                <div key={idx} className="error-item">
                  <AlertTriangle size={16} color="#ff3b30" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="recommendations-section">
            <h3>Recommended Actions</h3>
            <div className="recommendations-list">
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className={`recommendation-card priority-${rec.priority}`}>
                  <div className="rec-header">
                    <span className={`priority-badge ${rec.priority}`}>{rec.priority.toUpperCase()}</span>
                    <h4>{rec.title}</h4>
                  </div>
                  <p>{rec.action}</p>
                  {rec.automatable && (
                    <div className="rec-badge">
                      <Zap size={14} />
                      <span>Auto-fixable</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="issues-section">
            <h3>Detected Issues</h3>
            
            {/* Missing Values */}
            {analysis.issues.missingValues.length > 0 && (
              <div className="issue-category">
                <h4 className="category-title">
                  <AlertTriangle size={18} color="#ff9500" />
                  Missing Values ({analysis.issues.missingValues.length} columns)
                </h4>
                {analysis.issues.missingValues.map((issue, idx) => (
                  <IssueCard
                    key={`missing-${idx}`}
                    issue={issue}
                    issueId={`missing-${idx}`}
                    expanded={expandedIssues.has(`missing-${idx}`)}
                    onToggle={() => toggleIssue(`missing-${idx}`)}
                    selectedStrategy={selectedFixes.find(f => f.type === issue.type && f.column === issue.column)?.strategy}
                    onSelectStrategy={(strategy) => selectStrategy(issue, strategy)}
                    getSeverityColor={getSeverityColor}
                    getSeverityIcon={getSeverityIcon}
                  />
                ))}
              </div>
            )}

            {/* Outliers */}
            {analysis.issues.outliers.length > 0 && (
              <div className="issue-category">
                <h4 className="category-title">
                  <AlertTriangle size={18} color="#ffcc00" />
                  Outliers ({analysis.issues.outliers.length} columns)
                </h4>
                {analysis.issues.outliers.map((issue, idx) => (
                  <IssueCard
                    key={`outlier-${idx}`}
                    issue={issue}
                    issueId={`outlier-${idx}`}
                    expanded={expandedIssues.has(`outlier-${idx}`)}
                    onToggle={() => toggleIssue(`outlier-${idx}`)}
                    selectedStrategy={selectedFixes.find(f => f.type === issue.type && f.column === issue.column)?.strategy}
                    onSelectStrategy={(strategy) => selectStrategy(issue, strategy)}
                    getSeverityColor={getSeverityColor}
                    getSeverityIcon={getSeverityIcon}
                  />
                ))}
              </div>
            )}

            {/* Duplicates */}
            {analysis.issues.duplicates.length > 0 && (
              <div className="issue-category">
                <h4 className="category-title">
                  <AlertTriangle size={18} color="#ff9500" />
                  Duplicate Rows ({analysis.issues.duplicates[0].count} duplicates)
                </h4>
                {analysis.issues.duplicates.map((issue, idx) => (
                  <IssueCard
                    key={`dup-${idx}`}
                    issue={issue}
                    issueId={`dup-${idx}`}
                    expanded={expandedIssues.has(`dup-${idx}`)}
                    onToggle={() => toggleIssue(`dup-${idx}`)}
                    selectedStrategy={selectedFixes.find(f => f.type === issue.type)?.strategy}
                    onSelectStrategy={(strategy) => selectStrategy(issue, strategy)}
                    getSeverityColor={getSeverityColor}
                    getSeverityIcon={getSeverityIcon}
                  />
                ))}
              </div>
            )}

            {/* Type Issues */}
            {analysis.issues.typeIssues.length > 0 && (
              <div className="issue-category">
                <h4 className="category-title">
                  <Info size={18} color="#007aff" />
                  Type Inconsistencies ({analysis.issues.typeIssues.length} columns)
                </h4>
                {analysis.issues.typeIssues.map((issue, idx) => (
                  <IssueCard
                    key={`type-${idx}`}
                    issue={issue}
                    issueId={`type-${idx}`}
                    expanded={expandedIssues.has(`type-${idx}`)}
                    onToggle={() => toggleIssue(`type-${idx}`)}
                    selectedStrategy={selectedFixes.find(f => f.type === issue.type && f.column === issue.column)?.strategy}
                    onSelectStrategy={(strategy) => selectStrategy(issue, strategy)}
                    getSeverityColor={getSeverityColor}
                    getSeverityIcon={getSeverityIcon}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="action-bar">
            <div className="action-info">
              <span className="fix-count">{selectedFixes.length} fixes selected</span>
              <span className="fix-desc">Recommended strategies are pre-selected</span>
            </div>
            <button 
              className="apply-button"
              onClick={applyFixes}
              disabled={selectedFixes.length === 0 || applying}
            >
              {applying ? (
                <>
                  <div className="button-spinner"></div>
                  Applying Fixes...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Apply {selectedFixes.length} Fixes
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function IssueCard({ issue, issueId, expanded, onToggle, selectedStrategy, onSelectStrategy, getSeverityColor, getSeverityIcon }) {
  return (
    <div className="issue-card">
      <div className="issue-header" onClick={onToggle}>
        <div className="issue-info">
          {getSeverityIcon(issue.severity)}
          <div>
            <h5>
              {issue.column ? `Column: ${issue.column}` : issue.type === 'duplicates' ? 'Duplicate Rows' : 'Data Issue'}
            </h5>
            <p className="issue-meta">
              {issue.count} issues ({issue.percentage}%) • {issue.severity.toUpperCase()} severity
            </p>
          </div>
        </div>
        <button className="expand-button">
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {expanded && (
        <div className="issue-body">
          {issue.type === 'outliers' && (
            <div className="issue-details">
              <p><strong>Bounds:</strong> {issue.bounds.lower.toFixed(2)} to {issue.bounds.upper.toFixed(2)}</p>
              <p><strong>IQR:</strong> {issue.iqr.toFixed(2)}</p>
            </div>
          )}

          {issue.type === 'duplicates' && (
            <div className="issue-details">
              <p><strong>Duplicate Groups:</strong> {issue.groups}</p>
              <p><strong>Total Duplicates:</strong> {issue.count}</p>
            </div>
          )}

          {issue.type === 'typeIssues' && (
            <div className="issue-details">
              <p><strong>Dominant Type:</strong> {issue.dominantType}</p>
              <p><strong>Inconsistent Values:</strong> {issue.inconsistentCount}</p>
            </div>
          )}

          <div className="strategies-section">
            <h6>Fix Strategies</h6>
            <div className="strategies-list">
              {issue.strategies?.map((strategy, idx) => (
                <div
                  key={idx}
                  className={`strategy-card ${selectedStrategy?.name === strategy.name ? 'selected' : ''} ${strategy.recommended ? 'recommended' : ''}`}
                  onClick={() => onSelectStrategy(strategy)}
                >
                  <div className="strategy-header">
                    <div className="strategy-title">
                      <input
                        type="radio"
                        checked={selectedStrategy?.name === strategy.name}
                        onChange={() => onSelectStrategy(strategy)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="strategy-name">{strategy.name}</span>
                      {strategy.recommended && (
                        <span className="recommended-badge">RECOMMENDED</span>
                      )}
                    </div>
                    <span className="confidence-badge">
                      {strategy.confidence}% confidence
                    </span>
                  </div>
                  
                  <p className="strategy-description">{strategy.description}</p>
                  <p className="strategy-impact">
                    <strong>Impact:</strong> {strategy.impact}
                  </p>
                  
                  <div className="pros-cons">
                    <div className="pros">
                      <strong>Pros:</strong>
                      <ul>
                        {strategy.pros.map((pro, i) => (
                          <li key={i}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="cons">
                      <strong>Cons:</strong>
                      <ul>
                        {strategy.cons.map((con, i) => (
                          <li key={i}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SelfHealingPanel
