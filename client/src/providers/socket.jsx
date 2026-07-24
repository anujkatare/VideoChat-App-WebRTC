import React, { useMemo } from 'react'
import { io } from 'socket.io-client'

const SocketContext = React.createContext(null)

export const useSocket = () => {
  return React.useContext(SocketContext)
}

const SocketProvider = ({ children }) => {
  const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://aurachat-backend-99fa.onrender.com' //Updated to new live Render URL

  const socket = useMemo(
    () => io(socketUrl, {
      transports: ['websocket', 'polling'], // Added for stable fallback
      withCredentials: true
    }),
    [socketUrl]
  )

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider