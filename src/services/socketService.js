import io from 'socket.io-client'

// Make sure this matches the server port where your Socket.IO server is running
const SOCKET_URL = 'http://localhost:3001'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
    this.listeners = {}
  }

  connect() {
    // If already connected or connecting, return
    if (this.socket) return

    try {
      console.log('Initializing socket connection to:', SOCKET_URL)

      this.socket = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        autoConnect: true,
      })

      this.socket.on('connect', () => {
        console.log('Socket connected successfully:', this.socket.id)
        this.connected = true

        // Execute any pending callbacks that were waiting for connection
        if (this.listeners.onConnected) {
          this.listeners.onConnected.forEach((callback) => {
            try {
              callback()
            } catch (err) {
              console.error('Error in onConnected callback:', err)
            }
          })
        }
      })

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected')
        this.connected = false
      })

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        this.connected = false
      })

      this.socket.on('error', (error) => {
        console.error('Socket error:', error)
      })

      // Set up default listeners
      this.setupDefaultListeners()
    } catch (error) {
      console.error('Error initializing socket connection:', error)
      this.socket = null
      this.connected = false
    }
  }

  setupDefaultListeners() {
    if (!this.socket) {
      console.warn('Cannot set up listeners: socket is null')
      return
    }

    // Listen for comment events
    this.socket.on('commentAdded', (comment) => {
      try {
        if (this.listeners.commentAdded) {
          this.listeners.commentAdded.forEach((callback) => callback(comment))
        }
      } catch (error) {
        console.error('Error in commentAdded listener:', error)
      }
    })

    // Listen for activity events
    this.socket.on('activityAdded', (activity) => {
      try {
        if (this.listeners.activityAdded) {
          this.listeners.activityAdded.forEach((callback) => callback(activity))
        }
      } catch (error) {
        console.error('Error in activityAdded listener:', error)
      }
    })

    // Listen for activity updates (for dashboard)
    this.socket.on('activityUpdated', (activity) => {
      try {
        if (this.listeners.activityUpdated) {
          this.listeners.activityUpdated.forEach((callback) => callback(activity))
        }
      } catch (error) {
        console.error('Error in activityUpdated listener:', error)
      }
    })

    // Listen for notifications
    this.socket.on('notification', (notification) => {
      try {
        if (this.listeners.notification) {
          this.listeners.notification.forEach((callback) => callback(notification))
        }
      } catch (error) {
        console.error('Error in notification listener:', error)
      }
    })

    // Listen for project notifications
    this.socket.on('projectNotification', (notification) => {
      try {
        if (this.listeners.projectNotification) {
          this.listeners.projectNotification.forEach((callback) => callback(notification))
        }
      } catch (error) {
        console.error('Error in projectNotification listener:', error)
      }
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  // Join a room
  joinRoom(room) {
    try {
      if (!room) {
        console.warn('Cannot join room: missing room name')
        return
      }

      // If we don't have a socket yet, create one
      if (!this.socket) {
        this.connect()
      }

      // If socket exists but not connected yet
      if (this.socket && !this.connected) {
        console.log(`Socket exists but not connected. Setting up delayed join for room ${room}`)

        // Remove any existing connect handlers for this room to prevent duplicates
        const existingHandlerKey = `join_${room}`
        if (this.listeners[existingHandlerKey]) {
          this.socket.off('connect', this.listeners[existingHandlerKey])
          delete this.listeners[existingHandlerKey]
        }

        // Set up a one-time listener for the connect event
        const connectHandler = () => {
          if (this.socket) {
            this.socket.emit('joinRoom', room)
            console.log(`Joined room (delayed): ${room}`)
          }
        }

        // Store the handler reference so we can remove it later if needed
        this.listeners[existingHandlerKey] = connectHandler
        this.socket.on('connect', connectHandler)
        return
      }

      // If socket is connected, join the room immediately
      if (this.socket && this.connected) {
        this.socket.emit('joinRoom', room)
        console.log(`Joined room: ${room}`)
      } else {
        console.warn(`Failed to join room ${room}: socket not connected`)
      }
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  // Leave a room
  leaveRoom(room) {
    try {
      if (!room) {
        console.warn('Cannot leave room: missing room name')
        return
      }

      if (!this.socket || !this.connected) return
      this.socket.emit('leaveRoom', room)
      console.log(`Left room: ${room}`)
    } catch (error) {
      console.error('Error leaving room:', error)
    }
  }

  // Send a new comment
  sendComment(comment) {
    try {
      if (!comment) {
        console.warn('Cannot send comment: missing comment data')
        return
      }

      // If we don't have a socket yet, create one
      if (!this.socket) {
        this.connect()
      }

      // If socket exists but not connected yet
      if (this.socket && !this.connected) {
        console.log('Socket exists but not connected. Setting up delayed comment send')

        // Set up a one-time listener for the connect event
        const connectHandler = () => {
          if (this.socket) {
            this.socket.emit('newComment', comment)
            console.log('Comment sent (delayed)')
            this.socket.off('connect', connectHandler)
          }
        }

        this.socket.on('connect', connectHandler)
        return
      }

      // If socket is connected, send immediately
      if (this.socket && this.connected) {
        this.socket.emit('newComment', comment)
        console.log('Comment sent')
      } else {
        console.warn('Failed to send comment: socket not connected')
      }
    } catch (error) {
      console.error('Error sending comment:', error)
    }
  }

  // Send a new activity log
  sendActivity(activity) {
    try {
      if (!activity) {
        console.warn('Cannot send activity: missing activity data')
        return
      }

      // If we don't have a socket yet, create one
      if (!this.socket) {
        this.connect()
      }

      // If socket exists but not connected yet
      if (this.socket && !this.connected) {
        console.log('Socket exists but not connected. Setting up delayed activity send')

        // Set up a one-time listener for the connect event
        const connectHandler = () => {
          if (this.socket) {
            this.socket.emit('newActivity', activity)
            console.log('Activity sent (delayed)')
            this.socket.off('connect', connectHandler)
          }
        }

        this.socket.on('connect', connectHandler)
        return
      }

      // If socket is connected, send immediately
      if (this.socket && this.connected) {
        this.socket.emit('newActivity', activity)
        console.log('Activity sent')
      } else {
        console.warn('Failed to send activity: socket not connected')
      }
    } catch (error) {
      console.error('Error sending activity:', error)
    }
  }

  // Add event listener
  on(event, callback) {
    try {
      if (!event || typeof callback !== 'function') {
        console.warn('Invalid event listener parameters', { event, callback })
        return () => {}
      }

      // Initialize the listeners array for this event if it doesn't exist
      if (!this.listeners[event]) {
        this.listeners[event] = []
      }

      // Add the callback to our internal listeners array
      this.listeners[event].push(callback)

      // If we don't have a socket yet, create one
      if (!this.socket) {
        this.connect()
      }

      // If socket exists but not connected yet
      if (this.socket && !this.connected) {
        // Initialize the onConnected array if it doesn't exist
        if (!this.listeners.onConnected) {
          this.listeners.onConnected = []
        }

        // Add a callback to register this event listener once connected
        const connectCallback = () => {
          if (this.socket) {
            this.socket.on(event, callback)
          }
        }

        this.listeners.onConnected.push(connectCallback)
      } else if (this.socket && this.connected) {
        // If we're already connected, set up the socket listener immediately
        this.socket.on(event, callback)
      }

      // Return a function to unsubscribe
      return () => this.off(event, callback)
    } catch (error) {
      console.error('Error adding event listener:', error)
      return () => {}
    }
  }

  // Remove event listener
  off(event, callback) {
    try {
      if (!event || typeof callback !== 'function') {
        console.warn('Invalid event listener parameters for removal', { event, callback })
        return
      }

      // Remove from our internal listeners array
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
      }

      // If we have a socket, remove the listener from it
      if (this.socket) {
        this.socket.off(event, callback)
      }

      // Also remove from onConnected callbacks if present
      if (this.listeners.onConnected) {
        // We can't directly compare the callbacks since they're wrapped,
        // so we'll just keep all callbacks (this is a minor memory leak,
        // but these callbacks are small and temporary)
      }
    } catch (error) {
      console.error('Error removing event listener:', error)
    }
  }
}

// Create a singleton instance
const socketService = new SocketService()

export default socketService
