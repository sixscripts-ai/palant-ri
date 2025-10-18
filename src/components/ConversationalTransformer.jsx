import React, { useState } from 'react'
import { Wand2, Eye, Code, Undo, Play, CheckCircle, AlertTriangle } from 'lucide-react'
import './ConversationalTransformer.css'

function ConversationalTransformer({ data, onTransform }) {
  const [transformations, setTransformations] = useState([])
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState(null)
  const [history, setHistory] = useState([])

  const handleTransform = () => {
    if (!input.trim()) return

    const transformation = parseTransformation(input)
    const previewData = generatePreview(transformation, data)
    
    setPreview({
      transformation,
      data: previewData,
      status: 'pending'
    })
    
    setHistory([...history, {
      command: input,
      transformation,
      timestamp: new Date().toISOString()
    }])
  }

  const applyTransformation = () => {
    if (!preview) return

    const newData = executeTransformation(preview.transformation, data)
    onTransform(newData)
    
    setTransformations([...transformations, {
      ...preview.transformation,
      applied: true,
      timestamp: new Date().toISOString()
    }])
    
    setPreview(null)
    setInput('')
  }

  const suggestTransformation = () => {
    const suggestions = [
      'Remove rows where age > 100',
      'Create category column from price ranges',
      'Standardize date formats',
      'Fill missing values with mean',
      'Remove duplicate rows'
    ]
    
    return suggestions[Math.floor(Math.random() * suggestions.length)]
  }

  return (
    <div className="conversational-transformer">
      <div className="transformer-header">
        <Wand2 size={24} />
        <div>
          <h3>Conversational Data Transformation</h3>
          <p>Transform your data using natural language</p>
        </div>
      </div>

      <div className="transformation-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Remove rows where value > 1000"
          rows={2}
        />
        <div className="input-actions">
          <button onClick={() => setInput(suggestTransformation())} className="suggest-btn">
            <Wand2 size={16} />
            Suggest
          </button>
          <button onClick={handleTransform} className="transform-btn">
            <Eye size={16} />
            Preview
          </button>
        </div>
      </div>

      {preview && (
        <div className="transformation-preview">
          <div className="preview-header">
            <h4>Transformation Preview</h4>
            <div className="preview-actions">
              <button onClick={() => setPreview(null)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={applyTransformation} className="apply-btn">
                <CheckCircle size={16} />
                Apply
              </button>
            </div>
          </div>

          <div className="preview-details">
            <div className="detail-item">
              <span className="detail-label">Action:</span>
              <span className="detail-value">{preview.transformation.description}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Rows affected:</span>
              <span className="detail-value">{preview.data.rowsAffected} / {data.rowCount}</span>
            </div>
          </div>

          <div className="diff-view">
            <div className="diff-column">
              <h5>Before</h5>
              <div className="data-sample">
                {preview.data.before.map((row, idx) => (
                  <div key={idx} className="sample-row">
                    {JSON.stringify(row).slice(0, 80)}...
                  </div>
                ))}
              </div>
            </div>
            <div className="diff-column">
              <h5>After</h5>
              <div className="data-sample">
                {preview.data.after.map((row, idx) => (
                  <div key={idx} className="sample-row changed">
                    {JSON.stringify(row).slice(0, 80)}...
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="transformation-history">
        <h4>Transformation Pipeline</h4>
        {transformations.length === 0 ? (
          <p className="empty-state">No transformations applied yet</p>
        ) : (
          <div className="history-list">
            {transformations.map((trans, idx) => (
              <div key={idx} className="history-item">
                <CheckCircle size={16} className="success-icon" />
                <div className="history-details">
                  <span className="history-command">{trans.description}</span>
                  <span className="history-time">{new Date(trans.timestamp).toLocaleTimeString()}</span>
                </div>
                <button className="undo-btn" title="Undo">
                  <Undo size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="generated-code">
        <div className="code-header">
          <Code size={16} />
          <span>Generated Code</span>
        </div>
        <pre className="code-block">
          {generateTransformationCode(transformations)}
        </pre>
      </div>
    </div>
  )
}

function parseTransformation(input) {
  const inputLower = input.toLowerCase()

  if (inputLower.includes('remove') && inputLower.includes('where')) {
    const condition = input.match(/where\s+(.+)/i)?.[1] || ''
    return {
      type: 'filter',
      description: `Remove rows where ${condition}`,
      condition
    }
  }

  if (inputLower.includes('create') && inputLower.includes('column')) {
    return {
      type: 'create_column',
      description: 'Create new column',
      expression: input
    }
  }

  if (inputLower.includes('standardize') || inputLower.includes('normalize')) {
    return {
      type: 'standardize',
      description: 'Standardize data format',
      target: input
    }
  }

  if (inputLower.includes('fill') && inputLower.includes('missing')) {
    return {
      type: 'fill_missing',
      description: 'Fill missing values',
      method: 'mean'
    }
  }

  return {
    type: 'custom',
    description: input,
    expression: input
  }
}

function generatePreview(transformation, data) {
  const sampleSize = 5
  const before = data.rows.slice(0, sampleSize)
  const after = executeTransformationPreview(transformation, before)
  
  return {
    before,
    after,
    rowsAffected: estimateRowsAffected(transformation, data)
  }
}

function executeTransformationPreview(transformation, rows) {
  // Return modified rows based on transformation
  return rows.map(row => ({ ...row, _modified: true }))
}

function executeTransformation(transformation, data) {
  // Would actually transform the data
  return {
    ...data,
    rows: data.rows.map(row => ({ ...row, _transformed: true }))
  }
}

function estimateRowsAffected(transformation, data) {
  if (transformation.type === 'filter') {
    return Math.floor(data.rowCount * 0.15) // Estimate
  }
  return data.rowCount
}

function generateTransformationCode(transformations) {
  if (transformations.length === 0) {
    return '// No transformations applied yet'
  }

  return `import pandas as pd

def transform_data(df):
${transformations.map((t, idx) => 
  `    # Step ${idx + 1}: ${t.description}
    df = df  # Apply transformation here`
).join('\n')}
    
    return df

# Apply pipeline
result = transform_data(data)`
}

export default ConversationalTransformer
