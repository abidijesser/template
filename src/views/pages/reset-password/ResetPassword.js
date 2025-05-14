import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { token } = useParams()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      console.log('Envoi de la requête de réinitialisation...')
      const response = await axios.post('http://localhost:3001/api/auth/reset-password', {
        token,
        newPassword,
      })

      console.log('Réponse reçue:', response.data)

      if (response.data.success) {
        setSuccess(
          'Mot de passe réinitialisé avec succès. Redirection vers la page de connexion...',
        )
        setError('')
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(response.data.error || 'Erreur lors de la réinitialisation du mot de passe')
      }
    } catch (err) {
      console.error('Erreur détaillée:', err.response?.data)
      setError(err.response?.data?.error || 'Une erreur est survenue lors de la réinitialisation')
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
                    <h1>Réinitialiser le mot de passe</h1>

                    {error && <CAlert color="danger">{error}</CAlert>}
                    {success && <CAlert color="success">{success}</CAlert>}

                    <div className="mb-3">
                      <CFormInput
                        type="password"
                        placeholder="Nouveau mot de passe"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <CFormInput
                        type="password"
                        placeholder="Confirmer le mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    <CButton color="primary" type="submit">
                      Réinitialiser le mot de passe
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

export default ResetPassword
