import { Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './pages/home'
import Room from './pages/room'
import Auth from './pages/auth'
import Dashboard from './pages/dashboard'
import Lobby from './pages/lobby'
import Summary from './pages/summary'
import AuthProvider from './providers/auth'
import SocketProvider from './providers/socket'
import PeerProvider from './providers/peer'

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <PeerProvider>
          <SocketProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Auth defaultTab="login" />} />
              <Route path="/signup" element={<Auth defaultTab="signup" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/room/:roomId/lobby" element={<Lobby />} />
              <Route path="/room/:roomId" element={<Room />} />
              <Route path="/room/:roomId/summary" element={<Summary />} />
            </Routes>
          </SocketProvider>
        </PeerProvider>
      </AuthProvider>
    </div>
  )
}

export default App
