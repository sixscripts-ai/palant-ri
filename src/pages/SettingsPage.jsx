import React, { useState, useEffect } from 'react'
import { Settings, Key, CheckCircle, XCircle, Eye, EyeOff, Save, ArrowLeft, AlertCircle } from 'lucide-react'
import './SettingsPage.css'

const AI_PROVIDERS = [
  {
    id: 'perplexity',
    name: 'Perplexity',
    models: [
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-huge-128k-online'
    ],
    description: 'Real-time web search powered AI with citations',
    getKeyUrl: 'https://www.perplexity.ai/settings/api'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      'gemini-2.0-flash-exp',
      'gemini-exp-1206',
      'gemini-2.5-pro-latest'
    ],
    description: 'Google\'s most capable multimodal AI',
    getKeyUrl: 'https://aistudio.google.com/app/apikey'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: [
      'claude-sonnet-4-20250514',
      'claude-4-5-sonnet-20241022',
      'claude-4.1-opus-20240229'
    ],
    description: 'Advanced reasoning and analysis capabilities',
    getKeyUrl: 'https://console.anthropic.com/settings/keys'
  }
]

function SettingsPage({ onBack, onSave }) {
  const [selectedProvider, setSelectedProvider] = useState('perplexity')
  const [apiKeys, setApiKeys] = useState({})
  const [selectedModels, setSelectedModels] = useState({})
  const [showKeys, setShowKeys] = useState({})
  const [validationStatus, setValidationStatus] = useState({})
  const [validating, setValidating] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load saved settings from localStorage
    const savedKeys = localStorage.getItem('buddy_ai_keys')
    const savedModels = localStorage.getItem('buddy_ai_models')
    const savedProvider = localStorage.getItem('buddy_ai_provider')

    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys))
      } catch (e) {
        console.error('Failed to parse saved keys')
      }
    }

    if (savedModels) {
      try {
        setSelectedModels(JSON.parse(savedModels))
      } catch (e) {
        console.error('Failed to parse saved models')
      }
    }

    if (savedProvider) {
      setSelectedProvider(savedProvider)
    }
  }, [])

  const handleApiKeyChange = (provider, value) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }))
    setValidationStatus(prev => ({ ...prev, [provider]: null }))
  }

  const handleModelChange = (provider, model) => {
    setSelectedModels(prev => ({ ...prev, [provider]: model }))
  }

  const toggleShowKey = (provider) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  const validateApiKey = async (provider) => {
    const apiKey = apiKeys[provider]
    if (!apiKey) {
      setValidationStatus(prev => ({ ...prev, [provider]: 'error' }))
      return
    }

    setValidating(prev => ({ ...prev, [provider]: true }))

    try {
      // Use relative URL with proxy in dev mode
      const apiUrl = '/api/ai/validate-key'
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          apiKey,
          model: selectedModels[provider] || AI_PROVIDERS.find(p => p.id === provider)?.models[0]
        })
      })

      const data = await response.json()

      if (data.valid) {
        setValidationStatus(prev => ({ ...prev, [provider]: 'success' }))
      } else {
        setValidationStatus(prev => ({ ...prev, [provider]: 'error' }))
      }
    } catch (error) {
      console.error('Validation error:', error)
      setValidationStatus(prev => ({ ...prev, [provider]: 'error' }))
    } finally {
      setValidating(prev => ({ ...prev, [provider]: false }))
    }
  }

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('buddy_ai_keys', JSON.stringify(apiKeys))
    localStorage.setItem('buddy_ai_models', JSON.stringify(selectedModels))
    localStorage.setItem('buddy_ai_provider', selectedProvider)

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)

    if (onSave) {
      onSave({
        provider: selectedProvider,
        apiKey: apiKeys[selectedProvider],
        model: selectedModels[selectedProvider]
      })
    }
  }

  const currentProvider = AI_PROVIDERS.find(p => p.id === selectedProvider)

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <div className="settings-title">
          <Settings size={28} />
          <div>
            <h1>AI Configuration</h1>
            <p className="subtitle">Configure your AI providers and API keys</p>
          </div>
        </div>
        <button 
          className={`save-button ${saved ? 'saved' : ''}`}
          onClick={handleSave}
          disabled={!apiKeys[selectedProvider]}
        >
          {saved ? (
            <>
              <CheckCircle size={18} />
              Saved!
            </>
          ) : (
            <>
              <Save size={18} />
              Save Settings
            </>
          )}
        </button>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <h3>AI Providers</h3>
          <div className="provider-list">
            {AI_PROVIDERS.map(provider => (
              <button
                key={provider.id}
                className={`provider-item ${selectedProvider === provider.id ? 'active' : ''}`}
                onClick={() => setSelectedProvider(provider.id)}
              >
                <div className="provider-info">
                  <span className="provider-name">{provider.name}</span>
                  {validationStatus[provider.id] === 'success' && (
                    <CheckCircle size={16} className="status-icon success" />
                  )}
                  {validationStatus[provider.id] === 'error' && (
                    <XCircle size={16} className="status-icon error" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="settings-info">
            <AlertCircle size={18} />
            <div>
              <h4>Security Notice</h4>
              <p>API keys are stored locally in your browser. They are never sent to our servers except for validation.</p>
            </div>
          </div>
        </div>

        <div className="settings-content">
          <div className="provider-details">
            <div className="provider-header">
              <h2>{currentProvider.name}</h2>
              <p className="provider-description">{currentProvider.description}</p>
            </div>

            <div className="settings-section">
              <label className="settings-label">
                <Key size={18} />
                API Key
              </label>
              <div className="api-key-input-group">
                <div className="input-wrapper">
                  <input
                    type={showKeys[selectedProvider] ? 'text' : 'password'}
                    className="settings-input"
                    placeholder={`Enter your ${currentProvider.name} API key`}
                    value={apiKeys[selectedProvider] || ''}
                    onChange={(e) => handleApiKeyChange(selectedProvider, e.target.value)}
                  />
                  <button
                    className="toggle-visibility"
                    onClick={() => toggleShowKey(selectedProvider)}
                  >
                    {showKeys[selectedProvider] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  className="validate-button"
                  onClick={() => validateApiKey(selectedProvider)}
                  disabled={!apiKeys[selectedProvider] || validating[selectedProvider]}
                >
                  {validating[selectedProvider] ? (
                    <>
                      <div className="button-spinner"></div>
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Validate
                    </>
                  )}
                </button>
              </div>
              <a 
                href={currentProvider.getKeyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="get-key-link"
              >
                Get your {currentProvider.name} API key →
              </a>
              {validationStatus[selectedProvider] === 'success' && (
                <div className="validation-message success">
                  <CheckCircle size={16} />
                  API key is valid and working!
                </div>
              )}
              {validationStatus[selectedProvider] === 'error' && (
                <div className="validation-message error">
                  <XCircle size={16} />
                  Invalid API key. Please check and try again.
                </div>
              )}
            </div>

            <div className="settings-section">
              <label className="settings-label">Model Selection</label>
              <select
                className="settings-select"
                value={selectedModels[selectedProvider] || currentProvider.models[0]}
                onChange={(e) => handleModelChange(selectedProvider, e.target.value)}
              >
                {currentProvider.models.map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <p className="settings-hint">
                Choose the model that best fits your needs. Larger models provide better quality but may be slower.
              </p>
            </div>

            <div className="settings-section">
              <h3>Model Information</h3>
              <div className="model-info">
                {selectedProvider === 'perplexity' && (
                  <>
                    <p><strong>Sonar Large:</strong> Best balance of speed and quality with web search</p>
                    <p><strong>Sonar Small:</strong> Faster responses for simpler queries</p>
                    <p><strong>Sonar Huge:</strong> Maximum capability for complex analysis</p>
                  </>
                )}
                {selectedProvider === 'gemini' && (
                  <>
                    <p><strong>2.0 Flash:</strong> Lightning-fast responses with excellent quality</p>
                    <p><strong>Exp 1206:</strong> Experimental model with cutting-edge features</p>
                    <p><strong>1.5 Pro:</strong> Stable and reliable for production use</p>
                  </>
                )}
                {selectedProvider === 'anthropic' && (
                  <>
                    <p><strong>Sonnet 4:</strong> Latest model with superior reasoning</p>
                    <p><strong>Sonnet 3.5:</strong> Great balance of speed and capability</p>
                    <p><strong>Opus:</strong> Most powerful model for complex tasks</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
