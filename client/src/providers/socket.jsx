import React, { useMemo } from 'react'
import { io } from 'socket.io-client'

const SocketContext = React.createContext(null)

export const useSocket = () => {
  return React.useContext(SocketContext)
}

const SocketProvider = ({ children }) => {
  const socket = useMemo(
    () => io("https://videochat-app-webrtc-server.onrender.com"),
    []
  )

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider

