import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CButton,
  CFormTextarea,
  CSpinner,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilOptions, cilPencil, cilTrash } from '@coreui/icons'
import './CommentItem.css'

const CommentItem = ({ comment, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(comment.content)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  // Check if the current user is the author of the comment
  const isAuthor = () => {
    const userId = localStorage.getItem('userId')
    return userId === comment.author?._id
  }

  // Format date in a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Handle comment update
  const handleUpdate = async () => {
    if (!editedContent.trim() || editedContent === comment.content) {
      setIsEditing(false)
      setEditedContent(comment.content)
      return
    }

    setIsSubmitting(true)
    try {
      await onUpdate(comment._id, editedContent)
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du commentaire:', error)
      setEditedContent(comment.content)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle comment deletion
  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      try {
        await onDelete(comment._id)
      } catch (error) {
        console.error('Erreur lors de la suppression du commentaire:', error)
      }
    }
  }

  return (
    <CCard className="comment-item mb-3">
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start">
          <div className="comment-header">
            <div className="comment-author">
              <strong>{comment.author?.name || 'Utilisateur inconnu'}</strong>
            </div>
            <div className="comment-date text-muted">
              {formatDate(comment.createdAt)}
              {comment.updatedAt !== comment.createdAt && ' (modifié)'}
            </div>
          </div>
          {isAuthor() && (
            <CDropdown alignment="end">
              <CDropdownToggle
                color="transparent"
                caret={false}
                className="p-0"
                onClick={() => setShowOptions(!showOptions)}
              >
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => setIsEditing(true)}>
                  <CIcon icon={cilPencil} className="me-2" />
                  Modifier
                </CDropdownItem>
                <CDropdownItem onClick={handleDelete}>
                  <CIcon icon={cilTrash} className="me-2" />
                  Supprimer
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          )}
        </div>

        {isEditing ? (
          <div className="mt-3">
            <CFormTextarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
            <div className="d-flex justify-content-end mt-2">
              <CButton
                color="secondary"
                variant="outline"
                size="sm"
                className="me-2"
                onClick={() => {
                  setIsEditing(false)
                  setEditedContent(comment.content)
                }}
                disabled={isSubmitting}
              >
                Annuler
              </CButton>
              <CButton
                color="primary"
                size="sm"
                onClick={handleUpdate}
                disabled={isSubmitting || !editedContent.trim() || editedContent === comment.content}
              >
                {isSubmitting ? <CSpinner size="sm" /> : 'Enregistrer'}
              </CButton>
            </div>
          </div>
        ) : (
          <div className="comment-content mt-2">{comment.content}</div>
        )}
      </CCardBody>
    </CCard>
  )
}

export default CommentItem
