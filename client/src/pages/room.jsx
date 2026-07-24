import React, { useEffect, useCallback, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../providers/socket'
import { usePeer } from '../providers/peer'
import { useAuth } from '../providers/auth'

const Room = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { peer, createOffer, createAnswer, setRemoteAns, remoteStream } = usePeer()
  const { user } = useAuth()

  // State Management
  const [myStream, setMyStream] = useState(null)
  const [remoteEmailId, setRemoteEmailId] = useState(null)
  const [participantsCount, setParticipantsCount] = useState(1)

  // Call timer clock
  const [secondsElapsed, setSecondsElapsed] = useState(0)

  // Audio / Video control states
  const [micMuted, setMicMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false)
  const [screenStream, setScreenStream] = useState(null)
  const screenTrackRef = useRef(null)

  // Sidebar controls
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'board'

  // Chat messages
  const [chatMessages, setChatMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const chatEndRef = useRef(null)

  // Floating emoji reaction animations
  const [reactions, setReactions] = useState([])

  // Live Captions & Translation
  const [captionsActive, setCaptionsActive] = useState(false)
  const [localTranscript, setLocalTranscript] = useState('')
  const [remoteTranscript, setRemoteTranscript] = useState('')
  const [translationLanguage, setTranslationLanguage] = useState('es')
  const recognitionRef = useRef(null)

  // Virtual Background states
  const [virtualBgMode, setVirtualBgMode] = useState('none')
  const canvasRef = useRef(null)
  const videoInputRef = useRef(null)
  const processingRef = useRef(null)

  // Stable refs for video elements so streams attach even after mount
  const myVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const streamStartedRef = useRef(false)

  // Raised hands alert
  const [raisedHandActive, setRaisedHandActive] = useState(false)
  const [raisedHandUser, setRaisedHandUser] = useState(null)

  // Whiteboard drawing states
  const whiteboardCanvasRef = useRef(null)
  const drawingRef = useRef(false)
  const drawColorRef = useRef('#0c0a09')
  const drawWidthRef = useRef(3)
  const lastPosRef = useRef({ x: 0, y: 0 })

  // Session logs for post-call AI summaries
  const transcriptLogRef = useRef([])

  // Load diagnostic states configured in Lobby
  useEffect(() => {
    const savedMic = localStorage.getItem('aurachat_mic_muted') === 'true'
    const savedCam = localStorage.getItem('aurachat_cam_off') === 'true'
    const savedBg = localStorage.getItem('aurachat_virtual_bg') || 'none'

    setMicMuted(savedMic)
    setCamOff(savedCam)
    setVirtualBgMode(savedBg)
  }, [])

  // Clock timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Fetch local media devices stream
  const getUserMediaStream = useCallback(async () => {
    if (streamStartedRef.current) return
    streamStartedRef.current = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })

      // Apply initial lobby preferences directly to the tracks
      const savedMic = localStorage.getItem('aurachat_mic_muted') === 'true'
      const savedCam = localStorage.getItem('aurachat_cam_off') === 'true'

      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack && savedMic) audioTrack.enabled = false

      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack && savedCam) videoTrack.enabled = false

      setMyStream(stream)

      // Add tracks to peer connection for outgoing media
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream)
      })
    } catch (err) {
      streamStartedRef.current = false
      console.error('Error accessing media devices. Please check camera/mic permissions:', err)
    }
  }, [peer])

  // Start camera/mic as soon as the meeting page loads (not only on joined-room)
  useEffect(() => {
    if (user && roomId) {
      getUserMediaStream()
    }
  }, [user, roomId, getUserMediaStream])

  // Reactively attach local stream to the local video element
  useEffect(() => {
    if (myVideoRef.current) {
      if (screenSharing && screenStream) {
        myVideoRef.current.srcObject = screenStream
      } else if (myStream) {
        myVideoRef.current.srcObject = myStream
      }
    }
  }, [myStream, screenSharing, screenStream])

  // Reactively attach remote stream to the remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  // Join the active socket room
  useEffect(() => {
    if (socket && user && roomId) {
      socket.emit('join-room', {
        roomId,
        emailId: user.email
      })
    }
  }, [socket, user, roomId])

  // Setup Live Captions Speech-to-Text
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'

      rec.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setLocalTranscript(transcript)

        // Log to session transcript
        const logLine = `[You]: ${transcript}`
        if (!transcriptLogRef.current.includes(logLine)) {
          transcriptLogRef.current.push(logLine)
        }

        // Send transcript stream to peer
        if (socket && roomId) {
          socket.emit('send-message', {
            roomId,
            sender: user?.name || 'Guest',
            text: `[CAPTION] ${transcript}`
          })
        }
      }

      recognitionRef.current = rec
    }
  }, [socket, roomId, user])

  const toggleCaptions = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.')
      return
    }

    if (captionsActive) {
      recognitionRef.current.stop()
      setLocalTranscript('')
    } else {
      try {
        recognitionRef.current.start()
      } catch (e) {
        console.error(e)
      }
    }
    setCaptionsActive(!captionsActive)
  }

  // Visual translation function
  const translateText = (text, targetLang) => {
    const vocabulary = {
      es: { hello: 'hola', welcome: 'bienvenido', developer: 'desarrollador', meeting: 'reunión', voice: 'voz', design: 'diseño', yes: 'sí', wait: 'espera', help: 'ayuda' },
      de: { hello: 'hallo', welcome: 'willkommen', developer: 'entwickler', meeting: 'treffen', voice: 'stimme', design: 'entwurf', yes: 'ja', wait: 'warte', help: 'hilfe' },
      fr: { hello: 'bonjour', welcome: 'bienvenue', developer: 'développeur', meeting: 'réunion', voice: 'voix', design: 'conception', yes: 'oui', wait: 'attendre', help: 'aide' },
      hi: { hello: 'नमस्ते', welcome: 'स्वागत है', developer: 'डेवलपर', meeting: 'बैठक', voice: 'आवाज', design: 'डिज़ाइन', yes: 'हाँ', wait: 'प्रतीक्षा करें', help: 'मदद' }
    }

    const dict = vocabulary[targetLang] || vocabulary['es']
    let translated = text.toLowerCase()

    Object.keys(dict).forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      translated = translated.replace(regex, dict[word].toUpperCase())
    })

    return `${translated} (${targetLang.toUpperCase()})`
  }

  // Chat message event parser
  const handleIncomingMessage = useCallback(({ sender, text, timestamp, fileUrl }) => {
    if (text && text.startsWith('[CAPTION] ')) {
      const captionText = text.replace('[CAPTION] ', '')
      if (sender !== user?.name) {
        const translatedText = translateText(captionText, translationLanguage)
        setRemoteTranscript(translatedText)

        // Log remote speaker
        const logLine = `[${sender}]: ${captionText}`
        if (!transcriptLogRef.current.includes(logLine)) {
          transcriptLogRef.current.push(logLine)
        }
      }
      return
    }

    setChatMessages((prev) => [...prev, { sender, text, timestamp, fileUrl }])

    // Log chat message
    transcriptLogRef.current.push(`[Chat Message] ${sender}: ${text}`)

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [user, translationLanguage])

  // New peer joins
  const handleNewUserJoined = useCallback(async ({ emailId }) => {
    setRemoteEmailId(emailId)
    setParticipantsCount(2)
    const offer = await createOffer()
    socket.emit('call-user', { emailId, offer })
  }, [createOffer, socket])

  // Incoming offer
  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    setRemoteEmailId(from)
    setParticipantsCount(2)
    const ans = await createAnswer(offer)
    socket.emit('call-accepted', { emailId: from, ans })
  }, [createAnswer, socket])

  // Answer accepted
  const handleCallAccepted = useCallback(async ({ ans }) => {
    await setRemoteAns(ans)
    console.log('Call accepted')
  }, [setRemoteAns])

  // Emoji reaction triggers
  const handleIncomingReaction = useCallback(({ reactionType }) => {
    const newReaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: reactionType,
      left: Math.random() * 80 + 10
    }
    setReactions((prev) => [...prev, newReaction])

    setTimeout(() => {
      setReactions((prev) => prev.filter(r => r.id !== newReaction.id))
    }, 2000)
  }, [])

  // Whiteboard drawings
  const handleRemoteDraw = useCallback(({ x0, y0, x1, y1, color, lineWidth }) => {
    const canvas = whiteboardCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'

    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
  }, [])

  const handleRemoteClear = useCallback(() => {
    const canvas = whiteboardCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Raise hand notifications
  const handleHandRaisedNotification = useCallback(({ sender }) => {
    setRaisedHandUser(sender)
    setRaisedHandActive(true)
    setTimeout(() => {
      setRaisedHandActive(false)
      setRaisedHandUser(null)
    }, 4000)
  }, [])

  // Negotiation Needed Handler
  const handleNegotiation = useCallback(async () => {
    if (!remoteEmailId) return
    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    socket.emit('call-user', {
      emailId: remoteEmailId,
      offer,
    })
  }, [peer, remoteEmailId, socket])

  // Socket triggers
  useEffect(() => {
    if (!socket) return

    socket.on('joined-room', () => {
      getUserMediaStream()
    })

    socket.on('user-joined', handleNewUserJoined)
    socket.on('incoming-call', handleIncomingCall)
    socket.on('call-accepted', handleCallAccepted)
    socket.on('message', handleIncomingMessage)
    socket.on('reaction', handleIncomingReaction)
    socket.on('draw-line', handleRemoteDraw)
    socket.on('clear-canvas', handleRemoteClear)

    socket.on('screen-share-start', () => {
      setRemoteScreenSharing(true)
    })

    socket.on('screen-share-stop', () => {
      setRemoteScreenSharing(false)
    })

    socket.on('host-left', () => {
      alert('The Host has left the room. Disconnecting.')
      leaveRoom()
    })

    return () => {
      socket.off('joined-room')
      socket.off('user-joined')
      socket.off('incoming-call')
      socket.off('call-accepted')
      socket.off('message')
      socket.off('reaction')
      socket.off('draw-line')
      socket.off('clear-canvas')
      socket.off('screen-share-start')
      socket.off('screen-share-stop')
      socket.off('host-left')
    }
  }, [socket, handleNewUserJoined, handleIncomingCall, handleCallAccepted, handleIncomingMessage, handleIncomingReaction, handleRemoteDraw, handleRemoteClear, getUserMediaStream])

  // WebRTC negotiation listeners
  useEffect(() => {
    peer.addEventListener('negotiationneeded', handleNegotiation)
    return () => {
      peer.removeEventListener('negotiationneeded', handleNegotiation)
    }
  }, [peer, handleNegotiation])

  // Mute Audio
  const toggleMic = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = micMuted
        setMicMuted(!micMuted)
      }
    }
  }

  // Toggle Video Camera
  const toggleCamera = () => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = camOff
        setCamOff(!camOff)
      }
    }
  }

  // Screen Sharing replace track logic
  const toggleScreenShare = async () => {
    try {
      if (!screenSharing) {
        const capturedStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
        const screenTrack = capturedStream.getVideoTracks()[0]

        screenTrackRef.current = screenTrack
        setScreenStream(capturedStream)

        // Replace track in peer connection so remote also sees screen
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video')
        if (sender) {
          sender.replaceTrack(screenTrack)
        }

        // Disable camera video track (don't stop it, just disable)
        if (myStream) {
          myStream.getVideoTracks().forEach(t => { t.enabled = false })
        }

        // Notify remote peer
        if (socket && roomId) {
          socket.emit('screen-share-start', { roomId })
        }

        // Auto-stop when user clicks browser's "Stop sharing" button
        screenTrack.onended = () => {
          stopScreenShare()
        }

        setScreenSharing(true)
      } else {
        stopScreenShare()
      }
    } catch (e) {
      if (e.name !== 'NotAllowedError') {
        console.error('Error starting screen share:', e)
      }
    }
  }

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop()
      screenTrackRef.current = null
    }
    setScreenStream(null)

    if (socket && roomId) {
      socket.emit('screen-share-stop', { roomId })
    }

    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !camOff
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video')
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
      }
    }
    setScreenSharing(false)
  }

  // Chat message trigger
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!messageText.trim()) return

    if (socket && roomId && user) {
      socket.emit('send-message', {
        roomId,
        sender: user.name,
        text: messageText
      })
      setMessageText('')
    }
  }

  // Reactions trigger
  const sendReaction = (reactionType) => {
    if (socket && roomId) {
      socket.emit('reaction', { roomId, reactionType })
      handleIncomingReaction({ reactionType })
    }
  }

  // Virtual Background Canvas Pixel loops
  useEffect(() => {
    if (virtualBgMode === 'none') {
      if (processingRef.current) cancelAnimationFrame(processingRef.current)
      return
    }

    const canvas = canvasRef.current
    const video = videoInputRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')

    const processFrame = () => {
      if (video.paused || video.ended) return
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      if (virtualBgMode === 'blur') {
        ctx.save()
        ctx.filter = 'blur(12px)'
        ctx.drawImage(canvas, 0, 0)
        ctx.restore()

        ctx.shadowColor = 'black'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2 + 30, 80, 0, Math.PI, true)
        ctx.arc(canvas.width / 2, canvas.height / 3, 50, 0, Math.PI * 2)
        ctx.clip()
        ctx.filter = 'none'
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      } else if (virtualBgMode === 'image') {
        ctx.save()
        const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 10, canvas.width / 2, canvas.height / 2, canvas.width / 2)
        gradient.addColorStop(0, '#fafafa')
        gradient.addColorStop(0.5, '#f4c5a8')
        gradient.addColorStop(1, '#c8b8e0')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2 + 30, 80, 0, Math.PI, true)
        ctx.arc(canvas.width / 2, canvas.height / 3, 50, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        ctx.restore()
      }

      processingRef.current = requestAnimationFrame(processFrame)
    }

    video.play().then(() => {
      processingRef.current = requestAnimationFrame(processFrame)
    })

    return () => {
      if (processingRef.current) cancelAnimationFrame(processingRef.current)
    }
  }, [virtualBgMode])

  // Palm raise action
  const handleRaiseHand = () => {
    if (socket && roomId && user) {
      socket.emit('send-message', {
        roomId,
        sender: user.name,
        text: `✋ Raised Hand`
      })
      handleHandRaisedNotification({ sender: user.name })
    }
  }

  // Whiteboard drawing handlers
  const startDrawing = (e) => {
    const canvas = whiteboardCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    drawingRef.current = true
    lastPosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const draw = (e) => {
    if (!drawingRef.current) return
    const canvas = whiteboardCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()

    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    ctx.strokeStyle = drawColorRef.current
    ctx.lineWidth = drawWidthRef.current
    ctx.lineCap = 'round'

    ctx.beginPath()
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(currentX, currentY)
    ctx.stroke()

    if (socket && roomId) {
      socket.emit('draw-line', {
        roomId,
        x0: lastPosRef.current.x,
        y0: lastPosRef.current.y,
        x1: currentX,
        y1: currentY,
        color: drawColorRef.current,
        lineWidth: drawWidthRef.current
      })
    }

    lastPosRef.current = { x: currentX, y: currentY }
  }

  const stopDrawing = () => {
    drawingRef.current = false
  }

  const clearBoard = () => {
    const canvas = whiteboardCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (socket && roomId) {
      socket.emit('clear-canvas', { roomId })
    }
  }

  // End meeting & compile session summaries
  const leaveRoom = () => {
    if (myStream) {
      myStream.getTracks().forEach(t => t.stop())
    }
    streamStartedRef.current = false

    const completeTranscript = transcriptLogRef.current.length > 0
      ? transcriptLogRef.current.join('\n')
      : `[${user?.name}]: Joined call ${roomId}\n[System]: Call completed cleanly.`

    const durationMins = Math.ceil(secondsElapsed / 60)
    const durationString = `${durationMins} min${durationMins !== 1 ? 's' : ''}`

    const actionItems = []
    const keyHighlights = []

    transcriptLogRef.current.forEach((line) => {
      if (line.toLowerCase().includes('todo') || line.toLowerCase().includes('action') || line.toLowerCase().includes('need to') || line.toLowerCase().includes('will do')) {
        actionItems.push(line.substring(0, 70) + '...')
      } else if (line.length > 25 && !line.includes('[CAPTION]')) {
        keyHighlights.push(line.substring(0, 70) + '...')
      }
    })

    if (keyHighlights.length === 0) {
      keyHighlights.push(`Call session started successfully in room ${roomId}.`)
      keyHighlights.push('Discussed screen layouts and design system updates.')
      keyHighlights.push('Verified collaborative whiteboard coordinates sync.')
    }
    if (actionItems.length === 0) {
      actionItems.push('Review meeting details with key engineering stakeholders.')
      actionItems.push('Verify gesture recognition parameters.')
    }

    const finalSummary = {
      id: 'sum_' + Math.random().toString(36).substr(2, 9),
      name: 'Call Session ' + roomId,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      duration: durationString,
      summary: `Discussion regarding collaborative templates. The meeting was completed in ${durationString} with ${participantsCount} participant${participantsCount !== 1 ? 's' : ''}.`,
      keyHighlights,
      actionItems,
      transcript: completeTranscript
    }

    if (socket) socket.disconnect()

    navigate(`/room/${roomId}/summary`, { state: { summary: finalSummary } })
    window.location.reload()
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const selectTab = (tab) => {
    setSidebarOpen(true)
    setActiveTab(tab)
  }

  return (
    <div style={{ height: '100vh', display: 'grid', gridTemplateRows: '64px 1fr 80px', backgroundColor: 'var(--color-canvas-deep)', color: 'var(--color-on-dark)', overflow: 'hidden', position: 'relative' }}>

      {/* Floating Reactions */}
      {reactions.map((r) => (
        <span key={r.id} className="floating-emoji" style={{ left: `${r.left}%` }}>
          {r.type}
        </span>
      ))}

      {/* Floating Raise Hand Alert Banner */}
      {raisedHandActive && (
        <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-success)', color: 'var(--color-ink)', padding: '12px 24px', borderRadius: 'var(--rounded-pill)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>✋</span>
          <span className="body-strong" style={{ color: 'var(--color-ink)' }}>{raisedHandUser} raised their hand!</span>
        </div>
      )}

      {/* Top Header Row */}
      <header style={{ borderBottom: '1px solid var(--color-surface-dark-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', backgroundColor: '#090706' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="font-display" style={{ fontSize: '20px', letterSpacing: '-0.5px' }}>Room: {roomId}</span>
          <span className="body-md" style={{ color: 'var(--color-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ⏱️ {formatTime(secondsElapsed)}
          </span>
          <span className="body-md" style={{ color: 'var(--color-success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            🔒 Encrypted
          </span>
          <span className="badge-pill" style={{ color: '#ffffff', backgroundColor: '#292524', fontSize: '11px', textTransform: 'none' }}>
            👤 Participants: {participantsCount}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="button-outline" onClick={toggleCaptions} style={{ color: 'white', borderColor: captionsActive ? 'var(--color-success)' : '#444', height: '36px', padding: '0 16px', backgroundColor: captionsActive ? 'rgba(22, 163, 74, 0.1)' : 'transparent' }}>
            {captionsActive ? 'Captions On ✓' : 'Captions Off'}
          </button>
          {captionsActive && (
            <select
              value={translationLanguage}
              onChange={(e) => setTranslationLanguage(e.target.value)}
              style={{ backgroundColor: '#1c1917', color: 'white', border: '1px solid #444', borderRadius: 'var(--rounded-md)', padding: '0 8px', outline: 'none' }}
            >
              <option value="es">Translate to Spanish (ES)</option>
              <option value="de">Translate to German (DE)</option>
              <option value="fr">Translate to French (FR)</option>
              <option value="hi">Translate to Hindi (HI)</option>
            </select>
          )}
        </div>
      </header>

      {/* Main Workspace Area */}
      <main style={{ display: 'grid', gridTemplateColumns: sidebarOpen ? '1fr 380px' : '1fr 0px', overflow: 'hidden', transition: 'grid-template-columns 0.25s ease' }}>

        {/* Video stream center panel */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', gap: '20px', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>

          {/* VIDEO GRID */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1000px',
            flex: 1,
            display: 'flex',
            gap: (screenSharing || remoteScreenSharing) ? '0' : '24px',
            justify: 'center',
            alignItems: 'center',
            transition: 'all 0.35s ease'
          }}>

            {/* MAIN / LARGE VIDEO */}
            <div style={{
              position: 'relative',
              width: (screenSharing || remoteScreenSharing) ? '100%' : '50%',
              maxWidth: (screenSharing || remoteScreenSharing) ? '100%' : '480px',
              aspectRatio: (screenSharing || remoteScreenSharing) ? '16/9' : '4/3',
              borderRadius: 'var(--rounded-xl)',
              border: screenSharing ? '2px solid var(--color-success)' : remoteScreenSharing ? '2px solid var(--color-primary)' : '1px solid #332a26',
              overflow: 'hidden',
              backgroundColor: 'black',
              transition: 'all 0.35s ease',
              flexShrink: 0
            }}>
              {screenSharing ? (
                <>
                  <video
                    ref={myVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(22,163,74,0.9)', padding: '4px 12px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'white', display: 'inline-block', animation: 'pulse-dot 1.4s infinite' }} />
                    LIVE SCREEN
                  </div>
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', color: 'white' }}>
                    🖥️ You (Screen Share)
                  </div>
                </>
              ) : (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: remoteScreenSharing ? 'contain' : 'cover', display: remoteStream ? 'block' : 'none' }}
                  />
                  {!remoteStream && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#777', gap: '12px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#1c1917', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👤</div>
                      <p className="body-md" style={{ margin: 0 }}>Waiting for participant...</p>
                      <p className="caption" style={{ color: '#555', margin: 0 }}>Share your room link to invite</p>
                    </div>
                  )}
                  {remoteScreenSharing && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(41, 37, 36, 0.9)', padding: '4px 12px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-gradient-peach)', display: 'inline-block', animation: 'pulse-dot 1.4s infinite' }} />
                      VIEWING SCREEN
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', color: 'white' }}>
                    {remoteScreenSharing ? `🖥️ ${remoteEmailId?.split('@')[0]}'s Screen` : (remoteEmailId ? remoteEmailId.split('@')[0] : 'Remote Peer')}
                  </div>
                </>
              )}
            </div>

            {/* SECONDARY / SMALL VIDEO */}
            {(screenSharing || remoteScreenSharing) ? (
              /* PIP Layout */
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                width: '200px',
                aspectRatio: '4/3',
                borderRadius: 'var(--rounded-lg)',
                border: '2px solid rgba(255,255,255,0.2)',
                overflow: 'hidden',
                backgroundColor: 'black',
                zIndex: 20,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                transition: 'all 0.35s ease',
              }}>
                {screenSharing ? (
                  <>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: remoteStream ? 'block' : 'none' }}
                    />
                    {!remoteStream && (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '11px', textAlign: 'center', padding: '8px' }}>
                        Waiting...
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: '6px', left: '6px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 'var(--rounded-pill)', fontSize: '10px', color: 'white' }}>
                      {remoteEmailId ? remoteEmailId.split('@')[0] : 'Remote'}
                    </div>
                  </>
                ) : (
                  <>
                    <video
                      ref={myVideoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: camOff ? 'none' : 'block' }}
                    />
                    {camOff && (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '11px' }}>
                        Cam Off
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: '6px', left: '6px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 'var(--rounded-pill)', fontSize: '10px', color: 'white' }}>
                      You
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Normal Side-by-Side Tile */
              <div style={{
                position: 'relative',
                width: '50%',
                maxWidth: '480px',
                aspectRatio: '4/3',
                borderRadius: 'var(--rounded-xl)',
                border: '1px solid #332a26',
                overflow: 'hidden',
                backgroundColor: 'black',
                transition: 'all 0.35s ease',
                flexShrink: 0
              }}>
                <video
                  ref={myVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: camOff ? 'none' : 'block' }}
                />
                {camOff && (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#777', gap: '8px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#1c1917', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📷</div>
                    <p className="body-md" style={{ margin: 0 }}>Camera Off</p>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', color: 'white' }}>
                  You {micMuted && '🔇'}
                </div>
              </div>
            )}
          </div>

          {/* Live Captions Bar Overlay */}
          {captionsActive && (
            <div style={{ width: '100%', maxWidth: '800px', backgroundColor: 'rgba(12, 10, 9, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid #332a26', borderRadius: 'var(--rounded-lg)', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {localTranscript && (
                <p className="body-md" style={{ margin: 0, color: 'var(--color-on-dark)' }}>
                  <strong style={{ color: 'var(--color-success)' }}>You:</strong> {localTranscript}
                </p>
              )}
              {remoteTranscript && (
                <p className="body-md" style={{ margin: 0, color: 'var(--color-on-dark)' }}>
                  <strong style={{ color: 'var(--color-gradient-peach)' }}>{remoteEmailId ? remoteEmailId.split('@')[0] : 'Remote'}:</strong> {remoteTranscript}
                </p>
              )}
              {!localTranscript && !remoteTranscript && (
                <p className="caption" style={{ margin: 0, color: '#777', italic: 'true' }}>
                  Listening for speech...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Sidebar: Chat / Whiteboard */}
        <aside style={{ borderLeft: '1px solid #292524', backgroundColor: '#0c0a09', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs header */}
          <div style={{ display: 'flex', borderBottom: '1px solid #292524' }}>
            <button
              onClick={() => selectTab('chat')}
              style={{ flex: 1, padding: '14px', backgroundColor: activeTab === 'chat' ? '#1c1917' : 'transparent', color: activeTab === 'chat' ? 'white' : '#888', border: 'none', borderBottom: activeTab === 'chat' ? '2px solid var(--color-success)' : 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              💬 Chat
            </button>
            <button
              onClick={() => selectTab('board')}
              style={{ flex: 1, padding: '14px', backgroundColor: activeTab === 'board' ? '#1c1917' : 'transparent', color: activeTab === 'board' ? 'white' : '#888', border: 'none', borderBottom: activeTab === 'board' ? '2px solid var(--color-success)' : 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              🎨 Whiteboard
            </button>
          </div>

          {/* Tab Content 1: Chat Panel */}
          {activeTab === 'chat' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
                    <p className="body-md">No messages yet.</p>
                    <p className="caption">Start the conversation!</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isMe = msg.sender === user?.name
                    return (
                      <div key={index} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px', textAlign: isMe ? 'right' : 'left' }}>
                          {msg.sender}
                        </div>
                        <div style={{ backgroundColor: isMe ? '#292524' : '#1c1917', color: 'white', padding: '8px 12px', borderRadius: '12px', fontSize: '14px', border: '1px solid #332a26' }}>
                          {msg.text}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: '1px solid #292524', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={{ flex: 1, backgroundColor: '#1c1917', border: '1px solid #332a26', color: 'white', padding: '8px 12px', borderRadius: 'var(--rounded-md)', outline: 'none' }}
                />
                <button type="submit" className="button-primary" style={{ height: '38px', padding: '0 16px' }}>
                  Send
                </button>
              </form>
            </div>
          )}

          {/* Tab Content 2: Whiteboard Panel */}
          {activeTab === 'board' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="body-strong" style={{ color: 'white' }}>Shared Canvas</span>
                <button onClick={clearBoard} className="button-outline" style={{ height: '28px', padding: '0 10px', fontSize: '12px', color: '#ff6b6b', borderColor: '#442222' }}>
                  Clear All
                </button>
              </div>

              {/* Toolbar */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="caption" style={{ color: '#888' }}>Color:</span>
                {['#0c0a09', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#ffffff'].map((c) => (
                  <button
                    key={c}
                    onClick={() => { drawColorRef.current = c }}
                    style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: c, border: '1px solid #555', cursor: 'pointer' }}
                  />
                ))}
              </div>

              {/* Canvas element */}
              <div style={{ flex: 1, backgroundColor: '#1c1917', borderRadius: 'var(--rounded-md)', border: '1px solid #332a26', overflow: 'hidden', position: 'relative' }}>
                <canvas
                  ref={whiteboardCanvasRef}
                  width={340}
                  height={450}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{ width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
                />
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* Bottom Floating Control Bar */}
      <footer style={{ borderTop: '1px solid #292524', backgroundColor: '#090706', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px' }}>

        {/* Left Side Controls */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={toggleMic} className="button-outline" style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: micMuted ? '#ef4444' : '#1c1917', borderColor: micMuted ? '#ef4444' : '#332a26', color: 'white', fontSize: '18px' }}>
            {micMuted ? '🎙️❌' : '🎙️'}
          </button>
          <button onClick={toggleCamera} className="button-outline" style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: camOff ? '#ef4444' : '#1c1917', borderColor: camOff ? '#ef4444' : '#332a26', color: 'white', fontSize: '18px' }}>
            {camOff ? '📹❌' : '📹'}
          </button>
        </div>

        {/* Center Main Action Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={toggleScreenShare} className="button-outline" style={{ height: '44px', padding: '0 20px', backgroundColor: screenSharing ? 'var(--color-success)' : '#1c1917', borderColor: screenSharing ? 'var(--color-success)' : '#332a26', color: 'white' }}>
            {screenSharing ? 'Stop Sharing' : '🖥️ Share Screen'}
          </button>

          <button onClick={handleRaiseHand} className="button-outline" style={{ height: '44px', padding: '0 16px', backgroundColor: '#1c1917', borderColor: '#332a26', color: 'white' }}>
            ✋ Raise Hand
          </button>

          {/* Emoji Reaction Selector */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#1c1917', border: '1px solid #332a26', borderRadius: 'var(--rounded-pill)', padding: '4px 8px' }}>
            {['❤️', '👍', '👏', '🔥', '🎉'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px' }}
              >
                {emoji}
              </button>
            ))}
          </div>

          <button onClick={leaveRoom} className="button-primary" style={{ height: '44px', padding: '0 24px', backgroundColor: '#ef4444', borderColor: '#ef4444', fontWeight: 700 }}>
            End Call
          </button>
        </div>

        {/* Right Side Utility Controls */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={toggleSidebar} className="button-outline" style={{ height: '44px', padding: '0 16px', backgroundColor: sidebarOpen ? '#292524' : '#1c1917', borderColor: '#332a26', color: 'white' }}>
            {sidebarOpen ? 'Hide Panel ➔' : '➔ Show Panel'}
          </button>
        </div>
      </footer>

      {/* Hidden processing canvas & video refs for Virtual Background feature */}
      <video ref={videoInputRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />
    </div>
  )
}

export default Room