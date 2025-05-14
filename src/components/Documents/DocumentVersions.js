import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormTextarea,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilHistory, cilSwapVertical } from '@coreui/icons'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'

const DocumentVersions = ({ document, onVersionRestore }) => {
  const [confirmModal, setConfirmModal] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Format file size in human-readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date in human-readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Handle download of a version
  const handleDownload = (version) => {
    try {
      // Create a link to download the file
      const link = window.document.createElement('a')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      link.href = `${baseUrl}/${version.filePath}`

      // Utiliser le nom du document actuel pour toutes les versions
      // Cela garantit que le nom du fichier téléchargé est toujours le même
      link.setAttribute('download', document.name)

      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } catch (error) {
      console.error('Erreur lors du téléchargement de la version:', error)
      toast.error('Erreur lors du téléchargement de la version')
    }
  }

  // Open confirmation modal for restoring a version
  const openRestoreModal = (version) => {
    setSelectedVersion(version)
    setComment('')
    setError(null)
    setConfirmModal(true)
  }

  // Handle restore of a version
  const handleRestore = async () => {
    if (!selectedVersion) return

    try {
      setLoading(true)
      setError(null)

      // In a real implementation, this would call an API to restore the version
      // For now, we'll simulate it with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Call the parent component's callback
      if (onVersionRestore) {
        onVersionRestore(selectedVersion, comment)
      }

      setConfirmModal(false)
      toast.success('Version restaurée avec succès')
    } catch (err) {
      console.error('Erreur lors de la restauration de la version:', err)
      setError('Erreur lors de la restauration de la version')
      toast.error('Erreur lors de la restauration de la version')
    } finally {
      setLoading(false)
    }
  }

  // If document has no versions, show a message
  if (!document.versions || document.versions.length === 0) {
    return (
      <CCard className="mb-4">
        <CCardHeader>Historique des versions</CCardHeader>
        <CCardBody>
          <p className="text-center text-muted my-3">Aucune version antérieure disponible.</p>
        </CCardBody>
      </CCard>
    )
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>Historique des versions</CCardHeader>
        <CCardBody>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Version</CTableHeaderCell>
                <CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell>Taille</CTableHeaderCell>
                <CTableHeaderCell>Auteur</CTableHeaderCell>
                <CTableHeaderCell>Commentaire</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {/* Current version */}
              <CTableRow className="table-primary">
                <CTableDataCell>
                  <strong>Version actuelle</strong>
                  {document.uniqueId && (
                    <small className="ms-2 text-muted">({document.uniqueId.substring(0, 8)})</small>
                  )}
                  {document.displayId && !document.uniqueId && (
                    <small className="ms-2 text-muted">({document.displayId})</small>
                  )}
                </CTableDataCell>
                <CTableDataCell>{formatDate(document.uploadedDate)}</CTableDataCell>
                <CTableDataCell>{formatFileSize(document.fileSize)}</CTableDataCell>
                <CTableDataCell>
                  {document.uploadedBy?.name || 'Utilisateur inconnu'}
                </CTableDataCell>
                <CTableDataCell>-</CTableDataCell>
                <CTableDataCell>
                  <CButton
                    color="primary"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(document)}
                  >
                    <CIcon icon={cilCloudDownload} />
                  </CButton>
                </CTableDataCell>
              </CTableRow>

              {/* Previous versions */}
              {document.versions.map((version, index) => {
                // Utiliser uniqueId s'il existe, sinon utiliser l'index
                const versionId = version.uniqueId || `version-${index}`;
                const versionNumber = document.versions.length - index;

                return (
                  <CTableRow key={versionId}>
                    <CTableDataCell>
                      Version {versionNumber}
                      {version.uniqueId && (
                        <small className="ms-2 text-muted">({version.uniqueId.substring(0, 8)})</small>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>{formatDate(version.uploadedDate)}</CTableDataCell>
                    <CTableDataCell>{formatFileSize(version.fileSize)}</CTableDataCell>
                    <CTableDataCell>
                      {version.uploadedBy?.name || 'Utilisateur inconnu'}
                    </CTableDataCell>
                    <CTableDataCell>{version.comment || '-'}</CTableDataCell>
                    <CTableDataCell>
                    <CButton
                      color="primary"
                      size="sm"
                      variant="ghost"
                      className="me-2"
                      onClick={() => handleDownload(version)}
                      title="Télécharger cette version"
                    >
                      <CIcon icon={cilCloudDownload} />
                    </CButton>
                    <CButton
                      color="warning"
                      size="sm"
                      variant="ghost"
                      onClick={() => openRestoreModal(version)}
                      title="Restaurer cette version"
                    >
                      <CIcon icon={cilSwapVertical} />
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
                );
              })}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Confirmation Modal */}
      <CModal visible={confirmModal} onClose={() => setConfirmModal(false)}>
        <CModalHeader onClose={() => setConfirmModal(false)}>
          <CModalTitle>Restaurer une version antérieure</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Êtes-vous sûr de vouloir restaurer la version du{' '}
            {selectedVersion && formatDate(selectedVersion.uploadedDate)} ?
          </p>
          <p>
            <strong>Note:</strong> La version actuelle sera sauvegardée dans l'historique.
          </p>

          <div className="mb-3">
            <label htmlFor="versionComment" className="form-label">
              Commentaire (optionnel)
            </label>
            <CFormTextarea
              id="versionComment"
              placeholder="Raison de la restauration..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          {error && <CAlert color="danger">{error}</CAlert>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setConfirmModal(false)} disabled={loading}>
            Annuler
          </CButton>
          <CButton color="warning" onClick={handleRestore} disabled={loading}>
            {loading ? <CSpinner size="sm" /> : <CIcon icon={cilHistory} className="me-2" />}
            Restaurer cette version
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default DocumentVersions
