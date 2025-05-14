import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CCard, CCardHeader, CCardBody, CSpinner, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar } from '@coreui/icons'
import { fetchUpcomingEvents } from '../../services/upcomingEventsService'
import './UpcomingEvents.css'

const UpcomingEvents = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const getUpcomingEvents = async () => {
      try {
        setLoading(true)
        const eventsData = await fetchUpcomingEvents()
        setEvents(eventsData)
      } catch (err) {
        console.error('Error fetching upcoming events:', err)
        setError('Impossible de charger les événements à venir')
      } finally {
        setLoading(false)
      }
    }

    getUpcomingEvents()

    // Refresh events every 5 minutes
    const intervalId = setInterval(getUpcomingEvents, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  // Format date for display
  const formatDate = (date) => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    }

    // Check if date is tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Demain, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    }

    // Otherwise, return full date
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Handle event click
  const handleEventClick = (event) => {
    if (event.type === 'Réunion') {
      navigate(`/meeting-room/${event.id}`)
    } else if (event.type === 'Échéance') {
      navigate(`/tasks/${event.id}`)
    }
  }

  // Get border color based on priority
  const getBorderColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'danger'
      case 'medium':
        return 'warning'
      default:
        return 'info'
    }
  }

  return (
    <CCard className="dashboard-card h-100">
      <CCardHeader className="dashboard-card-header">
        <h4 className="mb-0">
          <CIcon icon={cilCalendar} className="me-2" />
          Événements à venir
        </h4>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="d-flex justify-content-center my-5">
            <CSpinner color="primary" />
          </div>
        ) : error ? (
          <CAlert color="danger">{error}</CAlert>
        ) : events.length === 0 ? (
          <div className="text-center p-4">
            <p className="text-muted">Aucun événement à venir</p>
          </div>
        ) : (
          <div className="upcoming-events">
            {events.map((event) => (
              <div
                key={`${event.type}-${event.id}`}
                className={`event-item p-3 mb-3 border-start border-4 border-${getBorderColor(event.priority)} rounded`}
                onClick={() => handleEventClick(event)}
              >
                <div className="d-flex justify-content-between">
                  <h5 className="mb-1">{event.title}</h5>
                  <span className="badge bg-light text-dark">{event.type}</span>
                </div>
                <p className="text-muted mb-0">{formatDate(event.date)}</p>
              </div>
            ))}
          </div>
        )}
      </CCardBody>
    </CCard>
  )
}

export default UpcomingEvents
