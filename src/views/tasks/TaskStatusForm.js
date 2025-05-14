import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormSelect,
  CButton,
  CSpinner,
} from '@coreui/react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

const TaskStatusForm = () => {
  const [task, setTask] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '',
    assignedTo: '',
    project: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    fetchTask()
  }, [id])

  const fetchTask = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        setLoading(false)
        return
      }

      // Récupérer la tâche
      const taskRes = await axios.get(`http://localhost:3001/api/tasks/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (taskRes.data.success) {
        const taskData = taskRes.data.task

        // Vérifier si l'utilisateur connecté est assigné à cette tâche
        const userId = localStorage.getItem('userId')
        const isAdmin = localStorage.getItem('userRole') === 'Admin'
        const isAssigned = taskData.assignedTo && taskData.assignedTo._id === userId

        if (!isAdmin && !isAssigned) {
          setError(
            "Vous n'êtes pas autorisé à modifier le statut de cette tâche. Seul l'utilisateur assigné peut modifier le statut.",
          )
          setLoading(false)
          return
        }

        setTask({
          ...taskData,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
          assignedTo: taskData.assignedTo?._id || '',
          project: taskData.project?._id || '',
        })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        setLoading(false)
        return
      }

      console.log('TaskStatusForm - Submitting status update')
      console.log('TaskStatusForm - Task ID:', id)
      console.log('TaskStatusForm - Status value:', task.status)

      // Préparer les données à envoyer (version simplifiée)
      const requestData = { status: task.status }
      console.log('TaskStatusForm - Request data:', requestData)

      // URL de l'API
      const apiUrl = `http://localhost:3001/api/tasks/${id}/status`
      console.log('TaskStatusForm - API URL:', apiUrl)

      // Configuration de la requête
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
      console.log('TaskStatusForm - Request config:', config)

      // Utiliser la méthode POST qui fonctionne d'après les tests
      const response = await axios.post(apiUrl, requestData, config)

      if (response.data.success) {
        toast.success('Statut de la tâche mis à jour avec succès')
        navigate('/tasks')
      } else {
        throw new Error(response.data.error || 'Failed to update task status')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      console.error('Error details:', error.response?.data)
      console.error('Error status:', error.response?.status)
      console.error('Error headers:', error.response?.headers)

      // Message d'erreur détaillé
      const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour du statut'
      console.error('Error message:', errorMessage)

      setError(errorMessage)
      toast.error(errorMessage)
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

  return (
    <CCard>
      <CCardHeader>
        <h4>Modifier le statut de la tâche</h4>
      </CCardHeader>
      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          <CRow>
            <CCol md={12}>
              <h5 className="mb-3">{task.title}</h5>
              <p className="text-muted mb-4">{task.description}</p>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <div className="mb-3">
                <strong>Priorité:</strong> {task.priority}
              </div>
              <div className="mb-3">
                <strong>Date d'échéance:</strong>{' '}
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Non définie'}
              </div>
            </CCol>
            <CCol md={6}>
              <div className="mb-3">
                <strong>Projet:</strong> {task.project?.projectName || 'Non assigné'}
              </div>
              <div className="mb-3">
                <strong>Assigné à:</strong> {task.assignedTo?.name || 'Non assigné'}
              </div>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <label className="form-label">Statut</label>
              <CFormSelect
                value={task.status}
                onChange={(e) => {
                  console.log('TaskStatusForm - Status changed to:', e.target.value)
                  setTask({ ...task, status: e.target.value })
                }}
                required
              >
                <option value="To Do">À faire</option>
                <option value="In Progress">En cours</option>
                <option value="Done">Terminé</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="mt-4">
            <CCol>
              <CButton type="submit" color="primary">
                Mettre à jour le statut
              </CButton>
              <CButton
                type="button"
                color="secondary"
                className="ms-2"
                onClick={() => navigate('/tasks')}
              >
                Annuler
              </CButton>
            </CCol>
          </CRow>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default TaskStatusForm
