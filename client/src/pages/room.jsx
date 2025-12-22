import React, { useEffect, useCallback, useState } from 'react'
import { useSocket } from '../providers/socket'
import { usePeer } from '../providers/peer'


const Room = () => {
  const { socket } = useSocket()
  const { peer, createOffer, createAnswer, setRemoteAns, remoteStream } = usePeer()

  const [myStream, setMyStream] = useState(null)
  const [remoteEmailId, setRemoteEmailId] = useState(null)

  
  // Get camera + mic & add tracks
  
  const getUserMediaStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    })

    setMyStream(stream)

    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream)
    })
  }, [peer])

  
  // When new user joins room
  
  const handleNewUserJoined = useCallback(
    async ({ emailId }) => {
      setRemoteEmailId(emailId)

      const offer = await createOffer()
      socket.emit('call-user', { emailId, offer })
    },
    [createOffer, socket]
  )

  
  // Incoming call (offer)
  
  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteEmailId(from)

      const ans = await createAnswer(offer)
      socket.emit('call-accepted', { emailId: from, ans })
    },
    [createAnswer, socket]
  )

  
  // Call accepted (answer)
  
  const handleCallAccepted = useCallback(
    async ({ ans }) => {
      await setRemoteAns(ans)
      console.log('Call accepted')
    },
    [setRemoteAns]
  )

  
  // Negotiation needed
  
  const handleNegotiation = useCallback(async () => {
    if (!remoteEmailId) return

    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)

    socket.emit('call-user', {
      emailId: remoteEmailId,
      offer,
    })
  }, [peer, remoteEmailId, socket])

  
  // Socket listeners
  
  useEffect(() => {
    if (!socket) return

    socket.on('user-joined', handleNewUserJoined)
    socket.on('incoming-call', handleIncomingCall)
    socket.on('call-accepted', handleCallAccepted)

    return () => {
      socket.off('user-joined', handleNewUserJoined)
      socket.off('incoming-call', handleIncomingCall)
      socket.off('call-accepted', handleCallAccepted)
    }
  }, [socket, handleNewUserJoined, handleIncomingCall, handleCallAccepted])

  
  // Peer negotiation listener
  useEffect(() => {
    peer.addEventListener('negotiationneeded', handleNegotiation)

    return () => {
      peer.removeEventListener('negotiationneeded', handleNegotiation)
    }
  }, [peer, handleNegotiation])

  
  // Start media on mount
  
  useEffect(() => {
    getUserMediaStream()
  }, [getUserMediaStream])

  return (
    <div className='room'>
      <h2  className='room-title'>Room </h2>
      <p>Connected to: {remoteEmailId || 'Waiting...'}</p>
     <div className='videos'>
      
      <video
        className='video local'
        autoPlay
        muted
        playsInline
        ref={(video) => {
          if (video && myStream) {
            video.srcObject = myStream
          }
        }}
        style={{ width: '740px', transform: 'scaleX(-1)' }}
      />

      
      <video
        className='video remote'
        autoPlay
        playsInline
        ref={(video) => {
          if (video && remoteStream) {
            video.srcObject = remoteStream
          }
        }}
        style={{ width: '740px', transform: 'scaleX(-1)' }}
      />
      </div>
    </div>
  )
}

export default Room
