import { Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './pages/home'
import Room from './pages/room'
import SocketProvider from './providers/socket'
import PeerProvider from './providers/peer'

function App() {
  return (
    <div className="App">
      <PeerProvider>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<Room />} />
          </Routes>
        </SocketProvider>
      </PeerProvider>
    </div>
  )
}

export default App
