/**
 * Self-Healing Data Pipeline Agent
 * Automatically detects and fixes data quality issues with multiple strategies
 */

export class SelfHealingAgent {
  constructor() {
    this.name = 'Self-Healing Data Agent'
    this.auditLog = []
    this.strategies = {
      missingValues: ['dropRows', 'fillMean', 'fillMedian', 'fillMode', 'fillForward', 'fillBackward'],
      outliers: ['remove', 'cap', 'transform', 'keep'],
      duplicates: ['removeAll', 'keepFirst', 'keepLast', 'markOnly'],
      typeIssues: ['coerce', 'stringify', 'nullify']
    }
  }

  /**
   * Analyze data and detect all quality issues
   */
  analyzeQuality(data) {
    const issues = {
      missingValues: this.detectMissingValues(data),
      outliers: this.detectOutliers(data),
      duplicates: this.detectDuplicates(data),
      typeIssues: this.detectTypeIssues(data),
      encoding: this.detectEncodingIssues(data)
    }

    const summary = {
      totalIssues: Object.values(issues).reduce((sum, arr) => sum + arr.length, 0),
      issues,
      severity: this.calculateSeverity(issues),
      recommendations: this.generateRecommendations(issues)
    }

    return summary
  }

  /**
   * Detect missing values in dataset
   */
  detectMissingValues(data) {
    const issues = []
    const { headers, rows } = data

    headers.forEach(header => {
      const values = rows.map(row => row[header])
      const missing = values.filter(v => v == null || v === '' || v === 'null' || v === 'undefined')
      const missingCount = missing.length
      const missingPct = (missingCount / rows.length) * 100

      if (missingCount > 0) {
        issues.push({
          type: 'missingValues',
          column: header,
          count: missingCount,
          percentage: parseFloat(missingPct.toFixed(2)),
          severity: missingPct > 50 ? 'critical' : missingPct > 20 ? 'high' : missingPct > 5 ? 'medium' : 'low',
          affectedRows: rows.map((row, idx) => ({ index: idx, value: row[header] }))
            .filter(item => item.value == null || item.value === '' || item.value === 'null')
            .map(item => item.index),
          strategies: this.proposeMissingValueStrategies(header, values, data)
        })
      }
    })

    return issues
  }

  /**
   * Propose strategies for handling missing values
   */
  proposeMissingValueStrategies(column, values, data) {
    const columnType = this.inferColumnType(values)
    const nonNull = values.filter(v => v != null && v !== '')
    const strategies = []

    // Strategy 1: Drop rows with missing values
    strategies.push({
      name: 'dropRows',
      description: `Remove all rows where ${column} is missing`,
      impact: `Will remove ${values.length - nonNull.length} rows (${((1 - nonNull.length / values.length) * 100).toFixed(1)}% of data)`,
      confidence: 90,
      recommended: nonNull.length / values.length > 0.95,
      pros: ['Clean dataset', 'No imputation bias'],
      cons: ['Data loss', 'May reduce sample size significantly']
    })

    if (columnType === 'number') {
      // Strategy 2: Fill with mean
      const mean = nonNull.reduce((sum, v) => sum + v, 0) / nonNull.length
      strategies.push({
        name: 'fillMean',
        description: `Fill missing values with mean (${mean.toFixed(2)})`,
        impact: `Will impute ${values.length - nonNull.length} values`,
        confidence: 75,
        recommended: true,
        pros: ['Preserves row count', 'Statistically sound for normal distributions'],
        cons: ['May distort distribution', 'Not suitable for skewed data'],
        value: mean
      })

      // Strategy 3: Fill with median
      const sorted = [...nonNull].sort((a, b) => a - b)
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]
      strategies.push({
        name: 'fillMedian',
        description: `Fill missing values with median (${median.toFixed(2)})`,
        impact: `Will impute ${values.length - nonNull.length} values`,
        confidence: 80,
        recommended: this.isSkewed(nonNull),
        pros: ['Robust to outliers', 'Preserves central tendency'],
        cons: ['May not capture distribution shape'],
        value: median
      })
    }

    if (columnType === 'text' || columnType === 'categorical') {
      // Strategy 4: Fill with mode (most frequent value)
      const mode = this.calculateMode(nonNull)
      const modeFreq = nonNull.filter(v => v === mode).length
      strategies.push({
        name: 'fillMode',
        description: `Fill missing values with most frequent value "${mode}"`,
        impact: `Will impute ${values.length - nonNull.length} values`,
        confidence: 70,
        recommended: modeFreq / nonNull.length > 0.2,
        pros: ['Preserves distribution', 'Works for categorical data'],
        cons: ['Increases frequency of mode', 'May not be appropriate for high cardinality'],
        value: mode
      })
    }

    // Strategy 5: Forward fill
    strategies.push({
      name: 'fillForward',
      description: 'Fill missing values with the previous non-null value',
      impact: `Propagates last known values forward`,
      confidence: 65,
      recommended: false,
      pros: ['Works well for time series', 'Maintains continuity'],
      cons: ['Assumes temporal ordering', 'May propagate outdated values']
    })

    return strategies.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1
      if (!a.recommended && b.recommended) return 1
      return b.confidence - a.confidence
    })
  }

  /**
   * Detect outliers using IQR method
   */
  detectOutliers(data) {
    const issues = []
    const numericColumns = this.getNumericColumns(data)

    numericColumns.forEach(header => {
      const values = data.rows.map(row => row[header]).filter(v => v != null && !isNaN(v))
      if (values.length === 0) return

      const sorted = [...values].sort((a, b) => a - b)
      const q1 = sorted[Math.floor(sorted.length * 0.25)]
      const q3 = sorted[Math.floor(sorted.length * 0.75)]
      const iqr = q3 - q1
      const lowerBound = q1 - 1.5 * iqr
      const upperBound = q3 + 1.5 * iqr

      const outlierIndices = []
      const outlierValues = []

      data.rows.forEach((row, idx) => {
        const value = row[header]
        if (value != null && !isNaN(value) && (value < lowerBound || value > upperBound)) {
          outlierIndices.push(idx)
          outlierValues.push(value)
        }
      })

      if (outlierIndices.length > 0) {
        const outlierPct = (outlierIndices.length / data.rows.length) * 100
        
        issues.push({
          type: 'outliers',
          column: header,
          count: outlierIndices.length,
          percentage: parseFloat(outlierPct.toFixed(2)),
          severity: outlierPct > 10 ? 'high' : outlierPct > 5 ? 'medium' : 'low',
          bounds: { lower: lowerBound, upper: upperBound },
          q1, q3, iqr,
          affectedRows: outlierIndices,
          values: outlierValues,
          strategies: this.proposeOutlierStrategies(header, outlierIndices, outlierValues, { lowerBound, upperBound })
        })
      }
    })

    return issues
  }

  /**
   * Propose strategies for handling outliers
   */
  proposeOutlierStrategies(column, indices, values, bounds) {
    const strategies = []

    // Strategy 1: Remove outliers
    strategies.push({
      name: 'remove',
      description: `Remove ${indices.length} rows containing outliers`,
      impact: `Will remove ${indices.length} rows (${(indices.length / 100).toFixed(1)}% of data)`,
      confidence: 70,
      recommended: indices.length < 50,
      pros: ['Clean dataset', 'Removes extreme values'],
      cons: ['Data loss', 'May remove valid extreme cases']
    })

    // Strategy 2: Cap outliers
    strategies.push({
      name: 'cap',
      description: `Cap outliers at bounds (${bounds.lower.toFixed(2)} - ${bounds.upper.toFixed(2)})`,
      impact: `Will modify ${indices.length} values`,
      confidence: 85,
      recommended: true,
      pros: ['Preserves row count', 'Reduces extreme impact'],
      cons: ['Distorts original values', 'May hide genuine extremes'],
      bounds
    })

    // Strategy 3: Transform (log transform)
    strategies.push({
      name: 'transform',
      description: 'Apply log transformation to reduce outlier impact',
      impact: `Will transform all values in column`,
      confidence: 75,
      recommended: false,
      pros: ['Mathematically sound', 'Reduces skewness'],
      cons: ['Changes scale', 'Requires positive values']
    })

    // Strategy 4: Keep as-is
    strategies.push({
      name: 'keep',
      description: 'Keep outliers as they may represent valid extreme cases',
      impact: 'No changes to data',
      confidence: 60,
      recommended: indices.length / values.length < 0.01,
      pros: ['Preserves original data', 'May capture important extremes'],
      cons: ['Can skew analysis', 'May affect statistical measures']
    })

    return strategies
  }

  /**
   * Detect duplicate rows
   */
  detectDuplicates(data) {
    const issues = []
    const seen = new Map()
    const duplicateGroups = []

    data.rows.forEach((row, idx) => {
      const key = JSON.stringify(row)
      if (seen.has(key)) {
        seen.get(key).push(idx)
      } else {
        seen.set(key, [idx])
      }
    })

    seen.forEach((indices, key) => {
      if (indices.length > 1) {
        duplicateGroups.push({
          firstIndex: indices[0],
          duplicateIndices: indices.slice(1),
          count: indices.length,
          row: JSON.parse(key)
        })
      }
    })

    if (duplicateGroups.length > 0) {
      const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.count - 1, 0)
      const duplicatePct = (totalDuplicates / data.rows.length) * 100

      issues.push({
        type: 'duplicates',
        count: totalDuplicates,
        groups: duplicateGroups.length,
        percentage: parseFloat(duplicatePct.toFixed(2)),
        severity: duplicatePct > 20 ? 'high' : duplicatePct > 5 ? 'medium' : 'low',
        duplicateGroups: duplicateGroups.slice(0, 10), // Show first 10 groups
        strategies: this.proposeDuplicateStrategies(duplicateGroups, totalDuplicates)
      })
    }

    return issues
  }

  /**
   * Propose strategies for handling duplicates
   */
  proposeDuplicateStrategies(groups, totalCount) {
    return [
      {
        name: 'removeAll',
        description: `Remove all ${totalCount} duplicate rows, keeping only first occurrence`,
        impact: `Will remove ${totalCount} rows`,
        confidence: 90,
        recommended: true,
        pros: ['Clean dataset', 'Standard approach'],
        cons: ['Data loss if duplicates are intentional']
      },
      {
        name: 'keepFirst',
        description: 'Keep first occurrence of each duplicate',
        impact: `Same as removeAll`,
        confidence: 90,
        recommended: true,
        pros: ['Predictable behavior'],
        cons: ['First may not be best']
      },
      {
        name: 'markOnly',
        description: 'Add a column marking duplicates without removing',
        impact: 'Adds "is_duplicate" column',
        confidence: 70,
        recommended: false,
        pros: ['No data loss', 'Allows manual review'],
        cons: ['Requires downstream handling']
      }
    ]
  }

  /**
   * Detect type inconsistencies
   */
  detectTypeIssues(data) {
    const issues = []

    data.headers.forEach(header => {
      const values = data.rows.map(row => row[header]).filter(v => v != null && v !== '')
      if (values.length === 0) return

      const types = new Set(values.map(v => typeof v))
      
      if (types.size > 1) {
        const typeCounts = {}
        values.forEach(v => {
          const t = typeof v
          typeCounts[t] = (typeCounts[t] || 0) + 1
        })

        const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]
        const inconsistentCount = values.length - typeCounts[dominantType]

        issues.push({
          type: 'typeIssues',
          column: header,
          dominantType,
          typeCounts,
          inconsistentCount,
          percentage: parseFloat((inconsistentCount / values.length * 100).toFixed(2)),
          severity: inconsistentCount / values.length > 0.2 ? 'high' : 'medium',
          strategies: this.proposeTypeFixStrategies(header, dominantType, inconsistentCount)
        })
      }
    })

    return issues
  }

  /**
   * Propose strategies for fixing type issues
   */
  proposeTypeFixStrategies(column, dominantType, count) {
    return [
      {
        name: 'coerce',
        description: `Convert all values to ${dominantType}`,
        impact: `Will attempt to convert ${count} inconsistent values`,
        confidence: 80,
        recommended: true,
        pros: ['Uniform type', 'Enables type-specific operations'],
        cons: ['May lose precision', 'Conversion may fail']
      },
      {
        name: 'stringify',
        description: 'Convert all values to strings',
        impact: `Safe conversion for all values`,
        confidence: 95,
        recommended: false,
        pros: ['Always works', 'No data loss'],
        cons: ['Loses type information', 'Limits analysis options']
      }
    ]
  }

  /**
   * Detect encoding issues
   */
  detectEncodingIssues(data) {
    const issues = []
    const textColumns = this.getTextColumns(data)

    textColumns.forEach(header => {
      const values = data.rows.map(row => row[header]).filter(v => v != null && v !== '')
      const problematicValues = []

      values.forEach((value, idx) => {
        if (typeof value === 'string' && this.hasEncodingIssues(value)) {
          problematicValues.push({ index: idx, value })
        }
      })

      if (problematicValues.length > 0) {
        issues.push({
          type: 'encoding',
          column: header,
          count: problematicValues.length,
          percentage: parseFloat((problematicValues.length / values.length * 100).toFixed(2)),
          severity: 'low',
          examples: problematicValues.slice(0, 5)
        })
      }
    })

    return issues
  }

  /**
   * Check if string has encoding issues
   */
  hasEncodingIssues(str) {
    // Check for common encoding problem patterns
    return /�|[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(str)
  }

  /**
   * Calculate overall severity
   */
  calculateSeverity(issues) {
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 }
    
    Object.values(issues).flat().forEach(issue => {
      if (issue.severity) {
        severityCounts[issue.severity]++
      }
    })

    if (severityCounts.critical > 0) return 'critical'
    if (severityCounts.high > 2) return 'high'
    if (severityCounts.high > 0 || severityCounts.medium > 3) return 'medium'
    return 'low'
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(issues) {
    const recommendations = []

    // Missing values recommendation
    if (issues.missingValues.length > 0) {
      const totalMissing = issues.missingValues.reduce((sum, i) => sum + i.count, 0)
      recommendations.push({
        priority: 'high',
        category: 'missingValues',
        title: `Address ${totalMissing} missing values across ${issues.missingValues.length} columns`,
        action: 'Review recommended strategies for each column and apply appropriate fixes',
        automatable: true
      })
    }

    // Outliers recommendation
    if (issues.outliers.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'outliers',
        title: `${issues.outliers.length} columns contain outliers`,
        action: 'Determine if outliers are data errors or valid extremes, then cap or remove',
        automatable: true
      })
    }

    // Duplicates recommendation
    if (issues.duplicates.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'duplicates',
        title: `${issues.duplicates[0].count} duplicate rows detected`,
        action: 'Remove duplicates to ensure data integrity',
        automatable: true
      })
    }

    return recommendations
  }

  /**
   * Apply selected fix strategies
   */
  applyFixes(data, fixPlan) {
    const result = {
      data: this.cloneData(data),
      changes: [],
      success: true,
      errors: []
    }

    try {
      // Apply each fix in the plan
      fixPlan.forEach(fix => {
        const change = this.applyFix(result.data, fix)
        result.changes.push(change)
        this.auditLog.push({
          timestamp: new Date().toISOString(),
          fix,
          change
        })
      })
    } catch (error) {
      result.success = false
      result.errors.push(error.message)
    }

    return result
  }

  /**
   * Apply individual fix
   */
  applyFix(data, fix) {
    const { type, column, strategy } = fix

    switch (type) {
      case 'missingValues':
        return this.fixMissingValues(data, column, strategy)
      case 'outliers':
        return this.fixOutliers(data, column, strategy)
      case 'duplicates':
        return this.fixDuplicates(data, strategy)
      case 'typeIssues':
        return this.fixTypeIssues(data, column, strategy)
      default:
        throw new Error(`Unknown fix type: ${type}`)
    }
  }

  /**
   * Fix missing values
   */
  fixMissingValues(data, column, strategy) {
    let fixedCount = 0
    const values = data.rows.map(row => row[column])

    switch (strategy.name) {
      case 'dropRows':
        const originalLength = data.rows.length
        data.rows = data.rows.filter(row => row[column] != null && row[column] !== '')
        fixedCount = originalLength - data.rows.length
        break

      case 'fillMean':
      case 'fillMedian':
      case 'fillMode':
        const fillValue = strategy.value
        data.rows.forEach(row => {
          if (row[column] == null || row[column] === '') {
            row[column] = fillValue
            fixedCount++
          }
        })
        break

      case 'fillForward':
        let lastValue = null
        data.rows.forEach(row => {
          if (row[column] != null && row[column] !== '') {
            lastValue = row[column]
          } else if (lastValue != null) {
            row[column] = lastValue
            fixedCount++
          }
        })
        break
    }

    return {
      type: 'missingValues',
      column,
      strategy: strategy.name,
      fixedCount,
      description: `Fixed ${fixedCount} missing values in ${column} using ${strategy.name}`
    }
  }

  /**
   * Fix outliers
   */
  fixOutliers(data, column, strategy) {
    let fixedCount = 0

    switch (strategy.name) {
      case 'remove':
        const originalLength = data.rows.length
        data.rows = data.rows.filter(row => {
          const value = row[column]
          return value == null || (value >= strategy.bounds.lower && value <= strategy.bounds.upper)
        })
        fixedCount = originalLength - data.rows.length
        break

      case 'cap':
        data.rows.forEach(row => {
          const value = row[column]
          if (value != null) {
            if (value < strategy.bounds.lower) {
              row[column] = strategy.bounds.lower
              fixedCount++
            } else if (value > strategy.bounds.upper) {
              row[column] = strategy.bounds.upper
              fixedCount++
            }
          }
        })
        break
    }

    return {
      type: 'outliers',
      column,
      strategy: strategy.name,
      fixedCount,
      description: `Fixed ${fixedCount} outliers in ${column} using ${strategy.name}`
    }
  }

  /**
   * Fix duplicates
   */
  fixDuplicates(data, strategy) {
    const originalLength = data.rows.length
    const seen = new Set()
    const kept = []

    data.rows.forEach(row => {
      const key = JSON.stringify(row)
      if (strategy.name === 'keepFirst' && !seen.has(key)) {
        kept.push(row)
        seen.add(key)
      }
    })

    if (strategy.name === 'keepFirst') {
      data.rows = kept
    }

    const fixedCount = originalLength - data.rows.length

    return {
      type: 'duplicates',
      strategy: strategy.name,
      fixedCount,
      description: `Removed ${fixedCount} duplicate rows`
    }
  }

  /**
   * Fix type issues
   */
  fixTypeIssues(data, column, strategy) {
    let fixedCount = 0

    data.rows.forEach(row => {
      const value = row[column]
      if (value != null) {
        try {
          if (strategy.name === 'coerce') {
            if (strategy.dominantType === 'number') {
              const num = Number(value)
              if (!isNaN(num)) {
                row[column] = num
                fixedCount++
              }
            }
          } else if (strategy.name === 'stringify') {
            row[column] = String(value)
            fixedCount++
          }
        } catch (e) {
          // Skip conversion errors
        }
      }
    })

    return {
      type: 'typeIssues',
      column,
      strategy: strategy.name,
      fixedCount,
      description: `Fixed ${fixedCount} type inconsistencies in ${column}`
    }
  }

  /**
   * Helper: Clone data
   */
  cloneData(data) {
    return {
      ...data,
      rows: data.rows.map(row => ({ ...row }))
    }
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
   * Helper: Get numeric columns
   */
  getNumericColumns(data) {
    return data.headers.filter(header => {
      const values = data.rows.map(row => row[header]).filter(v => v != null)
      return values.length > 0 && typeof values[0] === 'number'
    })
  }

  /**
   * Helper: Get text columns
   */
  getTextColumns(data) {
    return data.headers.filter(header => {
      const values = data.rows.map(row => row[header]).filter(v => v != null)
      return values.length > 0 && typeof values[0] === 'string'
    })
  }

  /**
   * Helper: Calculate mode
   */
  calculateMode(values) {
    const freq = {}
    values.forEach(v => freq[v] = (freq[v] || 0) + 1)
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
  }

  /**
   * Helper: Check if data is skewed
   */
  isSkewed(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const sorted = [...values].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    return Math.abs(mean - median) / mean > 0.1
  }

  /**
   * Get audit log
   */
  getAuditLog() {
    return this.auditLog
  }
}
