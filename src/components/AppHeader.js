import React, { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import axios from 'axios'
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
  CBadge,
  CSpinner,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilContrast,
  cilMenu,
  cilMoon,
  cilSun,
  cilSpeedometer,
  cilNotes,
  cilChartPie,
  cilStar,
  cilCursor,
  cilDescription,
  cilCalculator,
  cilLibrary,
  cilCheck,
  cilCloud,
} from '@coreui/icons'

import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'

const AppHeader = () => {
  const headerRef = useRef()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState(null)

  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

  // Fonction pour récupérer les notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      setNotificationError(null)

      const token = localStorage.getItem('token')
      if (!token) {
        console.error("Aucun token d'authentification trouvé")
        setNotificationError('Vous devez être connecté pour voir vos notifications')
        setLoadingNotifications(false)
        return
      }

      const response = await axios.get('http://localhost:3001/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data && response.data.success) {
        setNotifications(response.data.notifications)
      } else {
        console.error('Format de réponse invalide:', response.data)
        setNotificationError('Erreur lors de la récupération des notifications')
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error)
      setNotificationError(error.message || 'Erreur lors de la récupération des notifications')
    } finally {
      setLoadingNotifications(false)
    }
  }

  // Fonction pour marquer une notification comme lue
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      await axios.put(
        `http://localhost:3001/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Mettre à jour l'état local
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification,
        ),
      )
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error)
    }
  }

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    })

    // Récupérer toutes les notifications depuis l'API
    fetchNotifications()

    // Rafraîchir les notifications toutes les 60 secondes
    const interval = setInterval(fetchNotifications, 60000)

    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(interval)
  }, [])

  return (
    <CHeader position="sticky" className="mb-4 p-0 app-header" ref={headerRef}>
      <CContainer className="px-4 py-2" fluid>
        <div className="d-flex align-items-center justify-content-between w-100">
          <div className="d-flex align-items-center">
            <div className="app-logo me-4">
              <span className="fw-bold fs-4 text-white">worktrack</span>
            </div>
            <CHeaderToggler
              onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
              className="d-md-none text-white"
            >
              <CIcon icon={cilMenu} size="lg" />
            </CHeaderToggler>
            <CHeaderNav className="d-none d-md-flex main-nav">
              <CNavItem>
                <CNavLink to="/dashboard" as={NavLink} className="nav-link-custom">
                  <CIcon icon={cilSpeedometer} className="nav-icon" />
                  <span>Tableau de bord</span>
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink to="/projects" as={NavLink} className="nav-link-custom">
                  <CIcon icon={cilNotes} className="nav-icon" />
                  <span>Mes projets</span>
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink to="/tasks" as={NavLink} className="nav-link-custom">
                  <CIcon icon={cilChartPie} className="nav-icon" />
                  <span>Tâches</span>
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink to="/performances" as={NavLink} className="nav-link-custom">
                  <CIcon icon={cilStar} className="nav-icon" />
                  <span>Performances</span>
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink to="/resources" as={NavLink} className="nav-link-custom">
                  <CIcon icon={cilLibrary} className="nav-icon" />
                  <span>Ressources</span>
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink to="/drive" as={NavLink} className="nav-link-custom">
                  <CIcon icon={cilCloud} className="nav-icon" />
                  <span>Google Drive</span>
                </CNavLink>
              </CNavItem>
              <CDropdown variant="nav-item">
                <CDropdownToggle caret className="nav-link-custom">
                  <CIcon icon={cilCursor} className="nav-icon" />
                  <span>Collaboration</span>
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem href="#/collaboration/chat">Chat</CDropdownItem>
                  <CDropdownItem href="#/collaboration/notifications">Notifications</CDropdownItem>
                  <CDropdownItem href="#/collaboration/meetings">Réunions</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
              <CNavItem>
                <CNavLink to="/media" as={NavLink} className="nav-link-custom">
                  <CIcon icon={cilDescription} className="nav-icon" />
                  <span>Médias</span>
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink to="/settings" as={NavLink} className="nav-link-custom">
                  <CIcon icon={cilCalculator} className="nav-icon" />
                  <span>Paramètres</span>
                </CNavLink>
              </CNavItem>
            </CHeaderNav>
          </div>

          <div className="d-flex align-items-center">
            <CHeaderNav className="header-actions">
              {/* Utiliser directement CDropdown au lieu de l'imbriquer dans CNavItem */}
              <CDropdown variant="nav-item">
                <CDropdownToggle caret={false} className="action-link">
                  <div className="icon-wrapper">
                    <CIcon icon={cilBell} size="lg" />
                    <CBadge color="danger" shape="rounded-pill" position="top-end" size="sm">
                      {notifications.filter((notification) => !notification.read).length}
                    </CBadge>
                  </div>
                </CDropdownToggle>
                <CDropdownMenu style={{ minWidth: '300px', maxHeight: '400px', overflowY: 'auto' }}>
                  <CDropdownItem
                    header="true"
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>Notifications</span>
                    {loadingNotifications && <CSpinner size="sm" />}
                  </CDropdownItem>

                  {notificationError && (
                    <CDropdownItem className="text-danger">{notificationError}</CDropdownItem>
                  )}

                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <CDropdownItem
                        key={notification._id}
                        onClick={() => markNotificationAsRead(notification._id)}
                        style={{
                          backgroundColor: notification.read ? 'transparent' : '#f0f9ff',
                          borderLeft: notification.read ? 'none' : '3px solid #1890ff',
                          padding: '10px 15px',
                          margin: '2px 0',
                        }}
                      >
                        <div>
                          <div className="d-flex justify-content-between">
                            <small className="text-muted">
                              {new Date(notification.createdAt).toLocaleString()}
                            </small>
                            {notification.read && (
                              <CTooltip content="Lu">
                                <CIcon icon={cilCheck} size="sm" className="text-success" />
                              </CTooltip>
                            )}
                          </div>
                          <div>{notification.message}</div>
                        </div>
                      </CDropdownItem>
                    ))
                  ) : (
                    <CDropdownItem disabled>Aucune notification</CDropdownItem>
                  )}

                  <CDropdownItem divider="true" />
                  <CDropdownItem href="#/collaboration/notifications">
                    Voir toutes les notifications
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
              <CNavItem>
                <CNavLink href="#/collaboration/chat" className="action-link">
                  <div className="icon-wrapper">
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#4285F4',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '16px',
                      }}
                    >
                      G
                    </div>
                    <CBadge color="success" shape="rounded-pill" position="top-end" size="sm">
                      AI
                    </CBadge>
                  </div>
                  <CTooltip content="Assistant Gemini" placement="bottom">
                    <span className="visually-hidden">Assistant Gemini</span>
                  </CTooltip>
                </CNavLink>
              </CNavItem>
            </CHeaderNav>

            <div className="vr h-100 mx-3 text-white text-opacity-25 d-none d-lg-block"></div>

            <CDropdown variant="nav-item" placement="bottom-end">
              <CDropdownToggle caret={false} className="text-white theme-toggle">
                {colorMode === 'dark' ? (
                  <CIcon icon={cilMoon} size="lg" />
                ) : colorMode === 'auto' ? (
                  <CIcon icon={cilContrast} size="lg" />
                ) : (
                  <CIcon icon={cilSun} size="lg" />
                )}
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem
                  active={colorMode === 'light'}
                  className="d-flex align-items-center"
                  as="button"
                  type="button"
                  onClick={() => setColorMode('light')}
                >
                  <CIcon className="me-2" icon={cilSun} size="lg" /> Light
                </CDropdownItem>
                <CDropdownItem
                  active={colorMode === 'dark'}
                  className="d-flex align-items-center"
                  as="button"
                  type="button"
                  onClick={() => setColorMode('dark')}
                >
                  <CIcon className="me-2" icon={cilMoon} size="lg" /> Dark
                </CDropdownItem>
                <CDropdownItem
                  active={colorMode === 'auto'}
                  className="d-flex align-items-center"
                  as="button"
                  type="button"
                  onClick={() => setColorMode('auto')}
                >
                  <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>

            <div className="vr h-100 mx-3 text-white text-opacity-25"></div>
            <AppHeaderDropdown />
          </div>
        </div>
      </CContainer>
      <CContainer className="px-4 breadcrumb-container" fluid>
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
