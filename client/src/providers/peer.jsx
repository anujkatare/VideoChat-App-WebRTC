import React, { useMemo, useContext, useEffect, useState, useCallback } from 'react'

const PeerContext = React.createContext(null)

export const usePeer = () => useContext(PeerContext)

const PeerProvider = ({ children }) => {
    const [remoteStream, setRemoteStream] = useState(null)
  const peer = useMemo(() => {
    return new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
      ],
    })
  }, [])

  const createOffer = async () => {
    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    return offer
  }

  const createAnswer = async(offer) =>{
    await peer.setRemoteDescription(offer)
    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)
    return answer
  }

  const setRemoteAns = async (ans) =>{
    await peer.setRemoteDescription(ans)
  }

  const sendStream = async (stream) =>{
    const tracks = stream.getTracks()
    for(const track of tracks ){
        peer.addTrack(track, stream)
    }
  }

  const handleTrackEvent = useCallback((e)=>{
const streams = e.streams;
   setRemoteStream(streams[0])
  },[])

  const handleNegotiation = useCallback(() =>{
     console.log("Oops negotiation needed")
  },[])

  useEffect(() =>{
  peer.addEventListener('track',handleTrackEvent)
  peer.addEventListener('negotiationneeded', handleNegotiation)
  return () =>{
    peer.removeEventListener('track',handleTrackEvent)
    peer.removeEventListener('negotiationneeded', handleNegotiation)
  }
  },[handleTrackEvent,peer])


  return (
    <PeerContext.Provider value={{ peer, createOffer, createAnswer, setRemoteAns,  sendStream, remoteStream }}>
      {children}
    </PeerContext.Provider>
  )
}

export default PeerProvider
