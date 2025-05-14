import axios from 'axios'

/**
 * Get member recommendations for a task based on skills
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} - Recommendations data
 */
export const getRecommendedMembers = async (title, description, projectId) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await axios.post(
      'http://localhost:3001/api/recommendations/members',
      { title, description, projectId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    return response.data
  } catch (error) {
    console.error('Error getting recommended members:', error)
    throw error
  }
}

export default {
  getRecommendedMembers,
}
