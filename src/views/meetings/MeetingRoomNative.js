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

const MeetingRoomNative = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [participants, setParticipants] = useState([])
  const [remoteStreams, setRemoteStreams] = useState([])
  const [stream, setStream] = useState(null)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [connectionAlert, setConnectionAlert] = useState(null)

  const socketRef = useRef()
  const videoGridRef = useRef()
  const localVideoRef = useRef()
  const peerConnectionsRef = useRef({}) // Store RTCPeerConnection objects
  const remoteVideoRefs = useRef({})
  const messagesContainerRef = useRef(null)

  // Get meeting code from URL query params
  const searchParams = new URLSearchParams(location.search)
  const meetingCode = searchParams.get('code')

  // ICE servers configuration for WebRTC
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  }

  useEffect(() => {
    // Fetch meeting details
    const fetchMeeting = async () => {
      try {
        setLoading(true)
        const response = await getMeetingById(id)
        if (response.success) {
          const meetingData = response.meeting
          setMeeting(meetingData)

          // Check if current user is allowed to join this meeting
          const currentUserId = localStorage.getItem('userId')

          // Allow if user is the organizer
          const isOrganizer = meetingData.organizer && meetingData.organizer._id === currentUserId

          // Allow if user is in the participants list
          const isParticipant =
            meetingData.participants &&
            meetingData.participants.some(
              (participant) => participant._id === currentUserId || participant === currentUserId,
            )

          if (!isOrganizer && !isParticipant) {
            setError(
              'You are not authorized to join this meeting. Only the organizer and invited participants can join.',
            )
          }
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

    // Fetch previous messages for this meeting room
    const fetchPreviousMessages = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch(`http://localhost:3001/api/messages/room/meeting-${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.messages) {
            console.log('Previous messages loaded:', data.messages.length)
            setMessages(data.messages)
          }
        }
      } catch (err) {
        console.error('Error fetching previous messages:', err)
      }
    }

    fetchMeeting()
    fetchPreviousMessages()

    // Set up socket connection
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001')
    socketRef.current = socket

    // Join meeting room
    socket.emit('joinRoom', `meeting-${id}`)

    // Listen for chat messages
    socket.on('receiveMessage', (message) => {
      console.log('Received message:', message)
      // Only add the message if it's not from the current user
      // to avoid duplicates (since we already added our own messages)
      if (message.sender !== localStorage.getItem('userId')) {
        setMessages((prev) => [...prev, message])
      }
    })

    // Clean up on unmount
    return () => {
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        if (pc) {
          pc.close()
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

  // Scroll to bottom of messages container when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

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

      // Create peer connections for each existing user
      users.forEach((user) => {
        createPeerConnection(user.socketId, user.userId, user.userName, true)
      })

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

      // Create a peer connection for the new user
      createPeerConnection(userData.socketId, userData.userId, userData.userName, false)
    })

    // Handle WebRTC offers
    socket.on('webrtc-offer', async (data) => {
      console.log('Received WebRTC offer from:', data.from)

      // If we don't have a peer connection for this user yet, create one
      if (!peerConnectionsRef.current[data.from]) {
        createPeerConnection(data.from, data.fromUser.userId, data.fromUser.userName, false)
      }

      const pc = peerConnectionsRef.current[data.from]

      try {
        // Set the remote description
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer))

        // Create answer
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        // Send the answer
        socket.emit('webrtc-answer', {
          target: data.from,
          answer: pc.localDescription,
        })
      } catch (err) {
        console.error('Error handling offer:', err)
        setConnectionAlert(`Error establishing connection: ${err.message}`)
        setTimeout(() => setConnectionAlert(null), 5000)
      }
    })

    // Handle WebRTC answers
    socket.on('webrtc-answer', async (data) => {
      console.log('Received WebRTC answer from:', data.from)

      const pc = peerConnectionsRef.current[data.from]
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
        } catch (err) {
          console.error('Error setting remote description:', err)
        }
      }
    })

    // Handle ICE candidates
    socket.on('webrtc-ice-candidate', (data) => {
      console.log('Received ICE candidate from:', data.from)

      const pc = peerConnectionsRef.current[data.from]
      if (pc) {
        try {
          pc.addIceCandidate(new RTCIceCandidate(data.candidate))
        } catch (err) {
          console.error('Error adding ICE candidate:', err)
        }
      }
    })

    // Handle user leaving
    socket.on('user-left', (userData) => {
      console.log('User left:', userData)

      // Remove from participants list
      setParticipants((prev) => prev.filter((p) => p.socketId !== userData.socketId))

      // Close and remove the peer connection
      const pc = peerConnectionsRef.current[userData.socketId]
      if (pc) {
        pc.close()
        delete peerConnectionsRef.current[userData.socketId]
      }

      // Remove the remote stream
      setRemoteStreams((prev) => prev.filter((s) => s.socketId !== userData.socketId))
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

  // Create a WebRTC peer connection
  const createPeerConnection = async (socketId, userId, userName, isInitiator) => {
    console.log(`Creating peer connection to ${socketId}, initiator: ${isInitiator}`)

    try {
      // Create a new RTCPeerConnection
      const pc = new RTCPeerConnection(iceServers)
      peerConnectionsRef.current[socketId] = pc

      // Add our stream to the connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('webrtc-ice-candidate', {
            target: socketId,
            candidate: event.candidate,
          })
        }
      }

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log(`Connection state for ${socketId}: ${pc.connectionState}`)
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setConnectionAlert(`Connection to ${userName} ${pc.connectionState}`)
          setTimeout(() => setConnectionAlert(null), 5000)
        }
      }

      // Handle receiving remote streams
      pc.ontrack = (event) => {
        console.log(`Received track from ${socketId}`)

        // Create a new MediaStream
        const remoteStream = new MediaStream()
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track)
        })

        // Add to remote streams
        setRemoteStreams((prev) => {
          // Check if we already have this stream
          const exists = prev.some((s) => s.socketId === socketId)
          if (exists) {
            return prev.map((s) =>
              s.socketId === socketId
                ? {
                    ...s,
                    stream: remoteStream,
                  }
                : s,
            )
          } else {
            return [
              ...prev,
              {
                socketId,
                userId,
                userName,
                stream: remoteStream,
              },
            ]
          }
        })

        // Set the stream to the video element if it exists
        if (remoteVideoRefs.current[socketId]) {
          remoteVideoRefs.current[socketId].srcObject = remoteStream
        }
      }

      // If we're the initiator, create and send an offer
      if (isInitiator) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        socketRef.current.emit('webrtc-offer', {
          target: socketId,
          offer: pc.localDescription,
        })
      }

      return pc
    } catch (err) {
      console.error('Error creating peer connection:', err)
      setConnectionAlert(`Error creating connection: ${err.message}`)
      setTimeout(() => setConnectionAlert(null), 5000)
      return null
    }
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

    // Add the message locally first for immediate feedback
    setMessages((prev) => [...prev, messageData])

    // Then send it to others via socket
    socketRef.current.emit('sendMessage', messageData)

    // Clear the input field
    setNewMessage('')

    console.log('Message sent:', messageData)
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
      // Import and use the endMeeting function from meetingsService
      const { endMeeting } = await import('../../services/meetingsService')
      const response = await endMeeting(id)

      if (response.success) {
        navigate('/collaboration/meetings')
      } else {
        setConnectionAlert(`Failed to end meeting: ${response.error || 'Unknown error'}`)
        setTimeout(() => setConnectionAlert(null), 5000)
      }
    } catch (err) {
      console.error('Error ending meeting:', err)
      setConnectionAlert(`Error ending meeting: ${err.message}`)
      setTimeout(() => setConnectionAlert(null), 5000)
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
                {remoteStreams.map((remoteStream) => (
                  <div key={remoteStream.socketId} className="remote-video-container">
                    <video
                      ref={(el) => {
                        if (el) remoteVideoRefs.current[remoteStream.socketId] = el
                      }}
                      autoPlay
                      playsInline
                    />
                    <div className="video-label">{remoteStream.userName}</div>
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
              <div className="messages-container" ref={messagesContainerRef}>
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
              <CInputGroup className="mt-2">
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

export default MeetingRoomNative
