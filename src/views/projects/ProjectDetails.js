import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CSpinner,
} from '@coreui/react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import CommentList from '../../components/Comments/CommentList'
import ActivityLogList from '../../components/ActivityLog/ActivityLogList'
import ProjectDocuments from '../../components/Documents/ProjectDocuments'
import socketService from '../../services/socketService'

const ProjectDetails = () => {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(1)
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '')
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProject()
  }, [id])

  // Connect to socket when component mounts
  useEffect(() => {
    // Connect to socket
    socketService.connect()

    // Join the project room for real-time updates
    socketService.joinRoom('project', id)

    // Clean up when component unmounts
    return () => {
      socketService.leaveRoom('project', id)
    }
  }, [id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        setLoading(false)
        return
      }

      const response = await axios.get(`/api/projects/${id}`)

      if (response.data.success) {
        setProject(response.data.project)
      } else {
        throw new Error('Failed to fetch project')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setError(error.response?.data?.error || 'Erreur lors de la récupération du projet')
      toast.error(error.response?.data?.error || 'Erreur lors de la récupération du projet')
    } finally {
      setLoading(false)
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

  if (!project) {
    return <div className="alert alert-warning">Projet non trouvé</div>
  }

  // Fonction pour vérifier si l'utilisateur peut modifier le projet
  const canEditProject = () => {
    const userId = localStorage.getItem('userId')
    // L'utilisateur peut modifier s'il est admin ou propriétaire du projet
    return userRole === 'Admin' || (project.owner && project.owner._id === userId)
  }

  return (
    <CRow>
      <CCol>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Détails du projet</strong>
            <div>
              {/* Show edit button for all users but disable if not admin or owner */}
              <CButton
                color="warning"
                className="me-2"
                onClick={() => navigate(`/projects/edit/${id}`)}
                disabled={!canEditProject()}
              >
                Modifier
              </CButton>
              <CButton color="secondary" onClick={() => navigate('/projects')}>
                Retour
              </CButton>
            </div>
          </CCardHeader>
          <CCardBody>
            {!canEditProject() && (
              <div className="alert alert-info mb-3">
                <strong>Note:</strong> Seuls les administrateurs ou le propriétaire du projet
                peuvent modifier ce projet.
              </div>
            )}
            <h2>{project.projectName}</h2>
            <p>{project.description}</p>
            <p>
              <strong>Propriétaire:</strong>{' '}
              {project.owner ? project.owner.name || project.owner.email : 'Non défini'}
            </p>
            <p>
              <strong>Statut:</strong> {project.status}
            </p>
            <p>
              <strong>Date de début:</strong> {new Date(project.startDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Date de fin:</strong> {new Date(project.endDate).toLocaleDateString()}
            </p>

            <div className="mb-4">
              <strong>Tâches:</strong>
              <ul>
                {project.tasks && project.tasks.length > 0 ? (
                  project.tasks.map((task) => <li key={task._id}>{task.title}</li>)
                ) : (
                  <li>Aucune tâche pour ce projet</li>
                )}
              </ul>
            </div>

            <div className="mb-4">
              <strong>Membres:</strong>
              <ul>
                {project.members && project.members.length > 0 ? (
                  project.members.map((member) => <li key={member._id}>{member.name}</li>)
                ) : (
                  <li>Aucun membre pour ce projet</li>
                )}
              </ul>
            </div>
          </CCardBody>
        </CCard>

        {/* Project Documents */}
        <ProjectDocuments projectId={id} />

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
                <CommentList entityType="project" entityId={id} />
              </CTabPane>
              <CTabPane role="tabpanel" visible={activeTab === 2}>
                <ActivityLogList entityType="project" entityId={id} />
              </CTabPane>
            </CTabContent>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ProjectDetails
