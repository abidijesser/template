import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CButton,
  CSpinner,
  CFormInput,
  CBadge,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CModalTitle,
  CForm,
  CFormLabel,
  CFormSelect,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilVideo, cilSearch, cilPlus } from '@coreui/icons'
import { fetchMeetings, createMeeting, startMeeting } from '../../services/meetingsService'
import { fetchMeetingParticipants } from '../../services/userService'

const MeetingsList = () => {
  const navigate = useNavigate()
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    participants: [],
  })
  const [formError, setFormError] = useState(null)

  // Fetch meetings on component mount
  useEffect(() => {
    const getMeetings = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('token')
        if (!token) {
          setError('You must be logged in to view meetings')
          setLoading(false)
          return
        }

        setLoading(true)
        const response = await fetchMeetings()
        if (response.success) {
          setMeetings(response.meetings)
        } else {
          setError('Failed to load meetings')
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setError('Authentication error. Please log in again.')
          // Redirect to login page
          setTimeout(() => navigate('/login'), 2000)
        } else {
          setError('Error loading meetings: ' + (err.response?.data?.error || err.message))
        }
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    getMeetings()
  }, [navigate])

  // Fetch users for participant selection
  useEffect(() => {
    const getUsers = async () => {
      try {
        setLoadingUsers(true)
        const response = await fetchMeetingParticipants()
        if (response.success) {
          setUsers(response.users)
        } else {
          console.error('Failed to load users for participant selection')
        }
      } catch (err) {
        console.error('Error loading users:', err)
      } finally {
        setLoadingUsers(false)
      }
    }

    getUsers()
  }, [])

  // Filter meetings based on search term
  const filteredMeetings = meetings.filter(
    (meeting) =>
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.description && meeting.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === 'participants') {
      // Handle multi-select for participants
      const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
      setNewMeeting((prev) => ({
        ...prev,
        participants: selectedOptions,
      }))
    } else {
      // Handle other inputs
      setNewMeeting((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  // Handle form submission
  const handleCreateMeeting = async (e) => {
    e.preventDefault()

    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      setFormError('You must be logged in to create a meeting')
      return
    }

    // Validate form
    if (
      !newMeeting.title ||
      !newMeeting.startTime ||
      !newMeeting.endTime ||
      newMeeting.participants.length === 0
    ) {
      setFormError('Please fill in all required fields and select at least one participant')
      return
    }

    // Validate end time is after start time
    if (new Date(newMeeting.endTime) <= new Date(newMeeting.startTime)) {
      setFormError('End time must be after start time')
      return
    }

    try {
      const response = await createMeeting(newMeeting)
      if (response.success) {
        // Add new meeting to the list
        setMeetings((prev) => [...prev, response.meeting])
        // Close modal and reset form
        setShowCreateModal(false)
        setNewMeeting({
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          location: '',
          participants: [],
        })
        setFormError(null)
      } else {
        setFormError('Failed to create meeting')
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setFormError('Authentication error. Please log in again.')
        // Redirect to login page
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setFormError('Error creating meeting: ' + (err.response?.data?.error || err.message))
      }
      console.error(err)
    }
  }

  // Handle joining a meeting
  const handleJoinMeeting = (meetingId) => {
    navigate(`/meeting-room/${meetingId}`)
  }

  // Handle starting a meeting (for organizer)
  const handleStartMeeting = async (meetingId) => {
    try {
      // Use the startMeeting function from meetingsService instead of fetch
      const response = await startMeeting(meetingId)

      if (response.success) {
        // Navigate to meeting room
        navigate(`/meeting-room/${meetingId}?code=${response.meeting.meetingCode}`)
      } else {
        setError('Failed to start meeting: ' + (response.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('Error starting meeting:', err)
      setError('Error starting meeting: ' + (err.response?.data?.error || err.message))
    }
  }

  // Get badge color based on meeting status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'info'
      case 'in-progress':
        return 'success'
      case 'completed':
        return 'secondary'
      case 'cancelled':
        return 'danger'
      default:
        return 'primary'
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Meetings</h4>
          <div className="d-flex">
            <div className="me-2">
              <CFormInput
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control-sm"
              />
            </div>
            <CButton color="primary" onClick={() => setShowCreateModal(true)}>
              <CIcon icon={cilPlus} className="me-2" />
              New Meeting
            </CButton>
          </div>
        </CCardHeader>
        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}

          {meetings.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">No meetings found</p>
              <CButton color="primary" onClick={() => setShowCreateModal(true)}>
                Create your first meeting
              </CButton>
            </div>
          ) : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Title</CTableHeaderCell>
                  <CTableHeaderCell>Organizer</CTableHeaderCell>
                  <CTableHeaderCell>Start Time</CTableHeaderCell>
                  <CTableHeaderCell>End Time</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredMeetings.map((meeting) => (
                  <CTableRow key={meeting._id}>
                    <CTableDataCell>{meeting.title}</CTableDataCell>
                    <CTableDataCell>
                      {meeting.organizer ? meeting.organizer.name : 'Unknown'}
                    </CTableDataCell>
                    <CTableDataCell>{formatDate(meeting.startTime)}</CTableDataCell>
                    <CTableDataCell>{formatDate(meeting.endTime)}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={getStatusBadgeColor(meeting.status)}>{meeting.status}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      {meeting.isActive ? (
                        <CButton
                          color="success"
                          size="sm"
                          className="me-2"
                          onClick={() => handleJoinMeeting(meeting._id)}
                        >
                          <CIcon icon={cilVideo} className="me-1" />
                          Join Meeting
                        </CButton>
                      ) : (
                        meeting.status === 'scheduled' &&
                        meeting.organizer &&
                        meeting.organizer._id === localStorage.getItem('userId') && (
                          <CButton
                            color="primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleStartMeeting(meeting._id)}
                          >
                            <CIcon icon={cilVideo} className="me-1" />
                            Start Meeting
                          </CButton>
                        )
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Create Meeting Modal */}
      <CModal visible={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <CModalHeader>
          <CModalTitle>Create New Meeting</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {formError && <CAlert color="danger">{formError}</CAlert>}
          <CForm onSubmit={handleCreateMeeting}>
            <div className="mb-3">
              <CFormLabel htmlFor="title">Title *</CFormLabel>
              <CFormInput
                id="title"
                name="title"
                value={newMeeting.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="description">Description</CFormLabel>
              <CFormInput
                id="description"
                name="description"
                value={newMeeting.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="startTime">Start Time *</CFormLabel>
              <CFormInput
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={newMeeting.startTime}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="endTime">End Time *</CFormLabel>
              <CFormInput
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={newMeeting.endTime}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="location">Location</CFormLabel>
              <CFormInput
                id="location"
                name="location"
                value={newMeeting.location}
                onChange={handleInputChange}
                placeholder="Virtual or physical location"
              />
            </div>

            <div className="mb-3">
              <CFormLabel htmlFor="participants">Participants *</CFormLabel>
              <CFormSelect
                id="participants"
                name="participants"
                value={newMeeting.participants}
                onChange={handleInputChange}
                multiple
                size="5"
                aria-label="Select participants"
              >
                <option value="" disabled>
                  Select participants
                </option>
                {loadingUsers ? (
                  <option value="" disabled>
                    Loading users...
                  </option>
                ) : (
                  users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))
                )}
              </CFormSelect>
              <div className="small text-muted mt-1">
                Hold Ctrl (or Cmd) to select multiple participants
              </div>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleCreateMeeting}>
            Create Meeting
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default MeetingsList
