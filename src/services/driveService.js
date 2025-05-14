import axios from '../utils/axios'

/**
 * Get Google Drive authentication URL
 * @returns {Promise<{success: boolean, authUrl: string}>} Authentication URL
 */
export const getGoogleDriveAuthUrl = async () => {
  try {
    // Get user ID from JWT token
    const token = localStorage.getItem('token')
    if (!token) {
      return {
        success: false,
        error: 'Authentication required. Please log in.',
      }
    }

    // Decode the JWT token to get the user ID
    let userId = ''
    try {
      // JWT tokens are in the format: header.payload.signature
      // We need to decode the payload part (index 1)
      const payload = token.split('.')[1]
      const decodedPayload = JSON.parse(atob(payload))
      userId = decodedPayload.id

      if (!userId) {
        return {
          success: false,
          error: 'Could not extract user ID from token.',
        }
      }
    } catch (err) {
      console.error('Error decoding JWT token:', err)
      return {
        success: false,
        error: 'Invalid authentication token.',
      }
    }

    // Pass the user ID as a query parameter
    const response = await axios.get(`/api/drive/auth-url?userId=${userId}`)
    return response.data
  } catch (error) {
    console.error('Error getting Google Drive auth URL:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    }
  }
}

/**
 * Check if user is authenticated with Google Drive
 * @returns {Promise<{success: boolean, isAuthenticated: boolean}>} Authentication status
 */
export const checkGoogleDriveAuth = async () => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No authentication token found')
      return {
        success: false,
        isAuthenticated: false,
        error: 'Authentication required. Please log in.',
      }
    }

    const response = await axios.get('/api/drive/check-auth', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error checking Google Drive auth:', error)
    return {
      success: false,
      isAuthenticated: false,
      error: error.response?.data?.error || error.message,
      details: error.response?.data?.details,
    }
  }
}

/**
 * Remove Google Drive token
 * @returns {Promise<{success: boolean}>} Result
 */
export const removeGoogleDriveToken = async () => {
  try {
    const response = await axios.post('/api/drive/remove-token')
    return response.data
  } catch (error) {
    console.error('Error removing Google Drive token:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    }
  }
}

/**
 * Upload file to Google Drive
 * @param {FormData} formData - Form data with file and metadata
 * @returns {Promise<{success: boolean, data: Object}>} Upload result
 */
export const uploadFileToDrive = async (formData) => {
  try {
    const response = await axios.post('/api/drive/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error)

    // Check if user needs to re-authenticate
    if (
      error.response?.data?.code === 'NOT_AUTHENTICATED' ||
      error.response?.data?.code === 'REAUTH_REQUIRED'
    ) {
      return {
        success: false,
        error: error.response.data.error,
        needsAuth: true,
      }
    }

    return {
      success: false,
      error: error.response?.data?.error || error.message,
    }
  }
}

/**
 * List files from Google Drive
 * @param {Object} options - Query options
 * @param {number} options.pageSize - Number of files to return
 * @param {string} options.pageToken - Token for pagination
 * @param {string} options.query - Search query
 * @param {string} options.orderBy - Order by field
 * @returns {Promise<{success: boolean, files: Array, nextPageToken: string}>} List result
 */
export const listDriveFiles = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (options.pageSize) queryParams.append('pageSize', options.pageSize)
    if (options.pageToken) queryParams.append('pageToken', options.pageToken)
    if (options.query) queryParams.append('query', options.query)
    if (options.orderBy) queryParams.append('orderBy', options.orderBy)

    const response = await axios.get(`/api/drive/files?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error listing files from Google Drive:', error)

    // Check if user needs to re-authenticate
    if (
      error.response?.data?.code === 'NOT_AUTHENTICATED' ||
      error.response?.data?.code === 'REAUTH_REQUIRED'
    ) {
      return {
        success: false,
        error: error.response.data.error,
        needsAuth: true,
      }
    }

    return {
      success: false,
      error: error.response?.data?.error || error.message,
      files: [],
    }
  }
}

/**
 * Import a file from Google Drive to the application
 * @param {Object} fileData - File data
 * @param {string} fileData.fileId - Google Drive file ID
 * @param {string} fileData.title - Title for the imported file (optional)
 * @param {string} fileData.description - Description for the imported file (optional)
 * @param {string} fileData.project - Project ID to associate with the file (optional)
 * @param {boolean} fileData.isPublic - Whether the file should be public (optional)
 * @returns {Promise<{success: boolean, data: Object}>} Import result
 */
export const importFileFromDrive = async (fileData) => {
  try {
    const response = await axios.post('/api/drive/import', fileData)
    return response.data
  } catch (error) {
    console.error('Error importing file from Google Drive:', error)

    // Check if user needs to re-authenticate
    if (
      error.response?.data?.code === 'NOT_AUTHENTICATED' ||
      error.response?.data?.code === 'REAUTH_REQUIRED'
    ) {
      return {
        success: false,
        error: error.response.data.error,
        needsAuth: true,
      }
    }

    return {
      success: false,
      error: error.response?.data?.error || error.message,
    }
  }
}

export default {
  getGoogleDriveAuthUrl,
  checkGoogleDriveAuth,
  removeGoogleDriveToken,
  uploadFileToDrive,
  listDriveFiles,
  importFileFromDrive,
}
