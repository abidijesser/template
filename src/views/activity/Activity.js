import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CListGroup,
  CListGroupItem,
  CSpinner,
  CAlert,
  CPagination,
  CPaginationItem,
  CBadge,
  CFormSelect,
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
  cilFolder,
} from '@coreui/icons'
import { Link } from 'react-router-dom'
import './Activity.css'

const Activity = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    skip: 0,
  })
  const [filter, setFilter] = useState('all')

  // Fetch activity logs when component mounts
  useEffect(() => {
    fetchActivityLogs()

    // Listen for activity updates
    const unsubscribe = socketService.on('activityUpdated', (activity) => {
      setActivities((prevActivities) => [activity, ...prevActivities])
    })

    // Clean up when component unmounts
    return () => {
      unsubscribe()
    }
  }, [pagination.skip, pagination.limit, filter])

  const fetchActivityLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch activity logs with pagination and filtering
      const response = await getRecentActivityLogs(pagination.limit, pagination.skip, filter)

      console.log('Activity logs response:', response)
      console.log('Activity logs data:', response.activityLogs)
      console.log('Pagination info:', response.pagination)

      if (response.success) {
        setActivities(response.activityLogs)

        // Update pagination with server response
        if (response.pagination) {
          setPagination(response.pagination)
        }

        // Log the activity types to help with debugging
        const activityTypes = [...new Set(response.activityLogs.map((a) => a.action))]
        console.log('All activity types in data:', activityTypes)
        console.log('Current filter:', filter)
        console.log('Activities count:', response.activityLogs.length)
        console.log('Total activities:', response.pagination?.total || 'unknown')
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

  const handleFilterChange = (e) => {
    // Reset pagination when filter changes
    setPagination((prev) => ({
      ...prev,
      skip: 0,
    }))
    setFilter(e.target.value)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
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
    <div className="animated fadeIn activity-page">
      <CRow>
        <CCol lg={12}>
          <CCard className="mb-4 activity-card">
            <CCardHeader className="activity-card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Historique des Activités</h4>
              <CFormSelect className="activity-filter" value={filter} onChange={handleFilterChange}>
                <option value="all">Toutes les activités</option>
                <option value="CREATE">Créations</option>
                <option value="UPDATE">Mises à jour</option>
                <option value="DELETE">Suppressions</option>
                <option value="COMMENT">Commentaires</option>
                <option value="STATUS_CHANGE">Changements de statut</option>
              </CFormSelect>
            </CCardHeader>
            <CCardBody className="p-3 p-md-4">
              {error && <CAlert color="danger">{error}</CAlert>}

              {loading ? (
                <div className="text-center my-5">
                  <CSpinner color="primary" />
                  <p className="mt-3 text-muted">Chargement des activités...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center text-muted my-5">
                  <div className="mb-3">
                    <CIcon icon={filter !== 'all' ? getActivityIcon(filter) : cilNotes} size="xl" />
                  </div>
                  <h5>Aucune activité trouvée</h5>
                  <p className="text-muted">
                    {filter !== 'all'
                      ? "Essayez de changer le filtre pour voir d'autres types d'activités"
                      : "Aucune activité n'a été enregistrée pour le moment"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="activity-timeline">
                    {activities.map((activity, index) => {
                      const activityInfo = getActivityDescription(activity)
                      const badge = getActivityBadge(activity.action)
                      return (
                        <div key={activity._id} className="activity-item d-flex">
                          <div
                            className="activity-icon d-flex align-items-center justify-content-center"
                            style={{
                              backgroundColor: `var(--cui-${badge.color})`,
                            }}
                          >
                            <CIcon
                              icon={getActivityIcon(activity.action)}
                              className="text-white"
                              size="sm"
                            />
                          </div>
                          <div className="activity-content flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div className="activity-user">{activityInfo.user}</div>
                              <div className="activity-time">{formatDate(activity.timestamp)}</div>
                            </div>
                            <div className="activity-text">
                              <CBadge color={badge.color} className="activity-badge">
                                {badge.text}
                              </CBadge>
                              <span>{activityInfo.text}</span>
                            </div>
                            {activity.action === 'COMMENT' && activityInfo.details && (
                              <div className="activity-details">"{activityInfo.details}..."</div>
                            )}
                            <div className="activity-action">
                              <Link
                                to={activityInfo.link}
                                className="btn btn-sm btn-outline-primary"
                              >
                                Voir
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {pagination.total > pagination.limit && (
                    <CPagination
                      className="activity-pagination justify-content-center mt-4"
                      aria-label="Pagination des activités"
                    >
                      <CPaginationItem
                        aria-label="Précédent"
                        disabled={pagination.skip === 0}
                        onClick={() =>
                          handlePageChange(Math.floor(pagination.skip / pagination.limit))
                        }
                      >
                        <span aria-hidden="true">&laquo;</span>
                      </CPaginationItem>

                      {(() => {
                        const totalPages = Math.ceil(pagination.total / pagination.limit)
                        const currentPage = Math.floor(pagination.skip / pagination.limit) + 1

                        // Determine which page numbers to show
                        let startPage = Math.max(1, currentPage - 2)
                        let endPage = Math.min(totalPages, startPage + 4)

                        // Adjust if we're near the end
                        if (endPage - startPage < 4) {
                          startPage = Math.max(1, endPage - 4)
                        }

                        const pages = []

                        // Add first page and ellipsis if needed
                        if (startPage > 1) {
                          pages.push(
                            <CPaginationItem key={1} onClick={() => handlePageChange(1)}>
                              1
                            </CPaginationItem>,
                          )
                          if (startPage > 2) {
                            pages.push(
                              <CPaginationItem key="ellipsis1" disabled>
                                ...
                              </CPaginationItem>,
                            )
                          }
                        }

                        // Add page numbers
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <CPaginationItem
                              key={i}
                              active={i === currentPage}
                              onClick={() => handlePageChange(i)}
                            >
                              {i}
                            </CPaginationItem>,
                          )
                        }

                        // Add last page and ellipsis if needed
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <CPaginationItem key="ellipsis2" disabled>
                                ...
                              </CPaginationItem>,
                            )
                          }
                          pages.push(
                            <CPaginationItem
                              key={totalPages}
                              onClick={() => handlePageChange(totalPages)}
                            >
                              {totalPages}
                            </CPaginationItem>,
                          )
                        }

                        return pages
                      })()}

                      <CPaginationItem
                        aria-label="Suivant"
                        disabled={pagination.skip + pagination.limit >= pagination.total}
                        onClick={() =>
                          handlePageChange(Math.floor(pagination.skip / pagination.limit) + 2)
                        }
                      >
                        <span aria-hidden="true">&raquo;</span>
                      </CPaginationItem>
                    </CPagination>
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default Activity
