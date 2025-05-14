import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import './WidgetsDropdown.css'

import {
  CRow,
  CCol,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownToggle,
  CWidgetStatsA,
  CCard,
  CCardBody,
  CTooltip,
} from '@coreui/react'
import { getStyle } from '@coreui/utils'
import { CChartBar, CChartLine, CChartDoughnut } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import {
  cilArrowBottom,
  cilArrowTop,
  cilOptions,
  cilTask,
  cilPeople,
  cilCalendar,
  cilSpeedometer,
  cilInfo,
  cilFolder
} from '@coreui/icons'

const WidgetsDropdown = (props) => {
  const widgetChartRef1 = useRef(null)
  const widgetChartRef2 = useRef(null)
  const [isLoading, setIsLoading] = useState(false)

  // Données fictives pour les statistiques du tableau de bord
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 12,
    activeProjects: 8,
    completedProjects: 4,
    projectsGrowth: 16.7,

    totalTasks: 48,
    completedTasks: 29,
    pendingTasks: 14,
    overdueTasks: 5,
    tasksGrowth: 8.3,

    teamMembers: 15,
    activeMembers: 12,
    membersGrowth: 20,

    upcomingDeadlines: 7,
    deadlinesThisWeek: 3,
    deadlinesNextWeek: 4,
    deadlinesGrowth: -5.2,
  })

  // Données pour les graphiques
  const projectStatusData = {
    labels: ['Actifs', 'Terminés', 'En pause'],
    datasets: [
      {
        data: [dashboardStats.activeProjects, dashboardStats.completedProjects, 0],
        backgroundColor: ['#321fdb', '#2eb85c', '#e55353'],
        hoverBackgroundColor: ['#1b2e83', '#1e7e3c', '#a93636'],
      },
    ],
  }

  const taskStatusData = {
    labels: ['Terminées', 'En cours', 'En retard'],
    datasets: [
      {
        data: [dashboardStats.completedTasks, dashboardStats.pendingTasks, dashboardStats.overdueTasks],
        backgroundColor: ['#2eb85c', '#f9b115', '#e55353'],
        hoverBackgroundColor: ['#1e7e3c', '#c58a10', '#a93636'],
      },
    ],
  }

  useEffect(() => {
    // Simuler le chargement des données
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    // Nettoyage
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (widgetChartRef1.current) {
        setTimeout(() => {
          widgetChartRef1.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-primary')
          widgetChartRef1.current.update()
        })
      }

      if (widgetChartRef2.current) {
        setTimeout(() => {
          widgetChartRef2.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-info')
          widgetChartRef2.current.update()
        })
      }
    })
  }, [widgetChartRef1, widgetChartRef2])

  return (
    <div className="dashboard-widgets">
      {/* Les 4 premières cartes ont été supprimées */}

      {/* Deuxième rangée - Statistiques détaillées */}
      <CRow className="mb-4">
        {/* Progression des projets */}
        <CCol md={6} xl={4}>
          <CCard className="mb-4 h-100 shadow-sm">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0 fs-5">Progression des projets</h4>
                <CTooltip content="Répartition des projets par statut">
                  <CIcon icon={cilInfo} className="text-muted" size="sm" />
                </CTooltip>
              </div>
              <div className="chart-container" style={{ height: '180px' }}>
                <CChartDoughnut
                  data={projectStatusData}
                  options={{
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          pointStyle: 'circle',
                          padding: 15,
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.raw / total) * 100);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                          }
                        }
                      }
                    },
                    cutout: '65%',
                    maintainAspectRatio: false,
                  }}
                />
              </div>
              <div className="text-center mt-3">
                <Link to="/projects" className="btn btn-sm btn-outline-primary">
                  Voir tous les projets
                </Link>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Statut des tâches */}
        <CCol md={6} xl={4}>
          <CCard className="mb-4 h-100 shadow-sm">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0 fs-5">Statut des tâches</h4>
                <CTooltip content="Répartition des tâches par statut">
                  <CIcon icon={cilInfo} className="text-muted" size="sm" />
                </CTooltip>
              </div>
              <div className="chart-container" style={{ height: '180px' }}>
                <CChartDoughnut
                  data={taskStatusData}
                  options={{
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          pointStyle: 'circle',
                          padding: 15,
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.raw / total) * 100);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                          }
                        }
                      }
                    },
                    cutout: '65%',
                    maintainAspectRatio: false,
                  }}
                />
              </div>
              <div className="text-center mt-3">
                <Link to="/tasks" className="btn btn-sm btn-outline-primary">
                  Voir toutes les tâches
                </Link>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Efficacité de l'équipe */}
        <CCol md={6} xl={4}>
          <CCard className="mb-4 h-100 shadow-sm">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0 fs-5">Efficacité de l'équipe</h4>
                <CTooltip content="Taux de complétion des tâches par rapport aux délais">
                  <CIcon icon={cilInfo} className="text-muted" size="sm" />
                </CTooltip>
              </div>
              <div className="text-center my-4">
                <div className="progress-circle-container position-relative mx-auto" style={{ width: '150px', height: '150px' }}>
                  <div className="position-absolute top-50 start-50 translate-middle text-center">
                    <div className="fs-1 fw-bold">78%</div>
                    <div className="text-muted small">Efficacité</div>
                  </div>
                  <CChartDoughnut
                    data={{
                      datasets: [{
                        data: [78, 22],
                        backgroundColor: ['#2eb85c', '#ebedef'],
                        borderWidth: 0,
                      }]
                    }}
                    options={{
                      cutout: '80%',
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          enabled: false
                        }
                      },
                      rotation: -90,
                      circumference: 180,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </div>
              <div className="text-center mt-3">
                <Link to="/performances" className="btn btn-sm btn-outline-primary">
                  Voir les performances
                </Link>
              </div>
            </CCardBody>
          </CCard>
        </CCol>


      </CRow>
    </div>
  )
}

WidgetsDropdown.propTypes = {
  className: PropTypes.string,
  withCharts: PropTypes.bool,
}

export default WidgetsDropdown
