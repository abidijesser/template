import React, { useState, useEffect } from 'react'
import { CRow, CCol, CCard, CCardBody, CCardHeader, CBadge, CSpinner } from '@coreui/react'
import mediaService from '../../services/mediaService'

const MediaDetail = ({ media }) => {
  const [loading, setLoading] = useState(true)
  const [fullMedia, setFullMedia] = useState(null)

  useEffect(() => {
    const fetchMediaDetails = async () => {
      if (!media || !media._id) return

      try {
        setLoading(true)
        const response = await mediaService.getMediaById(media._id)
        if (response.success) {
          setFullMedia(response.data)
        }
      } catch (error) {
        console.error('Error fetching media details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (media && Object.keys(media).length > 10) {
      // If we already have detailed media object
      setFullMedia(media)
      setLoading(false)
    } else {
      fetchMediaDetails()
    }
  }, [media])

  if (loading) {
    return (
      <div className="text-center my-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (!fullMedia) {
    return <div>Media not found or failed to load.</div>
  }

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderMediaPreview = () => {
    const fileUrl = `http://localhost:3001/${fullMedia.filePath}`

    switch (fullMedia.fileType) {
      case 'image':
        return (
          <div className="text-center mb-4">
            <img
              src={fileUrl}
              alt={fullMedia.title}
              className="img-fluid rounded"
              style={{ maxHeight: '400px' }}
            />
          </div>
        )
      case 'video':
        return (
          <div className="text-center mb-4">
            <video controls className="img-fluid rounded" style={{ maxHeight: '400px' }}>
              <source src={fileUrl} type={fullMedia.mimeType} />
              Your browser does not support the video tag.
            </video>
          </div>
        )
      case 'audio':
        return (
          <div className="mb-4">
            <audio controls className="w-100">
              <source src={fileUrl} type={fullMedia.mimeType} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        )
      case 'document':
        if (fullMedia.mimeType === 'application/pdf') {
          return (
            <div className="mb-4" style={{ height: '500px' }}>
              <iframe
                src={fileUrl}
                title={fullMedia.title}
                width="100%"
                height="100%"
                className="border-0 rounded"
              />
            </div>
          )
        } else {
          return (
            <div className="text-center mb-4">
              <i className="far fa-file-alt fa-5x mb-3"></i>
              <p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Download Document
                </a>
              </p>
            </div>
          )
        }
      default:
        return (
          <div className="text-center mb-4">
            <i className="far fa-file fa-5x mb-3"></i>
            <p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Download File
              </a>
            </p>
          </div>
        )
    }
  }

  return (
    <div>
      {renderMediaPreview()}

      <CRow>
        <CCol md={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Media Information</strong>
            </CCardHeader>
            <CCardBody>
              <dl className="row">
                <dt className="col-sm-4">Title</dt>
                <dd className="col-sm-8">{fullMedia.title}</dd>

                <dt className="col-sm-4">Description</dt>
                <dd className="col-sm-8">{fullMedia.description || 'No description'}</dd>

                <dt className="col-sm-4">File Type</dt>
                <dd className="col-sm-8">
                  <CBadge
                    color={
                      fullMedia.fileType === 'image'
                        ? 'info'
                        : fullMedia.fileType === 'document'
                          ? 'primary'
                          : fullMedia.fileType === 'video'
                            ? 'danger'
                            : fullMedia.fileType === 'audio'
                              ? 'warning'
                              : 'secondary'
                    }
                  >
                    {fullMedia.fileType}
                  </CBadge>
                </dd>

                <dt className="col-sm-4">File Name</dt>
                <dd className="col-sm-8">{fullMedia.fileName}</dd>

                <dt className="col-sm-4">File Size</dt>
                <dd className="col-sm-8">{formatFileSize(fullMedia.fileSize)}</dd>

                <dt className="col-sm-4">MIME Type</dt>
                <dd className="col-sm-8">{fullMedia.mimeType}</dd>

                <dt className="col-sm-4">Visibility</dt>
                <dd className="col-sm-8">
                  {fullMedia.isPublic ? (
                    <CBadge color="success">Public</CBadge>
                  ) : (
                    <CBadge color="secondary">Private</CBadge>
                  )}
                </dd>

                <dt className="col-sm-4">Tags</dt>
                <dd className="col-sm-8">
                  {fullMedia.tags && fullMedia.tags.length > 0
                    ? fullMedia.tags.map((tag, index) => (
                        <CBadge color="light" className="me-1 text-dark" key={index}>
                          {tag}
                        </CBadge>
                      ))
                    : 'No tags'}
                </dd>
              </dl>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Related Information</strong>
            </CCardHeader>
            <CCardBody>
              <dl className="row">
                <dt className="col-sm-4">Uploaded By</dt>
                <dd className="col-sm-8">{fullMedia.uploadedBy?.name || 'Unknown user'}</dd>

                <dt className="col-sm-4">Upload Date</dt>
                <dd className="col-sm-8">
                  {formatDate(fullMedia.createdAt || fullMedia.uploadedDate)}
                </dd>

                <dt className="col-sm-4">Project</dt>
                <dd className="col-sm-8">
                  {fullMedia.project?.projectName || 'Not assigned to a project'}
                </dd>

                <dt className="col-sm-4">Task</dt>
                <dd className="col-sm-8">{fullMedia.task?.title || 'Not assigned to a task'}</dd>

                <dt className="col-sm-4">Last Updated</dt>
                <dd className="col-sm-8">
                  {fullMedia.updatedAt ? formatDate(fullMedia.updatedAt) : 'Never updated'}
                </dd>
              </dl>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default MediaDetail
