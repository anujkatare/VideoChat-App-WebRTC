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


const emailToSocketMap = new Map()
const socketToEmailMap = new Map()

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)

  socket.on('join-room', ({ roomId, emailId }) => {
    console.log('User', emailId, 'joined room', roomId)

    emailToSocketMap.set(emailId, socket.id)
    socketToEmailMap.set(socket.id, emailId)

    socket.join(roomId)

    socket.emit('joined-room', { roomId })
    socket.broadcast.to(roomId).emit('user-joined', { emailId })
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

  socket.on('disconnect', () => {
    const email = socketToEmailMap.get(socket.id)
    console.log('Socket disconnected:', email)

    socketToEmailMap.delete(socket.id)
    if (email) emailToSocketMap.delete(email)
  })
})


server.listen(8001, () => {
  console.log('Server running on port 8001')
})
