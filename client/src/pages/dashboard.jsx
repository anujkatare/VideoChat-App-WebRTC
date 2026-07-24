import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/auth'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [meetings, setMeetings] = useState([])
  const [joinCode, setJoinCode] = useState('')
  const [meetingName, setMeetingName] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [copiedLink, setCopiedLink] = useState('')
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  
  // AI summary viewer modal state
  const [selectedSummary, setSelectedSummary] = useState(null)

  // Past meetings mock database
  const [pastMeetings, setPastMeetings] = useState([
    {
      id: 'past-1',
      name: 'Project Pitch',
      date: '24 Jul 2026',
      duration: '35 mins',
      summary: 'Presented details of the WebRTC media pipeline and the new ElevenLabs visual style interface. Host approved guests. Decided to build a custom Lobby.',
      keyHighlights: ['WebRTC signaling works in <50ms', 'Added new UI variables', 'Lobby route is live'],
      actionItems: ['Integrate audio waveform animations', 'Write summary parser model']
    },
    {
      id: 'past-2',
      name: 'Team Catchup',
      date: '20 Jul 2026',
      duration: '12 mins',
      summary: 'Reviewed general project status. Confirmed Google OAuth and basic sign-in flows work. Discovered MediaPipe raises hand with open palm.',
      keyHighlights: ['OAuth works with JWT', 'Speech translations verified'],
      actionItems: ['Confirm iOS Safari audio compatibility']
    }
  ])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Load scheduled meetings from local storage
    const savedMeetings = localStorage.getItem(`meetings_${user.profileId}`)
    if (savedMeetings) {
      try {
        setMeetings(JSON.parse(savedMeetings))
      } catch (e) {
        console.error(e)
      }
    }

    // Load custom summaries created during execution
    const savedSummaries = localStorage.getItem('aurachat_saved_summaries')
    if (savedSummaries) {
      try {
        const parsed = JSON.parse(savedSummaries)
        // Merge custom summaries into past meetings table
        setPastMeetings(prev => {
          const filtered = prev.filter(p => !parsed.some(x => x.id === p.id))
          return [...parsed, ...filtered]
        })
      } catch (e) {
        console.error(e)
      }
    }
  }, [user, navigate])

  const saveMeetings = (updated) => {
    setMeetings(updated)
    if (user) {
      localStorage.setItem(`meetings_${user.profileId}`, JSON.stringify(updated))
    }
  }

  const handleCreateInstantMeeting = () => {
    // Generate a random slug e.g. abc-123-xyz
    const slug = `${Math.random().toString(36).substr(2, 3)}-${Math.floor(100 + Math.random()*900)}-${Math.random().toString(36).substr(2, 3)}`
    
    // Redirect to Waiting room Lobby first!
    navigate(`/room/${slug}/lobby`)
  }

  const handleJoinMeeting = (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    // Clean room code from full URLs if pasted
    let cleanCode = joinCode.trim()
    if (cleanCode.includes('/room/')) {
      const parts = cleanCode.split('/room/')
      cleanCode = parts[1].split('/')[0]
    }

    navigate(`/room/${cleanCode}/lobby`)
  }

  const handleScheduleMeeting = (e) => {
    e.preventDefault()
    if (!meetingName || !meetingDate || !meetingTime) {
      alert('Please fill out all fields')
      return
    }

    const slug = `${Math.random().toString(36).substr(2, 3)}-${Math.floor(100 + Math.random()*900)}-${Math.random().toString(36).substr(2, 3)}`
    const newMeeting = {
      id: Math.random().toString(36).substr(2, 9),
      name: meetingName,
      date: meetingDate,
      time: meetingTime,
      slug,
    }

    const updated = [newMeeting, ...meetings]
    saveMeetings(updated)
    
    // Generate invite link to copy
    const inviteUrl = `${window.location.origin}/room/${slug}/lobby`
    setCopiedLink(inviteUrl)
    navigator.clipboard.writeText(inviteUrl)

    setMeetingName('')
    setMeetingDate('')
    setMeetingTime('')
    
    alert(`Meeting scheduled! Invite link copied to clipboard:\n${inviteUrl}`)
  }

  // Filter history based on search
  const filteredPastMeetings = pastMeetings.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.summary.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-canvas)', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Background decoration orbs */}
      <div className="gradient-orb-container">
        <div className="gradient-orb orb-sky" style={{ top: '-10%', right: '10%' }}></div>
        <div className="gradient-orb orb-rose" style={{ bottom: '-15%', left: '5%' }}></div>
      </div>

      {/* Top Navbar */}
      <header className="top-nav" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 24px', backgroundColor: 'var(--color-surface-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <h2 className="font-display" style={{ fontSize: '24px', letterSpacing: '-0.5px' }}>AuraChat</h2>
          <span className="badge-pill" style={{ fontSize: '10px' }}>Dashboard</span>
        </div>
        
        {/* Search Bar */}
        <div style={{ width: '320px', position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Search past meetings or notes..."
            className="text-input"
            style={{ height: '36px', padding: '8px 12px 8px 32px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <span className="body-strong" style={{ fontSize: '14px' }}>👤 {user.name}</span>
          <button 
            className="button-outline" 
            style={{ height: '32px', padding: '0 12px', fontSize: '13px' }} 
            onClick={() => alert('Settings Modal: Configuration templates mapped.')}
          >
            ⚙️ Settings
          </button>
          <button className="button-outline" onClick={logout} style={{ height: '32px', padding: '0 12px', fontSize: '13px', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
            Log Out
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="container-wide" style={{ position: 'relative', zIndex: 10, padding: '24px' }}>
        
        {/* Meeting Actions row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
          
          {/* Start Instant Call Card */}
          <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-base)' }}>
            <span className="badge-pill" style={{ width: 'fit-content' }}>🚀 Instant Room</span>
            <h2 className="font-display display-sm">Start Instant Call</h2>
            <p className="body-md">Creates a unique random room instantly and places you as Host inside the waiting room lobby.</p>
            <button className="button-primary" onClick={handleCreateInstantMeeting} style={{ width: 'fit-content', gap: '8px' }}>
              🚀 Start Now
            </button>
          </div>

          {/* Join Meeting Card */}
          <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-base)' }}>
            <span className="badge-pill" style={{ width: 'fit-content' }}>🔗 Meeting Link</span>
            <h2 className="font-display display-sm">Join Meeting</h2>
            <p className="body-md">Enter a room slug code (e.g., abc-123-xyz) or paste the full invite link to enter waiting room.</p>
            <form onSubmit={handleJoinMeeting} style={{ display: 'flex', gap: 'var(--spacing-sm)', width: '100%' }}>
              <input
                type="text"
                placeholder="Enter Code or URL"
                className="text-input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                required
              />
              <button type="submit" className="button-primary" style={{ padding: '0 24px' }}>
                Join
              </button>
            </form>
          </div>

        </div>

        {/* Schedule a Meeting Card */}
        <div className="feature-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <span className="badge-pill" style={{ width: 'fit-content', marginBottom: 'var(--spacing-sm)' }}>📅 Scheduler</span>
          <h2 className="font-display display-sm" style={{ marginBottom: 'var(--spacing-xs)' }}>Schedule a Meeting</h2>
          <p className="body-md" style={{ marginBottom: 'var(--spacing-base)' }}>Pick a date and topic. The invite link will copy to clipboard automatically.</p>
          
          <form onSubmit={handleScheduleMeeting} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Meeting Title"
              className="text-input"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              required
            />
            <input
              type="date"
              className="text-input"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              required
            />
            <input
              type="time"
              className="text-input"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              required
            />
            <button type="submit" className="button-outline" style={{ height: '44px' }}>
              Generate Invite Link
            </button>
          </form>
          
          {copiedLink && (
            <p className="caption" style={{ color: 'var(--color-success)', marginTop: '8px' }}>
              ✓ Scheduled! Invite link: <strong>{copiedLink}</strong>
            </p>
          )}
        </div>

        {/* Scheduled upcoming meetings panel */}
        {meetings.length > 0 && (
          <div className="feature-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h3 className="title-sm" style={{ marginBottom: 'var(--spacing-sm)' }}>📅 Pending Scheduled Calls</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              {meetings.map((m) => (
                <div key={m.id} style={{ border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '12px', backgroundColor: 'var(--color-canvas-soft)' }}>
                  <h4 className="title-sm" style={{ fontSize: '15px' }}>{m.name}</h4>
                  <p className="caption">{m.date} at {m.time}</p>
                  <button className="button-primary" style={{ height: '28px', fontSize: '12px', marginTop: '10px', width: '100%' }} onClick={() => navigate(`/room/${m.slug}/lobby`)}>
                    Enter Lobby
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Meetings & AI Notes Section */}
        <div className="feature-card">
          <span className="badge-pill" style={{ width: 'fit-content', marginBottom: 'var(--spacing-sm)' }}>📂 Archive</span>
          <h2 className="font-display display-sm" style={{ marginBottom: 'var(--spacing-md)' }}>RECENT MEETINGS & AI NOTES</h2>

          {filteredPastMeetings.length === 0 ? (
            <p className="body-md" style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '30px' }}>No records found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-hairline-strong)' }}>
                  <th className="caption-uppercase" style={{ padding: '12px 8px', color: 'var(--color-muted)' }}>Meeting Name</th>
                  <th className="caption-uppercase" style={{ padding: '12px 8px', color: 'var(--color-muted)' }}>Date</th>
                  <th className="caption-uppercase" style={{ padding: '12px 8px', color: 'var(--color-muted)' }}>Duration</th>
                  <th className="caption-uppercase" style={{ padding: '12px 8px', color: 'var(--color-muted)', textAlign: 'right' }}>AI Summary</th>
                </tr>
              </thead>
              <tbody>
                {filteredPastMeetings.map((p) => (
                  <tr key={p.id} className="voice-row" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <td className="body-strong" style={{ padding: '16px 8px' }}>{p.name}</td>
                    <td className="body-md" style={{ padding: '16px 8px' }}>{p.date}</td>
                    <td className="body-md" style={{ padding: '16px 8px' }}>{p.duration}</td>
                    <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                      <button 
                        className="button-outline" 
                        style={{ height: '30px', padding: '0 12px', fontSize: '13px' }}
                        onClick={() => setSelectedSummary(p)}
                      >
                        📄 View AI
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>

      {/* AI Summary View Modal Overlay */}
      {selectedSummary && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="feature-card" style={{ maxWidth: '600px', width: '100%', backgroundColor: 'white', padding: 'var(--spacing-xl)', borderRadius: 'var(--rounded-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-base)' }}>
              <div>
                <h3 className="font-display display-sm">{selectedSummary.name} Summary</h3>
                <p className="caption" style={{ marginTop: '2px' }}>{selectedSummary.date} • {selectedSummary.duration}</p>
              </div>
              <button 
                onClick={() => setSelectedSummary(null)} 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-muted)' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="body-md">
              <div>
                <strong style={{ color: 'var(--color-ink)' }}>Overview:</strong>
                <p style={{ marginTop: '4px', color: 'var(--color-body)' }}>{selectedSummary.summary}</p>
              </div>

              {selectedSummary.keyHighlights && selectedSummary.keyHighlights.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--color-ink)' }}>📌 Key Highlights:</strong>
                  <ul style={{ paddingLeft: '20px', marginTop: '4px', color: 'var(--color-body)' }}>
                    {selectedSummary.keyHighlights.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSummary.actionItems && selectedSummary.actionItems.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--color-ink)' }}>✅ Action Items:</strong>
                  <ul style={{ paddingLeft: '20px', marginTop: '4px', color: 'var(--color-body)' }}>
                    {selectedSummary.actionItems.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button className="button-primary" onClick={() => setSelectedSummary(null)} style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}>
              Close Summary
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default Dashboard
