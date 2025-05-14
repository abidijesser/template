import React, { useState, useEffect } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormSelect,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CAlert,
  CBadge,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilUser,
  cilPeople,
  cilLockLocked,
  cilLockUnlocked,
  cilTrash,
  cilPencil,
  cilShieldAlt,
} from '@coreui/icons'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import './DocumentPermissions.css'

const DocumentPermissions = ({ document, visible, onClose, onPermissionsUpdated }) => {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAccess, setSelectedAccess] = useState('view')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // État pour stocker les informations complètes du document
  const [fullDocumentInfo, setFullDocumentInfo] = useState(null)

  // Charger les utilisateurs et les permissions actuelles
  useEffect(() => {
    if (visible && document) {
      fetchUsers()

      // Initialiser les permissions comme un tableau vide
      // Les permissions réelles seront récupérées depuis l'API
      setPermissions([])

      // Récupérer les informations complètes du document
      fetchFullDocumentInfo()

      // Récupérer les permissions du document depuis l'API
      fetchDocumentPermissions()
    }
  }, [visible, document])

  // Récupérer les informations complètes du document
  const fetchFullDocumentInfo = async () => {
    // Vérifier si le document et son ID sont définis
    const documentId = document?.id || document?._id
    if (!documentId) {
      console.error('Erreur: ID du document non défini', document)
      return
    }

    try {
      console.log('Récupération des informations complètes du document:', documentId)
      const response = await axios.get(`/api/documents/${documentId}`)

      if (response.data.success && response.data.data) {
        console.log('Informations complètes du document récupérées:', response.data.data)
        setFullDocumentInfo(response.data.data)
      } else {
        console.error('Erreur dans la réponse API:', response.data)
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des informations du document:', err)
      console.error('Détails du document:', document)
    }
  }

  // Récupérer les permissions du document depuis l'API
  const fetchDocumentPermissions = async () => {
    // Vérifier si le document et son ID sont définis
    const documentId = document?.id || document?._id
    if (!documentId) {
      console.error('Erreur: ID du document non défini pour les permissions', document)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('Récupération des permissions pour le document ID:', documentId)
      const response = await axios.get(`/api/documents/${documentId}/permissions`)

      if (response.data.success) {
        const documentPermissions = response.data.data || []
        console.log('Permissions récupérées:', documentPermissions)
        setPermissions(documentPermissions)

        // Mettre à jour la liste des utilisateurs disponibles en excluant ceux qui ont déjà des permissions
        setUsers((prevUsers) => {
          console.log('Utilisateurs avant filtrage:', prevUsers)
          const filteredUsers = prevUsers.filter(
            (user) => !documentPermissions.some((p) => p.user._id === user._id),
          )
          console.log('Utilisateurs après filtrage:', filteredUsers)
          return filteredUsers
        })
      } else {
        console.error('Erreur dans la réponse API:', response.data)
        setError('Erreur lors de la récupération des permissions')
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des permissions:', err)
      setError(err.response?.data?.error || 'Erreur lors de la récupération des permissions')
    } finally {
      setLoading(false)
    }
  }

  // Récupérer la liste des utilisateurs
  const fetchUsers = async () => {
    try {
      setLoading(true)
      console.log('Récupération des utilisateurs pour le partage...')
      const response = await axios.get('/api/auth/users-for-sharing')

      console.log("Réponse de l'API users-for-sharing:", response.data)

      if (response.data.success) {
        // Filtrer pour exclure l'utilisateur actuel et le propriétaire du document
        const currentUserId = localStorage.getItem('userId')
        console.log('ID utilisateur actuel:', currentUserId)
        console.log('ID propriétaire du document:', document.uploadedBy?._id)

        // Vérifier si document.uploadedBy existe et a un _id
        if (!document.uploadedBy || !document.uploadedBy._id) {
          console.warn("Attention: document.uploadedBy est undefined ou n'a pas d'_id")
        }

        let filteredUsers = response.data.data.filter((user) => {
          const keepUser =
            user._id !== currentUserId &&
            (document.uploadedBy ? user._id !== document.uploadedBy._id : true)
          if (!keepUser) {
            console.log('Utilisateur filtré:', user.name, user._id)
          }
          return keepUser
        })

        console.log('Utilisateurs filtrés:', filteredUsers)

        // Nous filtrerons les utilisateurs qui ont déjà des permissions après avoir récupéré les permissions
        setUsers(filteredUsers)
      } else {
        console.error('Erreur dans la réponse API:', response.data)
        setError('Erreur lors de la récupération des utilisateurs')
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err)
      console.error("Détails de l'erreur:", err.response?.data)
      setError(err.response?.data?.error || 'Erreur lors de la récupération des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  // Ajouter une nouvelle permission
  const handleAddPermission = async (e) => {
    e.preventDefault()

    if (!selectedUser) {
      toast.warning('Veuillez sélectionner un utilisateur')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const documentId = document?.id || document?._id
      if (!documentId) {
        console.error("Erreur: ID du document non défini pour l'ajout de permission", document)
        setSubmitting(false)
        setError('Erreur: ID du document non défini')
        return
      }

      const response = await axios.put(`/api/documents/${documentId}/permissions`, {
        userId: selectedUser,
        access: selectedAccess,
      })

      if (response.data.success) {
        // Mettre à jour les permissions localement
        const updatedPermissions = [...permissions]
        const selectedUserObj = users.find((u) => u._id === selectedUser)

        updatedPermissions.push({
          user: {
            _id: selectedUser,
            name: selectedUserObj.name,
            email: selectedUserObj.email,
          },
          access: selectedAccess,
        })

        setPermissions(updatedPermissions)

        // Mettre à jour la liste des utilisateurs disponibles
        setUsers(users.filter((u) => u._id !== selectedUser))

        // Réinitialiser le formulaire
        setSelectedUser('')
        setSelectedAccess('view')

        toast.success('Permission ajoutée avec succès')

        // Notifier le parent
        if (onPermissionsUpdated) {
          onPermissionsUpdated(updatedPermissions)
        }
      } else {
        setError("Erreur lors de l'ajout de la permission")
      }
    } catch (err) {
      console.error("Erreur lors de l'ajout de la permission:", err)
      setError(err.response?.data?.error || "Erreur lors de l'ajout de la permission")
    } finally {
      setSubmitting(false)
    }
  }

  // Modifier une permission existante
  const handleUpdatePermission = async (userId, newAccess) => {
    try {
      setLoading(true)
      setError(null)

      const documentId = document?.id || document?._id
      if (!documentId) {
        console.error(
          'Erreur: ID du document non défini pour la mise à jour de permission',
          document,
        )
        setLoading(false)
        setError('Erreur: ID du document non défini')
        return
      }

      const response = await axios.put(`/api/documents/${documentId}/permissions`, {
        userId,
        access: newAccess,
      })

      if (response.data.success) {
        // Mettre à jour les permissions localement
        const updatedPermissions = permissions.map((p) =>
          p.user._id === userId ? { ...p, access: newAccess } : p,
        )

        setPermissions(updatedPermissions)

        toast.success('Permission mise à jour avec succès')

        // Notifier le parent
        if (onPermissionsUpdated) {
          onPermissionsUpdated(updatedPermissions)
        }
      } else {
        setError('Erreur lors de la mise à jour de la permission')
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la permission:', err)
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour de la permission')
    } finally {
      setLoading(false)
    }
  }

  // Supprimer une permission
  const handleRemovePermission = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Vérifier si l'ID du document est défini
      const documentId = document?.id || document?._id
      if (!documentId) {
        console.error(
          'Erreur: ID du document non défini pour la suppression de permission',
          document,
        )
        setLoading(false)
        setError('Erreur: ID du document non défini')
        return
      }

      // Mettre à jour avec un accès "none" pour supprimer
      const response = await axios.put(`/api/documents/${documentId}/permissions`, {
        userId,
        access: 'none',
      })

      if (response.data.success) {
        // Mettre à jour les permissions localement
        const updatedPermissions = permissions.filter((p) => p.user._id !== userId)
        setPermissions(updatedPermissions)

        // Ajouter l'utilisateur à la liste des utilisateurs disponibles
        const removedUser = permissions.find((p) => p.user._id === userId)?.user
        if (removedUser) {
          setUsers([...users, removedUser])
        }

        toast.success('Permission supprimée avec succès')

        // Notifier le parent
        if (onPermissionsUpdated) {
          onPermissionsUpdated(updatedPermissions)
        }
      } else {
        setError('Erreur lors de la suppression de la permission')
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de la permission:', err)
      setError(err.response?.data?.error || 'Erreur lors de la suppression de la permission')
    } finally {
      setLoading(false)
    }
  }

  // Obtenir la couleur du badge en fonction du niveau d'accès
  const getAccessBadgeColor = (access) => {
    switch (access) {
      case 'view':
        return 'info'
      case 'comment':
        return 'primary'
      case 'edit':
        return 'success'
      case 'admin':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  // Obtenir l'icône en fonction du niveau d'accès
  const getAccessIcon = (access) => {
    switch (access) {
      case 'view':
        return cilLockLocked
      case 'comment':
        return cilPencil
      case 'edit':
        return cilLockUnlocked
      case 'admin':
        return cilShieldAlt
      default:
        return cilLockLocked
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
      <CModalHeader onClose={onClose}>
        <CModalTitle>Gérer les permissions - {document?.name}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <div className="mb-4">
          <h5>Propriétaire</h5>
          <div className="owner-info d-flex align-items-center p-3 bg-light rounded">
            <CIcon icon={cilUser} className="me-3 text-primary" size="lg" />
            <div>
              {fullDocumentInfo?.uploadedBy ? (
                <>
                  <div className="fw-bold">
                    {fullDocumentInfo.uploadedBy.name || 'Nom non disponible'}
                  </div>
                  <div className="text-muted small">
                    {fullDocumentInfo.uploadedBy.email || 'Email non disponible'}
                  </div>
                </>
              ) : document?.uploadedBy && typeof document.uploadedBy === 'object' ? (
                <>
                  <div className="fw-bold">{document.uploadedBy.name || 'Nom non disponible'}</div>
                  <div className="text-muted small">
                    {document.uploadedBy.email || 'Email non disponible'}
                  </div>
                </>
              ) : document?.uploadedBy && typeof document.uploadedBy === 'string' ? (
                <div className="fw-bold">{document.uploadedBy}</div>
              ) : (
                <div className="fw-bold">Propriétaire non disponible</div>
              )}
            </div>
            <CBadge color="danger" className="ms-auto">
              Propriétaire
            </CBadge>
          </div>
          {/* Afficher les informations de débogage */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-light rounded small">
              <div>
                <strong>Document ID:</strong> {document?._id || document?.id}
              </div>
              <div>
                <strong>Document Name:</strong> {document?.name}
              </div>
              <div>
                <strong>UploadedBy (document):</strong> {JSON.stringify(document?.uploadedBy)}
              </div>
              <div>
                <strong>UploadedBy (fullDocumentInfo):</strong>{' '}
                {JSON.stringify(fullDocumentInfo?.uploadedBy)}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Utilisateurs avec accès</h5>
            <div>
              <CTooltip content={document?.isPublic ? 'Document public' : 'Document privé'}>
                <CBadge color={document?.isPublic ? 'info' : 'secondary'} className="me-2">
                  <CIcon
                    icon={document?.isPublic ? cilPeople : cilLockLocked}
                    className="me-1"
                    size="sm"
                  />
                  {document?.isPublic ? 'Public' : 'Privé'}
                </CBadge>
              </CTooltip>
            </div>
          </div>

          {permissions.length === 0 ? (
            <div className="text-center py-4 bg-light rounded">
              <p className="text-muted mb-0">
                Aucun utilisateur n'a accès à ce document en dehors du propriétaire.
              </p>
            </div>
          ) : (
            <CTable hover responsive className="permissions-table">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Utilisateur</CTableHeaderCell>
                  <CTableHeaderCell>Email</CTableHeaderCell>
                  <CTableHeaderCell>Niveau d'accès</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {permissions.map((permission) => (
                  <CTableRow key={permission.user._id}>
                    <CTableDataCell>
                      <div className="d-flex align-items-center">
                        <CIcon icon={cilUser} className="me-2 text-muted" size="sm" />
                        {permission.user.name}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>{permission.user.email}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={getAccessBadgeColor(permission.access)}>
                        <CIcon icon={getAccessIcon(permission.access)} className="me-1" size="sm" />
                        {permission.access === 'view' && 'Lecture seule'}
                        {permission.access === 'comment' && 'Commentaires'}
                        {permission.access === 'edit' && 'Modification'}
                        {permission.access === 'admin' && 'Administrateur'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex">
                        <CFormSelect
                          size="sm"
                          className="me-2 permission-select"
                          value={permission.access}
                          onChange={(e) =>
                            handleUpdatePermission(permission.user._id, e.target.value)
                          }
                          disabled={loading}
                        >
                          <option value="view">Lecture seule</option>
                          <option value="comment">Commentaires</option>
                          <option value="edit">Modification</option>
                          <option value="admin">Administrateur</option>
                        </CFormSelect>
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePermission(permission.user._id)}
                          disabled={loading}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </div>

        <div className="mb-3">
          <h5>Ajouter un utilisateur</h5>
          <CForm onSubmit={handleAddPermission} className="d-flex align-items-end">
            <div className="flex-grow-1 me-2">
              <CFormSelect
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={loading || submitting || users.length === 0}
              >
                <option value="">Sélectionner un utilisateur</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </CFormSelect>
            </div>
            <div className="me-2" style={{ width: '180px' }}>
              <CFormSelect
                value={selectedAccess}
                onChange={(e) => setSelectedAccess(e.target.value)}
                disabled={loading || submitting || !selectedUser}
              >
                <option value="view">Lecture seule</option>
                <option value="comment">Commentaires</option>
                <option value="edit">Modification</option>
                <option value="admin">Administrateur</option>
              </CFormSelect>
            </div>
            <div>
              <CButton
                type="submit"
                color="primary"
                disabled={loading || submitting || !selectedUser}
              >
                {submitting ? <CSpinner size="sm" /> : 'Ajouter'}
              </CButton>
            </div>
          </CForm>
          {users.length === 0 && (
            <div className="text-muted small mt-2">
              Tous les utilisateurs ont déjà accès à ce document.
            </div>
          )}
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Fermer
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default DocumentPermissions
