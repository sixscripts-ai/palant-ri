import React, { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, Link as LinkIcon, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import './UploadZone.css'

function UploadZone({ onFileUpload }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  const acceptedFormats = ['.csv', '.tsv', '.xlsx', '.xls', '.ods']
  const maxSize = 500 * 1024 * 1024 // 500MB

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
  }

  const processFile = async (file) => {
    setError(null)
    setUploading(true)
    setProgress(0)

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size exceeds 500MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      setUploading(false)
      return
    }

    // Validate file type
    const fileExt = '.' + file.name.split('.').pop().toLowerCase()
    if (!acceptedFormats.includes(fileExt)) {
      setError(`Unsupported file format. Please upload: ${acceptedFormats.join(', ')}`)
      setUploading(false)
      return
    }

    try {
      let parsedData = null

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      if (fileExt === '.csv' || fileExt === '.tsv') {
        // Parse CSV/TSV
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            clearInterval(progressInterval)
            setProgress(100)
            parsedData = {
              headers: results.meta.fields,
              rows: results.data,
              rowCount: results.data.length,
              columnCount: results.meta.fields.length
            }
            setTimeout(() => {
              onFileUpload(file, parsedData)
              setUploading(false)
            }, 300)
          },
          error: (error) => {
            clearInterval(progressInterval)
            setError(`Failed to parse file: ${error.message}`)
            setUploading(false)
          }
        })
      } else if (['.xlsx', '.xls', '.ods'].includes(fileExt)) {
        // Parse Excel/ODS
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
            
            const headers = jsonData[0]
            const rows = jsonData.slice(1).map(row => {
              const obj = {}
              headers.forEach((header, i) => {
                obj[header] = row[i]
              })
              return obj
            })

            clearInterval(progressInterval)
            setProgress(100)
            parsedData = {
              headers,
              rows,
              rowCount: rows.length,
              columnCount: headers.length
            }
            setTimeout(() => {
              onFileUpload(file, parsedData)
              setUploading(false)
            }, 300)
          } catch (err) {
            clearInterval(progressInterval)
            setError(`Failed to parse Excel file: ${err.message}`)
            setUploading(false)
          }
        }
        reader.readAsArrayBuffer(file)
      }
    } catch (err) {
      setError(`Unexpected error: ${err.message}`)
      setUploading(false)
    }
  }

  return (
    <div className="upload-container">
      <div 
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {!uploading ? (
          <>
            <div className="upload-icon">
              <FileSpreadsheet size={64} />
            </div>
            <h2>Upload Spreadsheet for Analysis</h2>
            <p className="upload-subtitle">
              Drag & drop your file here or click to browse
            </p>
            <div className="supported-formats">
              <span>Supported formats:</span>
              <div className="format-tags">
                {acceptedFormats.map(format => (
                  <span key={format} className="format-tag">{format}</span>
                ))}
              </div>
            </div>
            <div className="upload-info">
              <span>Maximum file size: 500MB</span>
            </div>
          </>
        ) : (
          <div className="upload-progress">
            <div className="spinner"></div>
            <h3>Processing your file...</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="progress-text">{progress}%</p>
          </div>
        )}

        {error && (
          <div className="upload-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="or-divider">
        <span>OR</span>
      </div>

      <div className="google-sheets-section">
        <LinkIcon size={24} />
        <h3>Connect Google Sheets</h3>
        <p>Paste a Google Sheets URL with view permissions</p>
        <input 
          type="text" 
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="sheets-input"
        />
        <button className="sheets-btn" disabled>
          Connect Sheet
          <span className="coming-soon">Coming Soon</span>
        </button>
      </div>
    </div>
  )
}

export default UploadZone
