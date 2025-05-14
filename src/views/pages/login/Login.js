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
  CFormCheck,
  CInputGroup,
  CInputGroupText,
  CRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import { FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa'
import axios from '../../../utils/axios'
import { toast } from 'react-toastify'
import projectBoardSvg from 'src/assets/images/project-board.svg'
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorError, setTwoFactorError] = useState('')
  const [tempUserData, setTempUserData] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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
    window.location.href = 'http://localhost:3001/auth/google?scope=profile%20email'
  }

  const handleFacebookLogin = () => {
    // Clear any existing tokens
    localStorage.removeItem('token')
    // Use the full URL for Facebook auth
    window.location.href = 'http://localhost:3001/api/auth/facebook'
  }

  return (
    <div className="login-page">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={10} lg={9} xl={8}>
            <div className="text-center mb-4">
              <h1 className="worktrack-logo">WorkTrack</h1>
            </div>
            <CCard className="login-card">
              <CCardGroup>
                <CCard className="login-form-container border-0">
                  <CCardBody>
                    <CForm onSubmit={handleSubmit}>
                      <h2>Login</h2>
                      <p className="text-muted mb-4">Sign in to your account</p>
                      {error && <div className="alert alert-danger">{error}</div>}

                      <div className="form-floating mb-3">
                        <CFormInput
                          id="floatingEmail"
                          placeholder="Email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <label htmlFor="floatingEmail">Email address</label>
                      </div>

                      <div className="form-floating mb-4 position-relative">
                        <CFormInput
                          id="floatingPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <label htmlFor="floatingPassword">Password</label>
                        <div
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </div>
                      </div>

                      <CRow className="mb-3">
                        <CCol xs={6}>
                          <CFormCheck
                            id="rememberMe"
                            label="Remember me"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                        </CCol>
                        <CCol xs={6} className="text-end">
                          <Link to="/forgot-password" className="text-decoration-none">
                            Forgot password?
                          </Link>
                        </CCol>
                      </CRow>

                      <CButton color="primary" className="login-button" type="submit">
                        Login
                      </CButton>

                      <div className="social-login-section">
                        <div className="social-login-divider">
                          <span>Or continue with</span>
                        </div>

                        <div className="social-login-buttons">
                          <CButton className="social-login-button" onClick={handleGoogleLogin}>
                            <div className="google-icon-wrapper">
                              <svg className="google-icon" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                              </svg>
                            </div>
                            Google
                          </CButton>
                          <CButton className="social-login-button" onClick={handleFacebookLogin}>
                            <div className="facebook-icon-wrapper">
                              <svg className="facebook-icon" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </div>
                            Facebook
                          </CButton>
                        </div>

                        <div className="register-link">
                          Don't have an account? <Link to="/register">Sign up</Link>
                        </div>
                      </div>
                    </CForm>
                  </CCardBody>
                </CCard>

                <CCard className="login-sidebar d-none d-md-block" style={{ width: '50%' }}>
                  <CCardBody className="d-flex flex-column justify-content-center">
                    <h3 className="login-sidebar-title">Check Your Project Progress</h3>
                    <p className="text-muted mb-4">
                      Track tasks, manage projects, and collaborate with your team efficiently.
                    </p>

                    <div className="project-illustration">
                      <img
                        src={projectBoardSvg}
                        alt="Project Management"
                        className="login-sidebar-image"
                      />
                    </div>

                    <div className="login-sidebar-dots">
                      <div className="login-sidebar-dot active"></div>
                      <div className="login-sidebar-dot"></div>
                      <div className="login-sidebar-dot"></div>
                    </div>
                  </CCardBody>
                </CCard>
              </CCardGroup>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>

      {/* Two-Factor Authentication Modal */}
      <CModal visible={showTwoFactorModal} onClose={() => setShowTwoFactorModal(false)} alignment="center">
        <CModalHeader className="border-bottom-0 pb-0">
          <CModalTitle className="fw-bold">Two-Factor Authentication</CModalTitle>
        </CModalHeader>
        <CModalBody className="pt-0">
          <div className="text-center mb-4">
            <div className="two-factor-icon-container">
              <FaShieldAlt size={24} className="text-primary" />
            </div>
            <p className="mb-1">Please enter the verification code from your authenticator app</p>
            <p className="text-muted small">The code refreshes every 30 seconds</p>
          </div>

          {twoFactorError && <div className="alert alert-danger">{twoFactorError}</div>}

          <CInputGroup className="mb-4">
            <CInputGroupText>
              <FaShieldAlt />
            </CInputGroupText>
            <CFormInput
              type="text"
              placeholder="Enter 6-digit code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              className="form-control-lg two-factor-input"
              maxLength="6"
            />
          </CInputGroup>
        </CModalBody>
        <CModalFooter className="border-top-0 pt-0">
          <CButton color="secondary" onClick={() => setShowTwoFactorModal(false)} className="px-4">
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleTwoFactorVerification} className="login-button">
            Verify
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Login
