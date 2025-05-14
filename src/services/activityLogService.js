import axios from '../utils/axios'

const API_URL = '/api/activity'

// Get activity logs for a project
export const getProjectActivityLogs = async (projectId, limit = 50, skip = 0) => {
  try {
    const response = await axios.get(`${API_URL}/project/${projectId}?limit=${limit}&skip=${skip}`)
    return response.data
  } catch (error) {
    console.error('Error getting project activity logs:', error)
    throw error
  }
}

// Get activity logs for a task
export const getTaskActivityLogs = async (taskId, limit = 50, skip = 0) => {
  try {
    const response = await axios.get(`${API_URL}/task/${taskId}?limit=${limit}&skip=${skip}`)
    return response.data
  } catch (error) {
    console.error('Error getting task activity logs:', error)
    throw error
  }
}

// Get activity logs for a user
export const getUserActivityLogs = async (userId, limit = 50, skip = 0) => {
  try {
    const response = await axios.get(`${API_URL}/user/${userId}?limit=${limit}&skip=${skip}`)
    return response.data
  } catch (error) {
    console.error('Error getting user activity logs:', error)
    throw error
  }
}

// Get recent activity logs for dashboard
export const getRecentActivityLogs = async (limit = 20, skip = 0, action = null) => {
  try {
    let url = `${API_URL}/recent?limit=${limit}&skip=${skip}`

    // Add action filter if provided
    if (action && action !== 'all') {
      url += `&action=${action}`
    }

    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.error('Error getting recent activity logs:', error)
    throw error
  }
}

// Get recent comment activities only
export const getRecentComments = async (limit = 5) => {
  try {
    const response = await axios.get(`${API_URL}/comments?limit=${limit}`)
    return response.data
  } catch (error) {
    console.error('Error getting recent comments:', error)
    throw error
  }
}
