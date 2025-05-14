import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CProgress,
  CImage,
  CSpinner,
} from '@coreui/react'
import { cilSettings, cilTask, cilUser, cilAccountLogout, cilCalendar } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { toast } from 'react-toastify'
import axios from '../../utils/axios'
import { getTotalTasksCount } from '../../services/taskService'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('User')
  const [userRole, setUserRole] = useState('Client')
  const [profilePicture, setProfilePicture] = useState(null)
  const [userId, setUserId] = useState(null)
  const [totalTasks, setTotalTasks] = useState(0)
  const [loadingTasks, setLoadingTasks] = useState(false)

  // Fonction pour récupérer le nombre total de tâches
  const fetchTotalTasks = async () => {
    try {
      setLoadingTasks(true)
      const count = await getTotalTasksCount()
      setTotalTasks(count)
    } catch (error) {
      console.error('Error fetching total tasks count:', error)
    } finally {
      setLoadingTasks(false)
    }
  }

  useEffect(() => {
    // Get user name from localStorage
    const storedName = localStorage.getItem('userName')
    if (storedName) {
      setUserName(storedName)
    }

    // Get user role from localStorage
    const storedRole = localStorage.getItem('userRole')
    if (storedRole) {
      setUserRole(storedRole)
    }

    // Get user ID from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUserId(parsedUser._id)

        // If user has a profile picture, set it
        if (parsedUser.profilePicture) {
          setProfilePicture(parsedUser.profilePicture)
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }

    // Fetch current user profile to get the latest profile picture
    fetchUserProfile()

    // Fetch total tasks count
    fetchTotalTasks()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/auth/profile')
      if (response.data.success) {
        const userData = response.data.user

        // Update profile picture if available
        if (userData.profilePicture) {
          setProfilePicture(userData.profilePicture)

          // Update local storage with the latest user data
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser)
              parsedUser.profilePicture = userData.profilePicture
              localStorage.setItem('user', JSON.stringify(parsedUser))
            } catch (error) {
              console.error('Error updating user data in localStorage:', error)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const handleLogout = async () => {
    try {
      console.log('Logout - Starting logout process')
      const token = localStorage.getItem('token')

      // Clear local storage first to ensure the user is logged out even if the server request fails
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userName')
      localStorage.removeItem('userRole')

      // Reset state
      setProfilePicture(null)

      // Show success message
      toast.success('Déconnexion réussie')

      // Try to call the server logout endpoint, but don't wait for it
      if (token) {
        try {
          console.log('Logout - Calling server logout endpoint')
          await fetch('http://localhost:3001/api/auth/logout', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          })
          console.log('Logout - Server logout successful')
        } catch (serverError) {
          // Ignore server errors since we've already cleared local storage
          console.log('Logout - Server logout failed, but local logout successful')
          console.error('Server logout error:', serverError)
        }
      }

      // Navigate to login page
      console.log('Logout - Redirecting to login page')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)

      // Ensure logout even if there's an error
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userName')
      localStorage.removeItem('userRole')

      // Reset state
      setProfilePicture(null)

      toast.error('Erreur lors de la déconnexion, mais vous avez été déconnecté')
      navigate('/login')
    }
  }

  const handleProfileClick = () => {
    navigate('/profile')
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userName) return 'U'
    const nameParts = userName.split(' ')
    if (nameParts.length > 1) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase()
    }
    return userName.charAt(0).toUpperCase()
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        {profilePicture ? (
          <CAvatar
            size="md"
            className="border border-2 border-white"
            src={`http://localhost:3001/${profilePicture}`}
          />
        ) : (
          <CAvatar color="light" size="md" className="text-primary border border-2 border-white">
            {getUserInitials()}
          </CAvatar>
        )}
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end" style={{ minWidth: '250px' }}>
        <CDropdownHeader className="bg-gradient-primary text-white d-flex flex-column align-items-center p-3">
          {profilePicture ? (
            <CAvatar
              size="lg"
              className="mb-2 border border-2 border-white"
              src={`http://localhost:3001/${profilePicture}`}
            />
          ) : (
            <CAvatar
              color="light"
              size="lg"
              className="mb-2 text-primary border border-2 border-white"
            >
              {getUserInitials()}
            </CAvatar>
          )}
          <div className="fw-semibold">{userName}</div>
          <div className="text-white-50 small">{userRole}</div>

          <div className="w-100 mt-2">
            <div className="d-flex justify-content-between mb-1 small">
              <span>Profil Complété</span>
              <span>75%</span>
            </div>
            <CProgress value={75} thin color="light" />
          </div>
        </CDropdownHeader>

        <CDropdownItem onClick={handleProfileClick}>
          <CIcon icon={cilUser} className="me-2 text-primary" />
          Mon Profil
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/tasks')}>
          <CIcon icon={cilTask} className="me-2 text-info" />
          Mes Tâches
          {loadingTasks ? (
            <CSpinner size="sm" color="info" className="ms-2" />
          ) : (
            <CBadge color="info" className="ms-2">
              {totalTasks}
            </CBadge>
          )}
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/calendar')}>
          <CIcon icon={cilCalendar} className="me-2 text-success" />
          Calendrier
        </CDropdownItem>

        <CDropdownItem onClick={() => navigate('/settings')}>
          <CIcon icon={cilSettings} className="me-2 text-secondary" />
          Paramètres
        </CDropdownItem>
        <CDropdownDivider />
        <CDropdownItem onClick={handleLogout} className="text-danger">
          <CIcon icon={cilAccountLogout} className="me-2" />
          Déconnexion
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
