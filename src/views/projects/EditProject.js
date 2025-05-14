import React, { useState, useEffect } from 'react'

// Fonction utilitaire pour décoder les tokens JWT de manière sécurisée
const decodeJWT = (token) => {
  try {
    // Vérifier si le token est au format JWT (xxx.yyy.zzz)
    if (!token || !token.includes('.') || token.split('.').length !== 3) {
      return null
    }

    // Décoder la partie payload (deuxième partie)
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}
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
  CFormLabel,
  CListGroup,
  CListGroupItem,
  CFormCheck,
} from '@coreui/react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

const EditProject = () => {
  const [project, setProject] = useState({
    projectName: '',
    description: '',
    status: 'Active',
    startDate: '',
    endDate: '',
    members: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const navigate = useNavigate()
  const { id } = useParams()

  // Fetch project data
  useEffect(() => {
    fetchProject()
  }, [id])

  // Fetch client users for member selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)
        const token = localStorage.getItem('token')
        if (!token) {
          toast.error('No authentication token found')
          return
        }

        const response = await axios.get('http://localhost:3001/api/auth/users', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.data.success) {
          // Filter only client users
          const clientUsers = response.data.users.filter((user) => user.role === 'Client')
          setUsers(clientUsers)
        } else {
          toast.error('Failed to fetch users')
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error(error.response?.data?.error || 'Error fetching users')
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

  // We're allowing all users to access the edit page, but only the owner can save changes
  // The server will enforce this restriction

  const fetchProject = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        setLoading(false)
        return
      }

      // Vérifier si le token est valide (non expiré)
      const payload = decodeJWT(token)
      if (!payload) {
        console.error('Failed to decode token')
        setError('Invalid authentication token. Please log in again.')
        setLoading(false)
        return
      }

      // Vérifier si le token est expiré
      const expirationTime = payload.exp * 1000 // Convert to milliseconds
      if (Date.now() >= expirationTime) {
        console.error('Token has expired')
        setError('Your session has expired. Please log in again.')
        setLoading(false)
        return
      }

      console.log('Token is valid and not expired, user ID:', payload.id)

      console.log(`Fetching project with ID: ${id}`)

      // Utiliser l'URL complète avec le préfixe http://localhost:3001
      const response = await axios.get(`http://localhost:3001/api/projects/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Vérifier si la réponse est du HTML (indiquant une redirection)
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.error('Received HTML response instead of JSON. This indicates a redirection or authentication issue.')
        console.log('Response data (HTML):', response.data.substring(0, 200) + '...')
        throw new Error('Received HTML response instead of JSON. Please check your authentication.')
      }

      console.log('Project API response:', response.data)

      if (response.data.success && response.data.project) {
        const projectData = response.data.project
        console.log('Project data received:', projectData)

        // Vérifier que les champs requis sont présents
        if (!projectData.projectName) {
          console.warn('Le champ projectName est manquant dans les données du projet')
          projectData.projectName = ''
        }

        if (!projectData.description) {
          console.warn('Le champ description est manquant dans les données du projet')
          projectData.description = ''
        }

        if (!projectData.status) {
          console.warn('Le champ status est manquant dans les données du projet')
          projectData.status = 'Active'
        }

        // Extract member IDs from the project data
        let memberIds = []
        if (projectData.members && projectData.members.length > 0) {
          memberIds = projectData.members.map((member) =>
            typeof member === 'object' ? member._id : member,
          )
          console.log('Extracted member IDs:', memberIds)
        } else {
          console.warn('Aucun membre trouvé dans les données du projet')
        }

        // Formater les dates et gérer les erreurs potentielles
        let formattedStartDate = ''
        let formattedEndDate = ''

        try {
          if (projectData.startDate) {
            formattedStartDate = new Date(projectData.startDate).toISOString().split('T')[0]
            console.log('Formatted start date:', formattedStartDate)
          }
        } catch (dateError) {
          console.error('Error formatting start date:', dateError)
          console.log('Original start date value:', projectData.startDate)
        }

        try {
          if (projectData.endDate) {
            formattedEndDate = new Date(projectData.endDate).toISOString().split('T')[0]
            console.log('Formatted end date:', formattedEndDate)
          }
        } catch (dateError) {
          console.error('Error formatting end date:', dateError)
          console.log('Original end date value:', projectData.endDate)
        }

        // Update the project state with formatted dates
        setProject({
          ...projectData,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          members: memberIds,
        })

        // Update selected members
        setSelectedMembers(memberIds)
      } else {
        console.error('Failed to load project data. Response:', response.data)
        setError('Failed to load project data. Please check the console for details.')
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du projet:', error)

      // Afficher des informations détaillées sur l'erreur
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        // qui n'est pas dans la plage 2xx
        console.error('Détails de l\'erreur:', error.response.data)
        console.error('Status:', error.response.status)
        console.error('Headers:', error.response.headers)
        setError(`Erreur ${error.response.status}: ${error.response?.data?.error || 'Erreur lors de la récupération du projet.'}`)
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('Pas de réponse du serveur:', error.request)
        setError('Aucune réponse du serveur. Vérifiez votre connexion internet.')
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error('Erreur de configuration:', error.message)
        setError(`Erreur: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setProject({
      ...project,
      [e.target.name]: e.target.value,
    })
  }

  // Handle member selection
  const handleMemberToggle = (userId) => {
    setSelectedMembers((prevSelected) => {
      if (prevSelected.includes(userId)) {
        return prevSelected.filter((id) => id !== userId)
      } else {
        return [...prevSelected, userId]
      }
    })
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

      // Validate that at least 5 members are selected
      if (selectedMembers.length < 5) {
        toast.error('Vous devez sélectionner au moins 5 membres pour le projet')
        setLoading(false)
        return
      }

      // Create a copy of the project with the selected members
      const projectData = {
        ...project,
        members: selectedMembers,
      }

      const response = await axios.put(`http://localhost:3001/api/projects/${id}`, projectData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        toast.success('Projet modifié avec succès !')
        navigate('/projects')
      } else {
        setError(response.data.error || 'Erreur lors de la modification du projet.')
        toast.error(response.data.error || 'Erreur lors de la modification du projet.')
      }
    } catch (error) {
      console.error('Erreur lors de la modification du projet:', error)
      // Handle permission errors specifically
      if (error.response?.status === 403) {
        toast.error(
          "Vous n'êtes pas autorisé à modifier ce projet. Seul le propriétaire peut le modifier.",
        )
      } else {
        toast.error(error.response?.data?.error || 'Erreur lors de la modification du projet.')
      }
      setError(error.response?.data?.error || 'Erreur lors de la modification du projet.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>
  }

  return (
    <CRow>
      <CCol>
        <CCard>
          <CCardHeader>
            <strong>Modifier le projet</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <CRow className="mb-3">
                <CCol>
                  <CFormInput
                    label="Nom du projet"
                    name="projectName"
                    value={project.projectName}
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
                    value={project.description}
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
                    value={project.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </CFormSelect>
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol>
                  <CFormInput
                    type="date"
                    label="Date de début"
                    name="startDate"
                    value={project.startDate}
                    onChange={handleChange}
                  />
                </CCol>
                <CCol>
                  <CFormInput
                    type="date"
                    label="Date de fin"
                    name="endDate"
                    value={project.endDate}
                    onChange={handleChange}
                  />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol>
                  <CFormLabel>Membres du projet (sélectionnez au moins 5 membres)</CFormLabel>
                  <div
                    className="border rounded p-3"
                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                  >
                    {loadingUsers ? (
                      <div className="text-center">Chargement des utilisateurs...</div>
                    ) : users.length === 0 ? (
                      <div className="text-center">Aucun utilisateur disponible</div>
                    ) : (
                      <CListGroup>
                        {users.map((user) => (
                          <CListGroupItem
                            key={user._id}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <CFormCheck
                              id={`member-${user._id}`}
                              label={`${user.name} (${user.email})`}
                              checked={selectedMembers.includes(user._id)}
                              onChange={() => handleMemberToggle(user._id)}
                            />
                          </CListGroupItem>
                        ))}
                      </CListGroup>
                    )}
                  </div>
                  <div className="text-muted mt-1">
                    {selectedMembers.length} membre(s) sélectionné(s){' '}
                    {selectedMembers.length < 5 && '(minimum 5 requis)'}
                  </div>
                </CCol>
              </CRow>
              <CRow>
                <CCol>
                  <CButton type="submit" color="primary" disabled={loading}>
                    {loading ? 'Sauvegarde...' : 'Modifier'}
                  </CButton>
                  <CButton
                    type="button"
                    color="secondary"
                    className="ms-2"
                    onClick={() => navigate('/projects')}
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

export default EditProject
