import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../providers/socket'
import { useAuth } from '../providers/auth'

const Lobby = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { user } = useAuth()

  // State Management
  const [localStream, setLocalStream] = useState(null)
  const [micMuted, setMicMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [virtualBg, setVirtualBg] = useState('none')
  
  // Host/Guest detection states
  const [isRoomHost, setIsRoomHost] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [requestSent, setRequestSent] = useState(false)
  const [declined, setDeclined] = useState(false)

  const videoPreviewRef = useRef(null)
  const localStreamRef = useRef(null)

  // Initialize camera preview
  const getCameraPreview = useCallback(async () => {
    try {
      // Stop any existing tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      })

      localStreamRef.current = stream
      setLocalStream(stream)

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Error starting video preview:', err)
    }
  }, [])

  // Attach stream to video element whenever stream changes
  useEffect(() => {
    if (videoPreviewRef.current && localStream) {
      videoPreviewRef.current.srcObject = localStream
    }
  }, [localStream])

  // Initial check: if room has an active host on server
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    getCameraPreview()

    return () => {
      // Clean up camera stream when leaving lobby
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [user, navigate, getCameraPreview])

  // Check room status from signaling server
  useEffect(() => {
    if (socket && roomId) {
      // Ask server if room has a host
      socket.emit('check-room-status', { roomId })

      socket.on('room-status-response', ({ hostActive }) => {
        setIsRoomHost(!hostActive) // If no active host, this user will be the Host
        setLoadingStatus(false)
      })

      // If approved directly during socket emission
      socket.on('joined-room', () => {
        // Stop local preview tracks before moving to Room page (which opens its own stream)
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop())
          localStreamRef.current = null
        }
        navigate(`/room/${roomId}`)
      })

      socket.on('waiting-room', () => {
        setRequestSent(true)
      })

      socket.on('join-declined', () => {
        setDeclined(true)
        setRequestSent(false)
      })

      return () => {
        socket.off('room-status-response')
        socket.off('joined-room')
        socket.off('waiting-room')
        socket.off('join-declined')
      }
    }
  }, [socket, roomId, localStream, navigate])

  // Toggle Mic
  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = micMuted
        setMicMuted(!micMuted)
      }
    }
  }

  // Toggle Camera
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = camOff
        setCamOff(!camOff)
      }
    }
  }

  // Join Action
  const handleJoinAction = () => {
    if (!socket || !user) return

    // Save preferences in localStorage to load on main room page
    localStorage.setItem('aurachat_mic_muted', micMuted ? 'true' : 'false')
    localStorage.setItem('aurachat_cam_off', camOff ? 'true' : 'false')
    localStorage.setItem('aurachat_virtual_bg', virtualBg)

    // Emit join event
    socket.emit('join-room', {
      roomId,
      emailId: user.email
    })
  }

  if (declined) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-canvas)' }}>
        <div className="feature-card" style={{ maxWidth: '400px', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
          <h2 className="font-display display-sm" style={{ color: 'var(--color-error)', marginBottom: 'var(--spacing-sm)' }}>Access Denied</h2>
          <p className="body-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
            Your request to join this meeting was declined by the room host.
          </p>
          <button className="button-primary" onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-canvas)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      
      {/* Background orbs */}
      <div className="gradient-orb-container">
        <div className="gradient-orb orb-mint" style={{ top: '15%', left: '10%' }}></div>
        <div className="gradient-orb orb-peach" style={{ bottom: '10%', right: '15%' }}></div>
      </div>

      <div className="feature-card" style={{ zIndex: 10, width: '100%', maxWidth: '640px', backgroundColor: 'white', padding: 'var(--spacing-xl)', borderRadius: 'var(--rounded-xl)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
          <span className="badge-pill" style={{ marginBottom: '8px' }}>Lobby Area</span>
          <h1 className="font-display display-sm">Room Diagnostic Test</h1>
          <p className="body-sm" style={{ color: 'var(--color-muted)' }}>Configure your camera, microphone, and filters before entering.</p>
        </div>

        {/* Video Preview */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 'var(--rounded-lg)', overflow: 'hidden', backgroundColor: 'black', border: '1px solid var(--color-hairline-strong)', marginBottom: 'var(--spacing-base)' }}>
          <video
              ref={videoPreviewRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: camOff ? 'none' : 'block' }}
            />
          {camOff && (
            <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
              <p className="body-md">Camera is turned off</p>
            </div>
          )}

          {/* Indicators */}
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '8px' }}>
            <span className="badge-pill" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
              {micMuted ? '🔇 Mic Muted' : '🎙️ Mic Active'}
            </span>
            <span className="badge-pill" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
              {camOff ? '📹 Camera Off' : '📷 Camera Live'}
            </span>
          </div>
        </div>

        {/* Diagnostic controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 'var(--spacing-lg)' }}>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={toggleMic}
              className="button-outline"
              style={{ flex: 1, height: '40px', gap: '6px', backgroundColor: micMuted ? '#fef2f2' : 'transparent', borderColor: micMuted ? 'var(--color-error)' : 'var(--color-hairline-strong)', color: micMuted ? 'var(--color-error)' : 'var(--color-ink)' }}
            >
              {micMuted ? '🎙️ Unmute' : '🎙️ Mute'}
            </button>
            <button
              onClick={toggleCamera}
              className="button-outline"
              style={{ flex: 1, height: '40px', gap: '6px', backgroundColor: camOff ? '#fef2f2' : 'transparent', borderColor: camOff ? 'var(--color-error)' : 'var(--color-hairline-strong)', color: camOff ? 'var(--color-error)' : 'var(--color-ink)' }}
            >
              {camOff ? '📷 Camera On' : '📷 Camera Off'}
            </button>
          </div>

          <div>
            <select
              value={virtualBg}
              onChange={(e) => setVirtualBg(e.target.value)}
              className="text-input"
              style={{ height: '40px', padding: '0 12px', cursor: 'pointer' }}
            >
              <option value="none">Normal Camera Background</option>
              <option value="blur">Blur Camera Background</option>
              <option value="image">Peach/Sky Gradient Filter</option>
            </select>
          </div>

        </div>

        {/* Action Button */}
        {loadingStatus ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--color-hairline)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : requestSent ? (
          <div style={{ textAlign: 'center', padding: '12px', border: '1px dashed var(--color-hairline-strong)', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--color-canvas-soft)' }}>
            <p className="body-strong" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid var(--color-hairline)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
              Waiting for Host approval...
            </p>
          </div>
        ) : (
          <button
            className="button-primary"
            onClick={handleJoinAction}
            style={{ width: '100%', height: '46px', fontSize: '16px' }}
          >
            {isRoomHost ? '🚀 Start Meeting (Host)' : '🙋 Ask to Join (Guest)'}
          </button>
        )}

        <button
          className="button-outline"
          onClick={() => navigate('/dashboard')}
          style={{ width: '100%', height: '40px', marginTop: '12px', border: 'none' }}
        >
          Cancel and Return
        </button>

      </div>
    </div>
  )
}

export default Lobby
