import React, { useState, useEffect } from 'react'
import DocumentUpload from '../../components/Documents/DocumentUpload'
import DocumentComments from '../../components/Documents/DocumentComments'
import DocumentVersions from '../../components/Documents/DocumentVersions'
import DocumentPreview from '../../components/Documents/DocumentPreview'
import DocumentShare from '../../components/Documents/DocumentShare'
import DocumentPermissions from '../../components/Documents/DocumentPermissions'
import DocumentEdit from '../../components/Documents/DocumentEdit'
import './Resources.css'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import socketService from '../../services/socketService'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CFormSelect,
  CInputGroup,
  CFormInput,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CSpinner,
  CBadge,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilFilter,
  cilPlus,
  cilCloudUpload,
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
  cilLink,
  cilCloudDownload,
  cilMagnifyingGlass,
  cilUser,
  cilLockLocked,
  cilLockUnlocked,
  cilCode,
} from '@coreui/icons'

const Resources = () => {
  // State for projects (for the project selector)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [activeTab, setActiveTab] = useState(1)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)

  // Fetch projects and documents from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects')
        if (response.data.success && response.data.projects) {
          setProjects(
            response.data.projects.map((project) => ({
              id: project._id,
              name: project.projectName,
            })),
          )
        } else {
          console.error('Format de réponse inattendu:', response.data)
          toast.error('Erreur lors de la récupération des projets')
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des projets:', error)
        toast.error(error.response?.data?.error || 'Erreur lors de la récupération des projets')
      }
    }

    const fetchDocuments = async () => {
      try {
        const response = await axios.get('/api/documents')
        if (response.data.success && response.data.data) {
          setDocuments(
            response.data.data.map((doc) => ({
              id: doc._id,
              name: doc.name,
              type: doc.fileType,
              size: formatFileSize(doc.fileSize),
              uploadedBy: doc.uploadedBy?.name || 'Utilisateur inconnu',
              uploadedDate: new Date(doc.uploadedDate).toISOString().split('T')[0],
              project: doc.project?._id || '',
              pinned: doc.pinned,
              permissions: getPermissionLevel(doc),
              filePath: doc.filePath,
              versions: doc.versions || [],
            })),
          )
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

    fetchProjects()
    fetchDocuments()
  }, [])

  // Set up socket.io listeners for real-time updates
  useEffect(() => {
    // Connect to socket
    socketService.connect()

    // Join room for document notifications
    const userId = localStorage.getItem('userId')
    if (userId) {
      socketService.joinRoom(`user-${userId}`)
    }

    // Listen for document notifications
    socketService.on('notification', (notification) => {
      if (notification.type.startsWith('document_')) {
        // Refresh documents when a document-related notification is received
        toast.info(notification.message)
        fetchDocuments()
      }
    })

    // Clean up on unmount
    return () => {
      socketService.off('notification')
      if (userId) {
        socketService.leaveRoom(`user-${userId}`)
      }
    }
  }, [])

  // Function to fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/documents')
      if (response.data.success && response.data.data) {
        setDocuments(
          response.data.data.map((doc) => ({
            id: doc._id,
            uniqueId: doc.uniqueId,
            displayId: doc.displayId,
            name: doc.name,
            type: doc.fileType,
            size: formatFileSize(doc.fileSize),
            uploadedBy: doc.uploadedBy?.name || 'Utilisateur inconnu',
            uploadedDate: new Date(doc.uploadedDate).toISOString().split('T')[0],
            project: doc.project?._id || '',
            pinned: doc.pinned,
            permissions: getPermissionLevel(doc),
            filePath: doc.filePath,
            versions: doc.versions || [],
            originalData: doc, // Conserver les données originales pour référence
          })),
        )
      } else {
        console.error('Format de réponse inattendu:', response.data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error)
    } finally {
      setLoading(false)
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

  // Function to get icon based on file type
  const getFileIcon = (type) => {
    // Normaliser le type en minuscules
    const fileType = type ? type.toLowerCase() : ''

    // Documents
    if (fileType === 'pdf') return cilFile
    if (['doc', 'docx', 'rtf', 'txt', 'odt'].includes(fileType)) return cilNotes

    // Feuilles de calcul
    if (['xls', 'xlsx', 'csv', 'ods'].includes(fileType)) return cilSpreadsheet

    // Présentations
    if (['ppt', 'pptx', 'odp'].includes(fileType)) return cilNotes

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileType)) return cilImage

    // Vidéos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(fileType)) return cilMovie

    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileType)) return cilLink

    // Audio
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(fileType)) return cilMovie

    // Code
    if (
      ['html', 'css', 'js', 'php', 'py', 'java', 'c', 'cpp', 'cs', 'json', 'xml'].includes(fileType)
    )
      return cilCode

    // Par défaut
    return cilFile
  }

  // Function to get badge color based on file type
  const getFileTypeBadgeColor = (type) => {
    // Normaliser le type en minuscules
    const fileType = type ? type.toLowerCase() : ''

    // Documents
    if (fileType === 'pdf') return 'danger'
    if (['doc', 'docx', 'rtf', 'txt', 'odt'].includes(fileType)) return 'primary'

    // Feuilles de calcul
    if (['xls', 'xlsx', 'csv', 'ods'].includes(fileType)) return 'success'

    // Présentations
    if (['ppt', 'pptx', 'odp'].includes(fileType)) return 'warning'

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileType)) return 'info'

    // Vidéos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(fileType)) return 'dark'

    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileType)) return 'secondary'

    // Audio
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(fileType)) return 'info'

    // Code
    if (
      ['html', 'css', 'js', 'php', 'py', 'java', 'c', 'cpp', 'cs', 'json', 'xml'].includes(fileType)
    )
      return 'primary'

    // Par défaut
    return 'secondary'
  }

  // Filter documents based on search term, selected project, and filter type
  const filteredDocuments = documents.filter((doc) => {
    // Recherche dans le nom et l'identifiant d'affichage
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.displayId && doc.displayId.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filtre par projet
    const matchesProject = selectedProject ? doc.project === selectedProject : true

    // Filtre par type de fichier (plus flexible)
    let matchesType = true
    if (filterType) {
      // Normaliser le type de fichier du document
      const docType = (doc.type || '').toLowerCase()

      // Vérifier si le type de fichier correspond au filtre
      matchesType = docType === filterType.toLowerCase()

      // Logs pour le débogage
      console.log(
        `Filtering document: ${doc.name}, type: ${docType}, filter: ${filterType}, matches: ${matchesType}`,
      )
    }

    return matchesSearch && matchesProject && matchesType
  })

  // Function to handle document selection
  const handleDocumentSelect = (doc) => {
    setSelectedDocument(doc)
    setActiveTab(2) // Switch to document details tab
  }

  // Function to handle document upload
  const handleUploadSuccess = async () => {
    // Refresh the documents list after successful upload
    try {
      await fetchDocuments()
      toast.success('Document(s) téléchargé(s) avec succès')
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error)
      toast.error('Erreur lors de la mise à jour de la liste des documents')
    }
  }

  // Function to handle document download
  const handleDownload = async (doc) => {
    // Vérifier si le document existe
    if (!doc) {
      console.error('Erreur: Aucun document fourni pour le téléchargement')
      toast.error('Erreur: Impossible de télécharger le document')
      return
    }

    try {
      // Utiliser axios pour télécharger le fichier avec l'authentification
      // Priorité: 1. uniqueId, 2. displayId, 3. id MongoDB, 4. _id MongoDB
      const docId = doc.uniqueId || doc.displayId || doc.id || doc._id

      if (!docId) {
        console.error('Erreur: ID du document non trouvé', doc)
        toast.error('Erreur: ID du document non trouvé')
        return
      }

      console.log('=== DÉBUT DU TÉLÉCHARGEMENT ===')
      console.log('Téléchargement du document ID:', docId)
      console.log('Nom du document:', doc.name)
      console.log('Type du document:', doc.type)
      console.log('uniqueId:', doc.uniqueId)
      console.log('displayId:', doc.displayId)
      console.log('ID MongoDB:', doc.id || doc._id)
      console.log('Détails complets du document:', doc)

      // Afficher un toast pour indiquer que le téléchargement a commencé
      toast.info(`Téléchargement de "${doc.name}" en cours...`)

      // Construire l'URL de téléchargement
      const downloadUrl = `/api/documents/${docId}/download`
      console.log('URL de téléchargement:', downloadUrl)

      // Utiliser axios pour faire une requête avec le token d'authentification
      console.log('Envoi de la requête de téléchargement...')
      const response = await axios.get(downloadUrl, {
        responseType: 'blob', // Important pour recevoir des données binaires
        timeout: 60000, // Augmenter le timeout à 60 secondes
      })

      console.log('Réponse reçue:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
        dataSize: response.data?.size,
      })

      // Vérifier si la réponse contient des données
      if (!response.data || response.data.size === 0) {
        console.error('Erreur: Réponse vide ou invalide')
        toast.error(`Erreur: Le fichier "${doc.name}" est vide ou invalide`)
        return
      }

      // Créer un objet URL pour le blob
      console.log("Création du blob et de l'URL pour le téléchargement...")
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      })
      const url = window.URL.createObjectURL(blob)

      // Déterminer le nom de fichier à utiliser pour le téléchargement
      const fileName = doc.name || 'document_téléchargé'
      console.log('Nom du fichier pour le téléchargement:', fileName)

      // Créer un lien pour télécharger le fichier
      console.log('Création du lien de téléchargement...')
      const link = window.document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      link.style.display = 'none' // Cacher le lien
      window.document.body.appendChild(link)

      // Déclencher le téléchargement
      console.log('Déclenchement du téléchargement...')
      link.click()

      // Nettoyer
      console.log('Nettoyage des ressources...')
      setTimeout(() => {
        if (link.parentNode) {
          window.document.body.removeChild(link)
        }
        window.URL.revokeObjectURL(url)
        console.log('Nettoyage terminé')
      }, 1000) // Augmenter le délai à 1 seconde

      console.log('=== FIN DU TÉLÉCHARGEMENT ===')
      toast.success(`Téléchargement de "${doc.name}" réussi`)
    } catch (error) {
      console.error('=== ERREUR DE TÉLÉCHARGEMENT ===')
      console.error('Erreur lors du téléchargement du document:', error)

      // Afficher des informations détaillées sur l'erreur
      if (error.response) {
        console.error("Détails de l'erreur:", {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
        })
      } else if (error.request) {
        console.error('Aucune réponse reçue:', error.request)
      } else {
        console.error('Erreur de configuration de la requête:', error.message)
      }

      toast.error(
        `Erreur lors du téléchargement de "${doc.name}": ${error.response?.data?.error || error.message}`,
      )
    }
  }

  // Function to handle document deletion
  const handleDelete = async (docId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return
    }

    try {
      // Utiliser l'ID MongoDB pour la compatibilité avec l'API existante
      const mongoId = typeof docId === 'object' ? docId.id || docId._id : docId

      if (!mongoId) {
        console.error('Erreur: ID MongoDB non trouvé pour la suppression', docId)
        toast.error('Erreur: ID du document non trouvé')
        return
      }

      console.log('Suppression du document avec ID MongoDB:', mongoId)
      console.log('Document à supprimer:', docId)

      const response = await axios.delete(`/api/documents/${mongoId}`)

      if (response.data.success) {
        // Identifier le document à supprimer par son ID unique ou MongoDB
        setDocuments(
          documents.filter((doc) => {
            // Si docId est un objet (document complet)
            if (typeof docId === 'object') {
              const uniqueIdToRemove = docId.uniqueId || docId.displayId || docId.id || docId._id
              const docUniqueId = doc.uniqueId || doc.displayId || doc.id || doc._id
              return docUniqueId !== uniqueIdToRemove
            }
            // Si docId est une chaîne (juste l'ID)
            return (
              doc.id !== docId &&
              doc._id !== docId &&
              doc.uniqueId !== docId &&
              doc.displayId !== docId
            )
          }),
        )

        // If the deleted document was selected, clear the selection
        if (selectedDocument) {
          const selectedId =
            selectedDocument.uniqueId ||
            selectedDocument.displayId ||
            selectedDocument.id ||
            selectedDocument._id
          const deletedId =
            typeof docId === 'object'
              ? docId.uniqueId || docId.displayId || docId.id || docId._id
              : docId

          if (selectedId === deletedId) {
            setSelectedDocument(null)
            setActiveTab(1) // Switch back to list view
          }
        }

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
      // Utiliser l'ID MongoDB pour la compatibilité avec l'API existante
      const mongoId = typeof docId === 'object' ? docId.id || docId._id : docId

      if (!mongoId) {
        console.error("Erreur: ID MongoDB non trouvé pour l'épinglage", docId)
        toast.error('Erreur: ID du document non trouvé')
        return
      }

      console.log("Modification du statut d'épinglage pour le document avec ID MongoDB:", mongoId)
      console.log('Document à modifier:', docId)

      const response = await axios.put(`/api/documents/${mongoId}/pin`)

      if (response.data.success) {
        // Update the document in the state using unique identifiers
        setDocuments(
          documents.map((doc) => {
            // Si docId est un objet (document complet)
            if (typeof docId === 'object') {
              const uniqueIdToUpdate = docId.uniqueId || docId.displayId || docId.id || docId._id
              const docUniqueId = doc.uniqueId || doc.displayId || doc.id || doc._id
              return docUniqueId === uniqueIdToUpdate ? { ...doc, pinned: !currentPinned } : doc
            }
            // Si docId est une chaîne (juste l'ID)
            return doc.id === docId ||
              doc._id === docId ||
              doc.uniqueId === docId ||
              doc.displayId === docId
              ? { ...doc, pinned: !currentPinned }
              : doc
          }),
        )

        // If the document was selected, update the selection
        if (selectedDocument) {
          const selectedId =
            selectedDocument.uniqueId ||
            selectedDocument.displayId ||
            selectedDocument.id ||
            selectedDocument._id
          const updatedId =
            typeof docId === 'object'
              ? docId.uniqueId || docId.displayId || docId.id || docId._id
              : docId

          if (selectedId === updatedId) {
            setSelectedDocument({ ...selectedDocument, pinned: !currentPinned })
          }
        }

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

  return (
    <div className="resources-page">
      <CRow>
        <CCol>
          <h2 className="mb-4">Ressources & Documents</h2>
        </CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol md={4}>
          <div className="position-relative">
            <CFormSelect
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Sélectionner un projet"
              className={selectedProject ? 'filter-active' : ''}
            >
              <option value="">Tous les projets</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </CFormSelect>
            {selectedProject && (
              <button
                className="position-absolute end-0 top-0 btn btn-sm btn-link text-danger"
                style={{ padding: '0.375rem 0.75rem' }}
                onClick={() => setSelectedProject('')}
                title="Effacer la sélection"
              >
                ×
              </button>
            )}
          </div>
        </CCol>
        <CCol md={6}>
          <CInputGroup>
            <CFormInput
              placeholder="Rechercher un document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={searchTerm ? 'filter-active' : ''}
            />
            {searchTerm ? (
              <CButton
                type="button"
                color="danger"
                variant="outline"
                onClick={() => setSearchTerm('')}
                title="Effacer la recherche"
              >
                ×
              </CButton>
            ) : null}
            <CButton type="button" color={searchTerm ? 'success' : 'primary'} variant="outline">
              <CIcon icon={cilSearch} />
            </CButton>
            <CDropdown variant="btn-group">
              <CDropdownToggle
                color={filterType ? 'success' : 'primary'}
                variant="outline"
                title={filterType ? `Filtré par: ${filterType.toUpperCase()}` : 'Filtrer par type'}
              >
                <CIcon icon={cilFilter} />
                {filterType && (
                  <span className="ms-1 badge bg-success">{filterType.toUpperCase()}</span>
                )}
              </CDropdownToggle>
              <CDropdownMenu>
                {filterType && (
                  <CDropdownItem onClick={() => setFilterType('')} className="text-danger fw-bold">
                    <CIcon icon={cilFilter} className="me-2" />
                    Effacer le filtre
                  </CDropdownItem>
                )}
                <CDropdownItem
                  onClick={() => setFilterType('')}
                  className={!filterType ? 'fw-bold' : ''}
                >
                  Tous les types
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => setFilterType('pdf')}
                  className={filterType === 'pdf' ? 'fw-bold bg-light' : ''}
                >
                  PDF
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => setFilterType('doc')}
                  className={filterType === 'doc' ? 'fw-bold bg-light' : ''}
                >
                  Word (.doc)
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => setFilterType('docx')}
                  className={filterType === 'docx' ? 'fw-bold bg-light' : ''}
                >
                  Word (.docx)
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => setFilterType('xls')}
                  className={filterType === 'xls' ? 'fw-bold bg-light' : ''}
                >
                  Excel (.xls)
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => setFilterType('xlsx')}
                  className={filterType === 'xlsx' ? 'fw-bold bg-light' : ''}
                >
                  Excel (.xlsx)
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => setFilterType('ppt')}
                  className={filterType === 'ppt' ? 'fw-bold bg-light' : ''}
                >
                  PowerPoint (.ppt)
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => setFilterType('pptx')}
                  className={filterType === 'pptx' ? 'fw-bold bg-light' : ''}
                >
                  PowerPoint (.pptx)
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => setFilterType('jpg')}
                  className={filterType === 'jpg' ? 'fw-bold bg-light' : ''}
                >
                  Images JPG
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => setFilterType('png')}
                  className={filterType === 'png' ? 'fw-bold bg-light' : ''}
                >
                  Images PNG
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => setFilterType('mp4')}
                  className={filterType === 'mp4' ? 'fw-bold bg-light' : ''}
                >
                  Vidéos MP4
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => setFilterType('txt')}
                  className={filterType === 'txt' ? 'fw-bold bg-light' : ''}
                >
                  Texte
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </CInputGroup>
        </CCol>
        <CCol md={2} className="d-flex justify-content-end">
          <CButton color="primary" onClick={() => setUploadModalVisible(true)}>
            <CIcon icon={cilPlus} className="me-2" />
            Ajouter un document
          </CButton>
        </CCol>
      </CRow>

      <CCard className="mb-4">
        <CCardHeader>
          <CNav variant="tabs" role="tablist">
            <CNavItem>
              <CNavLink
                active={activeTab === 1}
                onClick={() => setActiveTab(1)}
                role="tab"
                aria-controls="documents-tab"
              >
                Documents
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 2}
                onClick={() => setActiveTab(2)}
                role="tab"
                aria-controls="preview-tab"
                disabled={!selectedDocument}
              >
                Aperçu du document
              </CNavLink>
            </CNavItem>
          </CNav>
        </CCardHeader>
        <CCardBody>
          <CTabContent>
            <CTabPane role="tabpanel" aria-labelledby="documents-tab" visible={activeTab === 1}>
              {loading ? (
                <div className="text-center my-5">
                  <CSpinner color="primary" />
                  <p className="mt-2">Chargement des documents...</p>
                </div>
              ) : (
                <>
                  {filteredDocuments.length === 0 ? (
                    <div className="text-center my-5">
                      <p>Aucun document trouvé.</p>
                      {(searchTerm || selectedProject || filterType) && (
                        <div>
                          <p className="text-muted">
                            Essayez de modifier vos critères de recherche :
                          </p>
                          <div className="d-flex justify-content-center gap-2">
                            {searchTerm && (
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchTerm('')}
                              >
                                Effacer la recherche
                              </CButton>
                            )}
                            {selectedProject && (
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProject('')}
                              >
                                Effacer le filtre de projet
                              </CButton>
                            )}
                            {filterType && (
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                onClick={() => setFilterType('')}
                              >
                                Effacer le filtre de type
                              </CButton>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="documents-list">
                      <div className="filter-count">
                        <div>
                          <span>
                            Affichage de <strong>{filteredDocuments.length}</strong> document
                            {filteredDocuments.length > 1 ? 's' : ''}
                            {documents.length !== filteredDocuments.length &&
                              ` sur ${documents.length}`}
                          </span>
                          {(searchTerm || selectedProject || filterType) && (
                            <span className="filter-badge bg-info">Filtré</span>
                          )}
                        </div>
                        {(searchTerm || selectedProject || filterType) && (
                          <CButton
                            color="link"
                            size="sm"
                            className="filter-clear-button"
                            onClick={() => {
                              setSearchTerm('')
                              setSelectedProject('')
                              setFilterType('')
                            }}
                          >
                            <CIcon icon={cilFilter} className="me-1" />
                            Effacer tous les filtres
                          </CButton>
                        )}
                      </div>
                      <CRow className="documents-header mb-2 p-2 bg-light">
                        <CCol xs={6}>Nom</CCol>
                        <CCol xs={2}>Taille</CCol>
                        <CCol xs={2}>Ajouté par</CCol>
                        <CCol xs={2}>Date</CCol>
                      </CRow>
                      {filteredDocuments.map((doc) => {
                        // Utiliser uniqueId ou displayId s'ils existent, sinon utiliser id ou _id
                        const documentId = doc.uniqueId || doc.displayId || doc.id || doc._id

                        return (
                          <CRow
                            key={documentId}
                            className="document-item p-2 mb-2 align-items-center"
                            onClick={() => handleDocumentSelect(doc)}
                          >
                            <CCol xs={6} className="d-flex align-items-center">
                              <div className="document-icon me-2">
                                <CIcon
                                  icon={getFileIcon(doc.type)}
                                  size="lg"
                                  className={`file-icon file-icon-${doc.type}`}
                                />
                              </div>
                              <div className="document-name">
                                <div className="d-flex align-items-center">
                                  {doc.name}
                                  {doc.displayId && (
                                    <small className="ms-2 text-muted">({doc.displayId})</small>
                                  )}
                                  {/* Afficher un badge pour les documents dupliqués */}
                                  {doc.name &&
                                    doc.name.includes(' (') &&
                                    doc.name.includes(')') && (
                                      <span className="ms-2 badge bg-info">Duplicata</span>
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
                                <div className="document-meta">
                                  <CBadge
                                    color={getFileTypeBadgeColor(doc.type)}
                                    shape="rounded-pill"
                                    size="sm"
                                    className="me-2"
                                  >
                                    {doc.type.toUpperCase()}
                                  </CBadge>
                                  {doc.isPublic && (
                                    <CBadge
                                      color="info"
                                      shape="rounded-pill"
                                      size="sm"
                                      className="me-2"
                                    >
                                      Public
                                    </CBadge>
                                  )}
                                  {doc.permissions === 'edit' ? (
                                    <CBadge color="success" shape="rounded-pill" size="sm">
                                      Éditable
                                    </CBadge>
                                  ) : (
                                    <CBadge color="secondary" shape="rounded-pill" size="sm">
                                      Lecture seule
                                    </CBadge>
                                  )}
                                </div>
                              </div>
                            </CCol>
                            <CCol xs={2}>{doc.size}</CCol>
                            <CCol xs={2}>{doc.uploadedBy}</CCol>
                            <CCol
                              xs={2}
                              className="d-flex justify-content-between align-items-center"
                            >
                              {new Date(doc.uploadedDate).toLocaleDateString()}
                              <CDropdown alignment="end">
                                <CDropdownToggle color="transparent" caret={false}>
                                  <CIcon icon={cilOptions} />
                                </CDropdownToggle>
                                <CDropdownMenu>
                                  <CDropdownItem onClick={() => handleDocumentSelect(doc)}>
                                    <CIcon icon={cilMagnifyingGlass} className="me-2" />
                                    Aperçu
                                  </CDropdownItem>
                                  <CDropdownItem
                                    onClick={(e) => {
                                      e.preventDefault() // Empêcher le comportement par défaut
                                      e.stopPropagation() // Empêcher la propagation de l'événement

                                      // Logs détaillés pour le débogage
                                      console.log(
                                        'Clic sur le bouton de téléchargement pour le document:',
                                        doc,
                                      )
                                      console.log('ID du document:', doc.id || doc._id)
                                      console.log('Nom du document:', doc.name)

                                      // Appeler la fonction de téléchargement avec un délai pour éviter les conflits d'événements
                                      setTimeout(() => {
                                        handleDownload(doc)
                                      }, 100)
                                    }}
                                  >
                                    <CIcon icon={cilCloudDownload} className="me-2" />
                                    Télécharger
                                  </CDropdownItem>
                                  <CDropdownItem
                                    onClick={() => {
                                      setSelectedDocument(doc)
                                      setShareModalVisible(true)
                                    }}
                                  >
                                    <CIcon icon={cilShareBoxed} className="me-2" />
                                    Partager
                                  </CDropdownItem>
                                  {doc.permissions === 'edit' && (
                                    <>
                                      <CDropdownItem
                                        onClick={() => {
                                          setSelectedDocument(doc)
                                          setPermissionsModalVisible(true)
                                        }}
                                      >
                                        <CIcon icon={cilLockLocked} className="me-2" />
                                        Permissions
                                      </CDropdownItem>
                                      <CDropdownItem
                                        onClick={() => {
                                          setSelectedDocument(doc)
                                          setEditModalVisible(true)
                                        }}
                                      >
                                        <CIcon icon={cilPencil} className="me-2" />
                                        Modifier
                                      </CDropdownItem>
                                      <CDropdownItem onClick={() => handleDelete(doc)}>
                                        <CIcon icon={cilTrash} className="me-2" />
                                        Supprimer
                                      </CDropdownItem>
                                    </>
                                  )}
                                  <CDropdownItem onClick={() => handleTogglePin(doc, doc.pinned)}>
                                    <CIcon
                                      icon={cilStar}
                                      className={`me-2 ${doc.pinned ? 'text-warning' : ''}`}
                                    />
                                    {doc.pinned ? 'Désépingler' : 'Épingler'}
                                  </CDropdownItem>
                                </CDropdownMenu>
                              </CDropdown>
                            </CCol>
                          </CRow>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </CTabPane>
            <CTabPane role="tabpanel" aria-labelledby="preview-tab" visible={activeTab === 2}>
              {selectedDocument && (
                <div className="document-details">
                  <CRow className="mb-4">
                    <CCol xs={12} className="d-flex justify-content-between align-items-center">
                      <h3 className="mb-0">
                        <CIcon icon={getFileIcon(selectedDocument.type)} className="me-2" />
                        {selectedDocument.name}
                        {selectedDocument.displayId && (
                          <small className="ms-2 text-muted" style={{ fontSize: '0.7em' }}>
                            ({selectedDocument.displayId})
                          </small>
                        )}
                        {/* Afficher un badge pour les documents dupliqués */}
                        {selectedDocument.name &&
                          selectedDocument.name.includes(' (') &&
                          selectedDocument.name.includes(')') && (
                            <span className="ms-2 badge bg-info">Duplicata</span>
                          )}
                      </h3>
                      <div>
                        <CButton
                          color="primary"
                          variant="outline"
                          className="me-2"
                          onClick={(e) => {
                            e.preventDefault() // Empêcher le comportement par défaut
                            e.stopPropagation() // Empêcher la propagation de l'événement

                            // Logs détaillés pour le débogage
                            console.log('Téléchargement du document sélectionné:', selectedDocument)
                            console.log(
                              'ID du document:',
                              selectedDocument.id || selectedDocument._id,
                            )
                            console.log('Nom du document:', selectedDocument.name)

                            // Appeler la fonction de téléchargement avec un délai pour éviter les conflits d'événements
                            setTimeout(() => {
                              handleDownload(selectedDocument)
                            }, 100)
                          }}
                        >
                          <CIcon icon={cilCloudDownload} className="me-2" />
                          Télécharger
                        </CButton>
                        <CButton
                          color="primary"
                          variant="outline"
                          className="me-2"
                          onClick={(e) => {
                            e.preventDefault() // Empêcher le comportement par défaut
                            e.stopPropagation() // Empêcher la propagation de l'événement

                            console.log(
                              'Ouverture du modal de partage pour le document:',
                              selectedDocument.name,
                            )
                            setShareModalVisible(true)
                          }}
                        >
                          <CIcon icon={cilShareBoxed} className="me-2" />
                          Partager
                        </CButton>
                        {selectedDocument.permissions === 'edit' && (
                          <>
                            <CButton
                              color="primary"
                              variant="outline"
                              className="me-2"
                              onClick={(e) => {
                                e.preventDefault() // Empêcher le comportement par défaut
                                e.stopPropagation() // Empêcher la propagation de l'événement

                                console.log(
                                  'Ouverture du modal de permissions pour le document:',
                                  selectedDocument.name,
                                )
                                setPermissionsModalVisible(true)
                              }}
                            >
                              <CIcon icon={cilLockLocked} className="me-2" />
                              Permissions
                            </CButton>
                            <CButton
                              color="primary"
                              variant="outline"
                              className="me-2"
                              onClick={(e) => {
                                e.preventDefault() // Empêcher le comportement par défaut
                                e.stopPropagation() // Empêcher la propagation de l'événement

                                console.log(
                                  'Ouverture du modal de modification pour le document:',
                                  selectedDocument.name,
                                )
                                setEditModalVisible(true)
                              }}
                            >
                              <CIcon icon={cilPencil} className="me-2" />
                              Modifier
                            </CButton>
                            <CButton
                              color="danger"
                              variant="outline"
                              onClick={(e) => {
                                e.preventDefault() // Empêcher le comportement par défaut
                                e.stopPropagation() // Empêcher la propagation de l'événement

                                console.log('Suppression du document:', selectedDocument.name)
                                handleDelete(selectedDocument)
                              }}
                            >
                              <CIcon icon={cilTrash} className="me-2" />
                              Supprimer
                            </CButton>
                          </>
                        )}
                      </div>
                    </CCol>
                  </CRow>

                  <CRow className="mb-4">
                    <CCol md={8}>
                      <DocumentPreview document={selectedDocument} />
                    </CCol>
                    <CCol md={4}>
                      <CCard className="mb-4">
                        <CCardHeader>Informations</CCardHeader>
                        <CCardBody>
                          <div className="mb-2">
                            <strong>ID:</strong>{' '}
                            {selectedDocument.displayId ||
                              selectedDocument.uniqueId ||
                              'Non défini'}
                          </div>
                          <div className="mb-2">
                            <strong>Type:</strong> {selectedDocument.type.toUpperCase()}
                          </div>
                          <div className="mb-2">
                            <strong>Taille:</strong> {selectedDocument.size}
                          </div>
                          <div className="mb-2">
                            <strong>Ajouté par:</strong> {selectedDocument.uploadedBy}
                          </div>
                          <div className="mb-2">
                            <strong>Date d'ajout:</strong>{' '}
                            {new Date(selectedDocument.uploadedDate).toLocaleDateString()}
                          </div>
                          <div className="mb-2">
                            <strong>Projet:</strong>{' '}
                            {projects.find((p) => p.id === selectedDocument.project)?.name ||
                              'Non assigné'}
                          </div>
                          <div className="mb-2">
                            <strong>Permissions:</strong>{' '}
                            <CBadge
                              color={selectedDocument.permissions === 'edit' ? 'success' : 'info'}
                            >
                              <CIcon
                                icon={
                                  selectedDocument.permissions === 'edit'
                                    ? cilLockUnlocked
                                    : cilLockLocked
                                }
                                className="me-1"
                                size="sm"
                              />
                              {selectedDocument.permissions === 'edit'
                                ? 'Modification'
                                : 'Lecture seule'}
                            </CBadge>
                          </div>
                        </CCardBody>
                      </CCard>

                      {/* Historique des versions */}
                      <DocumentVersions
                        document={selectedDocument}
                        onVersionRestore={(version, comment) => {
                          // Dans une implémentation réelle, cette fonction appellerait l'API
                          const versionDate = new Date(version.uploadedDate).toLocaleDateString()
                          toast.success(
                            `Version du ${versionDate} restaurée avec succès${comment ? ': ' + comment : ''}`,
                          )
                          fetchDocuments()
                        }}
                      />
                    </CCol>
                  </CRow>

                  {/* Commentaires */}
                  <DocumentComments documentId={selectedDocument.id} />
                </div>
              )}
            </CTabPane>
          </CTabContent>
        </CCardBody>
      </CCard>

      {/* Document Upload Modal */}
      <DocumentUpload
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Document Share Modal */}
      {selectedDocument && (
        <>
          {console.log('Ouverture du modal de partage avec le document:', selectedDocument)}
          <DocumentShare
            document={{
              ...selectedDocument,
              _id: selectedDocument.id, // Assurer que _id est défini pour la compatibilité
            }}
            visible={shareModalVisible}
            onClose={() => setShareModalVisible(false)}
          />
        </>
      )}

      {/* Document Permissions Modal */}
      {selectedDocument && (
        <>
          {console.log('Ouverture du modal de permissions avec le document:', selectedDocument)}
          <DocumentPermissions
            document={{
              ...selectedDocument,
              _id: selectedDocument.id, // Assurer que _id est défini pour la compatibilité
            }}
            visible={permissionsModalVisible}
            onClose={() => setPermissionsModalVisible(false)}
            onPermissionsUpdated={(updatedPermissions) => {
              console.log('Permissions mises à jour:', updatedPermissions)

              // Mettre à jour le document sélectionné avec les nouvelles permissions
              setSelectedDocument({
                ...selectedDocument,
                permissions: updatedPermissions,
              })

              // Mettre à jour la liste des documents
              setDocuments(
                documents.map((doc) => {
                  // Utiliser les identifiants uniques pour comparer les documents
                  const docId = doc.uniqueId || doc.displayId || doc.id || doc._id
                  const selectedId =
                    selectedDocument.uniqueId ||
                    selectedDocument.displayId ||
                    selectedDocument.id ||
                    selectedDocument._id

                  return docId === selectedId ? { ...doc, permissions: updatedPermissions } : doc
                }),
              )
            }}
          />
        </>
      )}

      {/* Document Edit Modal */}
      {selectedDocument && (
        <DocumentEdit
          document={selectedDocument}
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          onEditSuccess={(updatedDocument) => {
            // Mettre à jour le document sélectionné
            const updatedDoc = {
              ...selectedDocument,
              name: updatedDocument.name,
              description: updatedDocument.description,
              project: updatedDocument.project,
              isPublic: updatedDocument.isPublic,
            }

            setSelectedDocument(updatedDoc)

            // Mettre à jour la liste des documents
            setDocuments(
              documents.map((doc) => {
                // Utiliser les identifiants uniques pour comparer les documents
                const docId = doc.uniqueId || doc.displayId || doc.id || doc._id
                const selectedId =
                  selectedDocument.uniqueId ||
                  selectedDocument.displayId ||
                  selectedDocument.id ||
                  selectedDocument._id

                return docId === selectedId ? updatedDoc : doc
              }),
            )

            // Rafraîchir la liste des documents
            fetchDocuments()
          }}
        />
      )}
    </div>
  )
}

export default Resources
