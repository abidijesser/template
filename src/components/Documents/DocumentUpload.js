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
import { cilCloudUpload, cilFile } from '@coreui/icons'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import './DocumentUpload.css'

const DocumentUpload = ({ visible, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [project, setProject] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  // Fetch projects when modal is opened
  useEffect(() => {
    if (visible) {
      fetchProjects()
    }
  }, [visible])

  // Reset form when modal is closed
  useEffect(() => {
    if (!visible) {
      resetForm()
    }
  }, [visible])

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
    setFile(null)
    setName('')
    setDescription('')
    setProject('')
    setIsPublic(false)
    setError(null)
  }

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (!name) {
        setName(selectedFile.name)
      }
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      setError('Veuillez sélectionner un fichier')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('document', file)
      formData.append('name', name || file.name)
      formData.append('description', description)
      if (project) {
        formData.append('project', project)
      }
      formData.append('isPublic', isPublic)

      const response = await axios.post('/api/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        toast.success('Document téléchargé avec succès')
        resetForm()
        onClose()
        if (onUploadSuccess) {
          onUploadSuccess(response.data.data)
        }
      } else {
        setError('Erreur lors du téléchargement du document')
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error)
      setError(error.response?.data?.error || 'Erreur lors du téléchargement du document')
    } finally {
      setUploading(false)
    }
  }

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      if (!name) {
        setName(droppedFile.name)
      }
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
      <CModalHeader onClose={onClose}>
        <CModalTitle>Ajouter un document</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          {error && <CAlert color="danger">{error}</CAlert>}

          <div
            className={`file-upload-area mb-3 ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="file-upload-content">
              {file ? (
                <div className="file-preview">
                  <CIcon icon={cilFile} size="xl" />
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{(file.size / 1024).toFixed(2)} KB</div>
                  <CButton
                    color="danger"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    Supprimer
                  </CButton>
                </div>
              ) : (
                <>
                  <CIcon icon={cilCloudUpload} size="xl" />
                  <p>Glissez et déposez un fichier ici ou cliquez pour parcourir</p>
                  <CButton color="primary" variant="outline" size="sm">
                    Parcourir
                  </CButton>
                </>
              )}
              <CFormInput
                type="file"
                id="file"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="name">Nom du document</CFormLabel>
            <CFormInput
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du document"
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
        <CButton color="secondary" onClick={onClose} disabled={uploading}>
          Annuler
        </CButton>
        <CButton color="primary" onClick={handleSubmit} disabled={uploading || !file}>
          {uploading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Téléchargement...
            </>
          ) : (
            'Télécharger'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default DocumentUpload
