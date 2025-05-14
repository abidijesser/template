import axios from 'axios';

/**
 * Service pour récupérer les données nécessaires pour les réponses de Gemini
 */

// URL de base de l'API
const API_URL = 'http://localhost:3001/api';

/**
 * Récupère les tâches de l'utilisateur
 * @returns {Promise<Array>} Liste des tâches
 */
export const getUserTasks = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API_URL}/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data && response.data.success) {
      return response.data.tasks;
    } else {
      throw new Error('Failed to fetch tasks');
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

/**
 * Récupère les projets de l'utilisateur
 * @returns {Promise<Array>} Liste des projets
 */
export const getUserProjects = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API_URL}/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data && response.data.success) {
      return response.data.projects;
    } else {
      throw new Error('Failed to fetch projects');
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

/**
 * Récupère les tâches dues aujourd'hui
 * @returns {Promise<Array>} Liste des tâches dues aujourd'hui
 */
export const getTodayTasks = async () => {
  try {
    const tasks = await getUserTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    });
  } catch (error) {
    console.error('Error fetching today tasks:', error);
    throw error;
  }
};

/**
 * Récupère les projets en retard
 * @returns {Promise<Array>} Liste des projets en retard
 */
export const getDelayedProjects = async () => {
  try {
    const projects = await getUserProjects();
    const today = new Date();
    
    return projects.filter(project => {
      if (!project.endDate) return false;
      const endDate = new Date(project.endDate);
      return endDate < today && project.status !== 'completed';
    });
  } catch (error) {
    console.error('Error fetching delayed projects:', error);
    throw error;
  }
};

/**
 * Récupère les membres de l'équipe disponibles
 * @returns {Promise<Array>} Liste des membres disponibles
 */
export const getAvailableTeamMembers = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Cette fonction est un exemple - vous devrez l'adapter à votre API
    const response = await axios.get(`${API_URL}/auth/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data && response.data.users) {
      // Logique pour déterminer les utilisateurs disponibles
      // Ceci est un exemple simplifié
      return response.data.users;
    } else {
      throw new Error('Failed to fetch users');
    }
  } catch (error) {
    console.error('Error fetching available team members:', error);
    throw error;
  }
};

/**
 * Récupère toutes les données nécessaires pour Gemini
 * @returns {Promise<Object>} Toutes les données
 */
export const getAllGeminiData = async () => {
  try {
    const [tasks, projects, todayTasks, delayedProjects] = await Promise.all([
      getUserTasks(),
      getUserProjects(),
      getTodayTasks(),
      getDelayedProjects()
    ]);

    // Essayer de récupérer les membres disponibles, mais ne pas bloquer si ça échoue
    let availableMembers = [];
    try {
      availableMembers = await getAvailableTeamMembers();
    } catch (error) {
      console.warn('Could not fetch available team members:', error);
    }

    return {
      tasks,
      projects,
      todayTasks,
      delayedProjects,
      availableMembers
    };
  } catch (error) {
    console.error('Error fetching all Gemini data:', error);
    throw error;
  }
};
