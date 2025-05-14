import axios from 'axios'

// Create an axios instance with base configuration
const instance = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout (increased from 10 seconds)
  withCredentials: true, // Allow cookies to be sent
})

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('Axios interceptor - Request to:', config.url)
    console.log('Axios interceptor - Full URL:', config.baseURL + config.url)
    console.log('Axios interceptor - Method:', config.method)
    console.log('Axios interceptor - Headers:', JSON.stringify(config.headers))
    console.log('Axios interceptor - Token exists:', !!token)

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('Axios interceptor - Added Authorization header')
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = Date.now().toString()

    return config
  },
  (error) => {
    console.error('Axios request interceptor error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    return Promise.reject(error)
  },
)

// Add a response interceptor
instance.interceptors.response.use(
  (response) => {
    console.log(`Axios interceptor - Response from ${response.config.url}:`, {
      status: response.status,
      success: response.data?.success,
      data: response.data,
    })
    return response
  },
  (error) => {
    console.error('Axios response error:', error.message)
    console.error('Error type:', error.constructor.name)
    console.error('Error code:', error.code)

    // Log network errors
    if (error.message === 'Network Error') {
      console.error('Network error details:', {
        message: 'Unable to connect to the server. Please check if the server is running.',
        config: error.config
          ? {
              url: error.config.url,
              baseURL: error.config.baseURL,
              method: error.config.method,
              timeout: error.config.timeout,
            }
          : 'No config available',
      })
    }

    if (error.response) {
      console.error('Error response data:', error.response.data)
      console.error('Error response status:', error.response.status)
      console.error('Error response headers:', error.response.headers)

      // Handle authentication errors
      if (error.response.status === 401) {
        console.log('Authentication error detected')

        // Don't redirect if we're already on the login page
        if (!window.location.pathname.includes('/login')) {
          // If the token is invalid or expired
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('userRole')
          localStorage.removeItem('userName')

          // Store the current URL to redirect back after login
          localStorage.setItem('redirectAfterLogin', window.location.pathname)

          // Redirect to login page
          window.location.href = '/login'
        }
      }

      // Handle server errors
      if (error.response.status >= 500) {
        console.error('Server error detected')
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Request details:', {
        method: error.request.method,
        url: error.request.url,
        status: error.request.status,
        responseType: error.request.responseType,
        readyState: error.request.readyState,
        responseText: error.request.responseText,
      })
    }

    return Promise.reject(error)
  },
)

export default instance
