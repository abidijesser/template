import React, { useState, useEffect, useRef } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CSpinner,
  CCardImage,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import axios from '../../../utils/axios'
import { toast } from 'react-toastify'
import CIcon from '@coreui/icons-react'
import { cilCamera } from '@coreui/icons'

const Profile = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    role: '',
    twoFactorEnabled: false,
    profilePicture: null,
    skills: [],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [showDisable2FA, setShowDisable2FA] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/auth/profile')
        if (response.data.success && response.data.user) {
          setUser(response.data.user)
        } else {
          setError('Failed to load profile data')
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setError(error.response?.data?.error || 'Error loading profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleEnable2FA = async () => {
    try {
      console.log('Profile - Enabling 2FA')
      console.log('Profile - Token exists:', !!localStorage.getItem('token'))

      // Log the full URL being called
      const url = 'http://localhost:3001/api/auth/generate-2fa'
      console.log('Profile - Calling URL:', url)

      // Use fetch instead of axios for debugging
      const token = localStorage.getItem('token')
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Profile - Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Profile - Response data:', data)

        if (data.success) {
          setQrCode(data.qrCode)
          setShow2FASetup(true)
          toast.success('2FA setup generated successfully')
        } else {
          console.error('Profile - Server returned error:', data.error)
          toast.error(data.error || 'Error generating 2FA setup')
        }
      } else {
        console.error('Profile - HTTP error:', response.status)
        toast.error(`Error ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Profile - Error generating 2FA:', error)
      toast.error('Error generating 2FA setup: ' + error.message)
    }
  }

  const handleVerify2FA = async () => {
    try {
      console.log('Profile - Verifying 2FA code:', verificationCode)

      // Nettoyer le code (supprimer les espaces)
      const cleanCode = verificationCode.toString().replace(/\s+/g, '')
      console.log('Profile - Cleaned 2FA code:', cleanCode)

      // Utiliser fetch pour plus de détails sur la réponse
      const token = localStorage.getItem('token')
      const url = 'http://localhost:3001/api/auth/verify-2fa'
      console.log('Profile - Calling URL:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: cleanCode }),
      })

      console.log('Profile - Verify 2FA response status:', response.status)

      const data = await response.json()
      console.log('Profile - Verify 2FA response data:', data)

      if (data.success) {
        toast.success('2FA enabled successfully')
        setUser((prev) => ({ ...prev, twoFactorEnabled: true }))
        setShow2FASetup(false)
        setVerificationCode('')
      } else {
        console.error('Profile - 2FA verification failed:', data.error)
        toast.error(data.error || 'Invalid verification code')

        // Afficher des informations de débogage si disponibles
        if (data.debug) {
          console.log('Profile - 2FA debug info:', data.debug)
          console.log('Profile - Expected token:', data.debug.expectedToken)
          console.log('Profile - Received token:', data.debug.receivedToken)
        }
      }
    } catch (error) {
      console.error('Profile - Error verifying 2FA:', error)
      toast.error('Error verifying 2FA code: ' + (error.message || 'Unknown error'))
    }
  }

  const handleShowDisable2FA = () => {
    setShowDisable2FA(true)
  }

  const handleCancelDisable2FA = () => {
    setShowDisable2FA(false)
    setDisableCode('')
  }

  const handleDisable2FA = async () => {
    try {
      console.log('Profile - Disabling 2FA with code:', disableCode)

      // Nettoyer le code (supprimer les espaces)
      const cleanCode = disableCode.toString().replace(/\s+/g, '')
      console.log('Profile - Cleaned disable code:', cleanCode)

      // Utiliser fetch pour plus de détails sur la réponse
      const token = localStorage.getItem('token')
      const url = 'http://localhost:3001/api/auth/disable-2fa'
      console.log('Profile - Calling URL:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: cleanCode }),
      })

      console.log('Profile - Disable 2FA response status:', response.status)

      const data = await response.json()
      console.log('Profile - Disable 2FA response data:', data)

      if (data.success) {
        toast.success('2FA disabled successfully')
        setUser((prev) => ({ ...prev, twoFactorEnabled: false }))
        setShowDisable2FA(false)
        setDisableCode('')
      } else {
        console.error('Profile - 2FA disabling failed:', data.error)
        toast.error(data.error || 'Invalid verification code')
      }
    } catch (error) {
      console.error('Profile - Error disabling 2FA:', error)
      toast.error('Error disabling 2FA: ' + (error.message || 'Unknown error'))
    }
  }

  const handleProfilePictureClick = () => {
    fileInputRef.current.click()
  }

  const handleProfilePictureChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]

    // Validate file type
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should not exceed 5MB')
      return
    }

    try {
      setUploadingPicture(true)

      const formData = new FormData()
      formData.append('profilePicture', file)

      const response = await axios.post('/api/auth/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        toast.success('Profile picture updated successfully')
        setUser((prev) => ({
          ...prev,
          profilePicture: response.data.profilePicture,
        }))
      } else {
        toast.error(response.data.error || 'Error uploading profile picture')
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      toast.error(error.response?.data?.error || 'Error uploading profile picture')
    } finally {
      setUploadingPicture(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <CRow>
      <CCol md={8}>
        <CCard className="mb-4">
          <CCardHeader>
            <h4>Profile</h4>
          </CCardHeader>
          <CCardBody>
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Modal pour désactiver 2FA */}
            <CModal visible={showDisable2FA} onClose={handleCancelDisable2FA}>
              <CModalHeader>
                <CModalTitle>Disable Two-Factor Authentication</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <p>Please enter the verification code from your authenticator app to confirm:</p>
                <CFormInput
                  type="text"
                  placeholder="Verification Code"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                />
              </CModalBody>
              <CModalFooter>
                <CButton color="secondary" onClick={handleCancelDisable2FA}>
                  Cancel
                </CButton>
                <CButton color="danger" onClick={handleDisable2FA}>
                  Disable 2FA
                </CButton>
              </CModalFooter>
            </CModal>

            <CForm>
              {/* Profile Picture */}
              <div className="text-center mb-4">
                <div
                  style={{
                    position: 'relative',
                    width: '150px',
                    height: '150px',
                    margin: '0 auto',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onClick={handleProfilePictureClick}
                >
                  {user.profilePicture ? (
                    <img
                      src={`http://localhost:3001/${user.profilePicture}`}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ fontSize: '3rem', color: '#666' }}>
                      {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      borderRadius: '50%',
                      padding: '8px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <CIcon icon={cilCamera} size="sm" style={{ color: 'white' }} />
                  </div>

                  {uploadingPicture && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <CSpinner color="primary" />
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                />

                <div className="mt-2">
                  <small className="text-muted">Click to change profile picture</small>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Name</label>
                <CFormInput type="text" value={user.name || ''} disabled />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <CFormInput type="email" value={user.email || ''} disabled />
              </div>
              <div className="mb-3">
                <label className="form-label">Role</label>
                <CFormInput type="text" value={user.role || ''} disabled />
              </div>

              <div className="mb-3">
                <label className="form-label">Compétences</label>
                {user.skills && user.skills.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {user.skills.map((skill, index) => (
                      <div
                        key={index}
                        className="bg-light rounded-pill px-3 py-1 d-flex align-items-center"
                      >
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted">Aucune compétence ajoutée</div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Two-Factor Authentication</label>
                {user.twoFactorEnabled ? (
                  <div>
                    <div className="text-success mb-2">Enabled</div>
                    <CButton color="danger" onClick={handleShowDisable2FA}>
                      Disable 2FA
                    </CButton>
                  </div>
                ) : (
                  <CButton color="primary" onClick={handleEnable2FA}>
                    Enable 2FA
                  </CButton>
                )}
              </div>
              {show2FASetup && (
                <div className="mb-3">
                  <h5>Setup Two-Factor Authentication</h5>
                  <p>Scan this QR code with your authenticator app:</p>
                  {qrCode && <img src={qrCode} alt="QR Code" />}
                  <div className="mt-3">
                    <CFormInput
                      type="text"
                      placeholder="Enter verification code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <CButton color="success" className="mt-2" onClick={handleVerify2FA}>
                      Verify
                    </CButton>
                  </div>
                </div>
              )}
              {user._id && (
                <Link to={`/profile/edit/${user._id}`}>
                  <CButton color="primary">Edit Profile</CButton>
                </Link>
              )}
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Profile
