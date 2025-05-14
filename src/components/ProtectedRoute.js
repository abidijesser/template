import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'
import { isAuthenticated, isClient, isAdmin } from '../utils/authUtils'
import { CSpinner } from '@coreui/react'
import ErrorBoundary from './ErrorBoundary'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if user is authenticated
        if (!isAuthenticated()) {
          setLoading(false)
          return
        }

        // Check if user is admin first
        const isAdminUser = await isAdmin()
        console.log('Is admin user:', isAdminUser)

        // If user is admin, they can access all routes
        // If adminOnly is true, only admins can access
        // If adminOnly is false, both admins and clients can access
        const hasCorrectRole = isAdminUser || (!adminOnly && (await isClient()))

        // Log the role check for monitoring
        console.log('Role check:', { adminOnly, isAdminUser, hasCorrectRole })

        // Restore strict role verification
        setAuthorized(hasCorrectRole)
        setLoading(false)
      } catch (error) {
        console.error('Error checking authentication:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [adminOnly])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <CSpinner color="primary" />
      </div>
    )
  }

  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!authorized) {
    // Redirect to unauthorized page if role doesn't match
    return <Navigate to="/unauthorized" state={{ from: location }} replace />
  }

  return <ErrorBoundary>{children}</ErrorBoundary>
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool,
}

export default ProtectedRoute
