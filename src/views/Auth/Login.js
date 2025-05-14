import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilShieldAlt } from '@coreui/icons'
import axios from '../../../utils/axios'
import { toast } from 'react-toastify'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorError, setTwoFactorError] = useState('')
  const [tempUserData, setTempUserData] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('') // Clear any previous errors
    setTwoFactorError('') // Clear any previous 2FA errors
    console.log('Attempting to login with email:', email)

    try {
      console.log('Sending login request to:', axios.defaults.baseURL + '/api/auth/login')
      const response = await axios.post('/api/auth/login', {
        email: email,
        password: password,
      })

      console.log('Login response:', response.data)

      if (response.data.success) {
        // Check if 2FA is required
        if (response.data.requireTwoFactor) {
          console.log('2FA is required for this account')
          // Store temporary user data for 2FA verification
          setTempUserData({
            email: email,
            password: password,
            userId: response.data.userId,
          })
          // Show 2FA modal
          setShowTwoFactorModal(true)
          return
        }

        console.log('Login successful, full response:', response.data)
        // Store the token in localStorage
        localStorage.setItem('token', response.data.token)
        console.log('Token stored from login:', response.data.token)

        // Store user role, name, and ID if available
        if (response.data.user) {
          if (response.data.user.role) {
            localStorage.setItem('userRole', response.data.user.role)
            console.log('User role stored:', response.data.user.role)
          }

          if (response.data.user.name) {
            localStorage.setItem('userName', response.data.user.name)
            console.log('User name stored:', response.data.user.name)
          }

          if (response.data.user._id) {
            localStorage.setItem('userId', response.data.user._id)
            console.log('User ID stored:', response.data.user._id)
          }

          // Redirect based on role
          if (response.data.user.role === 'Admin') {
            console.log('Admin user detected, redirecting to admin redirect page')
            console.log('Admin user details:', response.data.user)

            // Add a small delay before redirecting
            setTimeout(() => {
              console.log('Now navigating to admin redirect page')
              // Navigate to the admin redirect page
              navigate('/admin-redirect')
            }, 500)
            return
          }
        } else {
          console.error('User role not found in response:', response.data)
        }

        // Navigate to client dashboard
        navigate('/dashboard')
      } else {
        setError(response.data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      setError(error.response?.data?.error || 'An error occurred during login')
    }
  }

  // Function to handle 2FA verification
  async function handleTwoFactorVerification() {
    setTwoFactorError('') // Clear any previous errors

    if (!twoFactorCode) {
      setTwoFactorError('Please enter the verification code')
      return
    }

    try {
      console.log('Sending 2FA verification request')
      console.log('2FA code entered:', twoFactorCode)
      console.log('User data:', tempUserData)

      // Nettoyer le code 2FA (supprimer les espaces)
      const cleanCode = twoFactorCode.toString().replace(/\s+/g, '')
      console.log('Cleaned 2FA code:', cleanCode)

      const response = await axios.post('/api/auth/login', {
        email: tempUserData.email,
        password: tempUserData.password,
        twoFactorCode: cleanCode,
      })

      console.log('2FA response:', response.data)

      if (response.data.success) {
        console.log('2FA login successful, full response:', response.data)
        // Close the 2FA modal
        setShowTwoFactorModal(false)

        // Store the token in localStorage
        localStorage.setItem('token', response.data.token)
        console.log('Token stored from 2FA login:', response.data.token)

        // Store user role, name, and ID if available
        if (response.data.user) {
          if (response.data.user.role) {
            localStorage.setItem('userRole', response.data.user.role)
            console.log('User role stored from 2FA:', response.data.user.role)
          }

          if (response.data.user.name) {
            localStorage.setItem('userName', response.data.user.name)
            console.log('User name stored from 2FA:', response.data.user.name)
          }

          if (response.data.user._id) {
            localStorage.setItem('userId', response.data.user._id)
            console.log('User ID stored from 2FA:', response.data.user._id)
          }

          // Redirect based on role
          if (response.data.user.role === 'Admin') {
            console.log('Admin user detected from 2FA, redirecting to admin redirect page')
            // Navigate to the admin redirect page
            navigate('/admin-redirect')
            return
          }
        } else {
          console.error('User role not found in 2FA response:', response.data)
        }

        // Navigate to client dashboard
        navigate('/dashboard')
      } else {
        setTwoFactorError(response.data.error || 'Verification failed')
      }
    } catch (error) {
      console.error('2FA verification error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })

      // Afficher un message d'erreur plus détaillé
      const errorMessage = error.response?.data?.error || 'An error occurred during verification'
      console.error('2FA error message:', errorMessage)
      setTwoFactorError(errorMessage)

      // Ajouter un message d'aide
      if (errorMessage.includes('invalid')) {
        setTwoFactorError(
          errorMessage +
            '. Please make sure you are entering the current code from your authenticator app.',
        )
      }
    }
  }

  // Add useEffect to handle token and errors from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const error = urlParams.get('error')

    if (error) {
      toast.error('Authentication failed. Please try again.')
      return
    }

    if (token) {
      localStorage.setItem('token', token)
      navigate('/dashboard')
    }
  }, [navigate])

  const handleGoogleLogin = () => {
    // Clear any existing tokens
    localStorage.removeItem('token')
    // Use the full URL for Google auth with explicit scope
    window.location.href = 'http://localhost:3001/api/auth/google?scope=profile%20email'
  }

  const handleFacebookLogin = () => {
    // Clear any existing tokens
    localStorage.removeItem('token')
    // Use the full URL for Facebook auth
    window.location.href = 'http://localhost:3001/api/auth/facebook'
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <h1>Login</h1>
                    <p className="text-muted">Sign In to your account</p>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </CInputGroup>
                    <CRow>
                      <CCol xs={6}>
                        <CButton color="primary" className="px-4" type="submit">
                          Login
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                        <Link to="/forgot-password">
                          <CButton color="link" className="px-0">
                            Forgot password?
                          </CButton>
                        </Link>
                      </CCol>
                    </CRow>
                  </CForm>
                  <div className="mt-3">
                    <CButton color="danger" className="w-100 mb-2" onClick={handleGoogleLogin}>
                      Sign in with Google
                    </CButton>
                    <CButton color="primary" className="w-100" onClick={handleFacebookLogin}>
                      Sign in with Facebook
                    </CButton>
                  </div>
                </CCardBody>
              </CCard>
              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Sign up</h2>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
                      tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                    <Link to="/register">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        Register Now!
                      </CButton>
                    </Link>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>

      {/* Two-Factor Authentication Modal */}
      <CModal visible={showTwoFactorModal} onClose={() => setShowTwoFactorModal(false)}>
        <CModalHeader>
          <CModalTitle>Two-Factor Authentication</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Please enter the verification code from your authenticator app:</p>
          {twoFactorError && <div className="alert alert-danger">{twoFactorError}</div>}
          <CInputGroup className="mb-3">
            <CInputGroupText>
              <CIcon icon={cilShieldAlt} />
            </CInputGroupText>
            <CFormInput
              type="text"
              placeholder="Verification Code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
            />
          </CInputGroup>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowTwoFactorModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleTwoFactorVerification}>
            Verify
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Login
