import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/auth'

const Summary = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [summaryData, setSummaryData] = useState({
    id: Math.random().toString(36).substr(2, 9),
    name: 'Call Session ' + roomId,
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    duration: '15 mins',
    summary: 'Discussion regarding video layouts and client-server integrations. Host approved guests, tested whiteboard sync drawing tools, and reviewed speech transcript translations.',
    keyHighlights: [
      'Configured new ElevenLabs print editorial design tokens.',
      'Verified camera and mic test options in Lobby previews.',
      'AI Command parsing functions successfully mapped.'
    ],
    actionItems: [
      'Double check hand raises on iOS Safari.',
      'Populate past summaries inside localStorage cache.'
    ],
    transcript: `[Host]: Hello, welcome to the video call. Let's test the whiteboard.
[Guest]: Hi! Drawing is working fine on my screen. Can you try typing @ai?
[Host]: @ai suggest 3 bullet points for marketing strategy
[AI Assistant]: Here are your highlights...`
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Load from Router State if passed from the Call Room
    if (location.state && location.state.summary) {
      setSummaryData(location.state.summary)
    }
  }, [user, navigate, location])

  // Download Transcript TXT
  const handleDownloadTranscript = () => {
    const element = document.createElement("a")
    const file = new Blob([summaryData.transcript], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${summaryData.name.replace(/\s+/g, '_')}_transcript.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Save to Dashboard list
  const handleSaveToDashboard = () => {
    const savedSummaries = localStorage.getItem('aurachat_saved_summaries')
    let list = []
    if (savedSummaries) {
      try {
        list = JSON.parse(savedSummaries)
      } catch (e) {
        console.error(e)
      }
    }

    // Append this summary if not already present
    if (!list.some(item => item.id === summaryData.id)) {
      list = [summaryData, ...list]
      localStorage.setItem('aurachat_saved_summaries', JSON.stringify(list))
    }

    alert('Meeting AI Summary saved to your dashboard catalog!')
    navigate('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-canvas)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      
      {/* Background Gradients */}
      <div className="gradient-orb-container">
        <div className="gradient-orb orb-lavender" style={{ top: '-10%', left: '20%' }}></div>
        <div className="gradient-orb orb-peach" style={{ bottom: '-15%', right: '15%' }}></div>
      </div>

      {/* Summary Card container */}
      <div className="feature-card" style={{ zIndex: 10, width: '100%', maxWidth: '680px', backgroundColor: 'white', padding: 'var(--spacing-xl)', borderRadius: 'var(--rounded-xl)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--color-hairline)', paddingBottom: 'var(--spacing-base)' }}>
          <span className="badge-pill" style={{ marginBottom: '8px', backgroundColor: 'var(--color-surface-strong)' }}>Meeting Ended</span>
          <h1 className="font-display display-sm">Here is your AI Summary</h1>
          <p className="body-sm" style={{ color: 'var(--color-muted)', marginTop: '4px' }}>
            {summaryData.name} • {summaryData.date} • {summaryData.duration}
          </p>
        </div>

        {/* Content Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: 'var(--spacing-xl)' }}>
          
          {/* Summary paragraph */}
          <div>
            <h3 className="title-sm" style={{ color: 'var(--color-ink)', fontWeight: 600, marginBottom: '6px' }}>Meeting Overview</h3>
            <p className="body-md" style={{ color: 'var(--color-body)' }}>{summaryData.summary}</p>
          </div>

          {/* Highlights Checklist */}
          <div>
            <h3 className="title-sm" style={{ color: 'var(--color-ink)', fontWeight: 600, marginBottom: '6px' }}>📌 Key Highlights & Notes</h3>
            <ul style={{ paddingLeft: '20px', color: 'var(--color-body)' }} className="body-md">
              {summaryData.keyHighlights.map((hl, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{hl}</li>
              ))}
            </ul>
          </div>

          {/* Action Items */}
          <div>
            <h3 className="title-sm" style={{ color: 'var(--color-ink)', fontWeight: 600, marginBottom: '6px' }}>✅ Action Items & To-Dos</h3>
            <ul style={{ paddingLeft: '20px', color: 'var(--color-body)', listStyleType: 'none' }} className="body-md">
              {summaryData.actionItems.map((ai, i) => (
                <li key={i} style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" defaultChecked={false} style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                  <span>{ai}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Full Transcript box */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 className="title-sm" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>📜 Conversation Transcript</h3>
              <button className="button-tertiary-text" style={{ fontSize: '13px' }} onClick={handleDownloadTranscript}>
                Download Transcript TXT
              </button>
            </div>
            <pre style={{ backgroundColor: 'var(--color-canvas-soft)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '12px', fontSize: '13px', maxHeight: '180px', overflowY: 'auto', whiteSpace: 'pre-wrap', color: 'var(--color-body)', fontFamily: 'monospace' }}>
              {summaryData.transcript}
            </pre>
          </div>

        </div>

        {/* Navigation Action controls */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="button-primary" onClick={handleSaveToDashboard} style={{ flex: 1.5, height: '44px' }}>
            Save to Dashboard
          </button>
          <button className="button-outline" onClick={() => navigate('/dashboard')} style={{ flex: 1, height: '44px' }}>
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}

export default Summary
