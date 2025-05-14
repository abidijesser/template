import React, { useState } from 'react'
import './media.css'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardTitle,
  CCardText,
  CCardFooter,
  CButton,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CModalTitle,
  CAlert,
  CPagination,
  CPaginationItem,
  CBadge,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash, cilPencil, cilMagnifyingGlass } from '@coreui/icons'
import mediaService from '../../services/mediaService'
import MediaDetail from './MediaDetail'
import MediaEdit from './MediaEdit'

const MediaList = ({ media, onDelete, onEdit, page, totalPages, onPageChange }) => {
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleView = (media) => {
    setSelectedMedia(media)
    setShowDetailModal(true)
  }

  const handleEdit = (media) => {
    setSelectedMedia(media)
    setShowEditModal(true)
  }

  const handleDeleteClick = (media) => {
    setSelectedMedia(media)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!selectedMedia) return

    try {
      setDeleteLoading(true)
      setError(null)

      const response = await mediaService.deleteMedia(selectedMedia._id)

      if (response.success) {
        setShowDeleteModal(false)
        if (onDelete) onDelete()
      } else {
        setError('Failed to delete media')
      }
    } catch (error) {
      console.error('Error deleting media:', error)
      setError('An error occurred while deleting the media')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    if (onEdit) onEdit()
  }

  const getFileTypeColor = (fileType) => {
    switch (fileType) {
      case 'image':
        return 'info'
      case 'document':
        return 'primary'
      case 'video':
        return 'danger'
      case 'audio':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
      {!Array.isArray(media) || media.length === 0 ? (
        <CAlert color="info">No media files found. Upload some files to get started.</CAlert>
      ) : (
        <>
          <CRow xs={{ cols: 1 }} md={{ cols: 2 }} lg={{ cols: 3 }} className="g-4">
            {media.map((item) => (
              <CCol key={item._id}>
                <CCard className="h-100">
                  <div className="media-card-preview">
                    {item.fileType === 'image' ? (
                      <img
                        src={`http://localhost:3001/${item.filePath}`}
                        alt={item.title}
                        className="img-fluid media-preview-img"
                      />
                    ) : (
                      <div className="media-type-icon">
                        {item.fileType === 'document' && <i className="far fa-file-alt fa-3x"></i>}
                        {item.fileType === 'video' && <i className="far fa-file-video fa-3x"></i>}
                        {item.fileType === 'audio' && <i className="far fa-file-audio fa-3x"></i>}
                        {item.fileType === 'other' && <i className="far fa-file fa-3x"></i>}
                      </div>
                    )}
                  </div>
                  <CCardBody>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <CCardTitle>{item.title}</CCardTitle>
                      <CBadge color={getFileTypeColor(item.fileType)}>{item.fileType}</CBadge>
                    </div>
                    {item.description && (
                      <CCardText className="text-truncate mb-2">{item.description}</CCardText>
                    )}
                    <CCardText className="text-muted small">
                      Size: {formatFileSize(item.fileSize)}
                    </CCardText>
                    <CCardText className="text-muted small">
                      Uploaded: {formatDate(item.createdAt || item.uploadedDate)}
                    </CCardText>
                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-2">
                        {item.tags &&
                          item.tags.map((tag, index) => (
                            <CBadge color="light" className="me-1 text-dark" key={index}>
                              {tag}
                            </CBadge>
                          ))}
                      </div>
                    )}
                  </CCardBody>
                  <CCardFooter className="d-flex justify-content-between">
                    <CButton color="info" variant="ghost" onClick={() => handleView(item)}>
                      <CIcon icon={cilMagnifyingGlass} className="me-1" /> View
                    </CButton>
                    <div>
                      <CButton
                        color="primary"
                        variant="ghost"
                        className="me-2"
                        onClick={() => handleEdit(item)}
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton
                        color="danger"
                        variant="ghost"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </div>
                  </CCardFooter>
                </CCard>
              </CCol>
            ))}
          </CRow>

          {/* Pagination */}
          {totalPages && totalPages > 1 && (
            <CPagination className="mt-4 justify-content-center" aria-label="Media pagination">
              <CPaginationItem
                aria-label="Previous"
                disabled={page === 1}
                onClick={() => onPageChange && onPageChange(page - 1)}
              >
                <span aria-hidden="true">&laquo;</span>
              </CPaginationItem>

              {[...Array(totalPages).keys()].map((number) => (
                <CPaginationItem
                  key={number + 1}
                  active={page === number + 1}
                  onClick={() => onPageChange && onPageChange(number + 1)}
                >
                  {number + 1}
                </CPaginationItem>
              ))}

              <CPaginationItem
                aria-label="Next"
                disabled={page === totalPages}
                onClick={() => onPageChange && onPageChange(page + 1)}
              >
                <span aria-hidden="true">&raquo;</span>
              </CPaginationItem>
            </CPagination>
          )}
        </>
      )}

      {/* View Media Modal */}
      <CModal visible={showDetailModal} onClose={() => setShowDetailModal(false)} size="lg">
        <CModalHeader onClose={() => setShowDetailModal(false)}>
          <CModalTitle>{selectedMedia?.title}</CModalTitle>
        </CModalHeader>
        <CModalBody>{selectedMedia && <MediaDetail media={selectedMedia} />}</CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit Media Modal */}
      <CModal visible={showEditModal} onClose={() => setShowEditModal(false)} size="lg">
        <CModalHeader onClose={() => setShowEditModal(false)}>
          <CModalTitle>Edit Media</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedMedia && (
            <MediaEdit
              media={selectedMedia}
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEditModal(false)}
            />
          )}
        </CModalBody>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader onClose={() => setShowDeleteModal(false)}>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {error && <CAlert color="danger">{error}</CAlert>}
          <p>
            Are you sure you want to delete <strong>{selectedMedia?.title}</strong>?
          </p>
          <p className="text-danger">This action cannot be undone.</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? <CSpinner size="sm" /> : 'Delete'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default MediaList
