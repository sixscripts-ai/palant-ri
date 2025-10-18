/**
 * AI-Powered Semantic Search Agent
 * Searches across datasets by understanding concepts, synonyms, and context
 */

export class SemanticSearchAgent {
  constructor() {
    this.name = 'Semantic Search Agent'
    this.knowledgeBase = this.initializeKnowledgeBase()
    this.searchHistory = []
  }

  /**
   * Initialize domain knowledge base with synonyms and concepts
   */
  initializeKnowledgeBase() {
    return {
      revenue: ['sales', 'income', 'earnings', 'proceeds', 'receipts', 'turnover', 'gross'],
      customer: ['client', 'buyer', 'purchaser', 'consumer', 'patron', 'account'],
      profit: ['margin', 'earnings', 'returns', 'gains', 'net income'],
      cost: ['expense', 'spending', 'expenditure', 'outlay', 'price'],
      quantity: ['amount', 'count', 'volume', 'number', 'total', 'sum'],
      date: ['time', 'when', 'timestamp', 'period', 'day', 'month', 'year'],
      location: ['place', 'region', 'area', 'geography', 'territory', 'zone', 'country', 'city'],
      product: ['item', 'goods', 'merchandise', 'sku', 'article'],
      category: ['type', 'class', 'group', 'segment', 'classification'],
      status: ['state', 'condition', 'stage', 'phase'],
      loyalty: ['retention', 'repeat', 'returning', 'faithful', 'devoted'],
      churn: ['attrition', 'departure', 'loss', 'leaving', 'turnover'],
      conversion: ['completion', 'success', 'achievement', 'fulfillment'],
      engagement: ['interaction', 'activity', 'participation', 'involvement'],
      growth: ['increase', 'expansion', 'rise', 'development'],
      decline: ['decrease', 'reduction', 'drop', 'fall']
    }
  }

  /**
   * Search across datasets using semantic understanding
   */
  semanticSearch(query, datasets, options = {}) {
    const searchQuery = query.toLowerCase().trim()
    const results = {
      query: searchQuery,
      timestamp: new Date().toISOString(),
      matches: {
        columns: [],
        values: [],
        patterns: [],
        crossDataset: []
      },
      suggestions: [],
      confidence: 0
    }

    // Search in each dataset
    datasets.forEach((dataset, datasetIdx) => {
      // Search columns
      const columnMatches = this.searchColumns(searchQuery, dataset)
      results.matches.columns.push(...columnMatches.map(m => ({
        ...m,
        datasetId: datasetIdx,
        datasetName: dataset.name || `Dataset ${datasetIdx + 1}`
      })))

      // Search values
      const valueMatches = this.searchValues(searchQuery, dataset)
      results.matches.values.push(...valueMatches.map(m => ({
        ...m,
        datasetId: datasetIdx,
        datasetName: dataset.name || `Dataset ${datasetIdx + 1}`
      })))

      // Search patterns
      const patternMatches = this.searchPatterns(searchQuery, dataset)
      results.matches.patterns.push(...patternMatches.map(m => ({
        ...m,
        datasetId: datasetIdx,
        datasetName: dataset.name || `Dataset ${datasetIdx + 1}`
      })))
    })

    // Cross-dataset correlations
    if (datasets.length > 1) {
      results.matches.crossDataset = this.findCrossDatasetCorrelations(searchQuery, datasets)
    }

    // Generate suggestions
    results.suggestions = this.generateSuggestions(searchQuery, results.matches, datasets)

    // Calculate overall confidence
    results.confidence = this.calculateConfidence(results.matches)

    this.searchHistory.push(results)
    return results
  }

  /**
   * Search for columns by concept/synonym
   */
  searchColumns(query, dataset) {
    const matches = []
    const concepts = this.extractConcepts(query)

    dataset.headers.forEach(header => {
      const headerLower = header.toLowerCase()
      const headerWords = headerLower.split(/[_\s\-]+/)
      
      let matchScore = 0
      let matchType = null
      let matchedConcept = null

      // Exact match
      if (headerLower === query || headerLower.includes(query)) {
        matchScore = 100
        matchType = 'exact'
      }
      // Word match
      else if (headerWords.some(word => word === query || query.includes(word))) {
        matchScore = 90
        matchType = 'word'
      }
      // Concept/synonym match
      else {
        for (const concept of concepts) {
          const synonyms = this.knowledgeBase[concept] || []
          if (synonyms.some(syn => headerLower.includes(syn) || syn.includes(headerLower))) {
            matchScore = 80
            matchType = 'concept'
            matchedConcept = concept
            break
          }
        }
      }

      if (matchScore > 0) {
        matches.push({
          column: header,
          matchScore,
          matchType,
          matchedConcept,
          columnType: this.inferColumnType(dataset.rows.map(r => r[header])),
          sampleValues: this.getSampleValues(dataset.rows.map(r => r[header]), 5)
        })
      }
    })

    return matches.sort((a, b) => b.matchScore - a.matchScore)
  }

  /**
   * Search for values within the dataset
   */
  searchValues(query, dataset) {
    const matches = []
    const maxResults = 100

    dataset.headers.forEach(header => {
      const columnValues = dataset.rows.map(r => r[header])
      const matchingRows = []

      columnValues.forEach((value, idx) => {
        if (matchingRows.length >= maxResults) return

        const valueStr = String(value || '').toLowerCase()
        if (valueStr.includes(query)) {
          matchingRows.push({
            rowIndex: idx,
            value,
            context: this.getRowContext(dataset.rows[idx], dataset.headers)
          })
        }
      })

      if (matchingRows.length > 0) {
        matches.push({
          column: header,
          matchCount: matchingRows.length,
          percentage: (matchingRows.length / dataset.rows.length * 100).toFixed(2),
          matchingRows: matchingRows.slice(0, 10), // Limit to first 10
          totalRows: matchingRows.length
        })
      }
    })

    return matches.sort((a, b) => b.matchCount - a.matchCount)
  }

  /**
   * Search for statistical patterns related to query
   */
  searchPatterns(query, dataset) {
    const patterns = []
    const concepts = this.extractConcepts(query)

    // Find columns related to concepts
    const relatedColumns = []
    concepts.forEach(concept => {
      const synonyms = this.knowledgeBase[concept] || []
      dataset.headers.forEach(header => {
        const headerLower = header.toLowerCase()
        if (synonyms.some(syn => headerLower.includes(syn))) {
          relatedColumns.push({ header, concept })
        }
      })
    })

    // Analyze patterns in related columns
    relatedColumns.forEach(({ header, concept }) => {
      const values = dataset.rows.map(r => r[header]).filter(v => v != null)
      
      if (values.length === 0) return

      const columnType = this.inferColumnType(values)
      let pattern = null

      if (columnType === 'number') {
        const stats = this.calculateStats(values)
        pattern = {
          type: 'statistical',
          column: header,
          concept,
          stats,
          insights: this.generateStatsInsights(header, stats)
        }
      } else if (columnType === 'text' || columnType === 'categorical') {
        const distribution = this.getValueDistribution(values)
        pattern = {
          type: 'categorical',
          column: header,
          concept,
          distribution: Object.entries(distribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([value, count]) => ({ value, count, percentage: (count / values.length * 100).toFixed(1) })),
          uniqueCount: Object.keys(distribution).length
        }
      }

      if (pattern) {
        patterns.push(pattern)
      }
    })

    return patterns
  }

  /**
   * Find correlations across multiple datasets
   */
  findCrossDatasetCorrelations(query, datasets) {
    const correlations = []
    const concepts = this.extractConcepts(query)

    // Find potential join keys
    for (let i = 0; i < datasets.length; i++) {
      for (let j = i + 1; j < datasets.length; j++) {
        const dataset1 = datasets[i]
        const dataset2 = datasets[j]

        // Find common column names or similar columns
        dataset1.headers.forEach(h1 => {
          dataset2.headers.forEach(h2 => {
            const similarity = this.calculateColumnSimilarity(h1, h2, dataset1, dataset2)
            
            if (similarity > 0.7) {
              correlations.push({
                type: 'potential_join',
                dataset1: dataset1.name || `Dataset ${i + 1}`,
                dataset2: dataset2.name || `Dataset ${j + 1}`,
                column1: h1,
                column2: h2,
                similarity,
                suggestion: `Join ${dataset1.name || `Dataset ${i + 1}`} and ${dataset2.name || `Dataset ${j + 1}`} on ${h1} ≈ ${h2}`
              })
            }
          })
        })

        // Find concept-related correlations
        concepts.forEach(concept => {
          const cols1 = this.findConceptColumns(concept, dataset1)
          const cols2 = this.findConceptColumns(concept, dataset2)
          
          if (cols1.length > 0 && cols2.length > 0) {
            correlations.push({
              type: 'concept_correlation',
              concept,
              dataset1: dataset1.name || `Dataset ${i + 1}`,
              dataset2: dataset2.name || `Dataset ${j + 1}`,
              columns1: cols1,
              columns2: cols2,
              suggestion: `Both datasets contain ${concept}-related data that could be compared`
            })
          }
        })
      }
    }

    return correlations
  }

  /**
   * Generate search suggestions
   */
  generateSuggestions(query, matches, datasets) {
    const suggestions = []

    // Suggest related concepts
    const concepts = this.extractConcepts(query)
    concepts.forEach(concept => {
      const relatedConcepts = this.getRelatedConcepts(concept)
      relatedConcepts.forEach(related => {
        suggestions.push({
          type: 'related_concept',
          text: `Search for "${related}" instead`,
          query: related,
          reason: `"${related}" is related to "${concept}"`
        })
      })
    })

    // Suggest columns with partial matches
    matches.columns.forEach(col => {
      if (col.matchScore < 100 && col.matchScore > 60) {
        suggestions.push({
          type: 'column_suggestion',
          text: `Did you mean "${col.column}"?`,
          query: col.column,
          reason: `Column "${col.column}" matches your search with ${col.matchScore}% confidence`
        })
      }
    })

    // Suggest common searches
    if (matches.columns.length === 0 && matches.values.length === 0) {
      suggestions.push({
        type: 'no_results',
        text: 'Try searching for column names, values, or concepts like "revenue", "customer", "date"',
        reason: 'No results found for your query'
      })
    }

    return suggestions.slice(0, 5)
  }

  /**
   * Extract concepts from query
   */
  extractConcepts(query) {
    const concepts = []
    const queryWords = query.toLowerCase().split(/\s+/)

    // Check if query matches any concept or its synonyms
    for (const [concept, synonyms] of Object.entries(this.knowledgeBase)) {
      if (queryWords.includes(concept) || synonyms.some(syn => queryWords.includes(syn))) {
        concepts.push(concept)
      }
    }

    // Also add the query itself as a concept
    if (concepts.length === 0) {
      concepts.push(query)
    }

    return concepts
  }

  /**
   * Find columns related to a concept
   */
  findConceptColumns(concept, dataset) {
    const synonyms = this.knowledgeBase[concept] || [concept]
    const columns = []

    dataset.headers.forEach(header => {
      const headerLower = header.toLowerCase()
      if (synonyms.some(syn => headerLower.includes(syn))) {
        columns.push(header)
      }
    })

    return columns
  }

  /**
   * Calculate column similarity
   */
  calculateColumnSimilarity(col1, col2, dataset1, dataset2) {
    const c1Lower = col1.toLowerCase()
    const c2Lower = col2.toLowerCase()

    // Exact match
    if (c1Lower === c2Lower) return 1.0

    // Fuzzy name match
    const nameScore = this.calculateStringSimilarity(c1Lower, c2Lower)

    // Type similarity
    const type1 = this.inferColumnType(dataset1.rows.map(r => r[col1]))
    const type2 = this.inferColumnType(dataset2.rows.map(r => r[col2]))
    const typeScore = type1 === type2 ? 1.0 : 0.5

    // Value overlap (for categorical)
    let valueScore = 0
    if (type1 === 'text' || type1 === 'categorical') {
      const values1 = new Set(dataset1.rows.map(r => r[col1]).filter(v => v != null))
      const values2 = new Set(dataset2.rows.map(r => r[col2]).filter(v => v != null))
      const intersection = new Set([...values1].filter(v => values2.has(v)))
      valueScore = intersection.size / Math.min(values1.size, values2.size)
    }

    return (nameScore * 0.4) + (typeScore * 0.3) + (valueScore * 0.3)
  }

  /**
   * Calculate string similarity (Levenshtein-based)
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Get related concepts
   */
  getRelatedConcepts(concept) {
    const related = {
      revenue: ['profit', 'cost', 'quantity'],
      customer: ['loyalty', 'churn', 'engagement'],
      product: ['category', 'quantity'],
      location: ['category'],
      profit: ['revenue', 'cost'],
      churn: ['customer', 'loyalty'],
      growth: ['revenue', 'quantity'],
      decline: ['churn', 'cost']
    }

    return related[concept] || []
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(matches) {
    let score = 0
    let totalWeight = 0

    if (matches.columns.length > 0) {
      score += matches.columns[0].matchScore * 0.4
      totalWeight += 0.4
    }

    if (matches.values.length > 0) {
      score += 80 * 0.3
      totalWeight += 0.3
    }

    if (matches.patterns.length > 0) {
      score += 70 * 0.2
      totalWeight += 0.2
    }

    if (matches.crossDataset.length > 0) {
      score += 60 * 0.1
      totalWeight += 0.1
    }

    return totalWeight > 0 ? Math.round(score / totalWeight) : 0
  }

  /**
   * Helper: Infer column type
   */
  inferColumnType(values) {
    const nonNull = values.filter(v => v != null && v !== '')
    if (nonNull.length === 0) return 'unknown'
    
    const sample = nonNull[0]
    if (typeof sample === 'number') return 'number'
    if (typeof sample === 'boolean') return 'boolean'
    
    const uniqueRatio = new Set(nonNull).size / nonNull.length
    return uniqueRatio < 0.5 ? 'categorical' : 'text'
  }

  /**
   * Helper: Get sample values
   */
  getSampleValues(values, count = 5) {
    const nonNull = values.filter(v => v != null && v !== '')
    const unique = [...new Set(nonNull)]
    return unique.slice(0, count)
  }

  /**
   * Helper: Get row context
   */
  getRowContext(row, headers) {
    const context = {}
    headers.slice(0, 3).forEach(header => {
      context[header] = row[header]
    })
    return context
  }

  /**
   * Helper: Calculate statistics
   */
  calculateStats(values) {
    const nums = values.filter(v => typeof v === 'number')
    if (nums.length === 0) return null

    const sorted = [...nums].sort((a, b) => a - b)
    const sum = nums.reduce((a, b) => a + b, 0)
    const mean = sum / nums.length
    const median = sorted[Math.floor(sorted.length / 2)]

    return {
      count: nums.length,
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      min: nums[0],
      max: nums[nums.length - 1],
      sum: parseFloat(sum.toFixed(2))
    }
  }

  /**
   * Helper: Generate insights from stats
   */
  generateStatsInsights(column, stats) {
    const insights = []
    
    if (stats.mean > stats.median * 1.5) {
      insights.push(`${column} is right-skewed (mean > median)`)
    } else if (stats.mean < stats.median * 0.5) {
      insights.push(`${column} is left-skewed (mean < median)`)
    }

    const range = stats.max - stats.min
    if (range / stats.mean > 10) {
      insights.push(`High variability (range is ${(range / stats.mean).toFixed(1)}x the mean)`)
    }

    return insights
  }

  /**
   * Helper: Get value distribution
   */
  getValueDistribution(values) {
    const dist = {}
    values.forEach(v => {
      const key = String(v || 'null')
      dist[key] = (dist[key] || 0) + 1
    })
    return dist
  }

  /**
   * Get search history
   */
  getHistory() {
    return this.searchHistory
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.searchHistory = []
  }
}
