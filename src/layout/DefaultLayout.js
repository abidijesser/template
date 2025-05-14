// filepath: c:\Users\Lenovo\Desktop\pi1\MERN-Project-Manager\Client\src\layout\DefaultLayout.js
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AppContent, AppFooter, AppHeader } from '../components/index'
import { CSpinner } from '@coreui/react'
import './layout.css'

const DefaultLayout = ({ children }) => {
  const location = useLocation()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      // Check if there's a token in the URL
      const searchParams = new URLSearchParams(location.search)
      const hashParams = new URLSearchParams(location.hash.split('?')[1] || '')

      // Try to get token from various sources
      const token =
        searchParams.get('token') || hashParams.get('token') || localStorage.getItem('clientToken')

      if (token) {
        // Store the token in localStorage
        localStorage.setItem('token', token)
        // Clear the temporary clientToken if it exists
        localStorage.removeItem('clientToken')

        console.log('Token stored from URL parameters')
      }
    } catch (error) {
      console.error('Error processing token:', error)
    } finally {
      setLoading(false)
    }
  }, [location])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <div className="webtrack-layout">
      <AppHeader />
      <div className="wrapper d-flex flex-column min-vh-100">
        <div className="body flex-grow-1 px-3 py-4">{children || <AppContent />}</div>
      </div>
      <AppFooter />
    </div>
  )
}

export default DefaultLayout
