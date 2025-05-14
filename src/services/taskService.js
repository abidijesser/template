import axios from '../utils/axios'

/**
 * Service pour gérer les tâches
 */

// Récupérer toutes les tâches de l'utilisateur
export const getUserTasks = async () => {
  try {
    console.log('taskService - Fetching tasks from API...')
    const token = localStorage.getItem('token')
    console.log('taskService - Token exists:', !!token)

    const response = await axios.get('/api/tasks')

    console.log('taskService - Response received:', response.status)
    console.log('taskService - Response data:', response.data)

    if (response.data && response.data.success) {
      console.log('taskService - Tasks fetched successfully:', response.data.tasks.length)
      return response.data.tasks
    } else {
      console.error('taskService - Response format unexpected:', response.data)
      throw new Error('Failed to fetch tasks')
    }
  } catch (error) {
    console.error('taskService - Error fetching tasks:', error)
    console.error('taskService - Error details:', error.response?.data || 'No response data')
    throw error
  }
}

// Récupérer les tâches assignées à l'utilisateur
export const getAssignedTasks = async () => {
  try {
    const tasks = await getUserTasks()
    const userId = getUserIdFromLocalStorage()

    console.log('getAssignedTasks - All tasks:', tasks.length)
    console.log('getAssignedTasks - Current user ID:', userId)

    if (!userId) {
      console.log('getAssignedTasks - No user ID found, returning empty array')
      return []
    }

    // Log task structure to debug
    if (tasks.length > 0) {
      console.log('getAssignedTasks - Sample task structure:', JSON.stringify(tasks[0], null, 2))
    }

    // Log all tasks to see their assignedTo values
    tasks.forEach((task, index) => {
      if (index < 10) {
        // Limit to first 10 tasks to avoid console spam
        console.log(
          `Task ${index}: ${task.title}, assignedTo:`,
          typeof task.assignedTo === 'object'
            ? `${task.assignedTo?._id} (${task.assignedTo?.name || 'unnamed'})`
            : task.assignedTo,
        )
      }
    })

    // Filtrer les tâches assignées à l'utilisateur (sans filtrer par statut)
    const assignedTasks = tasks.filter((task) => {
      // Check if assignedTo exists
      const hasAssignedTo = !!task.assignedTo

      // Check if the ID matches
      let isAssignedToUser = false
      if (hasAssignedTo) {
        // Handle both object and string cases
        if (typeof task.assignedTo === 'object') {
          isAssignedToUser = task.assignedTo._id === userId
        } else {
          isAssignedToUser = task.assignedTo === userId
        }
      }

      // For debugging
      if (hasAssignedTo && !isAssignedToUser) {
        console.log(
          'Task assigned to someone else:',
          task.title,
          typeof task.assignedTo === 'object'
            ? `${task.assignedTo._id} (${task.assignedTo.name || 'unnamed'})`
            : task.assignedTo,
        )
      }

      return hasAssignedTo && isAssignedToUser
    })

    console.log('getAssignedTasks - Filtered tasks count:', assignedTasks.length)

    return assignedTasks
  } catch (error) {
    console.error('Error fetching assigned tasks:', error)
    return []
  }
}

// Récupérer le nombre total de tâches
export const getTotalTasksCount = async () => {
  try {
    const tasks = await getUserTasks()
    return tasks.length
  } catch (error) {
    console.error('Error fetching total tasks count:', error)
    return 0
  }
}

// Récupérer l'ID de l'utilisateur depuis le localStorage
const getUserIdFromLocalStorage = () => {
  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      return parsedUser._id
    }
    return null
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

// Récupérer toutes les tâches pour le calendrier (assignées à l'utilisateur ou dans ses projets)
export const getCalendarTasks = async () => {
  try {
    const tasks = await getUserTasks()
    const userId = getUserIdFromLocalStorage()

    console.log('getCalendarTasks - All tasks:', tasks.length)
    console.log('getCalendarTasks - Current user ID:', userId)

    if (!userId) {
      console.log('getCalendarTasks - No user ID found, returning empty array')
      return []
    }

    // Include all tasks that have a dueDate
    const calendarTasks = tasks.filter((task) => {
      return task.dueDate && task.dueDate !== ''
    })

    console.log('getCalendarTasks - Tasks with dueDate:', calendarTasks.length)

    return calendarTasks
  } catch (error) {
    console.error('Error fetching calendar tasks:', error)
    return []
  }
}
