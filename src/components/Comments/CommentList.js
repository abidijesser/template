import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CListGroup,
  CListGroupItem,
  CFormTextarea,
  CButton,
  CSpinner,
  CAlert,
  CAvatar,
} from '@coreui/react'
import './comments.css'
import {
  getTaskComments,
  getProjectComments,
  createTaskComment,
  createProjectComment,
} from '../../services/commentService'
import socketService from '../../services/socketService'
import CIcon from '@coreui/icons-react'
import { cilUser, cilSend } from '@coreui/icons'

// Function to generate consistent colors for user avatars
const getAvatarColor = (name) => {
  // List of CoreUI colors
  const colors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark']

  // Generate a hash from the name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Use the hash to pick a color
  const colorIndex = Math.abs(hash) % colors.length
  return colors[colorIndex]
}

const CommentList = ({ entityType, entityId }) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch comments when component mounts
  useEffect(() => {
    fetchComments()

    // Join the socket room for this entity
    socketService.joinRoom(entityType, entityId)

    // Listen for new comments
    const unsubscribe = socketService.on('commentAdded', (comment) => {
      // Only add the comment if it's for this entity
      if (
        (entityType === 'task' && comment.taskId === entityId) ||
        (entityType === 'project' && comment.projectId === entityId)
      ) {
        setComments((prevComments) => {
          // Check if comment already exists to prevent duplicates
          const commentExists = prevComments.some((c) => c._id === comment._id)
          if (commentExists) {
            return prevComments
          }
          return [comment, ...prevComments]
        })
      }
    })

    // Clean up when component unmounts
    return () => {
      socketService.leaveRoom(entityType, entityId)
      unsubscribe()
    }
  }, [entityType, entityId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      setError(null)

      let response
      if (entityType === 'task') {
        response = await getTaskComments(entityId)
      } else if (entityType === 'project') {
        response = await getProjectComments(entityId)
      }

      if (response.success) {
        setComments(response.comments)
      } else {
        setError('Failed to load comments')
      }
    } catch (err) {
      setError('Error loading comments: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    try {
      setSubmitting(true)
      setError(null)

      let response
      if (entityType === 'task') {
        response = await createTaskComment(entityId, newComment)
      } else if (entityType === 'project') {
        try {
          console.log(`Submitting comment for project ${entityId}:`, newComment)
          response = await createProjectComment(entityId, newComment)
          console.log('Project comment response:', response)
        } catch (projectCommentError) {
          console.error('Error in createProjectComment:', projectCommentError)
          const errorDetails = projectCommentError.response?.data?.details || ''
          throw new Error(
            `Failed to create project comment: ${projectCommentError.message}. ${errorDetails}`,
          )
        }
      }

      if (response && response.success) {
        setNewComment('')
        // The comment will be added via the socket listener
      } else {
        const errorMessage = response?.error || 'Failed to add comment'
        console.error('Comment submission failed:', errorMessage)
        setError(errorMessage)
      }
    } catch (err) {
      console.error('Comment submission error:', err)

      // Extract the most useful error message
      let errorMessage = 'An error occurred while adding your comment'

      if (err.response?.data?.error) {
        // Server returned a specific error message
        errorMessage = err.response.data.error
      } else if (err.message && err.message.includes('validation failed')) {
        // This is a validation error, simplify it
        errorMessage = 'The comment could not be saved due to validation issues'
      } else if (err.message) {
        // Use the error message but remove technical details
        errorMessage = err.message
          .replace(/^Error: Failed to create .* comment: /, '')
          .replace(/^Request failed with status code \d+\. /, '')
      }

      setError(`Error: ${errorMessage}`)

      // Check if token is expired or invalid
      if (err.response?.status === 401) {
        // Token might be expired, try to refresh or redirect to login
        localStorage.removeItem('token')
        alert('Your session has expired. Please log in again.')
        window.location.href = '/login'
      }

      // Automatically clear error after 5 seconds
      setTimeout(() => {
        setError(null)
      }, 5000)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    // If less than a minute ago
    if (diffSec < 60) {
      return 'Just now'
    }
    // If less than an hour ago
    else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`
    }
    // If less than a day ago
    else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`
    }
    // If less than a week ago
    else if (diffDay < 7) {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`
    }
    // Otherwise show the full date
    else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>Comments</strong>
      </CCardHeader>
      <CCardBody>
        {error && (
          <CAlert color="danger" dismissible onClose={() => setError(null)}>
            <div className="d-flex align-items-center">
              <div className="me-3">
                <i className="fa fa-exclamation-circle" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div>{error}</div>
            </div>
          </CAlert>
        )}

        <div className="mb-4 comment-form">
          <div className="d-flex">
            <div className="me-3">
              <CAvatar color="primary" textColor="white" size="md">
                {localStorage.getItem('userName')?.charAt(0)?.toUpperCase() || 'U'}
              </CAvatar>
            </div>
            <div className="flex-grow-1">
              <CFormTextarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                disabled={submitting}
                className="comment-textarea"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
                    e.preventDefault()
                    handleSubmitComment()
                  }
                }}
              />
              <div className="d-flex justify-content-between align-items-center mt-2">
                <small className="text-muted">Press Enter to send, Shift+Enter for new line</small>
                <CButton
                  color="primary"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  size="sm"
                >
                  {submitting ? <CSpinner size="sm" /> : <CIcon icon={cilSend} className="me-1" />}
                  Send
                </CButton>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center my-3">
            <CSpinner />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-muted my-3">No comments yet</div>
        ) : (
          <CListGroup>
            {comments.map((comment) => (
              <CListGroupItem key={comment._id} className="border-start-0 border-end-0 py-3">
                <div className="d-flex">
                  <div className="me-3">
                    {comment.author?.name ? (
                      <CAvatar
                        color={getAvatarColor(comment.author.name)}
                        textColor="white"
                        size="md"
                      >
                        {comment.author.name.charAt(0).toUpperCase()}
                      </CAvatar>
                    ) : (
                      <CAvatar color="secondary" size="md">
                        <CIcon icon={cilUser} />
                      </CAvatar>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="me-2">{comment.author?.name || 'Unknown User'}</strong>
                        <small className="text-muted">{formatDate(comment.createdAt)}</small>
                      </div>
                    </div>
                    <div className="mt-2 comment-content">{comment.content}</div>
                  </div>
                </div>
              </CListGroupItem>
            ))}
          </CListGroup>
        )}
      </CCardBody>
    </CCard>
  )
}

export default CommentList
