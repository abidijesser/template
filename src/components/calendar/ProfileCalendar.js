import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CCard, CCardBody, CCardHeader, CSpinner, CAlert, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar } from '@coreui/icons'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { fetchUserProjects } from '../../services/projectService'
import { getAssignedTasks } from '../../services/taskService'
import './CalendarStyles.css'

const ProfileCalendar = () => {
  const navigate = useNavigate()
  const [date, setDate] = useState(new Date())
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [events, setEvents] = useState([])

  // Fetch projects and tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch only projects where user is a member and tasks assigned to the user
        const [projectsData, tasksData] = await Promise.all([
          fetchUserProjects(),
          getAssignedTasks(),
        ])

        setProjects(projectsData)
        setTasks(tasksData)

        // Combine projects and tasks into events
        const projectEvents = projectsData.map((project) => ({
          id: project._id,
          title: project.projectName,
          startDate: new Date(project.startDate),
          endDate: new Date(project.endDate),
          type: 'project',
          color: '#4f5d73', // Dark blue
          data: project,
        }))

        const taskEvents = tasksData.map((task) => ({
          id: task._id,
          title: task.title,
          date: new Date(task.dueDate),
          type: 'task',
          color:
            task.priority === 'High'
              ? '#e55353'
              : task.priority === 'Medium'
                ? '#f9b115'
                : '#2eb85c',
          data: task,
        }))

        setEvents([...projectEvents, ...taskEvents])
      } catch (err) {
        console.error('Error fetching calendar data:', err)
        setError('Impossible de charger les données du calendrier')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle date change
  const handleDateChange = (newDate) => {
    setDate(newDate)
  }

  // Get events for a specific date
  const getEventsForDate = (date) => {
    if (!date) return []

    const dateString = date.toDateString()

    return events.filter((event) => {
      if (event.type === 'task') {
        return event.date && event.date.toDateString() === dateString
      } else if (event.type === 'project') {
        const startDate = event.startDate
        const endDate = event.endDate
        return date >= startDate && date <= endDate
      }
      return false
    })
  }

  // Custom tile content to show events
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null

    const eventsForDate = getEventsForDate(date)
    if (eventsForDate.length === 0) return null

    return (
      <div className="calendar-events">
        {eventsForDate.map((event, index) => (
          <div
            key={`${event.id}-${index}`}
            className={`calendar-event calendar-event-${event.type}`}
            style={{ backgroundColor: event.color }}
            title={event.title}
            onClick={(e) => {
              e.stopPropagation()
              navigate(event.type === 'project' ? `/projects/${event.id}` : `/tasks/${event.id}`)
            }}
          >
            {event.title.length > 10 ? `${event.title.substring(0, 10)}...` : event.title}
          </div>
        ))}
      </div>
    )
  }

  // Render selected date events
  const renderSelectedDateEvents = () => {
    const eventsForSelectedDate = getEventsForDate(date)

    if (eventsForSelectedDate.length === 0) {
      return (
        <div className="text-center p-2">
          <p className="text-muted small">Aucun événement pour cette date</p>
        </div>
      )
    }

    return (
      <div className="selected-date-events">
        <div className="mb-2 small fw-bold">
          Événements du{' '}
          {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        {eventsForSelectedDate.map((event) => (
          <div
            key={event.id}
            className="event-card mb-2 p-2 border rounded"
            onClick={() =>
              navigate(event.type === 'project' ? `/projects/${event.id}` : `/tasks/${event.id}`)
            }
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="small fw-bold">{event.title}</div>
              <CBadge
                color={
                  event.type === 'project'
                    ? 'primary'
                    : event.data.priority === 'High'
                      ? 'danger'
                      : event.data.priority === 'Medium'
                        ? 'warning'
                        : 'success'
                }
                size="sm"
              >
                {event.type === 'project' ? 'Projet' : 'Tâche'}
              </CBadge>
            </div>

            <div className="small text-muted">
              {event.type === 'project'
                ? `Du ${new Date(event.startDate).toLocaleDateString('fr-FR')} au ${new Date(event.endDate).toLocaleDateString('fr-FR')}`
                : `Échéance: ${new Date(event.date).toLocaleDateString('fr-FR')}`}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="profile-dropdown-calendar">
      {loading ? (
        <div className="d-flex justify-content-center my-2">
          <CSpinner color="primary" size="sm" />
        </div>
      ) : error ? (
        <CAlert color="danger" size="sm">
          {error}
        </CAlert>
      ) : (
        <div className="profile-calendar-container">
          <Calendar
            onChange={handleDateChange}
            value={date}
            tileContent={tileContent}
            className="profile-calendar"
            locale="fr-FR"
            minDetail="month"
            navigationLabel={({ date }) =>
              date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
            }
          />
          <div className="mt-2">{renderSelectedDateEvents()}</div>
        </div>
      )}
    </div>
  )
}

export default ProfileCalendar
