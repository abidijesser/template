import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CTable,
  CTableBody,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CBadge,
  CSpinner,
  CFormInput,
  CAlert,
  CPagination,
  CPaginationItem,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilX, cilCalendar, cilOptions, cilPencil, cilTrash, cilBell } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import { getUserTasks } from '../../services/taskService'
import {
  syncTaskWithGoogleCalendar,
  checkGoogleCalendarAuth,
  getGoogleCalendarAuthUrl,
} from '../../services/calendarService'
import '../../styles/ActionDropdown.css'

const TaskList = () => {
  const [tasks, setTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [syncingCalendar, setSyncingCalendar] = useState(false)
  const [syncingTaskId, setSyncingTaskId] = useState(null)
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false) // New state for checkbox
  const navigate = useNavigate()

  useEffect(() => {
    fetchTasks()
  }, [])

  // Filter tasks based on search query and "my tasks only" checkbox
  useEffect(() => {
    const userId = localStorage.getItem('userId')
    let filtered = tasks

    // Apply "my tasks only" filter if checkbox is checked
    if (showMyTasksOnly && userId) {
      filtered = tasks.filter(
        (task) => task.assignedTo && task.assignedTo._id === userId,
      )
    }

    // Apply search query filter
    if (!searchQuery.trim()) {
      setFilteredTasks(filtered)
    } else {
      const lowercasedQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          (task.title && task.title.toLowerCase().includes(lowercasedQuery)) ||
          (task.project &&
            task.project.projectName &&
            task.project.projectName.toLowerCase().includes(lowercasedQuery)) ||
          (task.assignedTo &&
            task.assignedTo.name &&
            task.assignedTo.name.toLowerCase().includes(lowercasedQuery)) ||
          (task.status && task.status.toLowerCase().includes(lowercasedQuery)) ||
          (task.priority && task.priority.toLowerCase().includes(lowercasedQuery)),
      )
      setFilteredTasks(filtered)
    }
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [searchQuery, tasks, showMyTasksOnly])

  // Get current tasks for pagination
  const indexOfLastTask = currentPage * itemsPerPage
  const indexOfFirstTask = indexOfLastTask - itemsPerPage
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask)

  // Change page
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        setLoading(false)
        return
      }

      console.log('TaskList - Fetching tasks using taskService...')
      const tasksData = await getUserTasks()
      console.log('TaskList - Tasks fetched successfully:', tasksData.length)
      setTasks(tasksData)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setError('Erreur lors de la récupération des tâches')
      toast.error('Erreur lors de la récupération des tâches')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        return
      }

      const userRole = localStorage.getItem('userRole')
      const userId = localStorage.getItem('userId')
      console.log('TaskList - User role:', userRole)
      console.log('TaskList - User ID:', userId)

      const taskResponse = await axios.get(`/api/tasks/${id}`)
      const task = taskResponse.data.task
      const isAdmin = userRole === 'Admin'
      const isProjectOwner = task.project && task.project.owner && task.project.owner._id === userId

      console.log('TaskList - Is admin:', isAdmin)
      console.log('TaskList - Is project owner:', isProjectOwner)

      if (!isAdmin && !isProjectOwner) {
        toast.error(
          'Seuls les administrateurs ou le propriétaire du projet peuvent supprimer cette tâche',
        )
        return
      }

      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
        await axios.delete(`/api/tasks/${id}`)
        toast.success('Tâche supprimée avec succès !')
        fetchTasks()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression de la tâche')
    }
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      'To Do': 'warning',
      'In Progress': 'info',
      Done: 'success',
    }
    return <CBadge color={statusColors[status] || 'secondary'}>{status}</CBadge>
  }

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      Low: 'success',
      Medium: 'warning',
      High: 'danger',
    }
    return <CBadge color={priorityColors[priority] || 'secondary'}>{priority}</CBadge>
  }

  const handleSyncWithGoogleCalendar = async (taskId) => {
    try {
      setSyncingCalendar(true)
      setSyncingTaskId(taskId)

      const authCheckResult = await checkGoogleCalendarAuth()

      if (!authCheckResult.isAuthenticated) {
        const authUrlResult = await getGoogleCalendarAuthUrl()
        if (authUrlResult.success && authUrlResult.authUrl) {
          localStorage.setItem('calendarRedirectUrl', window.location.href)
          window.location.href = authUrlResult.authUrl
          return
        } else {
          throw new Error('Failed to get Google Calendar authentication URL')
        }
      }

      const result = await syncTaskWithGoogleCalendar(taskId)

      if (result.success) {
        toast.success('Tâche synchronisée avec Google Calendar avec succès!')
      } else {
        throw new Error(result.error || 'Failed to sync task with Google Calendar')
      }
    } catch (error) {
      console.error('Error syncing task with Google Calendar:', error)
      toast.error(error.message || 'Erreur lors de la synchronisation avec Google Calendar')
    } finally {
      setSyncingCalendar(false)
      setSyncingTaskId(null)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>
  }

  return (
    <CCard>
      <CCardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5>Liste des tâches</h5>
            <CFormCheck
              id="showMyTasksOnly"
              label="Afficher uniquement mes tâches"
              checked={showMyTasksOnly}
              onChange={(e) => setShowMyTasksOnly(e.target.checked)}
              className="mt-2"
            />
          </div>
          <div className="d-flex align-items-center">
            <div className="position-relative me-2" style={{ width: '300px' }}>
              <CFormInput
                placeholder="Rechercher des tâches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-5"
              />
              {searchQuery && (
                <CButton
                  color="link"
                  className="position-absolute"
                  style={{ right: '5px', top: '3px' }}
                  onClick={() => setSearchQuery('')}
                >
                  <CIcon icon={cilX} size="sm" />
                </CButton>
              )}
            </div>
            <CButton color="primary" onClick={() => navigate('/tasks/new')}>
              Nouvelle tâche
            </CButton>
          </div>
        </div>
        <div className="mt-2">
          <CAlert color="info" className="p-2 mb-0 small">
            Seuls les administrateurs ou le propriétaire du projet peuvent supprimer des tâches
          </CAlert>
        </div>
      </CCardHeader>
      <CCardBody>
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Titre</CTableHeaderCell>
              <CTableHeaderCell>Projet</CTableHeaderCell>
              <CTableHeaderCell>Assigné à</CTableHeaderCell>
              <CTableHeaderCell>Statut</CTableHeaderCell>
              <CTableHeaderCell>Priorité</CTableHeaderCell>
              <CTableHeaderCell>Date d'échéance</CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {filteredTasks.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan="7" className="text-center">
                  {searchQuery
                    ? 'Aucune tâche ne correspond à votre recherche'
                    : showMyTasksOnly
                    ? 'Vous n\'avez aucune tâche assignée'
                    : 'Aucune tâche trouvée'}
                </CTableDataCell>
              </CTableRow>
            ) : (
              currentTasks.map((task) => (
                <CTableRow key={task._id}>
                  <CTableDataCell>{task.title}</CTableDataCell>
                  <CTableDataCell>{task.project?.projectName || 'Non assigné'}</CTableDataCell>
                  <CTableDataCell>{task.assignedTo?.name || 'Non assigné'}</CTableDataCell>
                  <CTableDataCell>{getStatusBadge(task.status)}</CTableDataCell>
                  <CTableDataCell>{getPriorityBadge(task.priority)}</CTableDataCell>
                  <CTableDataCell>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Non définie'}
                  </CTableDataCell>
                  <CTableDataCell>
                    <CDropdown alignment="end" className="action-dropdown">
                      <CDropdownToggle color="light" size="sm" caret={false}>
                        <CIcon icon={cilOptions} size="lg" />
                      </CDropdownToggle>
                      <CDropdownMenu className="action-dropdown-menu">
                        <CDropdownItem onClick={() => navigate(`/tasks/${task._id}`)}>
                          <CIcon icon={cilPencil} className="me-2 text-info" />
                          Détails
                        </CDropdownItem>
                        <CDropdownItem
                          onClick={() => navigate(`/tasks/edit/${task._id}`)}
                          disabled={
                            !(
                              task.project &&
                              task.project.owner &&
                              task.project.owner._id === localStorage.getItem('userId')
                            )
                          }
                          title={
                            task.project &&
                            task.project.owner &&
                            task.project.owner._id === localStorage.getItem('userId')
                              ? 'Modifier la tâche'
                              : 'Seul le propriétaire du projet peut modifier la tâche'
                          }
                        >
                          <CIcon icon={cilPencil} className="me-2 text-primary" />
                          Modifier
                        </CDropdownItem>
                        <CDropdownItem
                          onClick={() => handleDelete(task._id)}
                          disabled={
                            !(
                              localStorage.getItem('userRole') === 'Admin' ||
                              (task.project &&
                                task.project.owner &&
                                task.project.owner._id === localStorage.getItem('userId'))
                            )
                          }
                          title={
                            localStorage.getItem('userRole') === 'Admin' ||
                            (task.project &&
                              task.project.owner &&
                              task.project.owner._id === localStorage.getItem('userId'))
                              ? 'Supprimer la tâche'
                              : 'Seuls les administrateurs ou le propriétaire du projet peuvent supprimer cette tâche'
                          }
                        >
                          <CIcon icon={cilTrash} className="me-2 text-danger" />
                          Supprimer
                        </CDropdownItem>
                        <CDropdownItem
                          onClick={() => navigate(`/tasks/status/${task._id}`)}
                          disabled={
                            !(
                              task.assignedTo &&
                              task.assignedTo._id === localStorage.getItem('userId')
                            )
                          }
                          title={
                            task.assignedTo &&
                            task.assignedTo._id === localStorage.getItem('userId')
                              ? 'Modifier le statut de la tâche'
                              : "Seul l'utilisateur assigné peut modifier le statut"
                          }
                        >
                          <CIcon icon={cilBell} className="me-2 text-warning" />
                          Modifier statut
                        </CDropdownItem>
                        <CDropdownItem
                          onClick={() => handleSyncWithGoogleCalendar(task._id)}
                          disabled={
                            (syncingCalendar && syncingTaskId === task._id) ||
                            !task.dueDate ||
                            !(
                              (task.project &&
                                task.project.owner &&
                                task.project.owner._id === localStorage.getItem('userId')) ||
                              (task.assignedTo &&
                                task.assignedTo._id === localStorage.getItem('userId'))
                            )
                          }
                          title={
                            !task.dueDate
                              ? "Cette tâche n'a pas de date d'échéance"
                              : !(
                                    (task.project &&
                                      task.project.owner &&
                                      task.project.owner._id === localStorage.getItem('userId')) ||
                                    (task.assignedTo &&
                                      task.assignedTo._id === localStorage.getItem('userId'))
                                  )
                                ? "Seul le propriétaire du projet ou l'utilisateur assigné peut ajouter cette tâche à Google Calendar"
                                : 'Ajouter cette tâche à Google Calendar'
                          }
                        >
                          {syncingCalendar && syncingTaskId === task._id ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              Synchronisation...
                            </>
                          ) : (
                            <>
                              <CIcon icon={cilCalendar} className="me-2 text-primary" />
                              Ajouter à Google Calendar
                            </>
                          )}
                        </CDropdownItem>
                      </CDropdownMenu>
                    </CDropdown>
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>

        {/* Pagination */}
        {filteredTasks.length > itemsPerPage && (
          <CPagination className="mt-4 justify-content-center" aria-label="Pagination des tâches">
            <CPaginationItem
              aria-label="Précédent"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <span aria-hidden="true">«</span>
            </CPaginationItem>
            {[...Array(Math.ceil(filteredTasks.length / itemsPerPage)).keys()].map((number) => (
              <CPaginationItem
                key={number + 1}
                active={currentPage === number + 1}
                onClick={() => handlePageChange(number + 1)}
              >
                {number + 1}
              </CPaginationItem>
            ))}
            <CPaginationItem
              aria-label="Suivant"
              disabled={currentPage === Math.ceil(filteredTasks.length / itemsPerPage)}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <span aria-hidden="true">»</span>
            </CPaginationItem>
          </CPagination>
        )}
      </CCardBody>
    </CCard>
  )
}

export default TaskList