import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/auth'

const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [playingVoice, setPlayingVoice] = useState(null)
  const [waveformActive, setWaveformActive] = useState(false)
  const [waveformBars, setWaveformBars] = useState(new Array(30).fill(15))

  // Simulate audio waveform animation
  useEffect(() => {
    let interval
    if (waveformActive) {
      interval = setInterval(() => {
        setWaveformBars(
          new Array(30).fill(0).map(() => Math.floor(Math.random() * 35) + 5)
        )
      }, 100)
    } else {
      setWaveformBars(new Array(30).fill(10))
    }
    return () => clearInterval(interval)
  }, [waveformActive])

  // Mock voice list
  const voices = [
    { id: 'v1', name: 'Rachel', accent: 'American / Warm / Narration', initials: 'RA', previewUrl: 'Rachel voice' },
    { id: 'v2', name: 'Drew', accent: 'British / Editorial / News', initials: 'DR', previewUrl: 'Drew voice' },
    { id: 'v3', name: 'Clyde', accent: 'American / Crisp / Video Games', initials: 'CL', previewUrl: 'Clyde voice' },
    { id: 'v4', name: 'Mimi', accent: 'Swedish / Soft / Audiobooks', initials: 'MI', previewUrl: 'Mimi voice' },
  ]

  const toggleVoicePlay = (voiceId) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null)
      setWaveformActive(false)
    } else {
      setPlayingVoice(voiceId)
      setWaveformActive(true)
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: 'var(--color-canvas)', overflowX: 'hidden' }}>
      
      {/* Background decoration orbs */}
      <div className="gradient-orb-container">
        <div className="gradient-orb orb-mint" style={{ top: '15%', left: '10%' }}></div>
        <div className="gradient-orb orb-peach" style={{ top: '35%', right: '15%' }}></div>
        <div className="gradient-orb orb-lavender" style={{ top: '65%', left: '20%' }}></div>
        <div className="gradient-orb orb-sky" style={{ bottom: '5%', right: '10%' }}></div>
      </div>

      {/* Top Navigation */}
      <header className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <h2 className="font-display" style={{ fontSize: '24px', letterSpacing: '-0.5px' }}>AuraChat</h2>
          <span className="badge-pill" style={{ fontSize: '10px' }}>Beta</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)' }}>
          <ul className="nav-links">
            <li><a className="nav-link" href="#features">Features</a></li>
            <li><a className="nav-link" href="#how-it-works">How it works</a></li>
            <li><a className="nav-link" href="#pricing">Pricing</a></li>
            <li><span className="nav-link" onClick={() => navigate('/signup')}>Enterprise</span></li>
            <li><a className="nav-link" href="https://elevenlabs.io/docs" target="_blank" rel="noopener noreferrer">Docs</a></li>
          </ul>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          {user ? (
            <button className="button-primary" onClick={() => navigate('/dashboard')}>
              Go to Workspace
            </button>
          ) : (
            <>
              <button className="button-outline" style={{ border: 'none' }} onClick={() => navigate('/login')}>
                Sign In
              </button>
              <button className="button-primary" onClick={() => navigate('/signup')}>
                Try free
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="section-rhythm container-wide" style={{ position: 'relative', zIndex: 10, textAlign: 'center', minHeight: '75vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ maxWidth: '850px', position: 'relative' }}>
          {/* Headline */}
          <h1 className="font-display display-mega" style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-ink)' }}>
            Real-Time Collaboration, <br />
            Elevated by Voice AI.
          </h1>
          {/* Subhead */}
          <p className="body-md" style={{ fontSize: '20px', marginBottom: 'var(--spacing-xl)', color: 'var(--color-body)', maxWidth: '640px', margin: '0 auto var(--spacing-xl) auto' }}>
            AuraChat delivers gorgeous video environments with live captions, real-time speech translation, floating canvas collaboration, and automated gesture-responsive raises.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-base)' }}>
            <button className="button-primary" style={{ padding: '12px 28px', height: '46px' }} onClick={() => navigate(user ? '/dashboard' : '/signup')}>
              {user ? 'Enter Workspace' : 'Start Collaborating'}
            </button>
            <a className="button-outline" style={{ padding: '12px 28px', height: '46px' }} href="#pricing">
              View Pricing Plans
            </a>
          </div>
        </div>
      </section>

      {/* Product Highlight / Audio Waveform Section */}
      <section className="container-wide" style={{ position: 'relative', zIndex: 10, marginBottom: 'var(--spacing-section)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--spacing-xl)', alignItems: 'center' }}>
          
          {/* Large Card with Gradient Orb inside */}
          <div className="gradient-orb-card" style={{ height: '360px', display: 'flex', alignItems: 'center' }}>
            <div className="card-orb" style={{ backgroundColor: 'var(--color-gradient-lavender)' }}></div>
            <div className="content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <span className="badge-pill" style={{ width: 'fit-content' }}>Brand Decor</span>
              <h2 className="font-display display-lg" style={{ color: 'var(--color-ink)' }}>Atmospheric Clarity</h2>
              <p className="body-md" style={{ maxWidth: '440px' }}>
                Drifting pastel backdrops symbolize fluid, barrier-free global voice translation. No high contrast neon, just beautiful editorial voice collaboration.
              </p>
            </div>
          </div>

          {/* Interactive Audio Waveform Card */}
          <div className="audio-waveform-card">
            <span className="badge-pill" style={{ width: 'fit-content' }}>Voice Synthesis</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-base)' }}>
              <button 
                onClick={() => setWaveformActive(!waveformActive)} 
                className="button-primary" 
                style={{ width: '48px', height: '48px', borderRadius: 'var(--rounded-full)', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                {waveformActive ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <rect x="4" y="4" width="4" height="16" />
                    <rect x="16" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '4px' }}>
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>
              <div>
                <h4 className="title-md">Speech Synthesis Waveform</h4>
                <p className="caption">Voice: Rachel (English Warm Voice)</p>
              </div>
            </div>
            {/* Waveform Visualization Bars */}
            <div className="waveform-visualization">
              {waveformBars.map((h, i) => (
                <div 
                  key={i} 
                  className={`waveform-bar ${waveformActive ? 'active' : ''}`} 
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Voice Library Talent List Section */}
      <section className="container-wide" style={{ position: 'relative', zIndex: 10, marginBottom: 'var(--spacing-section)' }}>
        <div style={{ maxWidth: '600px', marginBottom: 'var(--spacing-xl)' }}>
          <span className="badge-pill">Voice Library</span>
          <h2 className="font-display display-lg" style={{ marginTop: 'var(--spacing-sm)' }}>
            Curated Voice Atmosphere
          </h2>
          <p className="body-md" style={{ marginTop: 'var(--spacing-xs)' }}>
            Select from high-fidelity editorial voices used in real-time captions and translations during calls.
          </p>
        </div>

        <div className="feature-card" style={{ padding: '0 var(--spacing-lg)' }}>
          {voices.map((v) => (
            <div key={v.id} className="voice-row" style={{ padding: 'var(--spacing-base) 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <div className="voice-icon-circular">{v.initials}</div>
                <div>
                  <h4 className="title-sm" style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{v.name}</h4>
                  <p className="caption" style={{ fontSize: '13px' }}>{v.accent}</p>
                </div>
              </div>
              <button 
                className="button-outline" 
                onClick={() => toggleVoicePlay(v.id)} 
                style={{ height: '36px', padding: '0 16px', fontSize: '14px' }}
              >
                {playingVoice === v.id ? 'Stop Preview' : 'Play Preview'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Benefit Feature Grid */}
      <section className="container-wide" style={{ position: 'relative', zIndex: 10, marginBottom: 'var(--spacing-section)' }}>
        <span className="badge-pill" style={{ marginBottom: 'var(--spacing-sm)' }}>Features</span>
        <h2 className="font-display display-lg" style={{ marginBottom: 'var(--spacing-xl)' }}>
          Built for High-Fidelity Remote Teams
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-lg)' }}>
          
          <div className="feature-card">
            <h3 className="font-display display-sm" style={{ marginBottom: 'var(--spacing-xs)' }}>Live Translations</h3>
            <p className="body-md">
              Automatically transcribe spoken audio in WebRTC sessions and translate on-the-fly to over 5 global languages.
            </p>
          </div>

          <div className="feature-card">
            <h3 className="font-display display-sm" style={{ marginBottom: 'var(--spacing-xs)' }}>In-Call Bot @ai</h3>
            <p className="body-md">
              Request real-time summaries, marketing notes, or code suggestions inline. Just query the Gemini assistant inside chat.
            </p>
          </div>

          <div className="feature-card">
            <h3 className="font-display display-sm" style={{ marginBottom: 'var(--spacing-xs)' }}>Visual Canvas</h3>
            <p className="body-md">
              Draw collaboratively on an HTML5 sync-canvas, toggle screen sharing, and emit floating emoji reaction bursts.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container-wide" style={{ position: 'relative', zIndex: 10, marginBottom: 'var(--spacing-section)' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto var(--spacing-xl) auto' }}>
          <span className="badge-pill">Pricing</span>
          <h2 className="font-display display-lg" style={{ marginTop: 'var(--spacing-sm)' }}>
            Transparent Plans, Editorial Pricing
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)', maxWidth: '960px', margin: '0 auto' }}>
          
          {/* Card 1: Standard (Surface Card) */}
          <div className="pricing-tier-card">
            <div>
              <span className="badge-pill" style={{ backgroundColor: 'var(--color-canvas-soft)' }}>Standard</span>
              <h3 className="font-display display-md" style={{ marginTop: 'var(--spacing-xs)' }}>Free Starter</h3>
              <p className="body-sm" style={{ color: 'var(--color-muted)', marginTop: 'var(--spacing-xs)' }}>Ideal for casual collaborations and quick virtual syncs.</p>
            </div>
            
            <div style={{ margin: 'var(--spacing-sm) 0' }}>
              <span className="font-display" style={{ fontSize: '48px', fontWeight: 300 }}>$0</span>
              <span className="caption"> / forever</span>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }} className="body-sm">
              <li>✓ Up to 40 minute call duration limit</li>
              <li>✓ Collaborative Whiteboard & chat</li>
              <li>✓ Dynamic captions & AI summaries</li>
              <li>✓ Basic background filters</li>
            </ul>

            <button className="button-outline" onClick={() => navigate('/signup')} style={{ width: '100%', marginTop: 'auto' }}>
              Sign Up Free
            </button>
          </div>

          {/* Card 2: Featured Pro (Inverted Surface Dark) */}
          <div className="pricing-tier-card pricing-tier-featured">
            <div>
              <span className="badge-pill" style={{ color: 'var(--color-on-dark)', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>Featured</span>
              <h3 className="font-display display-md" style={{ marginTop: 'var(--spacing-xs)' }}>Professional</h3>
              <p className="body-sm" style={{ color: 'var(--color-on-dark-soft)', marginTop: 'var(--spacing-xs)' }}>For power creators demanding speech translations and unlimited AI tools.</p>
            </div>

            <div style={{ margin: 'var(--spacing-sm) 0' }}>
              <span className="font-display" style={{ fontSize: '48px', fontWeight: 300 }}>$19</span>
              <span className="caption" style={{ color: 'var(--color-on-dark-soft)' }}> / month</span>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }} className="body-sm">
              <li>✓ Unlimited video conference call lengths</li>
              <li>✓ High-fidelity voice library access</li>
              <li>✓ Multi-language live translation subtitles</li>
              <li>✓ Mediapipe raised hands gesture controls</li>
              <li>✓ Cloud session video transcription files</li>
            </ul>

            <button className="button-primary" onClick={() => navigate('/signup')} style={{ width: '100%', marginTop: 'auto' }}>
              Upgrade to Pro
            </button>
          </div>
        </div>
      </section>

      {/* Pre-Footer Testimonial Block */}
      <section className="container-wide" style={{ position: 'relative', zIndex: 10, paddingBottom: 'var(--spacing-section)' }}>
        <div className="gradient-orb-card" style={{ padding: 'var(--spacing-xl)', borderRadius: 'var(--rounded-xxl)', textAlign: 'center' }}>
          <div className="card-orb" style={{ backgroundColor: 'var(--color-gradient-peach)' }}></div>
          <span className="caption-uppercase">Testimonial</span>
          <p className="font-display" style={{ fontSize: '28px', fontStyle: 'italic', margin: 'var(--spacing-sm) auto var(--spacing-md) auto', maxWidth: '800px', lineHeight: 1.4 }}>
            "AuraChat has entirely altered how our global team conducts visual standups. The live translation subtitles are incredibly fast, and the design brings a print-editorial calmness to our workflow."
          </p>
          <h4 className="title-sm" style={{ fontWeight: 600 }}>Anuj Katare</h4>
          <p className="caption">Founder, VideoChat-App-WebRTC</p>
        </div>
      </section>

      {/* Footer Section */}
      <footer style={{ borderTop: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas)', position: 'relative', zIndex: 10 }}>
        <div className="container-wide" style={{ padding: 'var(--spacing-xl) 0', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--spacing-lg)' }}>
          <div>
            <h4 className="title-sm" style={{ marginBottom: 'var(--spacing-sm)' }}>AuraChat</h4>
            <p className="caption" style={{ fontSize: '13px' }}>Voice AI-enhanced WebRTC video conference platforms.</p>
          </div>
          <div>
            <h5 className="caption-uppercase" style={{ marginBottom: 'var(--spacing-sm)', fontSize: '11px', color: 'var(--color-muted)' }}>Product</h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <li><span className="nav-link" style={{ fontSize: '13px' }}>Creative Voice</span></li>
              <li><span className="nav-link" style={{ fontSize: '13px' }}>Agents Play</span></li>
              <li><span className="nav-link" style={{ fontSize: '13px' }}>Video Room</span></li>
            </ul>
          </div>
          <div>
            <h5 className="caption-uppercase" style={{ marginBottom: 'var(--spacing-sm)', fontSize: '11px', color: 'var(--color-muted)' }}>Resources</h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <li><a className="nav-link" style={{ fontSize: '13px' }} href="https://elevenlabs.io/docs" target="_blank" rel="noopener noreferrer">API Docs</a></li>
              <li><span className="nav-link" style={{ fontSize: '13px' }}>Integrations</span></li>
              <li><span className="nav-link" style={{ fontSize: '13px' }}>Help Center</span></li>
            </ul>
          </div>
          <div>
            <h5 className="caption-uppercase" style={{ marginBottom: 'var(--spacing-sm)', fontSize: '11px', color: 'var(--color-muted)' }}>Company</h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <li><span className="nav-link" style={{ fontSize: '13px' }}>About Us</span></li>
              <li><span className="nav-link" style={{ fontSize: '13px' }}>Careers</span></li>
              <li><span className="nav-link" style={{ fontSize: '13px' }}>Blog</span></li>
            </ul>
          </div>
          <div>
            <h5 className="caption-uppercase" style={{ marginBottom: 'var(--spacing-sm)', fontSize: '11px', color: 'var(--color-muted)' }}>Legal</h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <li><span className="nav-link" style={{ fontSize: '13px' }}>Privacy Policy</span></li>
              <li><span className="nav-link" style={{ fontSize: '13px' }}>Terms of Service</span></li>
              <li><span className="nav-link" style={{ fontSize: '13px' }}>Security</span></li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-hairline)', padding: 'var(--spacing-md) 0', textAlign: 'center' }}>
          <p className="caption" style={{ fontSize: '12px' }}>
            © {new Date().getFullYear()} AuraChat Inc. All rights reserved. Sub-licensed patterns styled after ElevenLabs.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Home
