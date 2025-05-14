import React, { useState, useEffect } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CFormSelect,
  CFormCheck,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil } from '@coreui/icons'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import './DocumentUpload.css' // Réutiliser les styles du composant DocumentUpload

const DocumentEdit = ({ document, visible, onClose, onEditSuccess }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [project, setProject] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Initialiser les champs du formulaire avec les données du document
  useEffect(() => {
    if (document && visible) {
      setName(document.name || '')
      setDescription(document.description || '')
      setProject(document.project || '')
      setIsPublic(document.isPublic || false)
      fetchProjects()
    }
  }, [document, visible])

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/projects')
      if (response.data.success && response.data.projects) {
        setProjects(response.data.projects)
      } else {
        console.error('Format de réponse inattendu:', response.data)
        setError('Erreur lors de la récupération des projets')
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des projets:', error)
      setError(error.response?.data?.error || 'Erreur lors de la récupération des projets')
    } finally {
      setLoading(false)
    }
  }

  // Reset form fields
  const resetForm = () => {
    setName('')
    setDescription('')
    setProject('')
    setIsPublic(false)
    setError(null)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name) {
      setError('Le nom du document est requis')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const documentData = {
        name,
        description,
        project: project || null,
        isPublic,
      }

      const response = await axios.put(`/api/documents/${document.id}`, documentData)

      if (response.data.success) {
        toast.success('Document modifié avec succès')
        resetForm()
        onClose()
        if (onEditSuccess) {
          onEditSuccess(response.data.data)
        }
      } else {
        setError('Erreur lors de la modification du document')
      }
    } catch (error) {
      console.error('Erreur lors de la modification du document:', error)
      setError(error.response?.data?.error || 'Erreur lors de la modification du document')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
      <CModalHeader onClose={onClose}>
        <CModalTitle>Modifier le document</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          {error && <CAlert color="danger">{error}</CAlert>}

          <div className="mb-3">
            <CFormLabel htmlFor="name">Nom du document</CFormLabel>
            <CFormInput
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du document"
              required
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="description">Description</CFormLabel>
            <CFormTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du document"
              rows={3}
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="project">Projet associé</CFormLabel>
            <CFormSelect
              id="project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              disabled={loading}
            >
              <option value="">Aucun projet</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.projectName}
                </option>
              ))}
            </CFormSelect>
          </div>

          <div className="mb-3">
            <CFormCheck
              id="isPublic"
              label="Document public (visible par tous les utilisateurs)"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose} disabled={saving}>
          Annuler
        </CButton>
        <CButton color="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default DocumentEdit
