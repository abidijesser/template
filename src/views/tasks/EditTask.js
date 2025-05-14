import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormSelect,
  CButton,
} from '@coreui/react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

const EditTask = () => {
  const [task, setTask] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '',
    assignedTo: '',
    project: '',
  })
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    fetchTask()
    fetchProjectsAndUsers()
  }, [id])

  const fetchTask = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('No authentication token found')
        return
      }

      const response = await axios.get(`http://localhost:3001/api/tasks/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.data && response.data.success && response.data.task) {
        const taskData = response.data.task
        setTask({
          ...taskData,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
          assignedTo: taskData.assignedTo?._id || '',
          project: taskData.project?._id || '',
        })
      } else {
        throw new Error('Task data not found or invalid response format')
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la tâche:', error)
      toast.error('Erreur lors de la récupération de la tâche.')
    }
  }

  const fetchProjectsAndUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('No authentication token found')
        return
      }

      const headers = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }

      const [projectsRes, usersRes] = await Promise.all([
        axios.get('http://localhost:3001/api/projects', headers),
        axios.get('http://localhost:3001/api/auth/users', headers),
      ])
      setProjects(projectsRes.data.projects || [])
      setUsers(usersRes.data.users || [])
    } catch (error) {
      console.error('Erreur lors de la récupération des projets ou utilisateurs:', error)
      toast.error('Erreur lors de la récupération des projets ou utilisateurs.')
    }
  }

  const handleChange = (e) => {
    setTask({
      ...task,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('No authentication token found')
        return
      }

      await axios.put(`http://localhost:3001/api/tasks/${id}`, task, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      toast.success('Tâche modifiée avec succès !')
      navigate('/tasks')
    } catch (error) {
      console.error('Erreur lors de la modification de la tâche:', error)
      toast.error('Erreur lors de la modification de la tâche.')
    }
  }

  return (
    <CRow>
      <CCol>
        <CCard>
          <CCardHeader>
            <strong>Modifier la tâche</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <CRow className="mb-3">
                <CCol>
                  <CFormInput
                    label="Titre"
                    name="title"
                    value={task.title}
                    onChange={handleChange}
                    required
                  />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol>
                  <CFormTextarea
                    label="Description"
                    name="description"
                    value={task.description}
                    onChange={handleChange}
                    required
                  />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol>
                  <CFormSelect
                    label="Statut"
                    name="status"
                    value={task.status}
                    onChange={handleChange}
                  >
                    <option value="To Do">À faire</option>
                    <option value="In Progress">En cours</option>
                    <option value="Done">Terminé</option>
                  </CFormSelect>
                </CCol>
                <CCol>
                  <CFormSelect
                    label="Priorité"
                    name="priority"
                    value={task.priority}
                    onChange={handleChange}
                  >
                    <option value="Low">Basse</option>
                    <option value="Medium">Moyenne</option>
                    <option value="High">Haute</option>
                  </CFormSelect>
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol>
                  <CFormInput
                    type="date"
                    label="Date d'échéance"
                    name="dueDate"
                    value={task.dueDate}
                    onChange={handleChange}
                  />
                </CCol>
                <CCol>
                  <CFormSelect
                    label="Assigné à"
                    name="assignedTo"
                    value={task.assignedTo}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner un utilisateur</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol>
                  <CFormSelect
                    label="Projet"
                    name="project"
                    value={task.project}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner un projet</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.projectName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>
              <CRow>
                <CCol>
                  <CButton type="submit" color="primary">
                    Modifier
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
      </CCol>
    </CRow>
  )
}

export default EditTask
