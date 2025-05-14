import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormTextarea,
  CButton,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSend } from '@coreui/icons'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import CommentItem from '../Comments/CommentItem'

const DocumentComments = ({ documentId }) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (documentId) {
      fetchComments()
    }
  }, [documentId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`/api/comments/document/${documentId}`)
      if (response.data.success) {
        setComments(response.data.comments)
      } else {
        setError('Erreur lors de la récupération des commentaires')
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des commentaires:', err)
      setError('Erreur lors de la récupération des commentaires')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setSubmitting(true)
      setError(null)
      const response = await axios.post(`/api/comments/document/${documentId}`, {
        content: newComment,
      })

      if (response.data.success) {
        setComments([response.data.comment, ...comments])
        setNewComment('')
        toast.success('Commentaire ajouté avec succès')
      } else {
        setError('Erreur lors de l\'ajout du commentaire')
        toast.error('Erreur lors de l\'ajout du commentaire')
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout du commentaire:', err)
      setError('Erreur lors de l\'ajout du commentaire')
      toast.error('Erreur lors de l\'ajout du commentaire')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId) => {
    try {
      const response = await axios.delete(`/api/comments/${commentId}`)
      if (response.data.success) {
        setComments(comments.filter((comment) => comment._id !== commentId))
        toast.success('Commentaire supprimé avec succès')
      } else {
        toast.error('Erreur lors de la suppression du commentaire')
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du commentaire:', err)
      toast.error('Erreur lors de la suppression du commentaire')
    }
  }

  const handleUpdate = async (commentId, content) => {
    try {
      const response = await axios.put(`/api/comments/${commentId}`, { content })
      if (response.data.success) {
        setComments(
          comments.map((comment) =>
            comment._id === commentId ? { ...comment, content } : comment
          )
        )
        toast.success('Commentaire mis à jour avec succès')
      } else {
        toast.error('Erreur lors de la mise à jour du commentaire')
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du commentaire:', err)
      toast.error('Erreur lors de la mise à jour du commentaire')
    }
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>Commentaires</CCardHeader>
      <CCardBody>
        <CForm onSubmit={handleSubmit} className="mb-4">
          <CFormTextarea
            id="newComment"
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            disabled={submitting}
          />
          <div className="d-flex justify-content-end mt-2">
            <CButton type="submit" color="primary" disabled={submitting || !newComment.trim()}>
              {submitting ? (
                <CSpinner size="sm" color="light" />
              ) : (
                <>
                  <CIcon icon={cilSend} className="me-2" />
                  Envoyer
                </>
              )}
            </CButton>
          </div>
        </CForm>

        {error && <CAlert color="danger">{error}</CAlert>}

        {loading ? (
          <div className="text-center my-4">
            <CSpinner />
            <p className="mt-2">Chargement des commentaires...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-muted my-4">
            <p>Aucun commentaire pour le moment.</p>
          </div>
        ) : (
          <div className="comments-list">
            {comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </CCardBody>
    </CCard>
  )
}

export default DocumentComments
