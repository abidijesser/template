import axios from '../utils/axios'

// API endpoints are relative since we're using the configured axios instance

/**
 * Get Google Calendar authentication URL
 * @returns {Promise<Object>} Authentication URL
 */
export const getGoogleCalendarAuthUrl = async () => {
  try {
    const response = await axios.get('/api/calendar/auth-url')
    return response.data
  } catch (error) {
    console.error('Error getting Google Calendar auth URL:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if user is authenticated with Google Calendar
 * @returns {Promise<Object>} Authentication status
 */
export const checkGoogleCalendarAuth = async () => {
  try {
    const response = await axios.get('/api/calendar/check-auth')
    return response.data
  } catch (error) {
    console.error('Error checking Google Calendar auth:', error)
    return { success: false, isAuthenticated: false, error: error.message }
  }
}

/**
 * Remove Google Calendar token
 * @returns {Promise<Object>} Result of token removal
 */
export const removeGoogleCalendarToken = async () => {
  try {
    const response = await axios.post('/api/calendar/remove-token', {})
    return response.data
  } catch (error) {
    console.error('Error removing Google Calendar token:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sync tasks with Google Calendar
 * @returns {Promise<Object>} Result of sync operation
 */
export const syncTasksWithGoogleCalendar = async () => {
  try {
    const response = await axios.post('/api/calendar/sync-tasks', {})
    return response.data
  } catch (error) {
    console.error('Error syncing tasks with Google Calendar:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sync projects with Google Calendar
 * @returns {Promise<Object>} Result of sync operation
 */
export const syncProjectsWithGoogleCalendar = async () => {
  try {
    const response = await axios.post('/api/calendar/sync-projects', {})
    return response.data
  } catch (error) {
    console.error('Error syncing projects with Google Calendar:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sync a specific task with Google Calendar
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Result of sync operation
 */
export const syncTaskWithGoogleCalendar = async (taskId) => {
  try {
    const response = await axios.post(`/api/calendar/sync-task/${taskId}`, {})
    return response.data
  } catch (error) {
    console.error('Error syncing task with Google Calendar:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sync a specific project with Google Calendar
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Result of sync operation
 */
export const syncProjectWithGoogleCalendar = async (projectId) => {
  try {
    const response = await axios.post(`/api/calendar/sync-project/${projectId}`, {})
    return response.data
  } catch (error) {
    console.error('Error syncing project with Google Calendar:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Format events for calendar display
 * @param {Array} projects - List of projects
 * @param {Array} tasks - List of tasks
 * @returns {Array} Formatted events
 */
export const formatCalendarEvents = (projects = [], tasks = []) => {
  const projectEvents = projects.map((project) => ({
    id: project._id,
    title: project.projectName,
    startDate: new Date(project.startDate),
    endDate: new Date(project.endDate),
    type: 'project',
    color: '#4f5d73', // Dark blue
    data: project,
  }))

  const taskEvents = tasks.map((task) => ({
    id: task._id,
    title: task.title,
    date: new Date(task.dueDate),
    type: 'task',
    color:
      task.priority === 'High' ? '#e55353' : task.priority === 'Medium' ? '#f9b115' : '#2eb85c',
    data: task,
  }))

  return [...projectEvents, ...taskEvents]
}
