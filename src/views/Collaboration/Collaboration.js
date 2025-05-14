import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import io from 'socket.io-client'
import Notifications from '../../components/Notifications'
import MeetingsList from '../meetings/MeetingsList'
import ChatBox from '../../components/ChatBox'
import { FaComments, FaBell, FaCalendarAlt } from 'react-icons/fa'
import './Collaboration.css'

const socket = io('http://localhost:3001') // Updated to match your server port

const Collaboration = () => {
  const location = useLocation()

  // States
  const [notifications, setNotifications] = useState([])

  // Determine active tab based on URL path
  const getTabFromPath = (path) => {
    // Handle hash router paths
    if (path.includes('#/collaboration/chat')) return 'chat'
    if (path.includes('#/collaboration/notifications')) return 'notifications'
    if (path.includes('#/collaboration/meetings')) return 'meetings'
    // Handle regular paths
    if (path.includes('/collaboration/chat')) return 'chat'
    if (path.includes('/collaboration/notifications')) return 'notifications'
    if (path.includes('/collaboration/meetings')) return 'meetings'
    return 'chat' // Default tab
  }

  // Set active tab based on current URL
  const [activeTab, setActiveTab] = useState(getTabFromPath(location.pathname))

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname))
  }, [location.pathname])

  // Navigate to the correct URL when tab changes
  const handleTabChange = (tab) => {
    const tabToPath = {
      chat: '#/collaboration/chat',
      notifications: '#/collaboration/notifications',
      meetings: '#/collaboration/meetings',
    }

    setActiveTab(tab)
    // For HashRouter, we need to use window.location.hash
    window.location.hash = tabToPath[tab].substring(1) || '/collaboration'
  }

  // Socket effects
  useEffect(() => {
    // Connect to socket
    socket.on('connect', () => {
      console.log('Connected to socket server')
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    return () => {
      socket.off('connect')
      socket.off('connect_error')
    }
  }, [])

  useEffect(() => {
    socket.on('notification', (notification) => {
      console.log('Nouvelle notification reçue:', notification)
      if (activeTab === 'notifications') {
        // Mettre à jour les notifications en temps réel
        setNotifications((prevNotifications) => [notification, ...prevNotifications])
      }
    })

    return () => {
      socket.off('notification')
    }
  }, [activeTab])

  const renderChatTab = () => (
    <div className="collaboration-chat-container">
      <div className="chat-main">
        <ChatBox />
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return renderChatTab()
      case 'notifications':
        return <Notifications socket={socket} /> // Passer le socket pour les notifications
      case 'scheduler':
        return <Notifications />
      case 'meetings':
        return (
          <div className="meetings-container">
            <MeetingsList />
          </div>
        )
      default:
        return renderChatTab()
    }
  }

  // Main render
  return (
    <div className="collaboration-container">
      <div className="collaboration-header">
        <h1>Collaboration & Communication</h1>
      </div>
      <div className="collaboration-tabs">
        <button
          onClick={() => handleTabChange('chat')}
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
        >
          <FaComments className="tab-icon" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => handleTabChange('notifications')}
          className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
        >
          <FaBell className="tab-icon" />
          <span>Notifications</span>
        </button>
        <button
          onClick={() => handleTabChange('meetings')}
          className={`tab-button ${activeTab === 'meetings' ? 'active' : ''}`}
        >
          <FaCalendarAlt className="tab-icon" />
          <span>Réunions</span>
        </button>
      </div>
      <div className="collaboration-content">{renderContent()}</div>
    </div>
  )
}

export default Collaboration
