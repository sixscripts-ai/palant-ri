import React, { useState } from 'react'
import { Code, Play, Copy, Check, ChevronDown, ChevronRight, Sparkles, Info } from 'lucide-react'
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent'
import './CodeGenerator.css'

function CodeGenerator({ data }) {
  const [agent] = useState(new CodeGeneratorAgent())
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('python')
  const [result, setResult] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [expandedSection, setExpandedSection] = useState('code')

  const exampleQueries = [
    'Show me the average of the first numeric column by category',
    'Find the top 10 highest values',
    'Calculate 3-month rolling average of revenue',
    'Group sales by region and show total',
    'Filter rows where value is greater than 100',
    'Show sum of all numeric columns'
  ]

  const handleGenerate = () => {
    if (!query.trim()) return

    setGenerating(true)
    setExecutionResult(null)
    
    setTimeout(() => {
      const codeResult = agent.generateCode(query, data, language)
      setResult(codeResult)
      setGenerating(false)
      setExpandedSection('code')
    }, 1000)
  }

  const handleExecute = () => {
    if (!result) return

    setExecuting(true)
    setTimeout(() => {
      const execResult = agent.executeCode(result, data)
      setExecutionResult(execResult)
      setExecuting(false)
      setExpandedSection('execution')
    }, 800)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate()
    }
  }

  return (
    <div className="code-generator">
      <div className="generator-header">
        <div className="header-title">
          <Code size={24} color="#007aff" />
          <div>
            <h2>Natural Language to Code</h2>
            <p className="subtitle">Convert plain English to executable Python, R, or SQL</p>
          </div>
        </div>
      </div>

      <div className="query-section">
        <div className="language-selector">
          {['python', 'r', 'sql'].map(lang => (
            <button
              key={lang}
              className={`lang-button ${language === lang ? 'active' : ''}`}
              onClick={() => setLanguage(lang)}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="query-input-container">
          <textarea
            className="query-input"
            placeholder="Describe what you want to do in plain English...
Example: Show me the top 10 customers by revenue"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={3}
          />
          <button 
            className="generate-button"
            onClick={handleGenerate}
            disabled={generating || !query.trim()}
          >
            {generating ? (
              <>
                <div className="button-spinner"></div>
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Code
              </>
            )}
          </button>
        </div>

        <div className="example-queries">
          <span className="example-label">Try these examples:</span>
          <div className="example-chips">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                className="example-chip"
                onClick={() => setQuery(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <div className="results-section">
          {/* Summary */}
          <div className="result-summary">
            <Info size={18} color="#007aff" />
            <p>{result.explanation.summary}</p>
          </div>

          {/* Generated Code */}
          <div className="result-card">
            <div 
              className="card-header"
              onClick={() => toggleSection('code')}
            >
              <div className="card-title">
                <Code size={20} />
                <h3>Generated {result.language.toUpperCase()} Code</h3>
                <span className="complexity-badge">
                  {result.explanation.complexity.level}
                </span>
              </div>
              <div className="card-actions">
                {expandedSection === 'code' && (
                  <>
                    <button 
                      className="action-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy()
                      }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    {language === 'python' && (
                      <button 
                        className="action-button primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExecute()
                        }}
                        disabled={executing}
                      >
                        {executing ? (
                          <>
                            <div className="button-spinner"></div>
                            Running...
                          </>
                        ) : (
                          <>
                            <Play size={16} />
                            Run Code
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
                <button className="expand-button">
                  {expandedSection === 'code' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
              </div>
            </div>

            {expandedSection === 'code' && (
              <div className="card-body">
                <pre className="code-block">
                  <code>{result.code}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Execution Results */}
          {executionResult && (
            <div className="result-card">
              <div 
                className="card-header"
                onClick={() => toggleSection('execution')}
              >
                <div className="card-title">
                  <Play size={20} />
                  <h3>Execution Results</h3>
                  {executionResult.success && (
                    <span className="result-badge success">
                      {executionResult.rowCount} rows
                    </span>
                  )}
                </div>
                <button className="expand-button">
                  {expandedSection === 'execution' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
              </div>

              {expandedSection === 'execution' && (
                <div className="card-body">
                  {executionResult.success ? (
                    <div className="execution-success">
                      <div className="result-table-container">
                        <table className="result-table">
                          <thead>
                            <tr>
                              {Object.keys(executionResult.result[0] || {}).map((key, idx) => (
                                <th key={idx}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {executionResult.result.slice(0, 20).map((row, idx) => (
                              <tr key={idx}>
                                {Object.values(row).map((value, cidx) => (
                                  <td key={cidx}>
                                    {typeof value === 'number' 
                                      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                      : String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {executionResult.rowCount > 20 && (
                        <p className="result-note">
                          Showing first 20 of {executionResult.rowCount} rows
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="execution-error">
                      <p><strong>Error:</strong> {executionResult.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          <div className="result-card">
            <div 
              className="card-header"
              onClick={() => toggleSection('explanation')}
            >
              <div className="card-title">
                <Info size={20} />
                <h3>Line-by-Line Explanation</h3>
              </div>
              <button className="expand-button">
                {expandedSection === 'explanation' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
            </div>

            {expandedSection === 'explanation' && (
              <div className="card-body">
                <div className="explanation-list">
                  {result.explanation.lineByLine.map((item, idx) => (
                    <div key={idx} className="explanation-item">
                      <div className="line-number">Line {item.line}</div>
                      <div className="explanation-content">
                        <code className="inline-code">{item.code}</code>
                        <p className="explanation-text">{item.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="complexity-info">
                  <h4>Complexity Assessment</h4>
                  <p className="complexity-level">
                    <strong>{result.explanation.complexity.level}:</strong> {result.explanation.complexity.description}
                  </p>
                </div>

                <div className="performance-info">
                  <h4>Performance Considerations</h4>
                  <p className="performance-estimate">
                    <strong>Estimated Speed:</strong> {result.explanation.performance.estimated}
                  </p>
                  {result.explanation.performance.considerations.length > 0 && (
                    <ul className="performance-list">
                      {result.explanation.performance.considerations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {result.explanation.alternatives.length > 0 && (
                  <div className="alternatives-info">
                    <h4>Alternative Approaches</h4>
                    {result.explanation.alternatives.map((alt, idx) => (
                      <div key={idx} className="alternative-item">
                        <strong>{alt.language || alt.approach}:</strong> {alt.reason}
                        <span className="advantage-note">({alt.advantage})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeGenerator
