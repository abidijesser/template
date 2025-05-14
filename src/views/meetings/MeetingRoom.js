import React, { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CFormInput,
  CInputGroup,
  CSpinner,
  CAlert,
  CBadge,
} from '@coreui/react'
import { io } from 'socket.io-client'
import { getMeetingById } from '../../services/meetingsService'
import './MeetingRoom.css'

const MeetingRoom = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [participants, setParticipants] = useState([])
  const [peers, setPeers] = useState([])
  const [stream, setStream] = useState(null)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [connectionAlert, setConnectionAlert] = useState(null)

  const socketRef = useRef()
  const videoGridRef = useRef()
  const localVideoRef = useRef()
  const peersRef = useRef([])
  const userVideoRefs = useRef({})

  // Get meeting code from URL query params
  const searchParams = new URLSearchParams(location.search)
  const meetingCode = searchParams.get('code')

  useEffect(() => {
    // Fetch meeting details
    const fetchMeeting = async () => {
      try {
        setLoading(true)
        const response = await getMeetingById(id)
        if (response.success) {
          setMeeting(response.meeting)
        } else {
          setError('Failed to load meeting details')
        }
      } catch (err) {
        setError('Error loading meeting')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchMeeting()

    // Set up socket connection
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001')
    socketRef.current = socket

    // Join meeting room
    socket.emit('joinRoom', `meeting-${id}`)

    // Listen for chat messages
    socket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message])
    })

    // Clean up on unmount
    return () => {
      // Close all peer connections
      peersRef.current.forEach((peer) => {
        if (peer.peer) {
          peer.peer.destroy()
        }
      })

      // Stop local stream
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop()
        })
      }

      socket.emit('leaveRoom', `meeting-${id}`)
      socket.disconnect()
    }
  }, [id])

  // Set up WebRTC when stream is available
  useEffect(() => {
    if (!stream || !socketRef.current) return

    const socket = socketRef.current
    const userId = localStorage.getItem('userId')
    const userName = localStorage.getItem('userName')

    // Join the meeting with WebRTC
    socket.emit('join-meeting', id, userId, userName)

    // Handle existing users in the meeting
    socket.on('connected-users', (users) => {
      console.log('Connected users:', users)

      // Create peers for each existing user
      const newPeers = users.map((user) => {
        const peer = createPeer(user.socketId, socket.id, stream)

        return {
          peerId: user.socketId,
          userId: user.userId,
          userName: user.userName,
          peer,
        }
      })

      peersRef.current = newPeers
      setPeers(newPeers)

      // Update participants list
      setParticipants(
        users.map((user) => ({
          id: user.userId,
          name: user.userName,
          socketId: user.socketId,
        })),
      )
    })

    // Handle new users joining
    socket.on('user-joined', (userData) => {
      console.log('User joined:', userData)

      // Add to participants list
      setParticipants((prev) => [
        ...prev,
        {
          id: userData.userId,
          name: userData.userName,
          socketId: userData.socketId,
        },
      ])

      // Create a peer for the new user
      const peer = addPeer(userData.socketId, socket.id, stream)

      peersRef.current.push({
        peerId: userData.socketId,
        userId: userData.userId,
        userName: userData.userName,
        peer,
      })

      setPeers((prev) => [
        ...prev,
        {
          peerId: userData.socketId,
          userId: userData.userId,
          userName: userData.userName,
          peer,
        },
      ])
    })

    // Handle WebRTC offers
    socket.on('webrtc-offer', (data) => {
      console.log('Received WebRTC offer from:', data.from)

      const peer = addPeer(data.from, data.from, stream, data.offer)

      const peerObj = {
        peerId: data.from,
        userId: data.fromUser.userId,
        userName: data.fromUser.userName,
        peer,
      }

      peersRef.current.push(peerObj)
      setPeers((prev) => [...prev, peerObj])
    })

    // Handle WebRTC answers
    socket.on('webrtc-answer', (data) => {
      console.log('Received WebRTC answer from:', data.from)

      const item = peersRef.current.find((p) => p.peerId === data.from)
      if (item) {
        item.peer.signal(data.answer)
      }
    })

    // Handle ICE candidates
    socket.on('webrtc-ice-candidate', (data) => {
      console.log('Received ICE candidate from:', data.from)

      const item = peersRef.current.find((p) => p.peerId === data.from)
      if (item) {
        item.peer.signal(data.candidate)
      }
    })

    // Handle user leaving
    socket.on('user-left', (userData) => {
      console.log('User left:', userData)

      // Remove from participants list
      setParticipants((prev) => prev.filter((p) => p.socketId !== userData.socketId))

      // Close and remove the peer connection
      const peerObj = peersRef.current.find((p) => p.peerId === userData.socketId)
      if (peerObj) {
        peerObj.peer.destroy()
      }

      peersRef.current = peersRef.current.filter((p) => p.peerId !== userData.socketId)
      setPeers((prev) => prev.filter((p) => p.peerId !== userData.socketId))
    })

    return () => {
      socket.off('connected-users')
      socket.off('user-joined')
      socket.off('webrtc-offer')
      socket.off('webrtc-answer')
      socket.off('webrtc-ice-candidate')
      socket.off('user-left')
    }
  }, [stream, id])

  // Create a peer (initiator)
  const createPeer = (target, _initiator, stream) => {
    console.log(`Creating peer to ${target} as initiator`)

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    })

    peer.on('signal', (signal) => {
      socketRef.current.emit('webrtc-offer', {
        target,
        offer: signal,
      })
    })

    peer.on('stream', (remoteStream) => {
      console.log(`Received stream from ${target}`)
      if (userVideoRefs.current[target]) {
        userVideoRefs.current[target].srcObject = remoteStream
      }
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
      setConnectionAlert(`Connection error: ${err.message}`)
      setTimeout(() => setConnectionAlert(null), 5000)
    })

    return peer
  }

  // Add a peer (non-initiator)
  const addPeer = (target, _initiator, stream, incomingSignal = null) => {
    console.log(`Adding peer to ${target}`)

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    })

    // If we have an incoming signal, process it
    if (incomingSignal) {
      peer.signal(incomingSignal)
    }

    peer.on('signal', (signal) => {
      socketRef.current.emit('webrtc-answer', {
        target,
        answer: signal,
      })
    })

    peer.on('stream', (remoteStream) => {
      console.log(`Received stream from ${target}`)
      if (userVideoRefs.current[target]) {
        userVideoRefs.current[target].srcObject = remoteStream
      }
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
      setConnectionAlert(`Connection error: ${err.message}`)
      setTimeout(() => setConnectionAlert(null), 5000)
    })

    return peer
  }

  // Handle sending a message
  const sendMessage = () => {
    if (!newMessage.trim()) return

    const messageData = {
      room: `meeting-${id}`,
      sender: localStorage.getItem('userId'),
      senderName: localStorage.getItem('userName'),
      content: newMessage,
      timestamp: new Date(),
    }

    socketRef.current.emit('sendMessage', messageData)
    setNewMessage('')
  }

  // Handle starting video
  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      // Set stream to state and local video element
      setStream(mediaStream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream
      }

      // Set initial state of video/audio
      setVideoEnabled(true)
      setAudioEnabled(true)

      // Emit event to let others know you've joined with video
      socketRef.current.emit('videoStarted', {
        meetingId: id,
        userId: localStorage.getItem('userId'),
        userName: localStorage.getItem('userName'),
      })
    } catch (err) {
      console.error('Error accessing camera and microphone:', err)
      setConnectionAlert(
        'Could not access camera or microphone. Please check your device permissions.',
      )
      setTimeout(() => setConnectionAlert(null), 5000)
    }
  }

  // Toggle video on/off
  const toggleVideo = () => {
    if (!stream) return

    const videoTracks = stream.getVideoTracks()
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled
    })

    setVideoEnabled(videoTracks[0]?.enabled || false)
  }

  // Toggle audio on/off
  const toggleAudio = () => {
    if (!stream) return

    const audioTracks = stream.getAudioTracks()
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled
    })

    setAudioEnabled(audioTracks[0]?.enabled || false)
  }

  // Handle ending the meeting (for organizer only)
  const endMeeting = async () => {
    try {
      const response = await fetch(`/api/meetings/${id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        navigate('/meetings')
      }
    } catch (err) {
      console.error('Error ending meeting:', err)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <CCard>
        <CCardBody>
          <div className="text-center">
            <h3>Error</h3>
            <p>{error || 'Meeting not found'}</p>
            <CButton color="primary" onClick={() => navigate('/meetings')}>
              Back to Meetings
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    )
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <h4>{meeting.title}</h4>
        <div className="small text-medium-emphasis">
          Meeting Code: <span className="fw-bold">{meeting.meetingCode || meetingCode}</span>
        </div>
      </CCardHeader>
      <CCardBody>
        {connectionAlert && (
          <CAlert color="warning" dismissible onClose={() => setConnectionAlert(null)}>
            {connectionAlert}
          </CAlert>
        )}

        <CRow>
          {/* Video section */}
          <CCol md={8}>
            <div className="video-container mb-3">
              <h5>Video Conference</h5>

              <div className="video-grid" ref={videoGridRef}>
                {/* Local video */}
                <div className="local-video-container">
                  <video ref={localVideoRef} autoPlay muted playsInline />
                  <div className="video-label">You {!stream && '(Camera off)'}</div>
                </div>

                {/* Remote videos */}
                {peers.map((peer) => (
                  <div key={peer.peerId} className="remote-video-container">
                    <video
                      ref={(el) => {
                        if (el) userVideoRefs.current[peer.peerId] = el
                      }}
                      autoPlay
                      playsInline
                    />
                    <div className="video-label">{peer.userName}</div>
                  </div>
                ))}
              </div>

              <div className="video-controls mt-3">
                {!stream ? (
                  <CButton color="primary" onClick={startVideo} className="me-2">
                    Start Video
                  </CButton>
                ) : (
                  <>
                    <CButton
                      color={videoEnabled ? 'primary' : 'secondary'}
                      onClick={toggleVideo}
                      className="me-2"
                    >
                      {videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                    </CButton>
                    <CButton
                      color={audioEnabled ? 'primary' : 'secondary'}
                      onClick={toggleAudio}
                      className="me-2"
                    >
                      {audioEnabled ? 'Mute' : 'Unmute'}
                    </CButton>
                  </>
                )}

                {meeting.organizer && meeting.organizer._id === localStorage.getItem('userId') && (
                  <CButton color="danger" onClick={endMeeting}>
                    End Meeting
                  </CButton>
                )}
              </div>
            </div>
          </CCol>

          {/* Chat section */}
          <CCol md={4}>
            <div className="chat-container">
              <h5>Meeting Chat</h5>
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="text-center text-muted p-3">No messages yet</div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`message-item p-2 mb-2 ${
                        msg.sender === localStorage.getItem('userId')
                          ? 'bg-light text-end'
                          : 'bg-info bg-opacity-10'
                      }`}
                    >
                      <div className="message-sender fw-bold">
                        {msg.sender === localStorage.getItem('userId') ? 'You' : msg.senderName}
                      </div>
                      <div className="message-content">{msg.content}</div>
                      <div className="message-time small text-muted">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <CInputGroup>
                <CFormInput
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <CButton type="button" color="primary" onClick={sendMessage}>
                  Send
                </CButton>
              </CInputGroup>
            </div>

            {/* Participants section */}
            <div className="participants-container mt-4">
              <h5>Participants ({participants.length + 1})</h5> {/* +1 for the current user */}
              <div className="participants-list">
                <ul className="list-group">
                  {/* Current user */}
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    {localStorage.getItem('userName')} (You)
                    {meeting.organizer &&
                      meeting.organizer._id === localStorage.getItem('userId') && (
                        <CBadge color="primary" shape="rounded-pill">
                          Host
                        </CBadge>
                      )}
                  </li>

                  {/* Other participants */}
                  {participants.map((participant) => (
                    <li
                      key={participant.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      {participant.name}
                      {meeting.organizer && meeting.organizer._id === participant.id && (
                        <CBadge color="primary" shape="rounded-pill">
                          Host
                        </CBadge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  )
}

export default MeetingRoom
