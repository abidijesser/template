import axios from '../utils/axios'

/**
 * Récupère les projets avec leurs tâches pour l'affichage dans le tableau de bord
 * @param {number} limit - Nombre de projets à récupérer (optionnel). Si 0, récupère tous les projets.
 * @returns {Promise<Array>} Liste des projets avec leurs statistiques
 */
export const getProjectsForDashboard = async (limit = 3) => {
  try {
    // Récupérer tous les projets
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    // Utiliser l'endpoint spécifique pour le tableau de bord qui inclut les tâches
    const response = await axios.get('http://localhost:3001/api/projects', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params: {
        includeTasks: true, // Demander explicitement d'inclure les tâches
        populate: 'tasks', // Demander de peupler les tâches
      },
    })
    console.log('API Response:', response.data)

    if (!response.data || !response.data.success) {
      throw new Error('Échec de la récupération des projets')
    }

    let projects = response.data.projects

    // Log each project and its tasks
    projects.forEach((project) => {
      console.log(
        `Project ${project.projectName} has ${project.tasks ? project.tasks.length : 0} tasks`,
      )
      if (project.tasks && project.tasks.length > 0) {
        console.log('First task:', project.tasks[0])
      }
    })

    // Trier les projets par date de fin (les plus proches d'abord)
    projects.sort((a, b) => new Date(a.endDate) - new Date(b.endDate))

    // Limiter le nombre de projets si nécessaire
    // Si limit est 0, on retourne tous les projets
    if (limit > 0) {
      projects = projects.slice(0, limit)
    }

    // Calculer les statistiques pour chaque projet
    const projectsWithStats = projects.map((project) => {
      console.log('Project:', project.projectName, 'Tasks:', project.tasks)

      // Vérifier si les tâches sont correctement récupérées
      if (!project.tasks) {
        console.warn(`Le projet ${project.projectName} n'a pas de tâches définies`)
      } else if (!Array.isArray(project.tasks)) {
        console.warn(
          `Les tâches du projet ${project.projectName} ne sont pas un tableau:`,
          project.tasks,
        )
      } else {
        console.log(`Le projet ${project.projectName} a ${project.tasks.length} tâches`)
        // Log the first task to see its structure
        if (project.tasks.length > 0) {
          console.log('Première tâche:', project.tasks[0])
        }
      }

      // Ensure tasks is an array
      const tasks = Array.isArray(project.tasks) ? project.tasks : []

      // Compter les tâches terminées
      // Vérifier si le statut est 'Done' ou 'Terminé' pour prendre en compte les différentes valeurs possibles
      const completedTasks = tasks.filter((task) => {
        if (!task) return false
        const status = task.status ? task.status.toLowerCase() : ''
        return status === 'done' || status === 'terminé' || status === 'terminée'
      }).length

      console.log(`Tâches terminées pour ${project.projectName}: ${completedTasks}/${tasks.length}`)

      // Calculer le pourcentage de progression
      const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
      console.log(`Progression pour ${project.projectName}: ${progress}%`)

      // Déterminer le statut du projet
      let status = 'En cours'
      let statusColor = 'primary'

      if (project.status === 'Completed') {
        status = 'Terminé'
        statusColor = 'success'
      } else if (progress >= 90) {
        status = 'Presque terminé'
        statusColor = 'success'
      } else if (new Date(project.endDate) < new Date()) {
        status = 'En retard'
        statusColor = 'danger'
      }

      // Formater la date d'échéance
      const dueDate = new Date(project.endDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

      return {
        id: project._id,
        title: project.projectName,
        progress,
        status,
        statusColor,
        tasks: tasks.length,
        completedTasks,
        dueDate,
      }
    })

    return projectsWithStats
  } catch (error) {
    console.error('Erreur lors de la récupération des projets pour le tableau de bord:', error)
    throw error
  }
}
