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
  cilSwapHorizontal,
  cilArrowRight,
  cilFolder,
  cilTask,
} from '@coreui/icons'

const RecentActivityListWidget = ({ limit = 5 }) => {
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

      console.log('RecentActivityListWidget - response:', response)
      console.log('RecentActivityListWidget - activity logs:', response.activityLogs)
      console.log(
        'RecentActivityListWidget - activity types:',
        response.activityLogs?.map((a) => a.action),
      )

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

    // Format: DD/MM/YYYY HH:MM:SS
    return date
      .toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      .replace(',', '')
  }

  const getActivityIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return cilFolder
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
        return { color: 'success', text: 'Créé' }
      case 'UPDATE':
        return { color: 'info', text: 'Mis à jour' }
      case 'DELETE':
        return { color: 'danger', text: 'Supprimé' }
      case 'COMMENT':
        return { color: 'primary', text: 'Commenté' }
      case 'STATUS_CHANGE':
        return { color: 'warning', text: 'Statut modifié' }
      case 'ASSIGN':
        return { color: 'info', text: 'Assigné' }
      case 'COMPLETE':
        return { color: 'success', text: 'Terminé' }
      default:
        return { color: 'secondary', text: action }
    }
  }

  const getActivityDescription = (activity) => {
    const userName = activity.user?.name || 'Utilisateur inconnu'

    let entityType = ''
    let entityName = ''
    let entityLink = '#'
    let actionText = ''

    // Determine entity type and name
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

    // Determine action text
    switch (activity.action) {
      case 'CREATE':
        actionText = `a créé un nouveau ${entityType}`
        break
      case 'UPDATE':
        actionText = `a mis à jour le ${entityType}`
        break
      case 'DELETE':
        actionText = `a supprimé un ${entityType}`
        break
      case 'COMMENT':
        actionText = `a commenté sur ${entityType}`
        break
      case 'STATUS_CHANGE':
        actionText = `a changé le statut du ${entityType} à ${activity.details?.newStatus || ''}`
        break
      case 'ASSIGN':
        actionText = `a assigné le ${entityType} à ${activity.details?.assignedTo || ''}`
        break
      case 'COMPLETE':
        actionText = `a marqué le ${entityType} comme terminé`
        break
      default:
        actionText = `a effectué une action sur le ${entityType}`
    }

    return {
      user: userName,
      text: `${actionText}${entityName ? ': ' + entityName : ''}`,
      link: entityLink,
      details: activity.details?.content || '',
    }
  }

  return (
    <CCard className="dashboard-card h-100 shadow-sm d-flex flex-column">
      <CCardHeader className="dashboard-card-header d-flex justify-content-between align-items-center">
        <h4 className="mb-0 fs-5">
          <CIcon icon={cilNotes} className="me-2 text-primary" />
          Activités Récentes
        </h4>
        <Link to="/activity" className="btn btn-sm btn-link">
          Voir Toutes <CIcon icon={cilArrowRight} size="sm" />
        </Link>
      </CCardHeader>
      <CCardBody
        className="p-0"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
      >
        {error && <CAlert color="danger">{error}</CAlert>}

        {loading ? (
          <div className="text-center my-3">
            <CSpinner />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-muted my-3">Aucune activité récente</div>
        ) : (
          <>
            <div style={{ flex: '1 1 auto', overflowY: 'auto', maxHeight: 'calc(100% - 50px)' }}>
              {activities.map((activity, index) => {
                const activityInfo = getActivityDescription(activity)
                const badge = getActivityBadge(activity.action)
                return (
                  <div
                    key={activity._id}
                    className={`activity-item py-3 px-2 ${index < activities.length - 1 ? 'border-bottom' : ''}`}
                    style={{
                      transition: 'all 0.2s ease',
                      borderLeft: `3px solid var(--cui-${badge.color})`,
                      paddingLeft: '12px',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div className="d-flex">
                      {/* Left side - Icon */}
                      <div
                        className="activity-icon me-3 rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: `var(--cui-${badge.color})`,
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <CIcon
                          icon={getActivityIcon(activity.action)}
                          className="text-white"
                          size="sm"
                        />
                      </div>

                      {/* Right side - Content */}
                      <div className="d-flex flex-column flex-grow-1">
                        {/* Top row - User and timestamp */}
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="fw-bold" style={{ fontSize: '0.9rem', color: '#333' }}>
                            {activityInfo.user}
                          </div>
                          <div
                            className="text-muted small"
                            style={{
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatDate(activity.timestamp)}
                          </div>
                        </div>

                        {/* Bottom row - Badge and activity text */}
                        <div>
                          <CBadge
                            color={badge.color}
                            className="me-2"
                            style={{
                              fontWeight: '500',
                              padding: '3px 6px',
                              fontSize: '0.75rem',
                            }}
                          >
                            {badge.text}
                          </CBadge>
                          <span style={{ fontSize: '0.85rem' }}>{activityInfo.text}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="text-center py-2 border-top" style={{ flex: '0 0 auto', marginTop: 0 }}>
              <Link
                to="/activity"
                className="btn btn-sm btn-outline-primary"
                style={{
                  fontWeight: '500',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  margin: '0',
                }}
              >
                Voir toutes les activités
              </Link>
            </div>
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default RecentActivityListWidget
