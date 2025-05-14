import React, { useState, useEffect } from 'react'
import DocViewer from '@cyntler/react-doc-viewer'
import '@cyntler/react-doc-viewer/dist/index.css'
import { CCard, CCardBody, CCardHeader, CSpinner, CAlert, CButton, CRow, CCol } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilExternalLink } from '@coreui/icons'
import './DocumentPreview.css'

const DocumentPreview = ({ document }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [docs, setDocs] = useState([])

  useEffect(() => {
    if (document) {
      setLoading(true)
      setError(null)

      // Construire l'URL complète du document
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const documentUrl = `${baseUrl}/${document.filePath}`

      // Déterminer le type MIME en fonction de l'extension du fichier
      const mimeType = getMimeType(document.type)

      setDocs([
        {
          uri: documentUrl,
          fileName: document.name,
          fileType: mimeType,
        },
      ])

      setLoading(false)
    }
  }, [document])

  // Fonction pour obtenir le type MIME à partir de l'extension de fichier
  const getMimeType = (fileType) => {
    const mimeTypes = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      txt: 'text/plain',
      csv: 'text/csv',
      html: 'text/html',
      htm: 'text/html',
    }

    return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream'
  }

  // Fonction pour télécharger le document
  const handleDownload = () => {
    try {
      // Créer un lien pour télécharger le fichier
      const link = window.document.createElement('a')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      link.href = `${baseUrl}/${document.filePath}`
      link.setAttribute('download', document.name)
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error)
      setError('Erreur lors du téléchargement du document')
    }
  }

  // Fonction pour ouvrir le document dans un nouvel onglet
  const handleOpenInNewTab = () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      window.open(`${baseUrl}/${document.filePath}`, '_blank')
    } catch (error) {
      console.error("Erreur lors de l'ouverture du document:", error)
      setError("Erreur lors de l'ouverture du document")
    }
  }

  // Vérifier si le type de document est prévisualisable
  const isPreviewable = (fileType) => {
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'html', 'htm']
    return previewableTypes.includes(fileType.toLowerCase())
  }

  if (!document) {
    return (
      <CCard className="mb-4">
        <CCardHeader>Aperçu du document</CCardHeader>
        <CCardBody className="text-center py-5">
          <p className="text-muted">Sélectionnez un document pour afficher l'aperçu</p>
        </CCardBody>
      </CCard>
    )
  }

  return (
    <CCard className="mb-4 document-preview-card">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <div>Aperçu: {document.name}</div>
        <div>
          <CButton
            color="primary"
            variant="ghost"
            size="sm"
            className="me-2"
            onClick={handleDownload}
            title="Télécharger"
          >
            <CIcon icon={cilCloudDownload} />
          </CButton>
          <CButton
            color="primary"
            variant="ghost"
            size="sm"
            onClick={handleOpenInNewTab}
            title="Ouvrir dans un nouvel onglet"
          >
            <CIcon icon={cilExternalLink} />
          </CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center py-5">
            <CSpinner />
            <p className="mt-3">Chargement de l'aperçu...</p>
          </div>
        ) : error ? (
          <CAlert color="danger">{error}</CAlert>
        ) : isPreviewable(document.type) ? (
          <DocViewer
            documents={docs}
            style={{ height: '70vh' }}
            className="document-viewer"
            config={{
              header: {
                disableHeader: true,
                disableFileName: true,
              },
            }}
            theme={{
              primary: '#5296d8',
              secondary: '#ffffff',
              tertiary: '#5296d899',
              textPrimary: '#ffffff',
              textSecondary: '#5296d8',
              textTertiary: '#00000099',
              disableThemeScrollbar: false,
            }}
          />
        ) : (
          <CRow className="justify-content-center align-items-center py-5">
            <CCol md={8} className="text-center">
              <div className="non-previewable-file">
                <CIcon icon={cilCloudDownload} size="3xl" className="mb-3" />
                <h4>Ce type de fichier ne peut pas être prévisualisé</h4>
                <p className="text-muted mb-4">
                  Le fichier {document.name} ({document.type.toUpperCase()}) ne peut pas être
                  prévisualisé directement dans le navigateur.
                </p>
                <CButton color="primary" onClick={handleDownload}>
                  <CIcon icon={cilCloudDownload} className="me-2" />
                  Télécharger le fichier
                </CButton>
              </div>
            </CCol>
          </CRow>
        )}
      </CCardBody>
    </CCard>
  )
}

export default DocumentPreview
