import React, { useState, useEffect } from 'react'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CFormCheck,
  CProgress,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudUpload, cilX } from '@coreui/icons'

const DocumentUpload = ({ visible, onClose, onUploadSuccess }) => {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects')
        if (response.data.success && response.data.projects) {
          setProjects(response.data.projects.map(project => ({
            id: project._id,
            name: project.projectName
          })))
        } else {
          console.error('Format de réponse inattendu:', response.data)
          toast.error('Erreur lors de la récupération des projets')
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des projets:', error)
        toast.error(error.response?.data?.error || 'Erreur lors de la récupération des projets')
      }
    }

    fetchProjects()
  }, [])

  // Reset form when modal is opened
  useEffect(() => {
    if (visible) {
      resetForm()
    }
  }, [visible])

  const resetForm = () => {
    setSelectedProject('')
    setSelectedFiles([])
    setDescription('')
    setIsPublic(false)
    setUploadProgress(0)
    setIsUploading(false)
    setError(null)
    setSuccess(false)
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles((prevFiles) => [...prevFiles, ...files])
  }

  const removeFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (selectedFiles.length === 0) {
      setError('Veuillez sélectionner au moins un fichier.')
      return
    }

    setIsUploading(true)
    setError(null)

    // Upload each file sequentially
    try {
      for (const file of selectedFiles) {
        // Create form data
        const formData = new FormData()
        formData.append('document', file)
        formData.append('name', file.name)
        formData.append('description', description)
        if (selectedProject) {
          formData.append('project', selectedProject)
        }
        formData.append('isPublic', isPublic.toString())

        // Track upload progress
        let progress = 0
        const uploadInterval = setInterval(() => {
          progress += 5
          if (progress > 95) {
            clearInterval(uploadInterval)
          }
          setUploadProgress(progress)
        }, 100)

        // Upload file
        const response = await axios.post('/api/documents', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        clearInterval(uploadInterval)
        setUploadProgress(100)

        if (!response.data.success) {
          throw new Error(response.data.error || 'Erreur lors du téléchargement du document')
        }
      }

      setIsUploading(false)
      setSuccess(true)

      // Notify parent component of successful upload
      setTimeout(() => {
        if (onUploadSuccess) {
          onUploadSuccess({
            files: selectedFiles,
            project: selectedProject,
            description,
            isPublic,
          })
        }
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error)
      setIsUploading(false)
      setError(error.response?.data?.error || error.message || 'Erreur lors du téléchargement du document')
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
      <CModalHeader onClose={onClose}>
        <CModalTitle>Ajouter un document</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error && <CAlert color="danger">{error}</CAlert>}
        {success && <CAlert color="success">Documents téléchargés avec succès!</CAlert>}

        <CForm onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="fileUpload" className="form-label">Sélectionner des fichiers</label>
            <CFormInput
              type="file"
              id="fileUpload"
              multiple
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="selected-files mb-3">
              <p className="mb-2">Fichiers sélectionnés:</p>
              <ul className="list-group">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-bold">{file.name}</span>
                      <span className="ms-2 text-muted">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <CButton
                      color="danger"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <CIcon icon={cilX} />
                    </CButton>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="projectSelect" className="form-label">Projet associé</label>
            <CFormSelect
              id="projectSelect"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={isUploading}
            >
              <option value="">Sélectionner un projet (optionnel)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </CFormSelect>
          </div>

          <div className="mb-3">
            <label htmlFor="description" className="form-label">Description</label>
            <CFormTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ajouter une description pour ces documents..."
              rows={3}
              disabled={isUploading}
            />
          </div>

          <div className="mb-3">
            <CFormCheck
              id="isPublic"
              label="Rendre ces documents accessibles à tous les membres du projet"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={isUploading}
            />
          </div>

          {isUploading && (
            <div className="mb-3">
              <label className="form-label">Progression du téléchargement</label>
              <CProgress value={uploadProgress} className="mb-2" />
              <small className="text-muted">{uploadProgress}% complété</small>
            </div>
          )}
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose} disabled={isUploading}>
          Annuler
        </CButton>
        <CButton color="primary" onClick={handleSubmit} disabled={isUploading || selectedFiles.length === 0}>
          <CIcon icon={cilCloudUpload} className="me-2" />
          {isUploading ? 'Téléchargement en cours...' : 'Télécharger'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default DocumentUpload
