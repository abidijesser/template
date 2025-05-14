import React, { useEffect } from 'react'
import { CSpinner, CContainer, CRow, CCol, CCard, CCardBody, CCardTitle } from '@coreui/react'

const AdminRedirect = () => {
  useEffect(() => {
    const redirectToAdmin = () => {
      // Get token and role from localStorage
      const token = localStorage.getItem('token')
      const userRole = localStorage.getItem('userRole')

      console.log('AdminRedirect - Token exists:', !!token)
      console.log('AdminRedirect - User role:', userRole)
      console.log('AdminRedirect - Token value:', token)

      // Check if user is admin
      if (token && userRole === 'Admin') {
        console.log('AdminRedirect - User is admin, preparing to redirect to admin dashboard')

        // Encode token for URL safety
        const encodedToken = encodeURIComponent(token)

        // Redirect to admin dashboard with token and role as query parameters
        const adminUrl = `http://localhost:5173/dashboard/default?token=${encodedToken}&role=${userRole}`
        console.log('AdminRedirect - Redirecting to:', adminUrl)

        // Use direct redirect
        window.location.href = adminUrl
      } else {
        console.log('AdminRedirect - Not an admin, redirecting to client dashboard')
        // If not admin, redirect to client dashboard
        window.location.href = '/#/dashboard'
      }
    }

    // Add a delay to ensure everything is loaded properly
    const redirectTimer = setTimeout(redirectToAdmin, 1000)

    // Cleanup function
    return () => clearTimeout(redirectTimer)
  }, [])

  return (
    <CContainer
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh' }}
    >
      <CRow>
        <CCol>
          <CCard>
            <CCardBody className="text-center">
              <CCardTitle>Redirecting to Admin Dashboard</CCardTitle>
              <p className="mt-3">Please wait while we redirect you to the admin dashboard...</p>
              <CSpinner color="primary" className="mt-3" />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default AdminRedirect
