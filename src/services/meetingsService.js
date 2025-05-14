import axios from 'axios'

const API_URL = 'http://localhost:3001/api/meetings' // URL de l'API meetings

// Get auth headers
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
})

// Fetch all meetings
export const fetchMeetings = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des réunions:', error)
    throw error
  }
}

// Get meeting by ID
export const getMeetingById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération de la réunion:', error)
    throw error
  }
}

// Create a new meeting
export const createMeeting = async (meetingData) => {
  try {
    const response = await axios.post(API_URL, meetingData, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la création de la réunion:', error)
    throw error
  }
}

// Update a meeting
export const updateMeeting = async (id, meetingData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, meetingData, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réunion:', error)
    throw error
  }
}

// Delete a meeting
export const deleteMeeting = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la suppression de la réunion:', error)
    throw error
  }
}

// Start a meeting
export const startMeeting = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/start`, {}, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Erreur lors du démarrage de la réunion:', error)
    throw error
  }
}

// End a meeting
export const endMeeting = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/end`, {}, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la fin de la réunion:', error)
    throw error
  }
}

// Join a meeting with a code
export const joinMeeting = async (meetingCode) => {
  try {
    const response = await axios.post(`${API_URL}/join`, { meetingCode }, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la connexion à la réunion:', error)
    throw error
  }
}

// Get active meetings
export const getActiveMeetings = async () => {
  try {
    const response = await axios.get(`${API_URL}/active`, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des réunions actives:', error)
    throw error
  }
}
