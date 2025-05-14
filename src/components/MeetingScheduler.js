import React, { useState, useEffect } from 'react'
import {
  FaCalendarAlt,
  FaUser,
  FaUsers,
  FaLink,
  FaVideo,
  FaClock,
  FaPlus,
  FaCheck,
  FaHourglassEnd,
} from 'react-icons/fa'
import axios from 'axios'
import './MeetingScheduler.css'

const MeetingScheduler = () => {
  const [meetingDetails, setMeetingDetails] = useState({
    date: '',
    duration: 60, // durée par défaut en minutes
    participants: '',
    zoomLink: '',
    title: "Réunion d'équipe",
  })
  const [success, setSuccess] = useState(false)
  const [meetings, setMeetings] = useState([])
  const [meetLink, setMeetLink] = useState('')
  const [generatingMeet, setGeneratingMeet] = useState(false)
  const [showUserList, setShowUserList] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  // Charger les réunions depuis le localStorage au démarrage
  useEffect(() => {
    const savedMeetings = localStorage.getItem('meetings')
    if (savedMeetings) {
      try {
        const parsedMeetings = JSON.parse(savedMeetings)
        // Convertir les chaînes de date en objets Date
        const formattedMeetings = parsedMeetings.map((meeting) => ({
          ...meeting,
          startDate: new Date(meeting.startDate),
          endDate: new Date(meeting.endDate),
        }))
        setMeetings(formattedMeetings)
      } catch (error) {
        console.error('Erreur lors du chargement des réunions:', error)
      }
    }

    // Charger la liste des utilisateurs
    const fetchUsers = async () => {
      try {
        setLoading(true)
        // Cette fonction est simulée pour l'exemple
        // Dans une application réelle, vous feriez un appel API
        setTimeout(() => {
          const mockUsers = [
            { _id: '1', name: 'Sophie Martin', email: 'sophie.martin@example.com' },
            { _id: '2', name: 'Thomas Dubois', email: 'thomas.dubois@example.com' },
            { _id: '3', name: 'Emma Petit', email: 'emma.petit@example.com' },
            { _id: '4', name: 'Lucas Bernard', email: 'lucas.bernard@example.com' },
            { _id: '5', name: 'Julie Moreau', email: 'julie.moreau@example.com' },
          ]
          setUsers(mockUsers)
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error)
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Fonctions pour l'API Google Calendar (simulées pour l'exemple)
  const checkGoogleCalendarAuth = async () => {
    // Dans une application réelle, vous feriez un appel API
    console.log('Vérification de l\'authentification Google Calendar...')
    return { isAuthenticated: false }
  }

  const getGoogleCalendarAuthUrl = async () => {
    // Dans une application réelle, vous feriez un appel API
    console.log('Obtention de l\'URL d\'authentification Google Calendar...')
    return {
      success: true,
      authUrl: 'https://accounts.google.com/o/oauth2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=https://www.googleapis.com/auth/calendar&response_type=code'
    }
  }

  const generateMeetLink = async (date) => {
    // Dans une application réelle, vous feriez un appel API
    console.log('Génération d\'un lien Google Meet pour la date:', date)
    return {
      success: true,
      meetLink: 'https://meet.google.com/abc-defg-hij'
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setMeetingDetails((prevDetails) => ({ ...prevDetails, [name]: value }))
  }

  // Toggle user list visibility
  const toggleUserList = () => {
    setShowUserList((prev) => !prev)
  }

  // Handle user selection
  const handleUserSelect = (user) => {
    const currentEmails = meetingDetails.participants ? meetingDetails.participants.split(',').map(email => email.trim()) : []
    const userEmail = user.email.trim()

    // Check if email is already in the list
    if (!currentEmails.includes(userEmail)) {
      const updatedEmails = [...currentEmails, userEmail].filter(Boolean).join(', ')
      setMeetingDetails((prev) => ({ ...prev, participants: updatedEmails }))
    }

    // Hide the user list after selection
    setShowUserList(false)
  }

  // Import all user emails
  const importAllUserEmails = () => {
    if (users.length > 0) {
      const allEmails = users.map(user => user.email).join(', ')
      setMeetingDetails((prev) => ({ ...prev, participants: allEmails }))
      setShowUserList(false)
    }
  }

  // Générer un lien Google Meet en utilisant l'API du serveur
  const generateGoogleMeetLink = async () => {
    if (!meetingDetails.date) {
      alert('Veuillez sélectionner une date pour la réunion avant de générer un lien Meet')
      return
    }

    try {
      setGeneratingMeet(true)
      console.log('Génération d\'un lien Google Meet via l\'API du serveur...')

      // Vérifier si l'utilisateur est authentifié avec Google Calendar
      const authCheck = await checkGoogleCalendarAuth()

      // Si l'utilisateur n'est pas authentifié, rediriger vers l'authentification
      if (!authCheck.isAuthenticated) {
        console.log('Utilisateur non authentifié avec Google Calendar')
        const authUrlResponse = await getGoogleCalendarAuthUrl()

        if (authUrlResponse.success && authUrlResponse.authUrl) {
          if (confirm('Vous devez vous connecter à Google Calendar pour générer un lien Meet. Voulez-vous vous connecter maintenant?')) {
            // Ouvrir l'URL d'authentification dans une nouvelle fenêtre
            window.open(authUrlResponse.authUrl, '_blank')
            alert('Après vous être connecté à Google Calendar, revenez sur cette page et réessayez de générer un lien Meet.')
          }
        } else {
          alert('Impossible d\'obtenir l\'URL d\'authentification Google Calendar.')
        }

        setGeneratingMeet(false)
        return
      }

      // Générer le lien Meet
      const result = await generateMeetLink(meetingDetails.date)

      if (result.success && result.meetLink) {
        setMeetLink(result.meetLink)
        setMeetingDetails(prev => ({ ...prev, zoomLink: result.meetLink }))
        console.log('Lien Google Meet généré avec succès:', result.meetLink)
      } else if (result.needsAuth) {
        // Si l'authentification a expiré, rediriger vers l'authentification
        console.log('Authentification Google Calendar expirée')
        const authUrlResponse = await getGoogleCalendarAuthUrl()

        if (authUrlResponse.success && authUrlResponse.authUrl) {
          if (confirm('Votre connexion à Google Calendar a expiré. Voulez-vous vous reconnecter maintenant?')) {
            // Ouvrir l'URL d'authentification dans une nouvelle fenêtre
            window.open(authUrlResponse.authUrl, '_blank')
            alert('Après vous être reconnecté à Google Calendar, revenez sur cette page et réessayez de générer un lien Meet.')
          }
        } else {
          alert('Impossible d\'obtenir l\'URL d\'authentification Google Calendar.')
        }
      } else {
        // Autre erreur
        console.error('Erreur lors de la génération du lien Google Meet:', result.error)
        alert(`Erreur lors de la génération du lien Google Meet: ${result.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la génération du lien Google Meet:', error)

      // Message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de la génération du lien Google Meet. ';

      if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      }

      alert(errorMessage)
    } finally {
      setGeneratingMeet(false)
    }
  }

  const handleCreateMeeting = async () => {
    if (meetingDetails.date && meetingDetails.participants && meetingDetails.zoomLink) {
      // Calculer la date de début et de fin
      const startDate = new Date(meetingDetails.date)
      const endDate = new Date(startDate.getTime())
      endDate.setMinutes(endDate.getMinutes() + parseInt(meetingDetails.duration))

      // Créer un objet réunion
      const meeting = {
        id: Date.now(), // identifiant unique basé sur le timestamp
        title: meetingDetails.title,
        startDate: startDate,
        endDate: endDate,
        duration: parseInt(meetingDetails.duration),
        participants: meetingDetails.participants.split(',').map((email) => email.trim()),
        zoomLink: meetingDetails.zoomLink,
      }

      console.log('Réunion créée :', meeting)

      // Ajouter la réunion à la liste
      const updatedMeetings = [...meetings, meeting]
      setMeetings(updatedMeetings)

      // Sauvegarder dans le localStorage
      localStorage.setItem('meetings', JSON.stringify(updatedMeetings))

      // Afficher un message de succès
      setSuccess(true)

      // Réinitialiser le formulaire après 3 secondes
      setTimeout(() => {
        setMeetingDetails({
          date: '',
          duration: 60,
          participants: '',
          zoomLink: '',
          title: "Réunion d'équipe",
        })
        setSuccess(false)
      }, 3000)
    } else {
      alert('Veuillez remplir tous les champs avant de créer la réunion.')
    }
  }

  // Fonction pour formater l'heure (HH:MM)
  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  // Fonction pour obtenir le jour et le mois
  const getDay = (date) => {
    return date.getDate()
  }

  const getMonth = (date) => {
    const months = [
      'JAN',
      'FÉV',
      'MAR',
      'AVR',
      'MAI',
      'JUIN',
      'JUIL',
      'AOÛ',
      'SEP',
      'OCT',
      'NOV',
      'DÉC',
    ]
    return months[date.getMonth()]
  }

  // Fonction pour définir la date à aujourd'hui
  const setToday = () => {
    const today = new Date()
    today.setHours(today.getHours() + 1)
    today.setMinutes(0)

    const formattedDate = today.toISOString().slice(0, 16)
    setMeetingDetails((prev) => ({ ...prev, date: formattedDate }))
  }

  // Fonction pour définir la date à demain
  const setTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10)
    tomorrow.setMinutes(0)

    const formattedDate = tomorrow.toISOString().slice(0, 16)
    setMeetingDetails((prev) => ({ ...prev, date: formattedDate }))
  }

  // Fonction pour définir la date à cette semaine (vendredi)
  const setThisWeek = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = dimanche, 1 = lundi, ..., 6 = samedi
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 + 7 - dayOfWeek

    const friday = new Date()
    friday.setDate(today.getDate() + daysUntilFriday)
    friday.setHours(14)
    friday.setMinutes(0)

    const formattedDate = friday.toISOString().slice(0, 16)
    setMeetingDetails((prev) => ({ ...prev, date: formattedDate }))
  }

  return (
    <div className="meeting-container">
      {/* Header with icon */}
      <div className="meeting-header">
        <FaVideo className="meeting-icon" />
        <h2 className="meeting-title">Planifier une réunion</h2>
      </div>

      {/* Success message */}
      {success && (
        <div className="success-message">
          <FaCheck className="success-icon" />
          <span>Réunion créée avec succès!</span>
        </div>
      )}

      {/* Meeting form */}
      <div className="meeting-form">
        <div className="input-group">
          <FaCalendarAlt className="input-icon" />
          <input
            type="datetime-local"
            name="date"
            value={meetingDetails.date}
            onChange={handleInputChange}
            className="input-field"
          />
        </div>

        <div className="input-group">
          <FaHourglassEnd className="input-icon" />
          <input
            type="number"
            name="duration"
            value={meetingDetails.duration}
            onChange={handleInputChange}
            placeholder="Durée en minutes"
            className="input-field"
            min="15"
            step="15"
          />
        </div>

        <div className="input-group">
          <FaVideo className="input-icon" />
          <input
            type="text"
            name="title"
            value={meetingDetails.title}
            onChange={handleInputChange}
            placeholder="Titre de la réunion"
            className="input-field"
          />
        </div>

        <div className="input-group">
          <FaUser className="input-icon" />
          <input
            type="text"
            name="participants"
            value={meetingDetails.participants}
            onChange={handleInputChange}
            placeholder="Emails séparés par des virgules"
            className="input-field"
          />
          <button
            type="button"
            className="import-users-btn"
            onClick={toggleUserList}
            title="Importer des utilisateurs"
          >
            <FaUsers />
          </button>

          {showUserList && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <h4>Sélectionner des utilisateurs</h4>
                <button
                  className="select-all-btn"
                  onClick={importAllUserEmails}
                >
                  Tout sélectionner
                </button>
              </div>

              {loading ? (
                <div className="loading-indicator">Chargement...</div>
              ) : users.length > 0 ? (
                <ul className="user-list">
                  {users.map(user => (
                    <li
                      key={user._id}
                      className="user-item"
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-users">Aucun utilisateur trouvé</div>
              )}
            </div>
          )}
        </div>

        <div className="input-group">
          <FaLink className="input-icon" />
          <input
            type="text"
            name="zoomLink"
            value={meetingDetails.zoomLink}
            onChange={handleInputChange}
            placeholder="Lien de la réunion"
            className="input-field"
          />
          <button
            type="button"
            className="generate-meet-btn"
            onClick={generateGoogleMeetLink}
            disabled={generatingMeet || !meetingDetails.date}
            title="Générer un lien Google Meet"
          >
            {generatingMeet ? 'Génération...' : 'Générer Meet'}
          </button>
        </div>
      </div>

      {/* Quick date selection */}
      <div className="quick-replies">
        <button className="quick-reply" onClick={setToday}>
          <FaClock className="quick-reply-icon" />
          <span>Aujourd'hui</span>
        </button>
        <button className="quick-reply" onClick={setTomorrow}>
          <FaClock className="quick-reply-icon" />
          <span>Demain</span>
        </button>
        <button className="quick-reply" onClick={setThisWeek}>
          <FaClock className="quick-reply-icon" />
          <span>Cette semaine</span>
        </button>
      </div>

      {/* Create meeting button */}
      <button onClick={handleCreateMeeting} className="create-button" disabled={success}>
        <FaPlus className="create-icon" />
        <span>Créer la Réunion</span>
      </button>

      {/* Upcoming meetings preview */}
      <div className="upcoming-meetings">
        <h3>Prochaines réunions</h3>

        {meetings.length === 0 ? (
          <div className="no-meetings">Aucune réunion planifiée</div>
        ) : (
          meetings
            .sort((a, b) => a.startDate - b.startDate) // Trier par date
            .map((meeting) => (
              <div className="meeting-preview" key={meeting.id}>
                <div className="meeting-preview-date">
                  <div className="meeting-date">{getDay(meeting.startDate)}</div>
                  <div className="meeting-month">{getMonth(meeting.startDate)}</div>
                </div>
                <div className="meeting-preview-details">
                  <div className="meeting-preview-title">{meeting.title}</div>
                  <div className="meeting-preview-time">
                    {formatTime(meeting.startDate)} - {formatTime(meeting.endDate)}
                  </div>
                  <div className="meeting-preview-participants">
                    {meeting.participants.length} participant
                    {meeting.participants.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}

export default MeetingScheduler
