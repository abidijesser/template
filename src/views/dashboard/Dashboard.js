// filepath: c:\Users\Lenovo\Desktop\pi1\MERN-Project-Manager\Client\src\views\dashboard\Dashboard.js
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPeople,
  cilChart,
  cilTask,
  cilCalendar,
  cilFolder,
  cilArrowRight,
  cilCheck,
  cilSpeedometer,
  cilLightbulb,
  cilSettings,
  cilPuzzle,
  cilGraph,
  cilBriefcase,
  cilChatBubble,
} from '@coreui/icons'

import projectManagementImage from 'src/assets/images/gestion_projet.png'
import worktrackLogo from 'src/assets/images/worktrack-logo.svg'

import WidgetsDropdown from '../widgets/WidgetsDropdown'
import MainChart from './MainChart'

import RecentActivityListWidget from '../../components/ActivityLog/RecentActivityListWidget'
import UpcomingEvents from '../../components/UpcomingEvents/UpcomingEvents'
import TeamMembersWidget from '../../components/dashboard/TeamMembersWidget'
import socketService from '../../services/socketService'
import { getProjectsForDashboard } from '../../services/dashboardService'
import './Dashboard.css'

const Dashboard = () => {
  const [dashboardProjects, setDashboardProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [allProjects, setAllProjects] = useState([])

  // Fonction pour sélectionner des projets aléatoires à afficher
  const selectRandomProjects = () => {
    if (allProjects.length === 0) return

    // Indiquer le chargement
    setLoading(true)

    // Sélectionner 3 projets aléatoires pour l'affichage
    let randomProjects = [...allProjects]

    // Mélanger les projets et prendre les 3 premiers
    randomProjects = randomProjects.sort(() => 0.5 - Math.random())

    // Limiter à 3 projets si nécessaire
    if (randomProjects.length > 3) {
      randomProjects = randomProjects.slice(0, 3)
    }

    // Mettre à jour l'affichage avec les projets aléatoires
    setDashboardProjects(randomProjects)

    // Terminer le chargement après un court délai pour l'effet visuel
    setTimeout(() => {
      setLoading(false)
    }, 300)
  }

  // Fonction pour récupérer les projets pour le tableau de bord
  const fetchDashboardProjects = async () => {
    try {
      setLoading(true)

      // Récupérer tous les projets pour la fonction aléatoire
      const allProjectsData = await getProjectsForDashboard(0) // 0 = tous les projets

      console.log('Tous les projets récupérés:', allProjectsData.length)

      if (allProjectsData.length === 0) {
        console.log('Aucun projet trouvé')
        setAllProjects([])
        setDashboardProjects([])
        return
      }

      setAllProjects(allProjectsData)

      // Sélectionner 3 projets aléatoires pour l'affichage
      let displayProjects = allProjectsData
      if (allProjectsData.length > 3) {
        // Mélanger les projets et prendre les 3 premiers
        displayProjects = [...allProjectsData].sort(() => 0.5 - Math.random()).slice(0, 3)
      }

      console.log('Dashboard projects received:', displayProjects)

      // Vérifier que chaque projet a les informations nécessaires
      displayProjects = displayProjects.map((project) => {
        // S'assurer que progress est un nombre
        if (typeof project.progress !== 'number') {
          project.progress = 0
        }

        // S'assurer que tasks et completedTasks sont définis
        if (typeof project.tasks !== 'number') {
          project.tasks = 0
        }

        if (typeof project.completedTasks !== 'number') {
          project.completedTasks = 0
        }

        return project
      })

      // Log task counts for each project
      displayProjects.forEach((project) => {
        console.log(
          `Dashboard - Project ${project.title}: ${project.completedTasks}/${project.tasks} tasks, Progress: ${project.progress}%`,
        )
      })

      setDashboardProjects(displayProjects)
    } catch (error) {
      console.error('Erreur lors de la récupération des projets pour le tableau de bord:', error)
      // En cas d'erreur, définir des tableaux vides
      setAllProjects([])
      setDashboardProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Connect to socket for real-time updates
    socketService.connect()

    // Récupérer les projets pour le tableau de bord
    fetchDashboardProjects()

    return () => {
      // Clean up socket connection when component unmounts
      socketService.disconnect()
    }
  }, [])

  return (
    <>
      {/* Section Héro */}
      <section
        className="hero-section text-center py-5 text-white"
        style={{
          background: 'linear-gradient(135deg, #321fdb 0%, #1f67db 50%, #1f9adb 100%)',
          borderRadius: '15px',
          boxShadow: '0 10px 30px rgba(50, 31, 219, 0.25)',
          margin: '0 15px 30px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cercles décoratifs */}
        <div
          className="circle-decoration"
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            zIndex: 1,
          }}
        ></div>
        <div
          className="circle-decoration"
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            zIndex: 1,
          }}
        ></div>

        {/* Éléments décoratifs supplémentaires */}
        <div
          className="circle-decoration"
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            zIndex: 1,
          }}
        ></div>
        <div
          className="circle-decoration"
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            zIndex: 1,
          }}
        ></div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Logo WorkTrack - Position centrée améliorée */}
          <div
            className="mb-4"
            style={{
              animation: 'fadeInUp 0.8s ease-out forwards',
              marginBottom: '30px',
            }}
          >
            <img
              src={worktrackLogo}
              alt="WorkTrack Logo"
              style={{
                height: '130px',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>

          <h1
            className="display-4 fw-bold"
            style={{
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              letterSpacing: '0.5px',
              marginBottom: '20px',
            }}
          >
            Optimisez vos projets, anticipez les risques, <br />
            <span
              style={{
                color: '#ffffff',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '0 15px',
                borderRadius: '5px',
              }}
            >
              réussissez en toute sérénité !
            </span>
          </h1>
          <p
            className="lead mt-4 mb-5"
            style={{
              maxWidth: '800px',
              margin: '0 auto',
              fontSize: '1.3rem',
              lineHeight: '1.6',
              textShadow: '0 1px 5px rgba(0, 0, 0, 0.15)',
            }}
          >
            Notre plateforme utilise l'
            <span style={{ fontWeight: 'bold', color: '#ffeb3b' }}>IA</span> pour vous aider à gérer
            vos projets de manière efficace, en identifiant les risques et en optimisant vos
            ressources.
          </p>

          <div
            className="position-relative"
            style={{
              display: 'inline-block',
              borderRadius: '15px',
              overflow: 'hidden',
              boxShadow: '0 15px 50px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.5s ease',
              transform: 'perspective(1000px) rotateX(5deg)',
              maxWidth: '85%',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg)'
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateX(5deg)'
              e.currentTarget.style.boxShadow = '0 15px 50px rgba(0, 0, 0, 0.3)'
            }}
          >
            <img
              src={projectManagementImage}
              alt="Illustration de gestion de projet"
              className="img-fluid"
              style={{
                display: 'block',
                borderRadius: '15px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0) 80%, rgba(0,0,0,0.5) 100%)',
                pointerEvents: 'none',
              }}
            ></div>
          </div>
        </div>
      </section>

      {/* Présentation des Fonctionnalités Clés */}
      <section className="features-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">Fonctionnalités Clés</h2>
            <p className="lead text-muted">
              Découvrez comment notre plateforme peut transformer votre gestion de projet
            </p>
          </div>
          <CRow className="g-4">
            {[
              {
                icon: cilSpeedometer,
                title: 'Planification intelligente',
                description:
                  'Utilisez nos outils avancés de planification avec vues Gantt, Kanban et gestion de Sprints pour organiser efficacement vos projets.',
                color: 'primary',
                image: 'planning.svg',
              },
              {
                icon: cilTask,
                title: 'Suivi des tâches et jalons',
                description:
                  "Suivez la progression de vos tâches en temps réel, définissez des jalons clés et recevez des notifications automatiques sur l'avancement.",
                color: 'success',
                image: 'tasks.svg',
              },
              {
                icon: cilLightbulb,
                title: "Prédiction des délais grâce à l'IA",
                description:
                  'Notre intelligence artificielle analyse vos données historiques pour prédire les délais réalistes et identifier les risques potentiels.',
                color: 'warning',
                image: 'ai.svg',
              },
              {
                icon: cilSettings,
                title: 'Optimisation des ressources',
                description:
                  'Gérez efficacement vos ressources humaines et matérielles, évitez la surcharge et maximisez la productivité de votre équipe.',
                color: 'danger',
                image: 'resources.svg',
              },
              {
                icon: cilChatBubble,
                title: 'Collaboration en équipe',
                description:
                  'Facilitez la communication avec messagerie intégrée, partage de documents et espaces de travail collaboratifs pour une meilleure synergie.',
                color: 'info',
                image: 'collaboration.svg',
              },
            ].map((feature, index) => (
              <CCol key={index} md={6} lg={4} className="mb-4">
                <div
                  className="h-100 feature-card p-4 rounded-4 shadow-sm border-top border-4 hover-shadow transition-all"
                  style={{
                    borderColor: `var(--cui-${feature.color})`,
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div className="d-flex align-items-center mb-4">
                    <div
                      className={`feature-icon-container d-flex align-items-center justify-content-center rounded-circle bg-${feature.color} bg-opacity-10 p-3 me-3`}
                      style={{ width: '60px', height: '60px' }}
                    >
                      <CIcon icon={feature.icon} size="xl" className={`text-${feature.color}`} />
                    </div>
                    <h4 className="fw-bold mb-0">{feature.title}</h4>
                  </div>
                  <p className="text-muted mb-4">{feature.description}</p>
                  <div className="text-center mt-auto">
                    <img
                      src={`/assets/images/features/${feature.image}`}
                      alt={feature.title}
                      className="img-fluid feature-image mb-3"
                      style={{ maxHeight: '120px', opacity: '0.9' }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    <div>
                      <CButton
                        color={feature.color}
                        variant="outline"
                        href="/features"
                        className="fw-bold mt-2"
                      >
                        En savoir plus
                        <CIcon icon={cilArrowRight} className="ms-2" />
                      </CButton>
                    </div>
                  </div>
                </div>
              </CCol>
            ))}
          </CRow>
        </div>
      </section>

      {/* Section "Comment ça marche ?" */}
      <section className="how-it-works-section py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5 fw-bold">Comment ça marche ?</h2>
          <CRow className="text-center">
            {[
              { step: '1', title: 'Créez votre projet', icon: '📋' },
              { step: '2', title: 'Ajoutez vos équipes et tâches', icon: '👥' },
              { step: '3', title: 'Suivez les performances et optimisez', icon: '📊' },
            ].map((step, index) => (
              <CCol key={index} md={4} className="mb-4">
                <div className="step-icon display-4 text-primary">{step.icon}</div>
                <h5 className="mt-3 fw-bold">{step.title}</h5>
              </CCol>
            ))}
          </CRow>
        </div>
      </section>

      {/* Dashboard Widgets */}
      <WidgetsDropdown className="mb-4" />

      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <CIcon icon={cilChart} className="icon" />
            Activité du projet
          </h2>
        </div>
        <CRow>
          <CCol md={12}>
            <CCard className="dashboard-card">
              <CCardBody>
                <MainChart />
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </section>

      {/* Section Projets */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <CIcon icon={cilFolder} className="icon" />
            Vos projets en cours
          </h2>
          <div className="d-flex gap-2">
            <button
              onClick={selectRandomProjects}
              disabled={allProjects.length === 0}
              className="btn-dashboard btn-success"
              title="Sélectionner un projet aléatoire"
            >
              Aléatoire
            </button>
            <Link to="/projects" className="btn-dashboard btn-outline">
              Tous les projets
              <CIcon icon={cilArrowRight} style={{ marginLeft: '6px' }} size="sm" />
            </Link>
          </div>
        </div>
        <CRow>
          <CCol md={12}>
            <CCard className="dashboard-card">
              <CCardBody>
                <CRow>
                  {loading ? (
                    <CCol xs={12} className="text-center py-5">
                      <div
                        className="spinner-grow text-primary mb-3"
                        style={{ width: '3rem', height: '3rem' }}
                        role="status"
                      >
                        <span className="visually-hidden">Chargement...</span>
                      </div>
                      <p className="text-muted">Chargement des projets en cours...</p>
                    </CCol>
                  ) : dashboardProjects.length === 0 ? (
                    <CCol xs={12} className="text-center py-5">
                      <div className="empty-state mb-3">
                        <CIcon
                          icon={cilFolder}
                          style={{ width: '4rem', height: '4rem', opacity: '0.5' }}
                        />
                      </div>
                      <h5 className="text-muted mb-3">Aucun projet à afficher</h5>
                      <p className="text-muted mb-4">
                        Commencez par créer votre premier projet pour le voir apparaître ici.
                      </p>
                      <Link to="/projects/create" className="btn btn-primary">
                        <CIcon icon={cilTask} className="me-2" />
                        Créer un nouveau projet
                      </Link>
                    </CCol>
                  ) : (
                    dashboardProjects.map((project, index) => (
                      <CCol xs={12} sm={6} lg={4} key={index} className="mb-4">
                        <div className="project-card card-hover-effect">
                          <div className="project-card-header">
                            <h5 className="project-card-title text-truncate" title={project.title}>
                              <CIcon icon={cilFolder} className="icon" />
                              {project.title}
                            </h5>
                            <CBadge color={project.statusColor} shape="rounded-pill">
                              {project.status}
                            </CBadge>
                          </div>

                          <div className="project-card-content">
                            <div className="d-flex justify-content-between mb-1 align-items-center">
                              <span className="fw-semibold">Progression</span>
                            </div>

                            <div className="progress-container">
                              <CProgress
                                value={project.progress || 0}
                                color={
                                  (project.progress || 0) > 75
                                    ? 'success'
                                    : (project.progress || 0) > 40
                                      ? 'primary'
                                      : 'warning'
                                }
                                height={12}
                                className="progress-bar"
                              />
                              <div
                                className="progress-label"
                                style={{
                                  backgroundColor:
                                    (project.progress || 0) > 75
                                      ? 'var(--success-color)'
                                      : (project.progress || 0) > 40
                                        ? 'var(--primary-color)'
                                        : 'var(--warning-color)',
                                }}
                              >
                                {project.progress || 0}%
                              </div>
                            </div>

                            <div className="project-stats">
                              <div className="stat-item">
                                <div className="stat-icon tasks">
                                  <CIcon icon={cilTask} size="sm" />
                                </div>
                                <div>
                                  <div className="stat-label">Tâches</div>
                                  <div className="stat-value">
                                    {project.completedTasks !== undefined
                                      ? project.completedTasks
                                      : 0}
                                    /{project.tasks !== undefined ? project.tasks : 0}
                                  </div>
                                </div>
                              </div>

                              <div className="stat-item">
                                <div className="stat-icon deadline">
                                  <CIcon icon={cilCalendar} size="sm" />
                                </div>
                                <div>
                                  <div className="stat-label">Échéance</div>
                                  <div className="stat-value">{project.dueDate}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="project-card-footer">
                            <Link
                              to={`/projects/${project.id}`}
                              className="btn-dashboard btn-primary"
                            >
                              <CIcon icon={cilArrowRight} className="me-2" size="sm" />
                              Voir détails du projet
                            </Link>
                          </div>
                        </div>
                      </CCol>
                    ))
                  )}
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </section>

      {/* Section Activités, Événements et Équipe */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <CIcon icon={cilPeople} className="icon" />
            Activités, Événements et Équipe
          </h2>
        </div>

        <CRow>
          {/* Activités récentes */}
          <CCol md={4} className="mb-4">
            <RecentActivityListWidget limit={5} />
          </CCol>

          {/* Événements à venir */}
          <CCol md={4} className="mb-4">
            <UpcomingEvents />
          </CCol>

          {/* Membres de l'équipe */}
          <CCol md={4} className="mb-4">
            <TeamMembersWidget />
          </CCol>
        </CRow>
      </section>

      {/* Section Tarification */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <CIcon icon={cilSettings} className="icon" />
            Tarification
          </h2>
        </div>

        <div className="text-center mb-4">
          <p className="lead">Choisissez le plan qui correspond à vos besoins</p>
        </div>

        <CRow className="justify-content-center">
          {[
            {
              plan: 'Gratuit',
              price: '0 DT',
              period: 'pour toujours',
              popular: false,
              color: 'info',
              features: [
                "Jusqu'à 3 projets",
                "Jusqu'à 5 utilisateurs",
                'Fonctionnalités de base',
                'Support communautaire',
                'Mises à jour gratuites',
              ],
            },
            {
              plan: 'Standard',
              price: '10 DT',
              period: 'par mois',
              popular: true,
              color: 'primary',
              features: [
                'Projets illimités',
                "Jusqu'à 20 utilisateurs",
                'Fonctionnalités avancées',
                'Support par email',
                'Analyses de performance',
                "Intégration avec d'autres outils",
              ],
            },
            {
              plan: 'Premium',
              price: '20 DT',
              period: 'par mois',
              popular: false,
              color: 'dark',
              features: [
                'Projets illimités',
                'Utilisateurs illimités',
                'Toutes les fonctionnalités',
                'Support prioritaire 24/7',
                'Analyses avancées avec IA',
                'API complète',
                'Personnalisation avancée',
              ],
            },
          ].map((pricing, index) => (
            <CCol key={index} md={4} className="mb-4">
              <div
                className={`project-card card-hover-effect ${pricing.popular ? 'border-primary' : ''}`}
                style={{
                  transform: pricing.popular ? 'scale(1.05)' : 'scale(1)',
                  zIndex: pricing.popular ? 1 : 0,
                }}
              >
                {pricing.popular && (
                  <div className="position-relative">
                    <CBadge
                      color="primary"
                      shape="rounded-pill"
                      className="position-absolute top-0 start-50 translate-middle px-3 py-2 fw-bold"
                    >
                      RECOMMANDÉ
                    </CBadge>
                  </div>
                )}

                <div
                  className="project-card-header text-center"
                  style={{
                    backgroundColor: `var(--${pricing.color === 'dark' ? 'dark' : pricing.color === 'primary' ? 'primary' : 'info'}-color)`,
                    color: 'white',
                    padding: 'var(--spacing-sm)',
                  }}
                >
                  <h4 className="fw-bold mb-0">{pricing.plan}</h4>
                </div>

                <div className="project-card-content text-center">
                  <div className="mb-4">
                    <span className="display-4 fw-bold">{pricing.price}</span>
                    <span className="text-muted fs-5">{pricing.period}</span>
                  </div>

                  <ul className="list-unstyled mb-4">
                    {pricing.features.map((feature, i) => (
                      <li key={i} className="py-2 d-flex align-items-center">
                        <CIcon
                          icon={cilCheck}
                          className="me-2"
                          style={{
                            width: '1rem',
                            height: '1rem',
                            color: `var(--${pricing.color === 'dark' ? 'dark' : pricing.color === 'primary' ? 'primary' : 'info'}-color)`,
                          }}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="project-card-footer">
                  <Link
                    to="/pricing"
                    className={`btn-dashboard ${pricing.popular ? 'btn-primary' : pricing.color === 'dark' ? 'btn-outline' : 'btn-outline'}`}
                    style={{ width: '100%' }}
                  >
                    {pricing.popular
                      ? 'Essai gratuit de 14 jours'
                      : pricing.plan === 'Gratuit'
                        ? 'Commencer gratuitement'
                        : 'Contacter les ventes'}
                  </Link>
                </div>
              </div>
            </CCol>
          ))}
        </CRow>

        <div className="text-center mt-4">
          <p className="text-muted mb-2">
            Besoin d'une solution personnalisée pour votre entreprise ?
          </p>
          <Link to="/contact" className="btn-dashboard btn-outline">
            Contactez notre équipe commerciale
          </Link>
        </div>
      </section>
    </>
  )
}
export default Dashboard
