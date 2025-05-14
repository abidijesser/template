import axios from './axios'

// Function to check if user is authenticated
export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null
}

// Function to get the current user's information
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return null
    }

    const response = await axios.get('/api/auth/profile')
    return response.data.user
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}

// Function to check if user has admin role
export const isAdmin = async () => {
  try {
    console.log('isAdmin function called')

    // First check localStorage for a faster response
    const storedRole = localStorage.getItem('userRole')
    console.log('Role from localStorage:', storedRole)

    if (storedRole) {
      const isAdminRole = storedRole === 'Admin'
      console.log('Is admin based on localStorage:', isAdminRole)
      return isAdminRole
    }

    // If no role in localStorage, check with the server
    console.log('No role in localStorage, checking with server')
    const user = await getCurrentUser()
    console.log('User from server:', user)

    const isAdminUser = user && user.role === 'Admin'
    console.log('Is admin based on server response:', isAdminUser)

    // Store the role for future checks
    if (user && user.role) {
      console.log('Storing role in localStorage:', user.role)
      localStorage.setItem('userRole', user.role)
    }

    return isAdminUser
  } catch (error) {
    console.error('Error checking admin role:', error)
    return false
  }
}

// Function to check if user has client role
export const isClient = async () => {
  try {
    console.log('isClient function called')

    // First check localStorage for a faster response
    const storedRole = localStorage.getItem('userRole')
    console.log('Role from localStorage:', storedRole)

    if (storedRole) {
      const isClientRole = storedRole === 'Client'
      console.log('Is client based on localStorage:', isClientRole)
      return isClientRole
    }

    // If no role in localStorage, check with the server
    console.log('No role in localStorage, checking with server')
    const user = await getCurrentUser()
    console.log('User from server:', user)

    const isClientUser = user && user.role === 'Client'
    console.log('Is client based on server response:', isClientUser)

    // Store the role for future checks
    if (user && user.role) {
      console.log('Storing role in localStorage:', user.role)
      localStorage.setItem('userRole', user.role)
    }

    return isClientUser
  } catch (error) {
    console.error('Error checking client role:', error)
    return false
  }
}

// Function to handle login
export const login = async (email, password) => {
  try {
    const response = await axios.post('/api/auth/login', { email, password })
    if (response.data.success) {
      localStorage.setItem('token', response.data.token)

      // Store user role and ID if available
      if (response.data.user) {
        if (response.data.user.role) {
          localStorage.setItem('userRole', response.data.user.role)
          console.log('User role stored in authUtils:', response.data.user.role)
        }

        if (response.data.user._id) {
          localStorage.setItem('userId', response.data.user._id)
          console.log('User ID stored in authUtils:', response.data.user._id)
        }

        if (response.data.user.name) {
          localStorage.setItem('userName', response.data.user.name)
          console.log('User name stored in authUtils:', response.data.user.name)
        }
      }

      return { success: true, user: response.data.user }
    } else if (response.data.message === '2FA required') {
      return { success: false, requires2FA: true }
    } else {
      return { success: false, error: response.data.error || 'Login failed' }
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: error.response?.data?.error || 'An error occurred during login',
    }
  }
}

// Function to handle 2FA verification
export const verify2FA = async (email, password, twoFactorToken) => {
  try {
    const response = await axios.post(
      '/api/auth/login',
      { email, password },
      { headers: { 'x-2fa-token': twoFactorToken } },
    )

    if (response.data.success) {
      localStorage.setItem('token', response.data.token)

      // Store user role and ID if available
      if (response.data.user) {
        if (response.data.user.role) {
          localStorage.setItem('userRole', response.data.user.role)
          console.log('User role stored in 2FA verification:', response.data.user.role)
        }

        if (response.data.user._id) {
          localStorage.setItem('userId', response.data.user._id)
          console.log('User ID stored in 2FA verification:', response.data.user._id)
        }

        if (response.data.user.name) {
          localStorage.setItem('userName', response.data.user.name)
          console.log('User name stored in 2FA verification:', response.data.user.name)
        }
      }

      return { success: true, user: response.data.user }
    } else {
      return { success: false, error: response.data.error || 'Verification failed' }
    }
  } catch (error) {
    console.error('2FA verification error:', error)
    return {
      success: false,
      error: error.response?.data?.error || 'An error occurred during verification',
    }
  }
}

// Function to handle registration
export const register = async (userData) => {
  try {
    const response = await axios.post('/api/auth/register', userData)
    if (response.data.success) {
      return { success: true, token: response.data.token }
    } else {
      return { success: false, error: response.data.error || 'Registration failed' }
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: error.response?.data?.error || 'An error occurred during registration',
    }
  }
}

// Function to handle logout
export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userRole')
  console.log('Token and user role removed from localStorage')
  // Optionally call the logout endpoint if needed
  // axios.get('/auth/logout');
}
