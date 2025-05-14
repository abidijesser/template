import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CAlert,
  CButton,
  CButtonGroup,
  CBadge,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilTask, cilNotes, cilOptions } from '@coreui/icons'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { fetchUserProjects } from '../../services/projectService'
import { getCalendarTasks } from '../../services/taskService'
import './CalendarPage.css'

const CalendarPage = () => {
  const navigate = useNavigate()
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState('month')
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
        console.log('CalendarPage - Fetching data...')
        const [projectsData, tasksData] = await Promise.all([
          fetchUserProjects(),
          getCalendarTasks(),
        ])

        console.log('CalendarPage - Projects fetched:', projectsData.length)
        console.log('CalendarPage - Tasks fetched:', tasksData.length)

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

        const taskEvents = tasksData
          .map((task) => {
            // Check if task has a valid dueDate
            if (!task.dueDate) {
              console.log('CalendarPage - Task without dueDate:', task.title, task._id)
              return null
            }

            return {
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
            }
          })
          .filter(Boolean) // Remove null entries

        console.log('CalendarPage - Task events created:', taskEvents.length)
        console.log('CalendarPage - Project events created:', projectEvents.length)

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

  // Handle view change
  const handleViewChange = (newView) => {
    setView(newView)
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
        <div className="text-center p-4">
          <p className="text-muted">Aucun événement pour cette date</p>
        </div>
      )
    }

    return (
      <div className="selected-date-events">
        <h5 className="mb-3">
          Événements du{' '}
          {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </h5>

        {eventsForSelectedDate.map((event) => (
          <div
            key={event.id}
            className="event-card mb-3 p-3 border rounded"
            onClick={() =>
              navigate(event.type === 'project' ? `/projects/${event.id}` : `/tasks/${event.id}`)
            }
          >
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-1">{event.title}</h6>
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
              >
                {event.type === 'project' ? 'Projet' : 'Tâche'}
              </CBadge>
            </div>

            {event.type === 'project' && (
              <div className="small text-muted">
                Du {new Date(event.startDate).toLocaleDateString('fr-FR')} au{' '}
                {new Date(event.endDate).toLocaleDateString('fr-FR')}
              </div>
            )}

            {event.type === 'task' && (
              <div className="small text-muted">
                Échéance: {new Date(event.date).toLocaleDateString('fr-FR')}
                {event.data.project && ` | Projet: ${event.data.project.projectName}`}
              </div>
            )}

            <div className="mt-2">
              <span className="text-primary small">Voir les détails</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">
          <CIcon icon={cilCalendar} className="me-2" />
          Calendrier
        </h4>
        <CButtonGroup>
          <CButton
            color={view === 'month' ? 'primary' : 'outline-primary'}
            onClick={() => handleViewChange('month')}
          >
            Mois
          </CButton>
          <CButton
            color={view === 'year' ? 'primary' : 'outline-primary'}
            onClick={() => handleViewChange('year')}
          >
            Année
          </CButton>
        </CButtonGroup>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="d-flex justify-content-center my-5">
            <CSpinner color="primary" />
          </div>
        ) : error ? (
          <CAlert color="danger">{error}</CAlert>
        ) : (
          <CRow>
            <CCol md={8}>
              <div className="calendar-container">
                <Calendar
                  onChange={handleDateChange}
                  value={date}
                  view={view}
                  onViewChange={({ view }) => setView(view)}
                  tileContent={tileContent}
                  className="custom-calendar"
                  locale="fr-FR"
                />
              </div>
            </CCol>
            <CCol md={4}>
              <CCard>
                <CCardHeader>
                  <h5 className="mb-0">Détails</h5>
                </CCardHeader>
                <CCardBody>{renderSelectedDateEvents()}</CCardBody>
              </CCard>
            </CCol>
          </CRow>
        )}
      </CCardBody>
    </CCard>
  )
}

export default CalendarPage
