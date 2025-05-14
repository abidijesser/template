import axios from 'axios'

const API_URL = 'http://localhost:3001/api/media'

// Create axios instance with auth token
const getAuthAxios = () => {
  const token = localStorage.getItem('token')
  return axios.create({
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  })
}

// Get all media with pagination and filters
const getAllMedia = async (page = 1, limit = 10, search = '', fileType = '', project = '') => {
  try {
    const authAxios = getAuthAxios()
    const response = await authAxios.get(API_URL, {
      params: {
        page,
        limit,
        search,
        fileType,
        project,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching media:', error)
    // Return a structured error response instead of throwing
    return {
      success: false,
      error: error.response?.data?.error || 'Error fetching media',
      data: [],
      pagination: { pages: 1, page: 1, limit, total: 0 },
    }
  }
}

// Get media by ID
const getMediaById = async (id) => {
  try {
    const authAxios = getAuthAxios()
    const response = await authAxios.get(`${API_URL}/${id}`)
    return response.data
  } catch (error) {
    console.error('Error fetching media by ID:', error)
    // Return a structured error response instead of throwing
    return {
      success: false,
      error: error.response?.data?.error || 'Error fetching media by ID',
      data: null,
    }
  }
}

// Get media by project
const getMediaByProject = async (projectId, page = 1, limit = 10) => {
  try {
    const authAxios = getAuthAxios()
    const response = await authAxios.get(`${API_URL}/project/${projectId}`, {
      params: { page, limit },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching project media:', error)
    throw error
  }
}

// Get media by task
const getMediaByTask = async (taskId, page = 1, limit = 10) => {
  try {
    const authAxios = getAuthAxios()
    const response = await authAxios.get(`${API_URL}/task/${taskId}`, {
      params: { page, limit },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching task media:', error)
    throw error
  }
}

// Get media by user (current user)
const getMyMedia = async (page = 1, limit = 10) => {
  try {
    // Get current user ID from local storage or context
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user || !user.id) {
      throw new Error('User not authenticated')
    }

    const authAxios = getAuthAxios()
    const response = await authAxios.get(`${API_URL}/user/${user.id}`, {
      params: { page, limit },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching user media:', error)
    throw error
  }
}

// Upload new media
const uploadMedia = async (formData) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    })
    return response.data
  } catch (error) {
    console.error('Error uploading media:', error)
    // Return a structured error response instead of throwing
    return {
      success: false,
      error: error.response?.data?.error || 'Error uploading media',
    }
  }
}

// Update media
const updateMedia = async (id, data) => {
  try {
    const authAxios = getAuthAxios()
    const response = await authAxios.put(`${API_URL}/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Error updating media:', error)
    // Return a structured error response instead of throwing
    return {
      success: false,
      error: error.response?.data?.error || 'Error updating media',
    }
  }
}

// Delete media
const deleteMedia = async (id) => {
  try {
    const authAxios = getAuthAxios()
    const response = await authAxios.delete(`${API_URL}/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting media:', error)
    // Return a structured error response instead of throwing
    return {
      success: false,
      error: error.response?.data?.error || 'Error deleting media',
    }
  }
}

const mediaService = {
  getAllMedia,
  getMediaById,
  getMediaByProject,
  getMediaByTask,
  getMyMedia,
  uploadMedia,
  updateMedia,
  deleteMedia,
}

export default mediaService
