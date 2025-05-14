import axios from 'axios'

const API_URL = 'http://localhost:3001/api/projects'

// Get auth headers
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
})

/**
 * Fetch all projects for the connected user
 * @returns {Promise<Array>} List of projects
 */
export const fetchProjects = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders())

    if (response.data && response.data.success) {
      return response.data.projects
    } else {
      throw new Error('Failed to fetch projects')
    }
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw error
  }
}

/**
 * Fetch a project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project data
 */
export const fetchProjectById = async (projectId) => {
  try {
    const response = await axios.get(`${API_URL}/${projectId}`, getAuthHeaders())

    if (response.data && response.data.success) {
      return response.data.project
    } else {
      throw new Error('Failed to fetch project')
    }
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error)
    throw error
  }
}

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} Created project
 */
export const createProject = async (projectData) => {
  try {
    const response = await axios.post(API_URL, projectData, getAuthHeaders())

    if (response.data && response.data.success) {
      return response.data.project
    } else {
      throw new Error('Failed to create project')
    }
  } catch (error) {
    console.error('Error creating project:', error)
    throw error
  }
}

/**
 * Update a project
 * @param {string} projectId - Project ID
 * @param {Object} projectData - Updated project data
 * @returns {Promise<Object>} Updated project
 */
export const updateProject = async (projectId, projectData) => {
  try {
    const response = await axios.put(`${API_URL}/${projectId}`, projectData, getAuthHeaders())

    if (response.data && response.data.success) {
      return response.data.project
    } else {
      throw new Error('Failed to update project')
    }
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error)
    throw error
  }
}

/**
 * Delete a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Response data
 */
export const deleteProject = async (projectId) => {
  try {
    const response = await axios.delete(`${API_URL}/${projectId}`, getAuthHeaders())

    if (response.data && response.data.success) {
      return response.data
    } else {
      throw new Error('Failed to delete project')
    }
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error)
    throw error
  }
}

/**
 * Fetch only projects where the user is a member or owner
 * @returns {Promise<Array>} List of projects
 */
export const fetchUserProjects = async () => {
  try {
    const response = await axios.get(`${API_URL}/user-projects`, getAuthHeaders())

    if (response.data && response.data.success) {
      return response.data.projects
    } else {
      throw new Error('Failed to fetch user projects')
    }
  } catch (error) {
    console.error('Error fetching user projects:', error)
    throw error
  }
}
