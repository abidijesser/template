import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CBadge,
  CSpinner,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CAlert,
} from '@coreui/react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import CommentList from '../../components/Comments/CommentList'
import ActivityLogList from '../../components/ActivityLog/ActivityLogList'
import socketService from '../../services/socketService'

const TaskDetail = () => {
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(1)
  const { id } = useParams()
  const navigate = useNavigate()

  // Connect to socket when component mounts
  useEffect(() => {
    // Connect to socket
    socketService.connect()

    // Join the task room for real-time updates
    socketService.joinRoom('task', id)

    // Clean up when component unmounts
    return () => {
      socketService.leaveRoom('task', id)
    }
  }, [id])

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        if (!token) {
          setError('No authentication token found')
          setLoading(false)
          return
        }

        const response = await axios.get(`http://localhost:3001/api/tasks/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.data.success) {
          setTask(response.data.task)
        } else {
          throw new Error('Failed to fetch task')
        }
      } catch (error) {
        console.error('Error fetching task:', error)
        setError(error.response?.data?.error || 'Erreur lors de la récupération de la tâche')
        toast.error(error.response?.data?.error || 'Erreur lors de la récupération de la tâche')
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [id])

  const handleDelete = async () => {
    try {
      // Vérifier le rôle de l'utilisateur
      const userRole = localStorage.getItem('userRole')
      const userId = localStorage.getItem('userId')
      console.log('TaskDetail - User role:', userRole)
      console.log('TaskDetail - User ID:', userId)

      const isAdmin = userRole === 'Admin'
      const isProjectOwner = task.project && task.project.owner && task.project.owner._id === userId

      console.log('TaskDetail - Is admin:', isAdmin)
      console.log('TaskDetail - Is project owner:', isProjectOwner)

      // Seuls les administrateurs ou les propriétaires du projet peuvent supprimer des tâches
      if (!isAdmin && !isProjectOwner) {
        toast.error(
          'Seuls les administrateurs ou le propriétaire du projet peuvent supprimer cette tâche',
        )
        return
      }

      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
        await axios.delete(`http://localhost:3001/api/tasks/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        toast.success('Tâche supprimée avec succès')
        navigate('/tasks')
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

  if (!task) {
    return <div className="alert alert-warning">Tâche non trouvée</div>
  }

  return (
    <CRow>
      <CCol>
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <h5>Détails de la tâche</h5>
              <div>
                {/* Buttons for project owners */}
                <CButton
                  color="primary"
                  className="me-2"
                  onClick={() => navigate(`/tasks/edit/${id}`)}
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
                  Modifier
                </CButton>
                <CButton
                  color="danger"
                  className="me-2"
                  onClick={handleDelete}
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
                  Supprimer
                </CButton>

                {/* Status modification button for assigned users */}
                {task.assignedTo && task.assignedTo._id === localStorage.getItem('userId') ? (
                  <CButton
                    color="warning"
                    className="me-2"
                    onClick={() => navigate(`/tasks/status/${id}`)}
                  >
                    Modifier statut
                  </CButton>
                ) : (
                  <CButton
                    color="warning"
                    className="me-2"
                    disabled
                    title="Seul l'utilisateur assigné peut modifier le statut"
                  >
                    Modifier statut
                  </CButton>
                )}
                <CButton color="secondary" onClick={() => navigate('/tasks')}>
                  Retour
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
            <div className="mb-4">
              <h4>{task.title}</h4>
              <div className="d-flex gap-3 mb-3">
                <div>
                  <strong>Statut:</strong> {getStatusBadge(task.status)}
                </div>
                <div>
                  <strong>Priorité:</strong> {getPriorityBadge(task.priority)}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h5>Description</h5>
              <p>{task.description}</p>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <h5>Informations</h5>
                <table className="table">
                  <tbody>
                    <tr>
                      <th>Projet:</th>
                      <td>{task.project?.projectName || 'Non assigné'}</td>
                    </tr>
                    <tr>
                      <th>Assigné à:</th>
                      <td>{task.assignedTo?.name || 'Non assigné'}</td>
                    </tr>
                    <tr>
                      <th>Date d'échéance:</th>
                      <td>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Non définie'}
                      </td>
                    </tr>
                    <tr>
                      <th>Date de création:</th>
                      <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <th>Dernière modification:</th>
                      <td>{new Date(task.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CCardBody>
        </CCard>

        {/* Tabs for Comments and Activity Log */}
        <CCard>
          <CCardHeader>
            <CNav variant="tabs" role="tablist">
              <CNavItem>
                <CNavLink active={activeTab === 1} onClick={() => setActiveTab(1)} role="button">
                  Commentaires
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink active={activeTab === 2} onClick={() => setActiveTab(2)} role="button">
                  Historique d'activité
                </CNavLink>
              </CNavItem>
            </CNav>
          </CCardHeader>
          <CCardBody>
            <CTabContent>
              <CTabPane role="tabpanel" visible={activeTab === 1}>
                <CommentList entityType="task" entityId={id} />
              </CTabPane>
              <CTabPane role="tabpanel" visible={activeTab === 2}>
                <ActivityLogList entityType="task" entityId={id} />
              </CTabPane>
            </CTabContent>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default TaskDetail
