import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CContainer,
  CRow,
  CCol,
  CButton,
  CSpinner,
  CAlert,
  CForm,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilCloudDownload, cilArrowLeft, cilShieldAlt } from '@coreui/icons'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import DocumentPreview from '../../components/Documents/DocumentPreview'
import DocumentComments from '../../components/Documents/DocumentComments'
import './SharedDocument.css'

const SharedDocument = () => {
  const { token } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [document, setDocument] = useState(null)
  const [accessLevel, setAccessLevel] = useState(null)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Valider le lien de partage
  useEffect(() => {
    if (token) {
      validateShareLink()
    }
  }, [token])

  // Fonction pour valider le lien de partage
  const validateShareLink = async (pwd = null) => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.post(`/share/validate/${token}`, {
        password: pwd
      })

      if (response.data.success) {
        setDocument(response.data.data.document)
        setAccessLevel(response.data.data.accessLevel)
        setRequiresPassword(false)
      } else {
        setError('Lien de partage invalide ou expiré')
      }
    } catch (err) {
      console.error('Erreur lors de la validation du lien de partage:', err)

      if (err.response?.data?.requiresPassword) {
        setRequiresPassword(true)
        setError(null)
      } else {
        setError(err.response?.data?.error || 'Lien de partage invalide ou expiré')
      }
    } finally {
      setLoading(false)
    }
  }

  // Gérer la soumission du mot de passe
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (!password.trim()) {
      return
    }

    try {
      setSubmitting(true)
      await validateShareLink(password)
    } finally {
      setSubmitting(false)
    }
  }

  // Fonction pour télécharger le document
  const handleDownload = () => {
    if (!document) return

    try {
      // Utiliser la nouvelle route de téléchargement qui enregistre les statistiques
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const downloadUrl = `${baseUrl}/api/share/public/download/${token}`

      // Ouvrir l'URL dans un nouvel onglet ou utiliser un lien invisible
      const link = window.document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', document.name)
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error)
      toast.error('Erreur lors du téléchargement du document')
    }
  }

  // Afficher l'écran de chargement
  if (loading) {
    return (
      <CContainer className="mt-5">
        <CRow className="justify-content-center">
          <CCol md={8} lg={6} xl={5}>
            <div className="text-center my-5">
              <CSpinner color="primary" />
              <p className="mt-3">Chargement du document partagé...</p>
            </div>
          </CCol>
        </CRow>
      </CContainer>
    )
  }

  // Afficher l'écran de saisie du mot de passe
  if (requiresPassword) {
    return (
      <CContainer className="mt-5">
        <CRow className="justify-content-center">
          <CCol md={8} lg={6} xl={5}>
            <CCard className="password-card">
              <CCardHeader className="text-center">
                <h4>Document protégé par mot de passe</h4>
              </CCardHeader>
              <CCardBody>
                <div className="text-center mb-4">
                  <CIcon icon={cilLockLocked} size="3xl" className="text-warning mb-3" />
                  <p>Ce document est protégé par un mot de passe. Veuillez saisir le mot de passe pour y accéder.</p>
                </div>

                <CForm onSubmit={handlePasswordSubmit}>
                  <div className="mb-3">
                    <CFormLabel>Mot de passe</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Entrez le mot de passe"
                        required
                      />
                    </CInputGroup>
                  </div>

                  <div className="d-grid">
                    <CButton
                      color="primary"
                      type="submit"
                      disabled={submitting || !password.trim()}
                    >
                      {submitting ? <CSpinner size="sm" /> : 'Accéder au document'}
                    </CButton>
                  </div>
                </CForm>

                <div className="text-center mt-3">
                  <CButton
                    color="link"
                    onClick={() => navigate('/')}
                  >
                    Retour à l'accueil
                  </CButton>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    )
  }

  // Afficher l'erreur
  if (error) {
    return (
      <CContainer className="mt-5">
        <CRow className="justify-content-center">
          <CCol md={8} lg={6} xl={5}>
            <CAlert color="danger" className="text-center">
              <h4 className="alert-heading">Erreur</h4>
              <p>{error}</p>
              <hr />
              <div className="d-grid">
                <CButton color="primary" onClick={() => navigate('/')}>
                  <CIcon icon={cilArrowLeft} className="me-2" />
                  Retour à l'accueil
                </CButton>
              </div>
            </CAlert>
          </CCol>
        </CRow>
      </CContainer>
    )
  }

  // Afficher le document
  return (
    <CContainer className="mt-4">
      <CRow>
        <CCol>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>{document.name}</h2>
            <div>
              <CButton
                color="primary"
                onClick={handleDownload}
                className="me-2"
              >
                <CIcon icon={cilCloudDownload} className="me-2" />
                Télécharger
              </CButton>
              <CButton
                color="secondary"
                variant="outline"
                onClick={() => navigate('/')}
              >
                <CIcon icon={cilArrowLeft} className="me-2" />
                Retour
              </CButton>
            </div>
          </div>

          <CCard className="mb-4">
            <CCardBody>
              <CRow>
                <CCol md={8}>
                  <p><strong>Description:</strong> {document.description || 'Aucune description'}</p>
                </CCol>
                <CCol md={4}>
                  <p><strong>Type:</strong> {document.fileType?.toUpperCase()}</p>
                  <p><strong>Taille:</strong> {document.fileSize}</p>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          <CRow>
            <CCol lg={8}>
              <DocumentPreview document={document} />
            </CCol>
            <CCol lg={4}>
              {accessLevel === 'comment' || accessLevel === 'edit' ? (
                <DocumentComments documentId={document._id} />
              ) : (
                <CCard>
                  <CCardHeader>Commentaires</CCardHeader>
                  <CCardBody className="text-center py-4">
                    <p className="text-muted">
                      Vous n'avez pas la permission d'ajouter des commentaires à ce document.
                    </p>
                  </CCardBody>
                </CCard>
              )}

              {/* Informations de sécurité */}
              <CCard className="mt-4 security-info-card">
                <CCardHeader>
                  <CIcon icon={cilShieldAlt} className="me-2" />
                  Informations de sécurité
                </CCardHeader>
                <CCardBody>
                  <div className="mb-2">
                    <strong>Type de fichier:</strong> {document.fileType.toUpperCase()}
                    <CBadge
                      color="success"
                      className="ms-2"
                      title="Le type de fichier est vérifié pour assurer l'intégrité du document"
                    >
                      Vérifié
                    </CBadge>
                  </div>
                  <div className="mb-2">
                    <strong>Niveau d'accès:</strong>{' '}
                    <CBadge
                      color={
                        accessLevel === 'view' ? 'info' :
                        accessLevel === 'comment' ? 'primary' :
                        'success'
                      }
                    >
                      {accessLevel === 'view' && 'Lecture seule'}
                      {accessLevel === 'comment' && 'Commentaires'}
                      {accessLevel === 'edit' && 'Modification'}
                    </CBadge>
                  </div>
                  <div className="mb-2">
                    <strong>Modifications:</strong>{' '}
                    {accessLevel === 'edit' ? (
                      <span className="text-success">Autorisées</span>
                    ) : (
                      <span className="text-danger">Non autorisées</span>
                    )}
                  </div>
                  <div className="mb-0">
                    <strong>Protection:</strong>{' '}
                    <CIcon
                      icon={cilLockLocked}
                      className="text-primary me-1"
                      size="sm"
                    />
                    Le document est protégé contre les modifications de type et de format
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default SharedDocument
