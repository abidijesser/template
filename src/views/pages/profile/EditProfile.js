import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CButton,
} from '@coreui/react'
import axios from '../../../utils/axios'
import { useParams, useNavigate } from 'react-router-dom'

const EditProfile = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    skills: [],
  })
  const [newSkill, setNewSkill] = useState('')
  const [error, setError] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/auth/profile/${id}`)
        setUser(response.data)
      } catch (err) {
        setError('Error fetching user data')
        console.error(err)
      }
    }
    fetchUser()
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setUser((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const handleAddSkill = () => {
    if (newSkill.trim() !== '' && !user.skills.includes(newSkill.trim())) {
      setUser((prevState) => ({
        ...prevState,
        skills: [...prevState.skills, newSkill.trim()],
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setUser((prevState) => ({
      ...prevState,
      skills: prevState.skills.filter((skill) => skill !== skillToRemove),
    }))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSkill()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`/api/auth/profile/${id}`, user)
      navigate('/profile')
    } catch (err) {
      setError('Error updating profile')
      console.error(err)
    }
  }

  return (
    <CRow>
      <CCol md={8}>
        <CCard className="mb-4">
          <CCardHeader>
            <h4>Edit Profile</h4>
          </CCardHeader>
          <CCardBody>
            {error && <div className="alert alert-danger">{error}</div>}
            <CForm onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <CFormInput
                  type="text"
                  name="name"
                  value={user.name || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <CFormInput
                  type="email"
                  name="email"
                  value={user.email || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Compétences</label>
                <div className="d-flex mb-2">
                  <CFormInput
                    type="text"
                    placeholder="Ajouter une compétence"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="me-2"
                  />
                  <CButton type="button" color="success" onClick={handleAddSkill}>
                    Ajouter
                  </CButton>
                </div>

                {user.skills && user.skills.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {user.skills.map((skill, index) => (
                      <div
                        key={index}
                        className="bg-light rounded-pill px-3 py-1 d-flex align-items-center"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          className="btn-close ms-2"
                          style={{ fontSize: '0.7rem' }}
                          onClick={() => handleRemoveSkill(skill)}
                          aria-label="Remove"
                        ></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted">Aucune compétence ajoutée</div>
                )}
              </div>

              <CButton type="submit" color="primary">
                Save Changes
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default EditProfile
