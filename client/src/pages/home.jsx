import React, { useState, useEffect, useCallback } from 'react'
import '../index.css'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../providers/socket'

const Home = () => {
  const { socket } = useSocket()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [roomId, setRoomId] = useState('')

  const handleRoomJoined = useCallback(
    ({ roomId }) => {
      navigate(`/room/${roomId}`)
    },
    [navigate]
  )

  useEffect(() => {
    if (!socket) return

    socket.on('joined-room', handleRoomJoined)

    return () => {
      socket.off('joined-room', handleRoomJoined)
    }
  }, [socket, handleRoomJoined])

  const handleJoinRoom = () => {
    if (!email || !roomId) return alert('Fill all fields')

    socket.emit('join-room', {
      emailId: email,
      roomId,
    })
  }

  return (
    <div className="container">
      <h2>Join Room</h2>

      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="text"
        placeholder="Enter room code"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />

      <button onClick={handleJoinRoom}>Join</button>
    </div>
  )
}


export default Home
