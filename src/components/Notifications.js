import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import './Notifications.css' // Assurez-vous de créer ce fichier CSS pour les styles

const Notifications = ({ socket }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Vous devez être connecté pour voir vos notifications')
      setLoading(false)
      return
    }

    console.log('Token trouvé:', token.substring(0, 20) + '...')
    fetchNotifications()

    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        console.log('Notification reçue via socket:', notification)
        setNotifications((prevNotifications) => [notification, ...prevNotifications])
      })

      return () => {
        socket.off('notification')
      }
    }
  }, [socket])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Récupération des notifications...')
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        setLoading(false)
        return
      }

      const response = await axios.get('http://localhost:3001/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.log('Réponse des notifications:', response.data)

      if (response.data && response.data.success) {
        setNotifications(response.data.notifications)
      } else {
        console.error('Format de réponse invalide:', response.data)
        setError('Format de réponse invalide')
        toast.error('Erreur lors de la récupération des notifications: Format invalide')
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError(error.message || 'Erreur inconnue')

      // Afficher plus de détails sur l'erreur
      if (error.response) {
        console.error("Détails de l'erreur:", error.response.data)
        toast.error(`Erreur: ${error.response.data.error || 'Erreur inconnue'}`)
      } else if (error.request) {
        console.error('Pas de réponse du serveur:', error.request)
        toast.error('Impossible de contacter le serveur')
      } else {
        console.error('Erreur lors de la configuration de la requête:', error.message)
        toast.error(`Erreur: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('No authentication token found')
        return
      }

      console.log('Marquage de la notification comme lue:', notificationId)
      await axios.put(`/notifications/${notificationId}/read`)
      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification,
        ),
      )
      toast.success('Notification marquée comme lue')
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Erreur lors de la mise à jour de la notification')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_created':
        return '📝'
      case 'task_updated':
        return '🔄'
      case 'task_assigned':
        return '👤'
      case 'task_completed':
        return '✅'
      default:
        return '📌'
    }
  }

  if (loading) {
    return <div className="notifications-loading">Chargement des notifications...</div>
  }

  if (error) {
    return (
      <div className="notifications-error">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={fetchNotifications} className="retry-button">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="notifications-container">
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <div className="no-notifications">Aucune notification</div>
      ) : (
        <ul className="notifications-list">
          {notifications.map((notification) => (
            <li
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => markAsRead(notification._id)}
            >
              <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Notifications
