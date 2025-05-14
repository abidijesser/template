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
  CFormSelect,
  CFormCheck,
  CFormTextarea,
  CInputGroup,
  CInputGroupText,
  CSpinner,
  CAlert,
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilLink,
  cilEnvelopeClosed,
  cilTrash,
  cilCopy,
  cilLockLocked,
  cilLockUnlocked,
  cilCalendar,
  cilPencil,
  cilUser,
} from '@coreui/icons'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import './DocumentShare.css'

const DocumentShare = ({ document, visible, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [shareLinks, setShareLinks] = useState([])
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [selectedLink, setSelectedLink] = useState(null)

  // États pour le formulaire de création de lien
  const [expiresIn, setExpiresIn] = useState('')
  const [accessLevel, setAccessLevel] = useState('view')
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')

  // États pour le formulaire d'envoi par email
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  // Charger les liens de partage existants
  useEffect(() => {
    if (visible && document) {
      fetchShareLinks()
    }
  }, [visible, document])

  // Récupérer les liens de partage
  const fetchShareLinks = async () => {
    if (!document || !document._id) {
      console.log('Document invalide ou sans ID:', document)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Récupération des liens de partage pour le document:', document._id)
      const response = await axios.get(`/api/share/document/${document._id}`)

      if (response.data.success) {
        setShareLinks(response.data.data)
      } else {
        setError('Erreur lors de la récupération des liens de partage')
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des liens de partage:', err)
      setError(err.response?.data?.error || 'Erreur lors de la récupération des liens de partage')
    } finally {
      setLoading(false)
    }
  }

  // Créer un nouveau lien de partage
  const handleCreateShareLink = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)

      const payload = {
        accessLevel,
        expiresIn: expiresIn || null,
      }

      if (usePassword && password) {
        payload.password = password
      }

      console.log("Création d'un lien de partage pour le document:", document._id)
      const response = await axios.post(`/api/share/document/${document._id}`, payload)

      if (response.data.success) {
        toast.success('Lien de partage créé avec succès')
        setShareLinks([response.data.data, ...shareLinks])
        resetCreateForm()
      } else {
        setError('Erreur lors de la création du lien de partage')
      }
    } catch (err) {
      console.error('Erreur lors de la création du lien de partage:', err)
      setError(err.response?.data?.error || 'Erreur lors de la création du lien de partage')
    } finally {
      setLoading(false)
    }
  }

  // Désactiver un lien de partage
  const handleDeactivateLink = async (token) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver ce lien de partage ?')) {
      return
    }

    try {
      setLoading(true)

      const response = await axios.delete(`/api/share/${token}`)

      if (response.data.success) {
        toast.success('Lien de partage désactivé avec succès')
        setShareLinks(shareLinks.filter((link) => link.token !== token))
      } else {
        toast.error('Erreur lors de la désactivation du lien de partage')
      }
    } catch (err) {
      console.error('Erreur lors de la désactivation du lien de partage:', err)
      toast.error(err.response?.data?.error || 'Erreur lors de la désactivation du lien de partage')
    } finally {
      setLoading(false)
    }
  }

  // Envoyer un lien par email
  const handleSendEmail = async (e) => {
    e.preventDefault()

    if (!selectedLink) return

    try {
      setSendingEmail(true)
      setError(null)

      const payload = {
        recipientEmail,
        recipientName,
        message: emailMessage,
        documentName: document.name,
      }

      const response = await axios.post(`/api/share/${selectedLink.token}/email`, payload)

      if (response.data.success) {
        toast.success('Lien de partage envoyé par email avec succès')
        resetEmailForm()
      } else {
        setError("Erreur lors de l'envoi du lien par email")
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi du lien par email:", err)
      setError(err.response?.data?.error || "Erreur lors de l'envoi du lien par email")
    } finally {
      setSendingEmail(false)
    }
  }

  // Copier un lien dans le presse-papier
  const handleCopyLink = (url) => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Lien copié dans le presse-papier'))
      .catch(() => toast.error('Erreur lors de la copie du lien'))
  }

  // Réinitialiser le formulaire de création
  const resetCreateForm = () => {
    setShowCreateForm(false)
    setExpiresIn('')
    setAccessLevel('view')
    setUsePassword(false)
    setPassword('')
  }

  // Réinitialiser le formulaire d'email
  const resetEmailForm = () => {
    setShowEmailForm(false)
    setSelectedLink(null)
    setRecipientEmail('')
    setRecipientName('')
    setEmailMessage('')
  }

  // Formater la date d'expiration
  const formatExpiryDate = (date) => {
    if (!date) return 'Jamais'
    return new Date(date).toLocaleString()
  }

  // Obtenir le badge pour le niveau d'accès
  const getAccessLevelBadge = (level) => {
    switch (level) {
      case 'view':
        return <CBadge color="info">Lecture</CBadge>
      case 'comment':
        return <CBadge color="success">Commentaire</CBadge>
      case 'edit':
        return <CBadge color="warning">Édition</CBadge>
      default:
        return <CBadge color="secondary">{level}</CBadge>
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
      <CModalHeader onClose={onClose}>
        <CModalTitle>Partager le document: {document?.name}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <div className="d-flex justify-content-between mb-3">
          <h5>Liens de partage</h5>
          <CButton color="primary" size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
            <CIcon icon={cilLink} className="me-2" />
            {showCreateForm ? 'Annuler' : 'Créer un nouveau lien'}
          </CButton>
        </div>

        {/* Formulaire de création de lien */}
        {showCreateForm && (
          <CCard className="mb-4">
            <CCardBody>
              <CForm onSubmit={handleCreateShareLink}>
                <div className="mb-3">
                  <CFormLabel>Niveau d'accès</CFormLabel>
                  <CFormSelect value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)}>
                    <option value="view">Lecture seule</option>
                    <option value="comment">Lecture et commentaires</option>
                    <option value="edit">Édition complète</option>
                  </CFormSelect>
                </div>

                <div className="mb-3">
                  <CFormLabel>Expiration</CFormLabel>
                  <CFormSelect value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)}>
                    <option value="">Jamais</option>
                    <option value="1">1 heure</option>
                    <option value="24">24 heures</option>
                    <option value="168">7 jours</option>
                    <option value="720">30 jours</option>
                  </CFormSelect>
                </div>

                <div className="mb-3">
                  <CFormCheck
                    id="usePassword"
                    label="Protéger par mot de passe"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                  />
                </div>

                {usePassword && (
                  <div className="mb-3">
                    <CFormLabel>Mot de passe</CFormLabel>
                    <CFormInput
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={usePassword}
                    />
                  </div>
                )}

                <div className="d-flex justify-content-end">
                  <CButton
                    color="secondary"
                    variant="outline"
                    className="me-2"
                    onClick={resetCreateForm}
                  >
                    Annuler
                  </CButton>
                  <CButton
                    color="primary"
                    type="submit"
                    disabled={loading || (usePassword && !password)}
                  >
                    {loading ? <CSpinner size="sm" /> : 'Créer le lien'}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        )}

        {/* Formulaire d'envoi par email */}
        {showEmailForm && selectedLink && (
          <CCard className="mb-4">
            <CCardBody>
              <h6>Envoyer par email</h6>
              <CForm onSubmit={handleSendEmail}>
                <div className="mb-3">
                  <CFormLabel>Email du destinataire</CFormLabel>
                  <CFormInput
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <CFormLabel>Nom du destinataire (optionnel)</CFormLabel>
                  <CFormInput
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <CFormLabel>Message (optionnel)</CFormLabel>
                  <CFormTextarea
                    rows={3}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                  />
                </div>

                <div className="d-flex justify-content-end">
                  <CButton
                    color="secondary"
                    variant="outline"
                    className="me-2"
                    onClick={resetEmailForm}
                  >
                    Annuler
                  </CButton>
                  <CButton color="primary" type="submit" disabled={sendingEmail || !recipientEmail}>
                    {sendingEmail ? <CSpinner size="sm" /> : 'Envoyer'}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        )}

        {/* Liste des liens de partage */}
        {loading ? (
          <div className="text-center my-4">
            <CSpinner />
            <p className="mt-2">Chargement des liens de partage...</p>
          </div>
        ) : shareLinks.length === 0 ? (
          <div className="text-center my-4">
            <p className="text-muted">Aucun lien de partage actif pour ce document.</p>
          </div>
        ) : (
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Lien</CTableHeaderCell>
                <CTableHeaderCell>Accès</CTableHeaderCell>
                <CTableHeaderCell>Expiration</CTableHeaderCell>
                <CTableHeaderCell>Sécurité</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {shareLinks.map((link) => (
                <CTableRow key={link.token}>
                  <CTableDataCell>
                    <div className="d-flex align-items-center">
                      <CInputGroup size="sm">
                        <CFormInput readOnly value={link.url} className="share-link-input" />
                        <CButton
                          color="primary"
                          variant="outline"
                          onClick={() => handleCopyLink(link.url)}
                        >
                          <CIcon icon={cilCopy} />
                        </CButton>
                      </CInputGroup>
                    </div>
                  </CTableDataCell>
                  <CTableDataCell>{getAccessLevelBadge(link.accessLevel)}</CTableDataCell>
                  <CTableDataCell>
                    <div className="d-flex align-items-center">
                      <CIcon icon={cilCalendar} className="me-1 text-muted" size="sm" />
                      {formatExpiryDate(link.expiresAt)}
                    </div>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CIcon
                      icon={link.isPasswordProtected ? cilLockLocked : cilLockUnlocked}
                      className={link.isPasswordProtected ? 'text-warning' : 'text-muted'}
                    />
                    <span className="ms-1">{link.isPasswordProtected ? 'Protégé' : 'Public'}</span>
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="d-flex">
                      <CTooltip content="Envoyer par email">
                        <CButton
                          color="info"
                          variant="ghost"
                          size="sm"
                          className="me-1"
                          onClick={() => {
                            setSelectedLink(link)
                            setShowEmailForm(true)
                          }}
                        >
                          <CIcon icon={cilEnvelopeClosed} />
                        </CButton>
                      </CTooltip>
                      <CTooltip content="Désactiver le lien">
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivateLink(link.token)}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTooltip>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Fermer
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default DocumentShare
