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
  CButton,
} from '@coreui/react'
import axios from '../../utils/axios' // Assurez-vous que le chemin est correct
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

const ProjectForm = () => {
  const [project, setProject] = useState({
    name: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  useEffect(() => {
    const fetchProject = async () => {
      if (isEditMode) {
        setLoading(true)
        setError('')
        try {
          // Correction: Récupération des données du projet
          const response = await axios.get(`/api/projects/${id}`)
          if (response.data.success && response.data.project) {
            // Correction: Assurez-vous que les champs correspondent à votre modèle Project
            setProject({
              name: response.data.project.name || '',
              description: response.data.project.description || '',
            })
          } else {
            toast.error('Projet non trouvé ou erreur serveur.')
            setError('Projet non trouvé.')
          }
        } catch (err) {
          console.error('Error fetching project:', err)
          const errorMessage =
            err.response?.data?.error || 'Erreur lors de la récupération du projet.'
          toast.error(errorMessage)
          setError(errorMessage)
        } finally {
          setLoading(false)
        }
      } else {
        // Réinitialiser si ce n'est pas en mode édition
        setProject({ name: '', description: '' })
      }
    }

    fetchProject()
  }, [id, isEditMode]) // Dépendances correctes pour useEffect

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        setLoading(false)
        return
      }

      if (isEditMode) {
        await axios.put(`http://localhost:3001/api/projects/${id}`, project, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        toast.success('Projet mis à jour avec succès')
      } else {
        await axios.post('http://localhost:3001/api/projects', project, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        toast.success('Projet créé avec succès')
      }
      navigate('/projects')
    } catch (err) {
      console.error('Error saving project:', err)
      const errorMessage = err.response?.data?.error || 'Erreur lors de la sauvegarde du projet.'
      toast.error(errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setProject((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (loading && isEditMode) {
    return <div className="text-center">Chargement des données du projet...</div>
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>
  }

  return (
    <CRow>
      <CCol>
        <CCard>
          <CCardHeader>
            <strong>{isEditMode ? 'Modifier le projet' : 'Nouveau projet'}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <div className="mb-3">
                <CFormInput
                  label="Nom du projet"
                  name="name"
                  value={project.name}
                  onChange={handleChange}
                  required
                  placeholder="Entrez le nom du projet"
                />
              </div>
              <div className="mb-3">
                <CFormTextarea
                  label="Description"
                  name="description"
                  value={project.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Entrez la description du projet"
                />
              </div>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <CButton type="submit" color="primary" disabled={loading}>
                  {loading ? 'Sauvegarde...' : isEditMode ? 'Mettre à jour' : 'Créer'}
                </CButton>
                <CButton
                  type="button"
                  color="secondary"
                  onClick={() => navigate('/projects')}
                  className="ms-2"
                  disabled={loading}
                >
                  Annuler
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ProjectForm
