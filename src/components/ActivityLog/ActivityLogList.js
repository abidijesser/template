import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CListGroup,
  CListGroupItem,
  CSpinner,
  CAlert,
  CPagination,
  CPaginationItem,
  CBadge,
} from '@coreui/react'
import { getProjectActivityLogs, getTaskActivityLogs } from '../../services/activityLogService'
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
} from '@coreui/icons'

const ActivityLogList = ({ entityType, entityId }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    skip: 0,
  })

  // Fetch activity logs when component mounts
  useEffect(() => {
    fetchActivityLogs()

    // Join the socket room for this entity
    socketService.joinRoom(entityType, entityId)

    // Listen for new activities
    const unsubscribe = socketService.on('activityAdded', (activity) => {
      // Only add the activity if it's for this entity
      if (
        (entityType === 'task' && activity.task === entityId) ||
        (entityType === 'project' && activity.project === entityId)
      ) {
        setActivities((prevActivities) => [activity, ...prevActivities])
      }
    })

    // Clean up when component unmounts
    return () => {
      socketService.leaveRoom(entityType, entityId)
      unsubscribe()
    }
  }, [entityType, entityId, pagination.skip, pagination.limit])

  const fetchActivityLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      let response
      if (entityType === 'task') {
        response = await getTaskActivityLogs(entityId, pagination.limit, pagination.skip)
      } else if (entityType === 'project') {
        response = await getProjectActivityLogs(entityId, pagination.limit, pagination.skip)
      }

      if (response.success) {
        setActivities(response.activityLogs)
        setPagination(response.pagination)
      } else {
        setError('Failed to load activity logs')
      }
    } catch (err) {
      setError('Error loading activity logs: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    const newSkip = (page - 1) * pagination.limit
    setPagination((prev) => ({
      ...prev,
      skip: newSkip,
    }))
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

    // Translate entity type to French
    switch (activity.entityType) {
      case 'PROJECT':
        entityType = 'projet'
        break
      case 'TASK':
        entityType = 'tâche'
        break
      case 'COMMENT':
        entityType = 'commentaire'
        break
      case 'USER':
        entityType = 'utilisateur'
        break
      default:
        entityType = activity.entityType.toLowerCase()
    }

    switch (activity.action) {
      case 'CREATE':
        return `${userName} a créé un nouveau ${entityType}`
      case 'UPDATE':
        return `${userName} a mis à jour le ${entityType}`
      case 'DELETE':
        return `${userName} a supprimé un ${entityType}`
      case 'COMMENT':
        return `${userName} a commenté: "${activity.details?.content || ''}"`
      case 'STATUS_CHANGE':
        return `${userName} a changé le statut en ${activity.details?.newStatus || ''}`
      case 'ASSIGN':
        return `${userName} a assigné le ${entityType} à ${activity.details?.assignedTo || ''}`
      case 'COMPLETE':
        return `${userName} a marqué le ${entityType} comme terminé`
      default:
        return `${userName} a effectué une action sur le ${entityType}`
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>Historique d'activité</strong>
      </CCardHeader>
      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        {loading ? (
          <div className="text-center my-3">
            <CSpinner />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-muted my-3">Aucune activité enregistrée</div>
        ) : (
          <>
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
                            <strong>{activity.user?.name || 'Utilisateur inconnu'}</strong>{' '}
                            <CBadge color={badge.color}>{badge.text}</CBadge>
                          </div>
                          <small className="text-muted">{formatDate(activity.timestamp)}</small>
                        </div>
                        <div className="mt-2">{getActivityDescription(activity)}</div>
                      </div>
                    </div>
                  </CListGroupItem>
                )
              })}
            </CListGroup>

            {totalPages > 1 && (
              <CPagination
                className="mt-3 justify-content-center"
                aria-label="Pagination de l'historique d'activité"
              >
                <CPaginationItem
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Précédent
                </CPaginationItem>

                {[...Array(totalPages).keys()].map((page) => (
                  <CPaginationItem
                    key={page + 1}
                    active={currentPage === page + 1}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    {page + 1}
                  </CPaginationItem>
                ))}

                <CPaginationItem
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Suivant
                </CPaginationItem>
              </CPagination>
            )}
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default ActivityLogList
