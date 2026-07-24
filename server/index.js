const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

// Maps for WebRTC and Client sessions
const emailToSocketMap = new Map()
const socketToEmailMap = new Map()

// Map room IDs to their active host socket ID
const roomHosts = new Map()

// Map of room IDs to list of active participants
const roomParticipants = new Map()

// Helper to query Gemini API via Node fetch (requires Node 18+)
async function queryGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return "I'm the AuraChat AI Assistant! I am ready to help, but no `GEMINI_API_KEY` was found in the server's environment. Please configure it to unlock real-time Gemini intelligence. In the meantime, here is a mock response: 'Your WebRTC connection is looking stable, and your virtual collaboration is set up successfully. Let me know if you need help summarizing this meeting!'"
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text
    return responseText || "I couldn't process that query. Please try again."
  } catch (err) {
    console.error('Error calling Gemini API:', err)
    return `Error querying Gemini: ${err.message}`
  }
}

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)

  socket.on('check-room-status', ({ roomId }) => {
    const hostSocketId = roomHosts.get(roomId)
    const hostActive = hostSocketId && io.sockets.sockets.has(hostSocketId)
    socket.emit('room-status-response', { hostActive: !!hostActive })
  })

  // Join Room workflow (with Host / Waiting Room approval)
  socket.on('join-room', ({ roomId, emailId }) => {
    console.log(`join-room requested by ${emailId} for room ${roomId}`)
    emailToSocketMap.set(emailId, socket.id)
    socketToEmailMap.set(socket.id, emailId)

    const hostSocketId = roomHosts.get(roomId)
    const hostActive = hostSocketId && io.sockets.sockets.has(hostSocketId)
    const participants = roomParticipants.get(roomId) || []
    const alreadyAdmitted = participants.includes(emailId)
    const isReconnectingHost = hostSocketId === socket.id

    // Lobby already joined this socket; room page re-emits join-room
    if (isReconnectingHost || alreadyAdmitted) {
      socket.join(roomId)
      if (!alreadyAdmitted) {
        participants.push(emailId)
        roomParticipants.set(roomId, participants)
      }
      if (!hostActive && isReconnectingHost) {
        roomHosts.set(roomId, socket.id)
      }
      socket.emit('joined-room', {
        roomId,
        isHost: roomHosts.get(roomId) === socket.id,
      })
      return
    }

    // Check if room has an active host
    if (!hostActive) {
      // First person to join becomes the Host
      roomHosts.set(roomId, socket.id)
      socket.join(roomId)
      
      const participants = roomParticipants.get(roomId) || []
      if (!participants.includes(emailId)) {
        participants.push(emailId)
        roomParticipants.set(roomId, participants)
      }

      console.log(`User ${emailId} assigned as Host for room ${roomId}`)
      socket.emit('joined-room', { roomId, isHost: true })
    } else {
      // Host is active. Automatically admit the guest and let the host start the call.
      socket.join(roomId)
      const participants = roomParticipants.get(roomId) || []
      if (!participants.includes(emailId)) {
        participants.push(emailId)
        roomParticipants.set(roomId, participants)
      }

      socket.emit('joined-room', { roomId, isHost: false })
      socket.broadcast.to(roomId).emit('user-joined', { emailId })
    }
  })

  // WebRTC Signalling Events
  socket.on('ice-candidate', ({ emailId, candidate }) => {
    const targetSocketId = emailToSocketMap.get(emailId)
    if (!targetSocketId || !candidate) return

    socket.to(targetSocketId).emit('ice-candidate', {
      candidate,
      from: socketToEmailMap.get(socket.id)
    })
  })

  socket.on('call-user', ({ emailId, offer }) => {
    const fromEmail = socketToEmailMap.get(socket.id)
    const targetSocketId = emailToSocketMap.get(emailId)

    if (!targetSocketId) return

    socket.to(targetSocketId).emit('incoming-call', {
      from: fromEmail,
      offer,
    })
  })

  socket.on('call-accepted', ({ emailId, ans }) => {
    const targetSocketId = emailToSocketMap.get(emailId)
    if (!targetSocketId) return

    socket.to(targetSocketId).emit('call-accepted', { ans })
  })

  // Rich Chat and Assistant Messages
  socket.on('send-message', async ({ roomId, sender, text, fileUrl }) => {
    const timestamp = Date.now()
    const messageObj = { sender, text, timestamp, fileUrl }
    
    // Broadcast original message to all room participants
    io.to(roomId).emit('message', messageObj)

    // Check if the user is calling the AI Bot
    if (text && text.trim().startsWith('@ai')) {
      const query = text.replace(/^@ai\s*/i, '').trim()
      io.to(roomId).emit('message', {
        sender: 'AI Assistant',
        text: 'Thinking...',
        timestamp: Date.now() + 1,
        isSystem: true
      })

      const botReply = await queryGemini(query)
      io.to(roomId).emit('message', {
        sender: 'AI Assistant',
        text: botReply,
        timestamp: Date.now() + 2
      })
    }
  })

  // Collaborative Whiteboard Stroke Syncing
  socket.on('draw-line', ({ roomId, x0, y0, x1, y1, color, lineWidth }) => {
    socket.to(roomId).emit('draw-line', { x0, y0, x1, y1, color, lineWidth })
  })

  socket.on('clear-canvas', ({ roomId }) => {
    socket.to(roomId).emit('clear-canvas')
  })

  // Floating Emoji Reaction burst events
  socket.on('reaction', ({ roomId, reactionType }) => {
    socket.to(roomId).emit('reaction', { reactionType })
  })

  socket.on('disconnect', () => {
    const email = socketToEmailMap.get(socket.id)
    console.log('Socket disconnected:', email, 'id:', socket.id)

    // Clean up Host map if Host left
    for (const [roomId, hostId] of roomHosts.entries()) {
      if (hostId === socket.id) {
        roomHosts.delete(roomId)
        console.log(`Host left room ${roomId}. Cleaned host mapping.`)
        // Notify others in the room
        socket.broadcast.to(roomId).emit('host-left', { roomId })
      }
    }

    socketToEmailMap.delete(socket.id)
    if (email) emailToSocketMap.delete(email)
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
