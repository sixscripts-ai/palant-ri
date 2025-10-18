/**
 * Natural Language to Code Generator Agent
 * Converts natural language queries to executable code (Python/R/SQL)
 */

export class CodeGeneratorAgent {
  constructor() {
    this.name = 'Code Generator Agent'
    this.supportedLanguages = ['python', 'r', 'sql']
    this.history = []
  }

  /**
   * Generate code from natural language query
   */
  generateCode(query, data, language = 'python') {
    const analysis = this.analyzeQuery(query, data)
    const code = this.synthesizeCode(analysis, language, data)
    const explanation = this.explainCode(code, analysis, language)
    
    const result = {
      query,
      language,
      code,
      explanation,
      analysis,
      timestamp: new Date().toISOString(),
      executable: true
    }

    this.history.push(result)
    return result
  }

  /**
   * Analyze natural language query to understand intent
   */
  analyzeQuery(query, data) {
    const queryLower = query.toLowerCase()
    
    const analysis = {
      intent: this.detectIntent(queryLower),
      columns: this.extractColumns(queryLower, data),
      operations: this.detectOperations(queryLower),
      aggregations: this.detectAggregations(queryLower),
      filters: this.detectFilters(queryLower, data),
      groupBy: this.detectGroupBy(queryLower, data),
      timeWindow: this.detectTimeWindow(queryLower),
      sorting: this.detectSorting(queryLower),
      limit: this.detectLimit(queryLower)
    }

    return analysis
  }

  /**
   * Detect query intent
   */
  detectIntent(query) {
    const intents = {
      aggregation: ['average', 'mean', 'sum', 'total', 'count', 'max', 'min', 'median'],
      filtering: ['where', 'filter', 'only', 'exclude', 'remove'],
      grouping: ['by', 'group', 'segment', 'category', 'each'],
      sorting: ['top', 'bottom', 'highest', 'lowest', 'sort', 'order'],
      transformation: ['create', 'add', 'calculate', 'derive', 'compute'],
      visualization: ['plot', 'chart', 'graph', 'show', 'display', 'visualize'],
      join: ['join', 'merge', 'combine', 'relate'],
      timeSereis: ['rolling', 'moving', 'trend', 'over time', 'monthly', 'daily']
    }

    const detected = []
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(kw => query.includes(kw))) {
        detected.push(intent)
      }
    }

    return detected.length > 0 ? detected : ['analysis']
  }

  /**
   * Extract mentioned columns from query
   */
  extractColumns(query, data) {
    const mentioned = []
    
    data.headers.forEach(header => {
      const headerLower = header.toLowerCase()
      const headerWords = headerLower.split(/[_\s]+/)
      
      // Check exact match
      if (query.includes(headerLower)) {
        mentioned.push(header)
      } 
      // Check partial match
      else if (headerWords.some(word => word.length > 3 && query.includes(word))) {
        mentioned.push(header)
      }
    })

    return mentioned
  }

  /**
   * Detect operations needed
   */
  detectOperations(query) {
    const operations = []
    
    const opMap = {
      filter: ['where', 'filter', 'only'],
      groupby: ['by', 'group', 'per', 'each'],
      sort: ['top', 'bottom', 'sort', 'order'],
      aggregate: ['sum', 'average', 'count', 'max', 'min', 'total'],
      join: ['join', 'merge', 'combine'],
      window: ['rolling', 'moving', 'sliding'],
      pivot: ['pivot', 'cross-tab', 'crosstab']
    }

    for (const [op, keywords] of Object.entries(opMap)) {
      if (keywords.some(kw => query.includes(kw))) {
        operations.push(op)
      }
    }

    return operations
  }

  /**
   * Detect aggregation functions
   */
  detectAggregations(query) {
    const aggs = []
    const aggMap = {
      sum: ['sum', 'total'],
      mean: ['average', 'mean', 'avg'],
      count: ['count', 'number of', 'how many'],
      max: ['maximum', 'max', 'highest', 'largest'],
      min: ['minimum', 'min', 'lowest', 'smallest'],
      median: ['median', 'middle'],
      std: ['std', 'standard deviation', 'variance']
    }

    for (const [agg, keywords] of Object.entries(aggMap)) {
      if (keywords.some(kw => query.includes(kw))) {
        aggs.push(agg)
      }
    }

    return aggs.length > 0 ? aggs : ['mean']
  }

  /**
   * Detect filter conditions
   */
  detectFilters(query, data) {
    const filters = []
    
    // Detect comparison operators
    const patterns = [
      { pattern: /greater than (\d+)/, operator: '>', value: '$1' },
      { pattern: /less than (\d+)/, operator: '<', value: '$1' },
      { pattern: /equal to (\d+)/, operator: '==', value: '$1' },
      { pattern: /more than (\d+)/, operator: '>', value: '$1' },
      { pattern: /> ?(\d+)/, operator: '>', value: '$1' },
      { pattern: /< ?(\d+)/, operator: '<', value: '$1' },
      { pattern: /= ?(\d+)/, operator: '==', value: '$1' }
    ]

    patterns.forEach(({ pattern, operator, value }) => {
      const match = query.match(pattern)
      if (match) {
        filters.push({
          operator,
          value: match[1]
        })
      }
    })

    return filters
  }

  /**
   * Detect group by columns
   */
  detectGroupBy(query, data) {
    const groupCols = []
    const categoricalCols = this.getCategoricalColumns(data)
    
    categoricalCols.forEach(col => {
      if (query.includes(col.toLowerCase())) {
        groupCols.push(col)
      }
    })

    return groupCols
  }

  /**
   * Detect time window for rolling operations
   */
  detectTimeWindow(query) {
    const windowPatterns = [
      { pattern: /(\d+)[-\s]?month/, unit: 'months', value: '$1' },
      { pattern: /(\d+)[-\s]?week/, unit: 'weeks', value: '$1' },
      { pattern: /(\d+)[-\s]?day/, unit: 'days', value: '$1' },
      { pattern: /(\d+)[-\s]?year/, unit: 'years', value: '$1' }
    ]

    for (const { pattern, unit, value } of windowPatterns) {
      const match = query.match(pattern)
      if (match) {
        return { value: parseInt(match[1]), unit }
      }
    }

    return null
  }

  /**
   * Detect sorting requirements
   */
  detectSorting(query) {
    if (query.includes('top') || query.includes('highest') || query.includes('largest')) {
      return { order: 'desc', detected: true }
    }
    if (query.includes('bottom') || query.includes('lowest') || query.includes('smallest')) {
      return { order: 'asc', detected: true }
    }
    return { order: 'desc', detected: false }
  }

  /**
   * Detect result limit
   */
  detectLimit(query) {
    const limitPatterns = [
      /top (\d+)/,
      /bottom (\d+)/,
      /first (\d+)/,
      /last (\d+)/,
      /limit (\d+)/
    ]

    for (const pattern of limitPatterns) {
      const match = query.match(pattern)
      if (match) {
        return parseInt(match[1])
      }
    }

    return null
  }

  /**
   * Synthesize code based on analysis
   */
  synthesizeCode(analysis, language, data) {
    switch (language) {
      case 'python':
        return this.generatePython(analysis, data)
      case 'r':
        return this.generateR(analysis, data)
      case 'sql':
        return this.generateSQL(analysis, data)
      default:
        return this.generatePython(analysis, data)
    }
  }

  /**
   * Generate Python code
   */
  generatePython(analysis, data) {
    const lines = []
    lines.push('import pandas as pd')
    lines.push('import numpy as np')
    lines.push('')
    lines.push('# Load data')
    lines.push('df = pd.DataFrame(data)')
    lines.push('')

    // Filter operations
    if (analysis.filters.length > 0) {
      lines.push('# Apply filters')
      analysis.filters.forEach((filter, idx) => {
        const col = analysis.columns[0] || data.headers[0]
        lines.push(`df = df[df['${col}'] ${filter.operator} ${filter.value}]`)
      })
      lines.push('')
    }

    // Group by operations
    if (analysis.groupBy.length > 0) {
      lines.push('# Group by')
      const groupCols = analysis.groupBy.map(c => `'${c}'`).join(', ')
      const valueCol = analysis.columns.find(c => !analysis.groupBy.includes(c)) || data.headers[0]
      const agg = analysis.aggregations[0] || 'mean'
      
      lines.push(`result = df.groupby([${groupCols}])['${valueCol}'].${agg}()`)
      lines.push('')
    }
    // Rolling window
    else if (analysis.timeWindow) {
      lines.push('# Rolling window calculation')
      const col = analysis.columns[0] || data.headers[0]
      const window = analysis.timeWindow.value
      const agg = analysis.aggregations[0] || 'mean'
      lines.push(`result = df['${col}'].rolling(window=${window}).${agg}()`)
      lines.push('')
    }
    // Simple aggregation
    else if (analysis.aggregations.length > 0) {
      lines.push('# Calculate aggregation')
      const col = analysis.columns[0] || data.headers[0]
      const agg = analysis.aggregations[0]
      lines.push(`result = df['${col}'].${agg}()`)
      lines.push('')
    }
    // Column selection
    else if (analysis.columns.length > 0) {
      lines.push('# Select columns')
      const cols = analysis.columns.map(c => `'${c}'`).join(', ')
      lines.push(`result = df[[${cols}]]`)
      lines.push('')
    }
    else {
      lines.push('# Describe data')
      lines.push('result = df.describe()')
      lines.push('')
    }

    // Sorting
    if (analysis.sorting.detected && analysis.groupBy.length > 0) {
      lines.push('# Sort results')
      lines.push(`result = result.sort_values(ascending=${analysis.sorting.order === 'asc'})`)
      lines.push('')
    }

    // Limit
    if (analysis.limit) {
      lines.push('# Limit results')
      if (analysis.sorting.order === 'desc') {
        lines.push(`result = result.head(${analysis.limit})`)
      } else {
        lines.push(`result = result.tail(${analysis.limit})`)
      }
      lines.push('')
    }

    lines.push('# Display results')
    lines.push('print(result)')

    return lines.join('\n')
  }

  /**
   * Generate R code
   */
  generateR(analysis, data) {
    const lines = []
    lines.push('library(dplyr)')
    lines.push('library(tidyr)')
    lines.push('')
    lines.push('# Load data')
    lines.push('df <- data.frame(data)')
    lines.push('')

    // Start pipeline
    lines.push('# Analysis pipeline')
    lines.push('result <- df %>%')

    const pipeline = []

    // Filter
    if (analysis.filters.length > 0) {
      analysis.filters.forEach(filter => {
        const col = analysis.columns[0] || data.headers[0]
        pipeline.push(`  filter(${col} ${filter.operator} ${filter.value})`)
      })
    }

    // Group by and aggregate
    if (analysis.groupBy.length > 0) {
      const groupCols = analysis.groupBy.join(', ')
      const valueCol = analysis.columns.find(c => !analysis.groupBy.includes(c)) || data.headers[0]
      const agg = analysis.aggregations[0] || 'mean'
      
      pipeline.push(`  group_by(${groupCols})`)
      pipeline.push(`  summarise(value = ${agg}(${valueCol}, na.rm = TRUE))`)
    }

    // Sorting
    if (analysis.sorting.detected) {
      const order = analysis.sorting.order === 'desc' ? 'desc' : ''
      pipeline.push(`  arrange(${order}(value))`)
    }

    // Limit
    if (analysis.limit) {
      if (analysis.sorting.order === 'asc') {
        pipeline.push(`  tail(${analysis.limit})`)
      } else {
        pipeline.push(`  head(${analysis.limit})`)
      }
    }

    lines.push(pipeline.join(' %>%\n'))
    lines.push('')
    lines.push('# Display results')
    lines.push('print(result)')

    return lines.join('\n')
  }

  /**
   * Generate SQL code
   */
  generateSQL(analysis, data) {
    const lines = []
    
    // SELECT clause
    if (analysis.groupBy.length > 0) {
      const groupCols = analysis.groupBy.join(', ')
      const valueCol = analysis.columns.find(c => !analysis.groupBy.includes(c)) || data.headers[0]
      const agg = analysis.aggregations[0]?.toUpperCase() || 'AVG'
      lines.push(`SELECT ${groupCols}, ${agg}(${valueCol}) as value`)
    } else if (analysis.columns.length > 0) {
      lines.push(`SELECT ${analysis.columns.join(', ')}`)
    } else {
      lines.push('SELECT *')
    }

    // FROM clause
    lines.push('FROM dataset')

    // WHERE clause
    if (analysis.filters.length > 0) {
      const conditions = analysis.filters.map((filter, idx) => {
        const col = analysis.columns[idx] || data.headers[0]
        return `${col} ${filter.operator} ${filter.value}`
      })
      lines.push(`WHERE ${conditions.join(' AND ')}`)
    }

    // GROUP BY clause
    if (analysis.groupBy.length > 0) {
      lines.push(`GROUP BY ${analysis.groupBy.join(', ')}`)
    }

    // ORDER BY clause
    if (analysis.sorting.detected) {
      const col = analysis.groupBy.length > 0 ? 'value' : (analysis.columns[0] || data.headers[0])
      lines.push(`ORDER BY ${col} ${analysis.sorting.order === 'desc' ? 'DESC' : 'ASC'}`)
    }

    // LIMIT clause
    if (analysis.limit) {
      lines.push(`LIMIT ${analysis.limit}`)
    }

    lines.push(';')

    return lines.join('\n')
  }

  /**
   * Explain generated code
   */
  explainCode(code, analysis, language) {
    const explanation = {
      summary: this.generateSummary(analysis),
      lineByLine: this.generateLineByLine(code, language),
      complexity: this.assessComplexity(analysis),
      performance: this.assessPerformance(analysis),
      alternatives: this.suggestAlternatives(analysis, language)
    }

    return explanation
  }

  /**
   * Generate summary explanation
   */
  generateSummary(analysis) {
    const parts = []

    if (analysis.filters.length > 0) {
      parts.push('filters the data')
    }
    if (analysis.groupBy.length > 0) {
      parts.push(`groups by ${analysis.groupBy.join(', ')}`)
    }
    if (analysis.aggregations.length > 0) {
      parts.push(`calculates ${analysis.aggregations.join(', ')}`)
    }
    if (analysis.sorting.detected) {
      parts.push(`sorts in ${analysis.sorting.order}ending order`)
    }
    if (analysis.limit) {
      parts.push(`returns top ${analysis.limit} results`)
    }

    const summary = parts.length > 0 
      ? `This code ${parts.join(', then ')}.`
      : 'This code performs a basic data analysis.'

    return summary
  }

  /**
   * Generate line-by-line explanation
   */
  generateLineByLine(code, language) {
    const lines = code.split('\n')
    const explanations = []

    lines.forEach((line, idx) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('--')) {
        return // Skip comments
      }
      if (trimmed === '') {
        return // Skip empty lines
      }

      let explanation = ''

      // Python explanations
      if (language === 'python') {
        if (trimmed.startsWith('import')) {
          explanation = 'Imports required library for data manipulation'
        } else if (trimmed.includes('pd.DataFrame')) {
          explanation = 'Converts input data into a pandas DataFrame'
        } else if (trimmed.includes('groupby')) {
          explanation = 'Groups data by specified columns for aggregation'
        } else if (trimmed.includes('rolling')) {
          explanation = 'Creates a rolling window for time-series calculations'
        } else if (trimmed.includes('filter') || trimmed.includes('[df[')) {
          explanation = 'Applies conditional filter to select specific rows'
        } else if (trimmed.includes('sort_values')) {
          explanation = 'Sorts the results based on specified column(s)'
        } else if (trimmed.includes('.head') || trimmed.includes('.tail')) {
          explanation = 'Limits output to top/bottom N rows'
        } else if (trimmed.includes('print')) {
          explanation = 'Displays the final results'
        } else {
          explanation = 'Performs data transformation'
        }
      }

      // SQL explanations
      else if (language === 'sql') {
        if (trimmed.startsWith('SELECT')) {
          explanation = 'Specifies which columns to retrieve from the dataset'
        } else if (trimmed.startsWith('FROM')) {
          explanation = 'Identifies the source table/dataset'
        } else if (trimmed.startsWith('WHERE')) {
          explanation = 'Filters rows based on specified conditions'
        } else if (trimmed.startsWith('GROUP BY')) {
          explanation = 'Groups rows by specified columns for aggregation'
        } else if (trimmed.startsWith('ORDER BY')) {
          explanation = 'Sorts results by specified column(s)'
        } else if (trimmed.startsWith('LIMIT')) {
          explanation = 'Restricts number of rows returned'
        }
      }

      if (explanation) {
        explanations.push({
          line: idx + 1,
          code: trimmed,
          explanation
        })
      }
    })

    return explanations
  }

  /**
   * Assess code complexity
   */
  assessComplexity(analysis) {
    let score = 0
    
    if (analysis.filters.length > 0) score += 1
    if (analysis.groupBy.length > 0) score += 2
    if (analysis.aggregations.length > 1) score += 1
    if (analysis.timeWindow) score += 2
    if (analysis.sorting.detected) score += 1

    if (score <= 2) return { level: 'Simple', description: 'Straightforward operation with minimal complexity' }
    if (score <= 4) return { level: 'Moderate', description: 'Multiple operations requiring intermediate understanding' }
    return { level: 'Complex', description: 'Advanced operations requiring careful execution' }
  }

  /**
   * Assess performance characteristics
   */
  assessPerformance(analysis) {
    const considerations = []

    if (analysis.groupBy.length > 0) {
      considerations.push('Grouping operations may be memory-intensive for large datasets')
    }
    if (analysis.filters.length > 0) {
      considerations.push('Filtering early reduces downstream computation')
    }
    if (analysis.timeWindow) {
      considerations.push('Rolling calculations require sorted time-series data')
    }
    if (analysis.sorting.detected) {
      considerations.push('Sorting is O(n log n) - consider limiting data first')
    }

    return {
      estimated: analysis.groupBy.length > 0 ? 'Moderate' : 'Fast',
      considerations
    }
  }

  /**
   * Suggest alternative approaches
   */
  suggestAlternatives(analysis, language) {
    const alternatives = []

    if (language === 'python' && analysis.groupBy.length > 0) {
      alternatives.push({
        language: 'sql',
        reason: 'SQL may be more efficient for large-scale aggregations',
        advantage: 'Database-optimized execution'
      })
    }

    if (analysis.aggregations.length > 0 && !analysis.groupBy.length) {
      alternatives.push({
        approach: 'vectorized',
        reason: 'Direct aggregation without grouping is faster',
        advantage: 'Simpler and more performant'
      })
    }

    return alternatives
  }

  /**
   * Execute generated code (simulation)
   */
  executeCode(codeResult, data) {
    try {
      const { analysis } = codeResult
      let result = { rows: [...data.rows] }

      // Apply filters
      if (analysis.filters.length > 0) {
        const col = analysis.columns[0] || data.headers[0]
        result.rows = result.rows.filter(row => {
          return analysis.filters.every(filter => {
            const value = row[col]
            switch (filter.operator) {
              case '>': return value > parseFloat(filter.value)
              case '<': return value < parseFloat(filter.value)
              case '==': return value == filter.value
              default: return true
            }
          })
        })
      }

      // Apply grouping and aggregation
      if (analysis.groupBy.length > 0) {
        const grouped = this.groupAndAggregate(result.rows, analysis, data)
        return { success: true, result: grouped, rowCount: grouped.length }
      }

      // Apply limit
      if (analysis.limit) {
        result.rows = analysis.sorting.order === 'desc' 
          ? result.rows.slice(0, analysis.limit)
          : result.rows.slice(-analysis.limit)
      }

      return { 
        success: true, 
        result: result.rows,
        rowCount: result.rows.length 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      }
    }
  }

  /**
   * Group and aggregate data
   */
  groupAndAggregate(rows, analysis, data) {
    const groups = {}
    const valueCol = analysis.columns.find(c => !analysis.groupBy.includes(c)) || data.headers[0]
    const agg = analysis.aggregations[0] || 'mean'

    rows.forEach(row => {
      const key = analysis.groupBy.map(col => row[col]).join('|')
      if (!groups[key]) {
        groups[key] = {
          ...Object.fromEntries(analysis.groupBy.map(col => [col, row[col]])),
          values: []
        }
      }
      groups[key].values.push(row[valueCol])
    })

    return Object.values(groups).map(group => {
      const result = { ...group }
      delete result.values
      
      switch (agg) {
        case 'sum':
          result.value = group.values.reduce((a, b) => a + b, 0)
          break
        case 'mean':
          result.value = group.values.reduce((a, b) => a + b, 0) / group.values.length
          break
        case 'count':
          result.value = group.values.length
          break
        case 'max':
          result.value = Math.max(...group.values)
          break
        case 'min':
          result.value = Math.min(...group.values)
          break
        default:
          result.value = group.values.reduce((a, b) => a + b, 0) / group.values.length
      }
      
      return result
    }).sort((a, b) => {
      return analysis.sorting.order === 'desc' ? b.value - a.value : a.value - b.value
    })
  }

  /**
   * Get categorical columns
   */
  getCategoricalColumns(data) {
    return data.headers.filter(header => {
      const values = data.rows.map(row => row[header]).filter(v => v != null)
      const uniqueRatio = new Set(values).size / values.length
      return uniqueRatio < 0.5 && typeof values[0] === 'string'
    })
  }

  /**
   * Get code history
   */
  getHistory() {
    return this.history
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = []
  }
}
