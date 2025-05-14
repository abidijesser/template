import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CListGroup,
  CListGroupItem,
  CSpinner,
  CAlert,
  CBadge,
  CButton,
} from '@coreui/react'
import { getRecentComments } from '../../services/activityLogService'
import socketService from '../../services/socketService'
import CIcon from '@coreui/icons-react'
import { cilCommentSquare, cilArrowRight } from '@coreui/icons'

const RecentCommentsWidget = ({ limit = 5 }) => {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch recent comments when component mounts
  useEffect(() => {
    fetchRecentComments()

    // Listen for activity updates
    const unsubscribe = socketService.on('activityUpdated', (activity) => {
      // Only add comment activities
      if (activity.action === 'COMMENT') {
        setComments((prevComments) => {
          // Add the new comment at the beginning and keep only the latest 'limit' comments
          const updatedComments = [activity, ...prevComments]
          return updatedComments.slice(0, limit)
        })
      }
    })

    // Clean up when component unmounts
    return () => {
      unsubscribe()
    }
  }, [limit])

  const fetchRecentComments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getRecentComments(limit)

      if (response.success) {
        setComments(response.activityLogs)
      } else {
        setError('Failed to load recent comments')
      }
    } catch (err) {
      setError('Error loading comments: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)

    // Format: DD/MM/YYYY HH:MM:SS
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getCommentDescription = (activity) => {
    const userName = activity.user?.name || 'Unknown User'

    let entityType = ''
    let entityName = ''
    let entityLink = '#'

    if (activity.entityType === 'PROJECT') {
      entityType = 'projet'
      entityName = activity.project?.projectName || ''
      entityLink = `/projects/${activity.project?._id}`
    } else if (activity.entityType === 'TASK') {
      entityType = 'tâche'
      entityName = activity.task?.title || ''
      entityLink = `/tasks/${activity.task?._id}`
    } else if (activity.entityType === 'DOCUMENT') {
      entityType = 'document'
      entityName = 'document'
      entityLink = `/resources`
    }

    return {
      user: userName,
      text: `a commenté sur ${entityType}: ${entityName}`,
      link: entityLink,
    }
  }

  return (
    <CCard className="h-100">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <strong>Commentaires Récents</strong>
        <Link to="/activity" className="btn btn-sm btn-link">
          Voir Tous <CIcon icon={cilArrowRight} size="sm" />
        </Link>
      </CCardHeader>
      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        {loading ? (
          <div className="text-center my-3">
            <CSpinner />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-muted my-3">Aucun commentaire récent</div>
        ) : (
          <CListGroup>
            {comments.map((comment) => {
              const commentInfo = getCommentDescription(comment)
              return (
                <CListGroupItem key={comment._id} className="border-start-0 border-end-0">
                  <div className="d-flex">
                    <div className="me-3">
                      <CIcon icon={cilCommentSquare} size="xl" className="text-primary" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <CBadge color="primary">Commenté</CBadge>
                        </div>
                        <small className="text-muted">{formatDate(comment.timestamp)}</small>
                      </div>
                      <div className="mt-1">
                        <strong>{commentInfo.user}</strong> {commentInfo.text}
                      </div>
                      {comment.details?.content && (
                        <div className="mt-1 text-muted fst-italic">
                          "{comment.details.content}..."
                        </div>
                      )}
                      <div className="mt-2">
                        <Link to={commentInfo.link} className="btn btn-sm btn-outline-primary">
                          Voir
                        </Link>
                      </div>
                    </div>
                  </div>
                </CListGroupItem>
              )
            })}
          </CListGroup>
        )}
      </CCardBody>
    </CCard>
  )
}

export default RecentCommentsWidget
