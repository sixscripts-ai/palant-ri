// Multi-Agent Orchestration System
// Coordinates specialized AI agents for autonomous data analysis

export class AgentOrchestrator {
  constructor() {
    this.agents = {
      dataHealer: new DataHealerAgent(),
      codeGenerator: new CodeGeneratorAgent(),
      transformer: new TransformerAgent(),
      semanticSearch: new SemanticSearchAgent(),
      anomalyDetective: new AnomalyDetectiveAgent()
    }
    this.agentActivity = []
  }

  async orchestrate(task, data, context = {}) {
    const plan = this.createExecutionPlan(task, data)
    const results = []

    for (const step of plan) {
      const agent = this.agents[step.agent]
      if (!agent) continue

      this.logActivity(step.agent, 'started', step.task)
      
      const result = await agent.execute(step.task, data, context)
      results.push({ agent: step.agent, result })
      
      this.logActivity(step.agent, 'completed', step.task, result)
      
      // Pass results to next agent in chain
      context[step.agent] = result
    }

    return {
      results,
      activity: this.agentActivity,
      recommendations: this.generateRecommendations(results)
    }
  }

  createExecutionPlan(task, data) {
    const plan = []
    const taskLower = task.toLowerCase()

    // Always run data healer first
    plan.push({ agent: 'dataHealer', task: 'analyze_quality' })

    // Determine which other agents to activate
    if (taskLower.includes('code') || taskLower.includes('query') || taskLower.includes('transform')) {
      plan.push({ agent: 'codeGenerator', task: 'generate' })
    }

    if (taskLower.includes('clean') || taskLower.includes('fix') || taskLower.includes('prepare')) {
      plan.push({ agent: 'transformer', task: 'transform' })
    }

    if (taskLower.includes('find') || taskLower.includes('search') || taskLower.includes('similar')) {
      plan.push({ agent: 'semanticSearch', task: 'search' })
    }

    if (taskLower.includes('anomaly') || taskLower.includes('outlier') || taskLower.includes('unusual')) {
      plan.push({ agent: 'anomalyDetective', task: 'investigate' })
    }

    return plan
  }

  logActivity(agent, status, task, result = null) {
    this.agentActivity.push({
      agent,
      status,
      task,
      timestamp: new Date().toISOString(),
      result: result ? JSON.stringify(result).slice(0, 100) : null
    })
  }

  generateRecommendations(results) {
    const recommendations = []
    
    results.forEach(({ agent, result }) => {
      if (agent === 'dataHealer' && result.issues?.length > 0) {
        recommendations.push({
          priority: 'high',
          action: 'Apply data healing suggestions',
          reason: `Found ${result.issues.length} data quality issues`
        })
      }
      
      if (agent === 'anomalyDetective' && result.anomalies?.length > 0) {
        recommendations.push({
          priority: 'medium',
          action: 'Review detected anomalies',
          reason: `${result.anomalies.length} anomalies require investigation`
        })
      }
    })

    return recommendations
  }

  getActivity() {
    return this.agentActivity
  }
}

// Specialized Agent Classes

class DataHealerAgent {
  async execute(task, data, context) {
    const issues = this.detectIssues(data)
    const strategies = this.generateStrategies(issues, data)
    const autoFixes = this.proposeAutoFixes(issues, data)

    return {
      issues,
      strategies,
      autoFixes,
      auditLog: this.createAuditLog(issues, strategies),
      confidence: this.calculateConfidence(issues, data)
    }
  }

  detectIssues(data) {
    const issues = []
    const { headers, rows } = data

    // Missing values
    headers.forEach(header => {
      const values = rows.map(r => r[header])
      const missing = values.filter(v => v == null || v === '').length
      const missingPct = (missing / rows.length) * 100

      if (missingPct > 5) {
        issues.push({
          type: 'missing_values',
          column: header,
          severity: missingPct > 30 ? 'critical' : missingPct > 15 ? 'high' : 'medium',
          details: `${missingPct.toFixed(1)}% missing values`,
          affectedRows: missing
        })
      }
    })

    // Outliers
    const numericCols = this.getNumericColumns(data)
    numericCols.forEach(col => {
      const values = rows.map(r => r[col]).filter(v => v != null)
      const outliers = this.detectOutliers(values)
      
      if (outliers.length > 0) {
        issues.push({
          type: 'outliers',
          column: col,
          severity: 'medium',
          details: `${outliers.length} outliers detected`,
          values: outliers.slice(0, 5)
        })
      }
    })

    // Type inconsistencies
    headers.forEach(header => {
      const values = rows.map(r => r[header]).filter(v => v != null && v !== '')
      const types = new Set(values.map(v => typeof v))
      
      if (types.size > 1) {
        issues.push({
          type: 'type_inconsistency',
          column: header,
          severity: 'high',
          details: `Mixed types: ${Array.from(types).join(', ')}`,
          examples: values.slice(0, 3)
        })
      }
    })

    // Duplicates
    const duplicates = this.findDuplicates(rows)
    if (duplicates > 0) {
      issues.push({
        type: 'duplicates',
        severity: duplicates > rows.length * 0.1 ? 'high' : 'low',
        details: `${duplicates} duplicate rows found`,
        count: duplicates
      })
    }

    return issues
  }

  generateStrategies(issues, data) {
    const strategies = []

    issues.forEach(issue => {
      switch (issue.type) {
        case 'missing_values':
          strategies.push({
            issue: issue.column,
            options: [
              {
                method: 'mean_imputation',
                description: 'Replace with column mean',
                pros: 'Simple, preserves distribution',
                cons: 'May not capture patterns',
                confidence: 75
              },
              {
                method: 'forward_fill',
                description: 'Propagate last valid value',
                pros: 'Good for time-series',
                cons: 'Assumes continuity',
                confidence: 70
              },
              {
                method: 'drop_rows',
                description: 'Remove rows with missing values',
                pros: 'Clean dataset',
                cons: 'Loses data',
                confidence: 85
              }
            ],
            recommended: 'mean_imputation'
          })
          break

        case 'outliers':
          strategies.push({
            issue: issue.column,
            options: [
              {
                method: 'cap_values',
                description: 'Cap at percentile boundaries',
                pros: 'Preserves all data points',
                cons: 'May distort distribution',
                confidence: 80
              },
              {
                method: 'remove_outliers',
                description: 'Remove extreme values',
                pros: 'Cleaner analysis',
                cons: 'May lose important cases',
                confidence: 75
              },
              {
                method: 'log_transform',
                description: 'Apply logarithmic transformation',
                pros: 'Reduces impact naturally',
                cons: 'Changes interpretation',
                confidence: 70
              }
            ],
            recommended: 'cap_values'
          })
          break
      }
    })

    return strategies
  }

  proposeAutoFixes(issues, data) {
    return issues
      .filter(i => i.severity !== 'critical')
      .map(issue => ({
        issue: issue.type,
        column: issue.column,
        action: this.getDefaultFix(issue.type),
        canAutoApply: true,
        impact: this.estimateImpact(issue, data)
      }))
  }

  getDefaultFix(issueType) {
    const fixes = {
      missing_values: 'mean_imputation',
      outliers: 'cap_values',
      type_inconsistency: 'type_conversion',
      duplicates: 'keep_first'
    }
    return fixes[issueType] || 'manual_review'
  }

  estimateImpact(issue, data) {
    const impactScore = (issue.affectedRows || 0) / data.rowCount
    return {
      rowsAffected: issue.affectedRows || 0,
      percentageAffected: (impactScore * 100).toFixed(2),
      severity: impactScore > 0.2 ? 'high' : impactScore > 0.05 ? 'medium' : 'low'
    }
  }

  createAuditLog(issues, strategies) {
    return {
      timestamp: new Date().toISOString(),
      issuesDetected: issues.length,
      strategiesProposed: strategies.length,
      summary: `Detected ${issues.length} data quality issues with ${strategies.length} proposed solutions`
    }
  }

  calculateConfidence(issues, data) {
    const qualityScore = 100 - (issues.length / data.columnCount) * 10
    return Math.max(60, Math.min(100, Math.round(qualityScore)))
  }

  getNumericColumns(data) {
    return data.headers.filter(h => {
      const vals = data.rows.map(r => r[h]).filter(v => v != null)
      return vals.length > 0 && typeof vals[0] === 'number'
    })
  }

  detectOutliers(values) {
    const sorted = [...values].sort((a, b) => a - b)
    const q1 = sorted[Math.floor(sorted.length * 0.25)]
    const q3 = sorted[Math.floor(sorted.length * 0.75)]
    const iqr = q3 - q1
    const lower = q1 - 1.5 * iqr
    const upper = q3 + 1.5 * iqr
    return values.filter(v => v < lower || v > upper)
  }

  findDuplicates(rows) {
    const seen = new Set()
    let count = 0
    rows.forEach(row => {
      const key = JSON.stringify(row)
      if (seen.has(key)) count++
      else seen.add(key)
    })
    return count
  }
}

class CodeGeneratorAgent {
  async execute(task, data, context) {
    const query = context.userQuery || task
    const code = this.generateCode(query, data)
    
    return {
      code,
      explanation: this.explainCode(code),
      executable: true,
      language: this.detectLanguage(query),
      dependencies: this.extractDependencies(code)
    }
  }

  generateCode(query, data) {
    const queryLower = query.toLowerCase()
    
    if (queryLower.includes('rolling') && queryLower.includes('average')) {
      return this.generateRollingAverage(data)
    }
    
    if (queryLower.includes('group') || queryLower.includes('by')) {
      return this.generateGroupBy(data)
    }
    
    if (queryLower.includes('filter') || queryLower.includes('where')) {
      return this.generateFilter(data)
    }
    
    if (queryLower.includes('join') || queryLower.includes('merge')) {
      return this.generateJoin(data)
    }
    
    return this.generateGenericAnalysis(data)
  }

  generateRollingAverage(data) {
    const numCol = data.headers.find(h => typeof data.rows[0]?.[h] === 'number') || 'value'
    
    return `import pandas as pd

# Load data
df = pd.DataFrame(data)

# Calculate 3-month rolling average
df['rolling_avg'] = df['${numCol}'].rolling(window=3).mean()

# Display results
print(df[['${numCol}', 'rolling_avg']].tail(10))

# Visualize
import matplotlib.pyplot as plt
plt.plot(df['${numCol}'], label='Actual')
plt.plot(df['rolling_avg'], label='3-Month Avg')
plt.legend()
plt.show()`
  }

  generateGroupBy(data) {
    const catCol = data.headers.find(h => typeof data.rows[0]?.[h] === 'string') || 'category'
    const numCol = data.headers.find(h => typeof data.rows[0]?.[h] === 'number') || 'value'
    
    return `import pandas as pd

# Load data
df = pd.DataFrame(data)

# Group by category and calculate statistics
summary = df.groupby('${catCol}')['${numCol}'].agg([
    ('count', 'count'),
    ('mean', 'mean'),
    ('median', 'median'),
    ('std', 'std'),
    ('min', 'min'),
    ('max', 'max')
])

print(summary.sort_values('mean', ascending=False))`
  }

  generateFilter(data) {
    const numCol = data.headers.find(h => typeof data.rows[0]?.[h] === 'number') || 'value'
    
    return `import pandas as pd

# Load data
df = pd.DataFrame(data)

# Filter data based on condition
filtered = df[df['${numCol}'] > df['${numCol}'].mean()]

print(f"Original rows: {len(df)}")
print(f"Filtered rows: {len(filtered)}")
print(f"\\nTop 10 results:")
print(filtered.head(10))`
  }

  generateJoin(data) {
    return `import pandas as pd

# Load datasets
df1 = pd.DataFrame(data1)
df2 = pd.DataFrame(data2)

# Perform inner join on common key
result = pd.merge(df1, df2, on='id', how='inner')

print(f"Left dataset: {len(df1)} rows")
print(f"Right dataset: {len(df2)} rows")
print(f"Joined result: {len(result)} rows")
print(result.head())`
  }

  generateGenericAnalysis(data) {
    return `import pandas as pd
import numpy as np

# Load data
df = pd.DataFrame(data)

# Basic exploration
print("Dataset shape:", df.shape)
print("\\nColumn types:")
print(df.dtypes)
print("\\nSummary statistics:")
print(df.describe())
print("\\nMissing values:")
print(df.isnull().sum())`
  }

  explainCode(code) {
    const lines = code.split('\n').filter(l => l.trim())
    const explanation = []
    
    lines.forEach(line => {
      if (line.includes('import')) {
        explanation.push('Import necessary libraries for data manipulation')
      } else if (line.includes('DataFrame')) {
        explanation.push('Convert data to pandas DataFrame for analysis')
      } else if (line.includes('rolling')) {
        explanation.push('Calculate rolling window statistics')
      } else if (line.includes('groupby')) {
        explanation.push('Group data by category and aggregate')
      } else if (line.includes('merge')) {
        explanation.push('Join datasets on common key')
      }
    })
    
    return explanation.join('. ')
  }

  detectLanguage(query) {
    if (query.includes('SQL') || query.includes('SELECT')) return 'sql'
    if (query.includes('R') || query.includes('dplyr')) return 'r'
    return 'python'
  }

  extractDependencies(code) {
    const deps = []
    if (code.includes('pandas')) deps.push('pandas')
    if (code.includes('numpy')) deps.push('numpy')
    if (code.includes('matplotlib')) deps.push('matplotlib')
    return deps
  }
}

class TransformerAgent {
  async execute(task, data, context) {
    const transformation = this.parseTransformation(task)
    const preview = this.previewTransformation(transformation, data)
    
    return {
      transformation,
      preview,
      script: this.generateScript(transformation),
      revertible: true
    }
  }

  parseTransformation(task) {
    const taskLower = task.toLowerCase()
    
    if (taskLower.includes('remove') || taskLower.includes('drop')) {
      return { type: 'remove_rows', condition: this.extractCondition(task) }
    }
    
    if (taskLower.includes('create') || taskLower.includes('add')) {
      return { type: 'create_column', expression: this.extractExpression(task) }
    }
    
    if (taskLower.includes('rename')) {
      return { type: 'rename_column', mapping: this.extractMapping(task) }
    }
    
    return { type: 'custom', task }
  }

  extractCondition(task) {
    const match = task.match(/where\s+(.+)/i)
    return match ? match[1] : 'value > threshold'
  }

  extractExpression(task) {
    const match = task.match(/create\s+(\w+)\s+from\s+(.+)/i)
    return match ? { name: match[1], formula: match[2] } : null
  }

  extractMapping(task) {
    const match = task.match(/rename\s+(\w+)\s+to\s+(\w+)/i)
    return match ? { from: match[1], to: match[2] } : null
  }

  previewTransformation(transformation, data) {
    return {
      before: data.rows.slice(0, 5),
      after: data.rows.slice(0, 5), // Would actually transform
      rowsAffected: this.estimateRowsAffected(transformation, data)
    }
  }

  estimateRowsAffected(transformation, data) {
    if (transformation.type === 'remove_rows') {
      return Math.floor(data.rowCount * 0.1) // Estimate
    }
    return data.rowCount
  }

  generateScript(transformation) {
    return `// Transformation script
const transform = (data) => {
  return data.filter(row => {
    // Apply transformation logic
    return true;
  });
};`
  }
}

class SemanticSearchAgent {
  async execute(task, data, context) {
    const query = context.userQuery || task
    const results = this.semanticSearch(query, data)
    
    return {
      query,
      results,
      matchedColumns: results.columns,
      suggestions: this.generateSuggestions(results, data)
    }
  }

  semanticSearch(query, data) {
    const queryLower = query.toLowerCase()
    const matchedColumns = []
    
    // Search in column names
    data.headers.forEach(header => {
      const score = this.calculateSimilarity(queryLower, header.toLowerCase())
      if (score > 0.3) {
        matchedColumns.push({
          column: header,
          score,
          matchType: 'column_name'
        })
      }
    })
    
    // Search for semantic matches
    const semanticMatches = this.findSemanticMatches(queryLower, data)
    matchedColumns.push(...semanticMatches)
    
    return {
      columns: matchedColumns.sort((a, b) => b.score - a.score),
      totalMatches: matchedColumns.length
    }
  }

  calculateSimilarity(str1, str2) {
    const words1 = str1.split(/\s+/)
    const words2 = str2.split(/\s+/)
    
    let matches = 0
    words1.forEach(w1 => {
      words2.forEach(w2 => {
        if (w1.includes(w2) || w2.includes(w1)) matches++
      })
    })
    
    return matches / Math.max(words1.length, words2.length)
  }

  findSemanticMatches(query, data) {
    const semanticMap = {
      'revenue': ['sales', 'income', 'earnings', 'profit'],
      'customer': ['client', 'user', 'buyer', 'patron'],
      'time': ['date', 'timestamp', 'period', 'when'],
      'location': ['region', 'country', 'city', 'place']
    }
    
    const matches = []
    Object.entries(semanticMap).forEach(([concept, synonyms]) => {
      if (query.includes(concept) || synonyms.some(s => query.includes(s))) {
        data.headers.forEach(header => {
          const headerLower = header.toLowerCase()
          if (synonyms.some(s => headerLower.includes(s))) {
            matches.push({
              column: header,
              score: 0.7,
              matchType: 'semantic',
              concept
            })
          }
        })
      }
    })
    
    return matches
  }

  generateSuggestions(results, data) {
    return results.columns.slice(0, 3).map(col => ({
      action: `Analyze ${col.column}`,
      reason: `High semantic match (${(col.score * 100).toFixed(0)}%)`,
      type: col.matchType
    }))
  }
}

class AnomalyDetectiveAgent {
  async execute(task, data, context) {
    const anomalies = this.detectAnomalies(data)
    const investigations = this.investigateAnomalies(anomalies, data)
    
    return {
      anomalies,
      investigations,
      summary: this.generateSummary(anomalies),
      alerts: this.generateAlerts(anomalies)
    }
  }

  detectAnomalies(data) {
    const anomalies = []
    const numericCols = this.getNumericColumns(data)
    
    numericCols.forEach(col => {
      const values = data.rows.map((r, idx) => ({ value: r[col], index: idx }))
        .filter(v => v.value != null)
      
      const outliers = this.detectStatisticalOutliers(values)
      
      outliers.forEach(outlier => {
        anomalies.push({
          type: 'statistical_outlier',
          column: col,
          rowIndex: outlier.index,
          value: outlier.value,
          severity: this.calculateSeverity(outlier, values),
          zscore: outlier.zscore
        })
      })
    })
    
    // Pattern anomalies
    const patternAnomalies = this.detectPatternAnomalies(data)
    anomalies.push(...patternAnomalies)
    
    return anomalies
  }

  detectStatisticalOutliers(values) {
    const vals = values.map(v => v.value)
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    const std = Math.sqrt(
      vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / vals.length
    )
    
    return values
      .map(v => ({
        ...v,
        zscore: Math.abs((v.value - mean) / std)
      }))
      .filter(v => v.zscore > 3)
  }

  detectPatternAnomalies(data) {
    const anomalies = []
    const numericCols = this.getNumericColumns(data)
    
    if (numericCols.length > 0) {
      const col = numericCols[0]
      const values = data.rows.map(r => r[col]).filter(v => v != null)
      
      // Check for sudden jumps
      for (let i = 1; i < values.length; i++) {
        const change = Math.abs((values[i] - values[i-1]) / values[i-1])
        if (change > 0.5) { // 50% change
          anomalies.push({
            type: 'sudden_change',
            column: col,
            rowIndex: i,
            value: values[i],
            previousValue: values[i-1],
            changePercent: (change * 100).toFixed(1),
            severity: 'medium'
          })
        }
      }
    }
    
    return anomalies
  }

  calculateSeverity(outlier, allValues) {
    if (outlier.zscore > 5) return 'critical'
    if (outlier.zscore > 4) return 'high'
    return 'medium'
  }

  investigateAnomalies(anomalies, data) {
    return anomalies.slice(0, 10).map(anomaly => {
      const row = data.rows[anomaly.rowIndex]
      const correlations = this.findCorrelations(anomaly, data)
      
      return {
        anomaly,
        context: row,
        possibleCauses: this.identifyPossibleCauses(anomaly, row, data),
        correlatedColumns: correlations,
        recommendation: this.recommendAction(anomaly)
      }
    })
  }

  findCorrelations(anomaly, data) {
    const row = data.rows[anomaly.rowIndex]
    const correlations = []
    
    data.headers.forEach(header => {
      if (header !== anomaly.column && row[header] != null) {
        correlations.push({
          column: header,
          value: row[header]
        })
      }
    })
    
    return correlations.slice(0, 3)
  }

  identifyPossibleCauses(anomaly, row, data) {
    const causes = []
    
    if (anomaly.type === 'statistical_outlier') {
      causes.push('Genuine exceptional case')
      causes.push('Data entry error')
      causes.push('System malfunction during recording')
    }
    
    if (anomaly.type === 'sudden_change') {
      causes.push('External event or intervention')
      causes.push('Seasonal or cyclical pattern')
      causes.push('Process change')
    }
    
    return causes
  }

  recommendAction(anomaly) {
    if (anomaly.severity === 'critical') {
      return 'Immediate investigation required - verify data source'
    }
    if (anomaly.severity === 'high') {
      return 'Review for data quality - may require correction'
    }
    return 'Monitor for patterns - may be legitimate variation'
  }

  generateSummary(anomalies) {
    const bySeverity = anomalies.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1
      return acc
    }, {})
    
    return {
      total: anomalies.length,
      bySeverity,
      topType: this.getMostCommonType(anomalies)
    }
  }

  getMostCommonType(anomalies) {
    const counts = anomalies.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'
  }

  generateAlerts(anomalies) {
    return anomalies
      .filter(a => a.severity === 'critical' || a.severity === 'high')
      .slice(0, 5)
      .map(a => ({
        message: `${a.severity.toUpperCase()}: Anomaly detected in ${a.column}`,
        details: `Value: ${a.value}, Row: ${a.rowIndex}`,
        action: this.recommendAction(a)
      }))
  }

  getNumericColumns(data) {
    return data.headers.filter(h => {
      const vals = data.rows.map(r => r[h]).filter(v => v != null)
      return vals.length > 0 && typeof vals[0] === 'number'
    })
  }
}

export default AgentOrchestrator
