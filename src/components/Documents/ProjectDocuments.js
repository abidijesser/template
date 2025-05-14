import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CBadge,
  CTooltip,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload,
  cilPencil,
  cilTrash,
  cilOptions,
  cilShareBoxed,
  cilStar,
  cilFile,
  cilNotes,
  cilImage,
  cilMovie,
  cilSpreadsheet,
  cilMagnifyingGlass,
} from '@coreui/icons'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const ProjectDocuments = ({ projectId }) => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDocuments()
  }, [projectId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/documents?projectId=${projectId}`)
      if (response.data.success && response.data.data) {
        setDocuments(response.data.data)
      } else {
        console.error('Format de réponse inattendu:', response.data)
        toast.error('Erreur lors de la récupération des documents')
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la récupération des documents')
    } finally {
      setLoading(false)
    }
  }

  // Function to handle document download
  const handleDownload = (doc) => {
    try {
      // Create a link to download the file
      const link = document.createElement('a')
      link.href = `http://localhost:3001/${doc.filePath}`
      link.setAttribute('download', doc.name)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error)
      toast.error('Erreur lors du téléchargement du document')
    }
  }

  // Function to handle document deletion
  const handleDelete = async (docId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return
    }

    try {
      const response = await axios.delete(`/api/documents/${docId}`)
      if (response.data.success) {
        // Remove the document from the state
        setDocuments(documents.filter((doc) => doc._id !== docId))
        toast.success('Document supprimé avec succès')
      } else {
        toast.error('Erreur lors de la suppression du document')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression du document')
    }
  }

  // Function to toggle pin status
  const handleTogglePin = async (docId, currentPinned) => {
    try {
      const response = await axios.put(`/api/documents/${docId}/pin`)
      if (response.data.success) {
        // Update the document in the state
        setDocuments(
          documents.map((doc) => (doc._id === docId ? { ...doc, pinned: !currentPinned } : doc)),
        )
        toast.success(currentPinned ? 'Document désépinglé' : 'Document épinglé')
      } else {
        toast.error("Erreur lors de la modification du statut d'épinglage")
      }
    } catch (error) {
      console.error("Erreur lors de la modification du statut d'épinglage:", error)
      toast.error(
        error.response?.data?.error || "Erreur lors de la modification du statut d'épinglage",
      )
    }
  }

  // Function to get icon based on file type
  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return cilFile
      case 'xls':
      case 'xlsx':
        return cilSpreadsheet
      case 'doc':
      case 'docx':
      case 'ppt':
      case 'pptx':
        return cilNotes
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return cilImage
      case 'mp4':
      case 'avi':
      case 'mov':
        return cilMovie
      default:
        return cilFile
    }
  }

  // Format file size in human-readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Determine permission level based on document data
  const getPermissionLevel = (doc) => {
    // If user is the uploader, they have edit permissions
    if (doc.uploadedBy?._id === localStorage.getItem('userId')) {
      return 'edit'
    }

    // Check explicit permissions
    if (doc.permissions && doc.permissions.length > 0) {
      const userPermission = doc.permissions.find((p) => p.user === localStorage.getItem('userId'))
      if (userPermission) {
        return userPermission.access === 'admin' ? 'edit' : userPermission.access
      }
    }

    // If document is public, default to view permission
    if (doc.isPublic) {
      return 'view'
    }

    return 'view' // Default permission
  }

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h5>Documents du projet</h5>
        <CButton color="primary" onClick={() => navigate('/resources')}>
          Gérer les documents
        </CButton>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center my-3">
            <CSpinner color="primary" />
            <p className="mt-2">Chargement des documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center my-3">
            <p>Aucun document associé à ce projet.</p>
            <CButton color="primary" onClick={() => navigate('/resources')}>
              Ajouter des documents
            </CButton>
          </div>
        ) : (
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Nom</CTableHeaderCell>
                <CTableHeaderCell>Type</CTableHeaderCell>
                <CTableHeaderCell>Taille</CTableHeaderCell>
                <CTableHeaderCell>Ajouté par</CTableHeaderCell>
                <CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {documents.map((doc) => {
                const permissionLevel = getPermissionLevel(doc)
                // Utiliser uniqueId ou displayId s'ils existent, sinon utiliser _id
                const documentId = doc.uniqueId || doc.displayId || doc._id
                return (
                  <CTableRow key={documentId}>
                    <CTableDataCell className="d-flex align-items-center">
                      <div className="document-icon me-2">
                        <CIcon icon={getFileIcon(doc.fileType)} size="lg" />
                      </div>
                      <div>
                        {doc.name}
                        {doc.displayId && (
                          <small className="ms-2 text-muted">({doc.displayId})</small>
                        )}
                        {doc.pinned && (
                          <CTooltip content="Document épinglé">
                            <CIcon
                              icon={cilStar}
                              className="ms-2 text-warning"
                              style={{ width: '14px', height: '14px' }}
                            />
                          </CTooltip>
                        )}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color="info">{doc.fileType.toUpperCase()}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{formatFileSize(doc.fileSize)}</CTableDataCell>
                    <CTableDataCell>{doc.uploadedBy?.name || 'Utilisateur inconnu'}</CTableDataCell>
                    <CTableDataCell>
                      {new Date(doc.uploadedDate).toLocaleDateString()}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CDropdown alignment="end">
                        <CDropdownToggle color="transparent" caret={false}>
                          <CIcon icon={cilOptions} />
                        </CDropdownToggle>
                        <CDropdownMenu>
                          <CDropdownItem onClick={() => navigate(`/resources?document=${doc._id}`)}>
                            <CIcon icon={cilMagnifyingGlass} className="me-2" />
                            Aperçu
                          </CDropdownItem>
                          <CDropdownItem onClick={() => handleDownload(doc)}>
                            <CIcon icon={cilCloudDownload} className="me-2" />
                            Télécharger
                          </CDropdownItem>
                          <CDropdownItem>
                            <CIcon icon={cilShareBoxed} className="me-2" />
                            Partager
                          </CDropdownItem>
                          {permissionLevel === 'edit' && (
                            <>
                              <CDropdownItem>
                                <CIcon icon={cilPencil} className="me-2" />
                                Modifier
                              </CDropdownItem>
                              <CDropdownItem onClick={() => handleDelete(doc._id)}>
                                <CIcon icon={cilTrash} className="me-2" />
                                Supprimer
                              </CDropdownItem>
                            </>
                          )}
                          <CDropdownItem onClick={() => handleTogglePin(doc._id, doc.pinned)}>
                            <CIcon
                              icon={cilStar}
                              className={`me-2 ${doc.pinned ? 'text-warning' : ''}`}
                            />
                            {doc.pinned ? 'Désépingler' : 'Épingler'}
                          </CDropdownItem>
                        </CDropdownMenu>
                      </CDropdown>
                    </CTableDataCell>
                  </CTableRow>
                )
              })}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  )
}

export default ProjectDocuments
