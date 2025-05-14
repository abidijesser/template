import React, { useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CRow,
  CAlert,
} from '@coreui/react'
import axios from 'axios'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [resetLink, setResetLink] = useState('')
  const [validationError, setValidationError] = useState('')
  const [info, setInfo] = useState('')

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      setValidationError('Email is required.')
      setError('')
      setResetLink('')
      return
    }

    if (!validateEmail(email)) {
      setValidationError('Please enter a valid email address.')
      setError('')
      setResetLink('')
      return
    }

    setValidationError('')

    try {
      setInfo('Sending...')
      const response = await axios.post('http://localhost:3001/api/auth/forgot-password', { email })

      if (response.data.success) {
        if (response.data.userExists === false) {
          setInfo('')
          setResetLink('')
          setError("No account is associated with this email.")
        
        } else {
          setInfo('')
          setError('')
          setResetLink('The reset link has been sent to your email address. Please check your inbox and follow the instructions in the email.')
          
        }
      } else {
        setError(response.data.error || 'An error occurred')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred')
      setSuccess('')
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <h1 className="mb-4">Forgot Password</h1>

                    {validationError && <CAlert color="warning">{validationError}</CAlert>}
                    {error && <CAlert color="danger">{error}</CAlert>}

                    {resetLink && (
                      <CAlert color="success">
                        {resetLink}
                      </CAlert>
                    )}

                    {info && (
                      <CAlert color="info">
                        {info}
                      </CAlert>
                    )}

                    <p className="text-body-secondary">
                      Enter your email to reset your password
                    </p>

                    <div className="mb-3">
                      <CFormInput
                        type="text"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <CButton color="primary" type="submit" className="btn w-100 mt-3">
                      Send Reset Link
                    </CButton>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default ForgotPassword