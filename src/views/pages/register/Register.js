import React, { useState } from 'react'
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
  CRow,
} from '@coreui/react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import teamCollaborationSvg from 'src/assets/images/team-collaboration.svg'
import './Register.css'

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()

    // Validate form
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy')
      return
    }

    setLoading(true)
    setError('')

    const userData = { name, email, password }
    console.log('Attempting to register with:', { name, email })

    try {
      console.log('Sending registration request to: http://localhost:3001/api/auth/register')
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      console.log('Registration response status:', response.status)
      const data = await response.json()
      console.log('Registration response data:', data)

      if (!response.ok) {
        setError(data.error || 'Registration failed')
      } else {
        // We're not storing the token anymore - user needs to log in manually
        console.log('Registration successful, redirecting to login')
        navigate('/login')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={10} lg={9} xl={8}>
            <div className="text-center mb-4">
              <h1 className="worktrack-logo">WorkTrack</h1>
            </div>
            <CCard className="register-card">
              <CCardGroup>
                <CCard className="register-form-container border-0">
                  <CCardBody>
                    <CForm onSubmit={handleRegister}>
                      <h2>Sign Up</h2>
                      <p className="text-muted mb-4">Create your account</p>
                      {error && <div className="alert alert-danger">{error}</div>}

                      <div className="form-floating mb-3">
                        <CFormInput
                          id="floatingName"
                          placeholder="Full Name"
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                        <label htmlFor="floatingName">Full Name</label>
                      </div>

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

                      <div className="form-floating mb-3 position-relative">
                        <CFormInput
                          id="floatingPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          autoComplete="new-password"
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

                      <div className="form-floating mb-4 position-relative">
                        <CFormInput
                          id="floatingConfirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm Password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <label htmlFor="floatingConfirmPassword">Confirm Password</label>
                        <div
                          className="password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </div>
                      </div>

                      <CFormCheck
                        id="termsCheck"
                        label={<>I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link></>}
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mb-3"
                      />

                      <CButton
                        color="primary"
                        className="register-button"
                        type="submit"
                        disabled={loading || !termsAccepted}
                      >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                      </CButton>

                      <div className="login-link">
                        Already have an account? <Link to="/login">Sign in</Link>
                      </div>
                    </CForm>
                  </CCardBody>
                </CCard>

                <CCard className="register-sidebar d-none d-md-block" style={{ width: '50%' }}>
                  <CCardBody className="d-flex flex-column justify-content-center">
                    <h3 className="register-sidebar-title">Team Collaboration</h3>
                    <p className="text-muted mb-4">
                      Join your team and start collaborating on projects and tasks efficiently.
                    </p>

                    <div className="team-illustration">
                      <img
                        src={teamCollaborationSvg}
                        alt="Team Collaboration"
                        className="register-sidebar-image"
                      />
                    </div>
                  </CCardBody>
                </CCard>
              </CCardGroup>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register
