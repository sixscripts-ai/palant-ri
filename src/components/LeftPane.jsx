import React, { useState } from 'react'
import { Table, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import './LeftPane.css'

function LeftPane({ data, analysis, loading }) {
  const [viewMode, setViewMode] = useState('schema')

  if (loading) {
    return (
      <div className="left-pane">
        <div className="pane-loading">
          <div className="spinner"></div>
          <p>Analyzing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="left-pane">
      <div className="pane-header">
        <h3>Data Overview</h3>
        <div className="view-toggle">
          <button 
            className={viewMode === 'schema' ? 'active' : ''}
            onClick={() => setViewMode('schema')}
          >
            Schema
          </button>
          <button 
            className={viewMode === 'preview' ? 'active' : ''}
            onClick={() => setViewMode('preview')}
          >
            Preview
          </button>
        </div>
      </div>

      {viewMode === 'schema' && (
        <div className="schema-view">
          <div className="data-stats">
            <div className="stat-card">
              <span className="stat-label">Rows</span>
              <span className="stat-value">{data.rowCount.toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Columns</span>
              <span className="stat-value">{data.columnCount}</span>
            </div>
          </div>

          <div className="quality-section">
            <h4>Data Quality</h4>
            {analysis && analysis.quality && (
              <div className="quality-items">
                {analysis.quality.warnings.length > 0 ? (
                  <>
                    {analysis.quality.warnings.map((warning, idx) => (
                      <div key={idx} className="quality-item warning">
                        <AlertTriangle size={16} />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="quality-item success">
                    <CheckCircle size={16} />
                    <span>No data quality issues detected</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="columns-section">
            <h4>Columns ({data.headers.length})</h4>
            <div className="columns-list">
              {data.headers.map((header, idx) => {
                const columnData = data.rows.map(row => row[header])
                const type = inferType(columnData)
                const missing = columnData.filter(v => v == null || v === '').length
                const missingPct = ((missing / data.rowCount) * 100).toFixed(1)
                
                return (
                  <div key={idx} className="column-item">
                    <div className="column-header">
                      <span className="column-name">{header}</span>
                      <span className={`column-type ${type}`}>{type}</span>
                    </div>
                    {missing > 0 && (
                      <div className="column-meta">
                        <AlertTriangle size={12} />
                        <span>{missingPct}% missing ({missing} rows)</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'preview' && (
        <div className="preview-view">
          <div className="preview-info">
            <Info size={16} />
            <span>Showing first 10 rows</span>
          </div>
          <div className="preview-table-container">
            <table className="preview-table">
              <thead>
                <tr>
                  {data.headers.map((header, idx) => (
                    <th key={idx}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.slice(0, 10).map((row, idx) => (
                  <tr key={idx}>
                    {data.headers.map((header, cidx) => (
                      <td key={cidx}>{formatValue(row[header])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function inferType(values) {
  const nonNull = values.filter(v => v != null && v !== '')
  if (nonNull.length === 0) return 'unknown'
  
  const sample = nonNull[0]
  if (typeof sample === 'number') return 'number'
  if (typeof sample === 'boolean') return 'boolean'
  
  // Check if date
  if (typeof sample === 'string') {
    const dateTest = new Date(sample)
    if (!isNaN(dateTest.getTime()) && sample.match(/\d{4}[-\/]\d{2}[-\/]\d{2}/)) {
      return 'date'
    }
  }
  
  return 'text'
}

function formatValue(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

export default LeftPane
