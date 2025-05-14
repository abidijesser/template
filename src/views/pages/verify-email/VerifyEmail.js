import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CAlert, CCard, CCardBody, CCol, CContainer, CRow } from '@coreui/react'
import axios from 'axios'

const VerifyEmail = () => {
  const [status, setStatus] = useState('Vérification en cours...')
  const [error, setError] = useState('')
  const { token } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axios.get(`http://localhost:3001/verify-email/${token}`)
        setStatus('Email vérifié avec succès!')
        setTimeout(() => navigate('/login'), 3000)
      } catch (err) {
        setError(err.response?.data?.error || 'Erreur de vérification')
      }
    }

    verifyEmail()
  }, [token, navigate])

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <CCard className="p-4">
              <CCardBody>
                <h2>Vérification de l'email</h2>
                {error ? (
                  <CAlert color="danger">{error}</CAlert>
                ) : (
                  <CAlert color="info">{status}</CAlert>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default VerifyEmail
