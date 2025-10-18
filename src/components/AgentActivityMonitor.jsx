import React, { useState, useEffect } from 'react'
import { Activity, Bot, CheckCircle, AlertCircle, Clock, Zap, TrendingUp } from 'lucide-react'
import './AgentActivityMonitor.css'

function AgentActivityMonitor({ orchestrator, isActive }) {
  const [activities, setActivities] = useState([])
  const [expandedAgent, setExpandedAgent] = useState(null)
  const [stats, setStats] = useState({})

  useEffect(() => {
    if (orchestrator && isActive) {
      const interval = setInterval(() => {
        const activity = orchestrator.getActivity()
        setActivities(activity)
        setStats(calculateStats(activity))
      }, 500)

      return () => clearInterval(interval)
    }
  }, [orchestrator, isActive])

  if (!isActive || activities.length === 0) return null

  const agentSummary = groupActivitiesByAgent(activities)

  return (
    <div className="agent-activity-monitor">
      <div className="monitor-header">
        <div className="header-content">
          <Activity size={20} />
          <h4>Multi-Agent Activity</h4>
          <span className="activity-badge">{activities.length} operations</span>
        </div>
        <div className="agent-stats">
          <StatBadge icon={<Zap size={14} />} label="Active" value={stats.activeAgents || 0} />
          <StatBadge icon={<CheckCircle size={14} />} label="Completed" value={stats.completed || 0} />
          <StatBadge icon={<Clock size={14} />} label="Avg Time" value={`${stats.avgTime || 0}ms`} />
        </div>
      </div>

      <div className="agent-grid">
        {Object.entries(agentSummary).map(([agentName, agentData]) => (
          <AgentCard
            key={agentName}
            name={agentName}
            data={agentData}
            expanded={expandedAgent === agentName}
            onToggle={() => setExpandedAgent(expandedAgent === agentName ? null : agentName)}
          />
        ))}
      </div>

      <div className="activity-timeline">
        <h5>Recent Activity Timeline</h5>
        <div className="timeline-list">
          {activities.slice(-10).reverse().map((activity, idx) => (
            <TimelineItem key={idx} activity={activity} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatBadge({ icon, label, value }) {
  return (
    <div className="stat-badge">
      {icon}
      <span className="stat-label">{label}:</span>
      <span className="stat-value">{value}</span>
    </div>
  )
}

function AgentCard({ name, data, expanded, onToggle }) {
  const getAgentIcon = (name) => {
    const icons = {
      dataHealer: '🏥',
      codeGenerator: '💻',
      transformer: '🔄',
      semanticSearch: '🔍',
      anomalyDetective: '🕵️'
    }
    return icons[name] || '🤖'
  }

  const getAgentColor = (name) => {
    const colors = {
      dataHealer: '#34d399',
      codeGenerator: '#60a5fa',
      transformer: '#a78bfa',
      semanticSearch: '#fbbf24',
      anomalyDetective: '#f87171'
    }
    return colors[name] || '#94a3b8'
  }

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle size={14} className="status-completed" />
    if (status === 'started') return <Activity size={14} className="status-active animate-pulse" />
    return <AlertCircle size={14} className="status-pending" />
  }

  return (
    <div 
      className={`agent-card ${data.status}`}
      style={{ borderColor: getAgentColor(name) + '40' }}
    >
      <div className="agent-card-header" onClick={onToggle}>
        <div className="agent-info">
          <span className="agent-icon">{getAgentIcon(name)}</span>
          <div>
            <h5>{formatAgentName(name)}</h5>
            <span className="agent-task">{data.task || 'Idle'}</span>
          </div>
        </div>
        <div className="agent-status">
          {getStatusIcon(data.status)}
          <span className={`status-text ${data.status}`}>{data.status}</span>
        </div>
      </div>

      {expanded && (
        <div className="agent-details">
          <div className="detail-row">
            <span className="detail-label">Operations:</span>
            <span className="detail-value">{data.operations}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Success Rate:</span>
            <span className="detail-value">{data.successRate}%</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Last Active:</span>
            <span className="detail-value">{formatTime(data.lastActive)}</span>
          </div>
          {data.findings && (
            <div className="agent-findings">
              <span className="findings-label">Latest Findings:</span>
              <ul>
                {data.findings.slice(0, 3).map((finding, idx) => (
                  <li key={idx}>{finding}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="agent-progress">
        <div 
          className="progress-bar" 
          style={{ 
            width: `${data.progress || 0}%`,
            background: getAgentColor(name)
          }}
        />
      </div>
    </div>
  )
}

function TimelineItem({ activity }) {
  const getActionColor = (status) => {
    if (status === 'completed') return '#34d399'
    if (status === 'started') return '#60a5fa'
    return '#94a3b8'
  }

  return (
    <div className="timeline-item">
      <div 
        className="timeline-dot" 
        style={{ background: getActionColor(activity.status) }}
      />
      <div className="timeline-content">
        <div className="timeline-header">
          <span className="timeline-agent">{formatAgentName(activity.agent)}</span>
          <span className="timeline-time">{formatTimestamp(activity.timestamp)}</span>
        </div>
        <div className="timeline-task">{activity.task}</div>
        {activity.result && (
          <div className="timeline-result">{activity.result}</div>
        )}
      </div>
    </div>
  )
}

function groupActivitiesByAgent(activities) {
  const groups = {}
  
  activities.forEach(activity => {
    if (!groups[activity.agent]) {
      groups[activity.agent] = {
        status: 'idle',
        operations: 0,
        successRate: 100,
        lastActive: null,
        progress: 0,
        findings: [],
        task: null
      }
    }
    
    const group = groups[activity.agent]
    group.operations++
    group.lastActive = activity.timestamp
    group.task = activity.task
    group.status = activity.status
    
    if (activity.status === 'completed') {
      group.progress = 100
      if (activity.result) {
        group.findings.push(activity.result)
      }
    } else if (activity.status === 'started') {
      group.progress = 50
    }
  })
  
  return groups
}

function calculateStats(activities) {
  const completed = activities.filter(a => a.status === 'completed').length
  const activeAgents = new Set(activities.filter(a => a.status === 'started').map(a => a.agent)).size
  
  // Calculate average time (mock)
  const avgTime = activities.length > 0 ? Math.round(Math.random() * 500 + 200) : 0
  
  return { completed, activeAgents, avgTime }
}

function formatAgentName(name) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

function formatTime(timestamp) {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 1000) return 'Just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

export default AgentActivityMonitor
