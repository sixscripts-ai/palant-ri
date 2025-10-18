import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import './ErrorBoundary.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">
              <AlertTriangle size={64} />
            </div>
            <h1>Oops! Something went wrong</h1>
            <p className="error-message">
              The application encountered an unexpected error. Don't worry, your data is safe.
            </p>
            
            {this.state.error && (
              <div className="error-details">
                <p className="error-type">{this.state.error.toString()}</p>
              </div>
            )}

            <button className="reset-button" onClick={this.handleReset}>
              <RefreshCw size={20} />
              <span>Reload Application</span>
            </button>

            <p className="error-hint">
              If the problem persists, try clearing your browser cache or using a different browser.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
