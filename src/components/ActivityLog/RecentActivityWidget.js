import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CListGroup,
  CListGroupItem,
  CSpinner,
  CAlert,
  CBadge
} from '@coreui/react'
import { getRecentActivityLogs } from '../../services/activityLogService'
import socketService from '../../services/socketService'
import CIcon from '@coreui/icons-react'
import {
  cilPencil,
  cilTrash,
  cilCommentSquare,
  cilCheckAlt,
  cilNotes,
  cilUser,
  cilSwapHorizontal
} from '@coreui/icons'

const RecentActivityWidget = ({ limit = 5 }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch recent activity logs when component mounts
  useEffect(() => {
    fetchRecentActivityLogs()

    // Listen for activity updates
    const unsubscribe = socketService.on('activityUpdated', (activity) => {
      setActivities((prevActivities) => {
        // Add the new activity at the beginning and keep only the latest 'limit' activities
        const updatedActivities = [activity, ...prevActivities]
        return updatedActivities.slice(0, limit)
      })
    })

    // Clean up when component unmounts
    return () => {
      unsubscribe()
    }
  }, [limit])

  const fetchRecentActivityLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getRecentActivityLogs(limit)

      if (response.success) {
        setActivities(response.activityLogs)
      } else {
        setError('Failed to load recent activities')
      }
    } catch (err) {
      setError('Error loading activities: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getActivityIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return cilNotes
      case 'UPDATE':
        return cilPencil
      case 'DELETE':
        return cilTrash
      case 'COMMENT':
        return cilCommentSquare
      case 'STATUS_CHANGE':
        return cilSwapHorizontal
      case 'ASSIGN':
        return cilUser
      case 'COMPLETE':
        return cilCheckAlt
      default:
        return cilNotes
    }
  }

  const getActivityBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return { color: 'success', text: 'Created' }
      case 'UPDATE':
        return { color: 'info', text: 'Updated' }
      case 'DELETE':
        return { color: 'danger', text: 'Deleted' }
      case 'COMMENT':
        return { color: 'primary', text: 'Commented' }
      case 'STATUS_CHANGE':
        return { color: 'warning', text: 'Status Changed' }
      case 'ASSIGN':
        return { color: 'info', text: 'Assigned' }
      case 'COMPLETE':
        return { color: 'success', text: 'Completed' }
      default:
        return { color: 'secondary', text: action }
    }
  }

  const getActivityDescription = (activity) => {
    const userName = activity.user?.name || 'Unknown User'
    const entityType = activity.entityType.toLowerCase()
    const entityName = activity.task?.title || activity.project?.projectName || ''
    
    let description = ''
    
    switch (activity.action) {
      case 'CREATE':
        description = `created a new ${entityType}`
        break
      case 'UPDATE':
        description = `updated the ${entityType}`
        break
      case 'DELETE':
        description = `deleted a ${entityType}`
        break
      case 'COMMENT':
        description = `commented on ${entityType}`
        break
      case 'STATUS_CHANGE':
        description = `changed status of ${entityType} to ${activity.details?.newStatus || ''}`
        break
      case 'ASSIGN':
        description = `assigned the ${entityType} to ${activity.details?.assignedTo || ''}`
        break
      case 'COMPLETE':
        description = `marked the ${entityType} as complete`
        break
      default:
        description = `performed an action on the ${entityType}`
    }
    
    return `${userName} ${description}${entityName ? `: ${entityName}` : ''}`
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>Recent Activity</strong>
      </CCardHeader>
      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        {loading ? (
          <div className="text-center my-3">
            <CSpinner />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-muted my-3">No recent activity</div>
        ) : (
          <CListGroup>
            {activities.map((activity) => {
              const badge = getActivityBadge(activity.action)
              return (
                <CListGroupItem key={activity._id} className="border-start-0 border-end-0">
                  <div className="d-flex">
                    <div className="me-3">
                      <CIcon icon={getActivityIcon(activity.action)} size="xl" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <CBadge color={badge.color}>{badge.text}</CBadge>
                        </div>
                        <small className="text-muted">{formatDate(activity.timestamp)}</small>
                      </div>
                      <div className="mt-1">{getActivityDescription(activity)}</div>
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

export default RecentActivityWidget
