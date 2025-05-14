import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Récupérer les données de performance
export const getPerformanceData = async () => {
  try {
    console.log('Récupération des données de performance...');
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Récupérer les tâches
    let tasks = [];
    try {
      const tasksResponse = await axios.get(`${API_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (tasksResponse.data && tasksResponse.data.success && Array.isArray(tasksResponse.data.tasks)) {
        tasks = tasksResponse.data.tasks;
        console.log(`${tasks.length} tâches récupérées`);
      } else {
        console.warn('Format de réponse inattendu pour les tâches:', tasksResponse.data);
      }
    } catch (taskError) {
      console.error('Erreur lors de la récupération des tâches:', taskError);
    }

    // Récupérer les projets
    let projects = [];
    try {
      const projectsResponse = await axios.get(`${API_URL}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (projectsResponse.data && Array.isArray(projectsResponse.data.projects)) {
        projects = projectsResponse.data.projects;
        console.log(`${projects.length} projets récupérés`);
      } else {
        console.warn('Format de réponse inattendu pour les projets:', projectsResponse.data);
      }
    } catch (projectError) {
      console.error('Erreur lors de la récupération des projets:', projectError);
    }

    // Vérifier si nous avons des données à traiter
    if (tasks.length === 0 && projects.length === 0) {
      console.warn('Aucune donnée de tâches ou de projets n\'a été récupérée');
    }

    // Calculer les KPIs (même si les données sont partielles)
    let kpis = {};
    try {
      kpis = calculateKPIs(tasks, projects);
      console.log('KPIs calculés avec succès');
    } catch (kpiError) {
      console.error('Erreur lors du calcul des KPIs:', kpiError);
      // Fournir des KPIs par défaut en cas d'erreur
      kpis = {
        progressRate: { value: 0, trend: 0, description: "Taux d'avancement global des projets" },
        averageTaskTime: { value: 0, unit: "jours", trend: 0, description: "Temps moyen pour compléter une tâche" },
        deadlineRespect: { value: 0, trend: 0, description: "Pourcentage de tâches terminées dans les délais" },
        teamProductivity: { value: 0, trend: 0, description: "Indice de productivité des équipes" },
        risksDetected: { value: 0, trend: 0, description: "Nombre de risques identifiés nécessitant une attention" }
      };
    }

    // Préparer les données pour les graphiques
    let chartData = {};
    try {
      chartData = prepareChartData(tasks, projects);
      console.log('Données des graphiques préparées avec succès');
    } catch (chartError) {
      console.error('Erreur lors de la préparation des données des graphiques:', chartError);
      // Fournir des données de graphiques par défaut en cas d'erreur
      chartData = {
        taskEvolutionData: [],
        delayData: [],
        heatmapData: [],
        projectStatusData: [],
        teamPerformanceData: [],
        riskData: [],
        resourceAllocationData: [],
        aiSuggestions: []
      };
    }

    // Retourner les données (même partielles)
    return {
      kpis,
      chartData,
      tasks,
      projects
    };
  } catch (error) {
    console.error('Error fetching performance data:', error);
    // Retourner un objet avec des données vides plutôt que de lancer une erreur
    return {
      kpis: {
        progressRate: { value: 0, trend: 0, description: "Taux d'avancement global des projets" },
        averageTaskTime: { value: 0, unit: "jours", trend: 0, description: "Temps moyen pour compléter une tâche" },
        deadlineRespect: { value: 0, trend: 0, description: "Pourcentage de tâches terminées dans les délais" },
        teamProductivity: { value: 0, trend: 0, description: "Indice de productivité des équipes" },
        risksDetected: { value: 0, trend: 0, description: "Nombre de risques identifiés nécessitant une attention" }
      },
      chartData: {
        taskEvolutionData: [],
        delayData: [],
        heatmapData: [],
        projectStatusData: [],
        teamPerformanceData: [],
        riskData: [],
        resourceAllocationData: [],
        aiSuggestions: []
      },
      tasks: [],
      projects: []
    };
  }
};

// Calculer les KPIs à partir des tâches et des projets
const calculateKPIs = (tasks, projects) => {
  // Taux d'avancement global (%)
  const completedTasks = tasks.filter(task =>
    task.status === 'Done' || task.status === 'Terminée'
  ).length;
  const totalTasks = tasks.length;
  const progressRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Délai moyen de réalisation des tâches (en jours)
  const completedTasksWithDates = tasks.filter(task =>
    (task.status === 'Done' || task.status === 'Terminée') && task.createdAt && task.updatedAt
  );

  let averageTaskTime = 0;
  if (completedTasksWithDates.length > 0) {
    const totalDays = completedTasksWithDates.reduce((sum, task) => {
      const createdDate = new Date(task.createdAt);
      const completedDate = new Date(task.updatedAt);
      const days = Math.round((completedDate - createdDate) / (1000 * 60 * 60 * 24));
      return sum + Math.max(days, 1); // Au moins 1 jour
    }, 0);
    averageTaskTime = Math.round(totalDays / completedTasksWithDates.length);
  }

  // Taux de respect des échéances (%)
  const tasksWithDueDate = tasks.filter(task =>
    task.dueDate && (task.status === 'Done' || task.status === 'Terminée')
  );
  let onTimeCount = 0;

  if (tasksWithDueDate.length > 0) {
    onTimeCount = tasksWithDueDate.filter(task => {
      const dueDate = new Date(task.dueDate);
      const completedDate = new Date(task.updatedAt);
      return completedDate <= dueDate;
    }).length;
  }

  const deadlineRespect = tasksWithDueDate.length > 0
    ? Math.round((onTimeCount / tasksWithDueDate.length) * 100)
    : 0;

  // Productivité par équipe (calculée à partir des tâches assignées)
  // Calculer la productivité réelle basée sur les projets
  let teamProductivity = 0;
  if (projects.length > 0) {
    // Calculer le pourcentage moyen de tâches terminées par projet
    const projectCompletionRates = projects.map(project => {
      const projectTasks = tasks.filter(task =>
        task.project && (typeof task.project === 'object' ?
          task.project._id === project._id :
          task.project === project._id)
      );

      if (projectTasks.length === 0) return 0;

      const projectCompletedTasks = projectTasks.filter(task =>
        task.status === 'Done' || task.status === 'Terminée'
      ).length;

      return projectCompletedTasks / projectTasks.length * 100;
    });

    // Moyenne des taux d'achèvement
    teamProductivity = Math.round(
      projectCompletionRates.reduce((sum, rate) => sum + rate, 0) / projects.length
    );
  } else {
    teamProductivity = 85; // Valeur par défaut si aucun projet
  }

  // Nombre de risques détectés
  // Considérer les tâches en retard comme des risques
  const lateTasks = tasks.filter(task => {
    if (task.dueDate && task.status !== 'Done' && task.status !== 'Terminée') {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      return dueDate < today;
    }
    return false;
  });

  const risksDetected = lateTasks.length;

  return {
    progressRate: {
      value: progressRate,
      trend: 5, // Valeur fictive pour la tendance
      description: "Taux d'avancement global des projets"
    },
    averageTaskTime: {
      value: averageTaskTime,
      unit: "jours",
      trend: -1, // Valeur fictive pour la tendance
      description: "Temps moyen pour compléter une tâche"
    },
    deadlineRespect: {
      value: deadlineRespect,
      trend: 2, // Valeur fictive pour la tendance
      description: "Pourcentage de tâches terminées dans les délais"
    },
    teamProductivity: {
      value: teamProductivity,
      trend: 3, // Valeur fictive pour la tendance
      description: "Indice de productivité des équipes"
    },
    risksDetected: {
      value: risksDetected,
      trend: risksDetected > 3 ? 2 : -2, // Tendance basée sur le nombre de risques
      description: "Nombre de risques identifiés nécessitant une attention"
    }
  };
};

// Préparer les données pour les graphiques
const prepareChartData = (tasks, projects) => {
  // Données pour la courbe d'évolution des tâches
  const taskStatusByMonth = {};
  const currentYear = new Date().getFullYear();

  // Initialiser les mois
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  months.forEach(month => {
    taskStatusByMonth[month] = { completed: 0, inProgress: 0, planned: 0 };
  });

  // Compter les tâches par mois et par statut
  tasks.forEach(task => {
    const createdDate = new Date(task.createdAt);
    if (createdDate.getFullYear() === currentYear) {
      const month = months[createdDate.getMonth()];

      // Mapping des statuts de tâches selon le modèle de données
      if (task.status === 'Done' || task.status === 'Terminée') {
        taskStatusByMonth[month].completed += 1;
      } else if (task.status === 'In Progress' || task.status === 'En cours') {
        taskStatusByMonth[month].inProgress += 1;
      }

      // Toutes les tâches sont considérées comme planifiées
      taskStatusByMonth[month].planned += 1;
    }
  });

  // Convertir en tableau pour Recharts
  const taskEvolutionData = months.map(month => ({
    name: month,
    completed: taskStatusByMonth[month].completed,
    inProgress: taskStatusByMonth[month].inProgress,
    planned: taskStatusByMonth[month].planned
  }));

  // Données pour le diagramme des délais
  const delayData = projects.map(project => {
    // Utiliser les dates réelles du projet pour les calculs
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const today = new Date();

    // Calculer le délai prévu en jours
    const plannedDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Calculer le délai réel en jours (jusqu'à aujourd'hui ou jusqu'à la fin si terminé)
    const isCompleted = project.status === 'Completed' || project.status === 'Archived';
    const actualEndDate = isCompleted ? endDate : today;
    const actualDays = Math.round((actualEndDate - startDate) / (1000 * 60 * 60 * 24));

    return {
      name: project.projectName || `Projet ${project._id.substring(0, 5)}`,
      actual: actualDays > 0 ? actualDays : 1,
      planned: plannedDays > 0 ? plannedDays : 1
    };
  });

  // Données pour la heatmap (fictives)
  const heatmapData = [
    { day: 'Lundi', '8h': 2, '9h': 5, '10h': 8, '11h': 6, '12h': 3, '13h': 2, '14h': 5, '15h': 7, '16h': 9, '17h': 4 },
    { day: 'Mardi', '8h': 3, '9h': 6, '10h': 9, '11h': 7, '12h': 4, '13h': 3, '14h': 6, '15h': 8, '16h': 7, '17h': 5 },
    { day: 'Mercredi', '8h': 4, '9h': 7, '10h': 10, '11h': 8, '12h': 5, '13h': 4, '14h': 7, '15h': 9, '16h': 8, '17h': 6 },
    { day: 'Jeudi', '8h': 5, '9h': 8, '10h': 9, '11h': 7, '12h': 4, '13h': 3, '14h': 6, '15h': 8, '16h': 9, '17h': 7 },
    { day: 'Vendredi', '8h': 4, '9h': 7, '10h': 8, '11h': 6, '12h': 3, '13h': 2, '14h': 5, '15h': 7, '16h': 8, '17h': 5 },
  ];

  // Données de statut des projets
  const projectStatusData = projects.map(project => {
    // Déterminer le statut du projet
    let status = 'in-progress';
    if (project.status === 'Terminé') {
      status = 'completed';
    } else if (project.status === 'En retard') {
      status = 'delayed';
    } else if (project.status === 'À risque') {
      status = 'at-risk';
    }

    // Calculer le progrès (fictif)
    const progress = status === 'completed' ? 100 : Math.floor(Math.random() * 80) + 10;

    return {
      id: project._id,
      name: project.projectName || `Projet ${project._id.substring(0, 5)}`,
      status,
      progress,
      deadline: project.endDate || new Date().toISOString()
    };
  });

  // Données de performance individuelle (fictives)
  const teamPerformanceData = [
    { id: 1, name: 'Sophie Martin', role: 'Développeur Frontend', tasksCompleted: 24, onTime: 22, efficiency: 92 },
    { id: 2, name: 'Thomas Dubois', role: 'Développeur Backend', tasksCompleted: 18, onTime: 15, efficiency: 83 },
    { id: 3, name: 'Emma Lefebvre', role: 'Designer UI/UX', tasksCompleted: 15, onTime: 14, efficiency: 93 },
    { id: 4, name: 'Lucas Bernard', role: 'Chef de Projet', tasksCompleted: 12, onTime: 10, efficiency: 83 },
    { id: 5, name: 'Camille Petit', role: 'Testeur QA', tasksCompleted: 30, onTime: 28, efficiency: 93 },
  ];

  // Données de suivi des risques
  let riskData = [];
  try {
    // Filtrer les tâches en retard
    const lateTasks = tasks.filter(task => {
      if (!task.dueDate) return false;

      // Vérifier si la tâche est terminée
      const isCompleted = task.status === 'Done' ||
                         task.status === 'Terminée' ||
                         task.status === 'Completed' ||
                         task.status === 'Terminé';

      if (isCompleted) return false;

      // Vérifier si la date d'échéance est valide
      try {
        const dueDate = new Date(task.dueDate);
        if (isNaN(dueDate.getTime())) {
          return false;
        }
        const today = new Date();
        return dueDate < today;
      } catch (error) {
        console.warn(`Erreur lors de la conversion de la date d'échéance pour la tâche:`, error);
        return false;
      }
    });

    // Mapper les tâches en retard en données de risque
    riskData = lateTasks.map((task, index) => {
      // Déterminer l'impact en fonction de la priorité
      let impact = 'medium';
      if (task.priority === 'Haute' || task.priority === 'High') {
        impact = 'high';
      } else if (task.priority === 'Basse' || task.priority === 'Low') {
        impact = 'low';
      }

      // Déterminer le projet associé
      let projectName = 'Non assigné';
      if (task.project) {
        if (typeof task.project === 'object' && task.project.projectName) {
          projectName = task.project.projectName;
        } else if (typeof task.project === 'string') {
          // Essayer de trouver le nom du projet dans la liste des projets
          const foundProject = projects.find(p => p._id === task.project);
          if (foundProject && foundProject.projectName) {
            projectName = foundProject.projectName;
          } else {
            projectName = `Projet ${task.project.substring(0, 5)}...`;
          }
        }
      }

      return {
        id: index + 1,
        project: projectName,
        description: `Tâche en retard: ${task.title || 'Sans titre'}`,
        impact,
        status: 'open',
        mitigation: 'Réaffectation des ressources recommandée'
      };
    });
  } catch (error) {
    console.error('Erreur lors de la préparation des données de risque:', error);
    riskData = [];
  }

  // Données de répartition des ressources (fictives)
  const resourceAllocationData = [
    { team: 'Frontend', allocated: 35, used: 32 },
    { team: 'Backend', allocated: 40, used: 38 },
    { team: 'Design', allocated: 20, used: 22 },
    { team: 'QA', allocated: 15, used: 13 },
    { team: 'DevOps', allocated: 10, used: 8 },
  ];

  // Suggestions IA basées sur les données réelles
  const aiSuggestions = [];

  // Suggestion 1: Risque de retard
  if (riskData.length > 0) {
    aiSuggestions.push({
      id: 1,
      title: `Risque de retard sur ${riskData.length} tâche(s)`,
      description: `${riskData.length} tâche(s) ont dépassé leur date d'échéance. Considérez de réaffecter des ressources ou d'ajuster le calendrier.`,
      type: 'warning'
    });
  }

  // Suggestion 2: Optimisation d'équipe
  const highEfficiencyTeam = teamPerformanceData.reduce((prev, current) =>
    (prev.efficiency > current.efficiency) ? prev : current
  );

  aiSuggestions.push({
    id: 2,
    title: `Optimisation de l'équipe ${highEfficiencyTeam.role}`,
    description: `L'équipe ${highEfficiencyTeam.role} montre une efficacité de ${highEfficiencyTeam.efficiency}%. Envisagez de partager leurs meilleures pratiques avec les autres équipes.`,
    type: 'success'
  });

  // Suggestion 3: Replanification
  if (deadlineRespect < 80) {
    aiSuggestions.push({
      id: 3,
      title: 'Replanification recommandée',
      description: `Le taux de respect des échéances est de ${deadlineRespect}%. Une replanification automatique pourrait réduire les risques de retard.`,
      type: 'info'
    });
  }

  return {
    taskEvolutionData,
    delayData,
    heatmapData,
    projectStatusData,
    teamPerformanceData,
    riskData,
    resourceAllocationData,
    aiSuggestions
  };
};

// Exporter les données au format PDF
export const exportToPDF = async (data = null) => {
  try {
    console.log('Exporting to PDF...');

    // Si aucune donnée n'est fournie, récupérer les données de performance
    if (!data) {
      data = await getProjectsPerformance();
    }

    // Dans une implémentation réelle, nous utiliserions une bibliothèque comme jsPDF
    // pour générer un PDF avec les données

    // Simulation d'un délai pour l'export
    return new Promise((resolve) => {
      setTimeout(() => {
        // Générer un nom de fichier avec la date actuelle
        const date = new Date().toISOString().split('T')[0];
        const filename = `performance_report_${date}.pdf`;

        // Dans une implémentation réelle, nous téléchargerions le fichier ici
        console.log(`PDF exporté sous le nom: ${filename}`);

        resolve({
          success: true,
          message: 'PDF exporté avec succès',
          filename,
          data
        });
      }, 1000);
    });
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw error;
  }
};

// Exporter les données au format CSV
export const exportToCSV = async (data = null) => {
  try {
    console.log('Exporting to CSV...');

    // Si aucune donnée n'est fournie, récupérer les données de performance
    if (!data) {
      data = await getProjectsPerformance();
    }

    // Fonction pour convertir les données en format CSV
    const convertToCSV = (objArray) => {
      const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
      let str = '';

      // En-têtes
      const headers = Object.keys(array[0]);
      str += headers.join(',') + '\r\n';

      // Lignes de données
      for (let i = 0; i < array.length; i++) {
        let line = '';
        for (const index in headers) {
          if (line !== '') line += ',';

          let value = array[i][headers[index]];
          if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          line += `"${value}"`;
        }
        str += line + '\r\n';
      }
      return str;
    };

    // Préparer les données pour l'export CSV
    const projectsData = data.projects.map(project => ({
      id: project._id,
      name: project.projectName,
      status: project.performance.status,
      completionRate: project.performance.completionRate + '%',
      timeEfficiency: project.performance.timeEfficiency + '%',
      riskLevel: project.performance.riskLevel + '%',
      taskCount: project.performance.taskCount,
      completedTasks: project.performance.completedTaskCount,
      lateTasks: project.performance.lateTaskCount
    }));

    // Convertir en CSV
    const csvContent = convertToCSV(projectsData);

    // Simulation d'un délai pour l'export
    return new Promise((resolve) => {
      setTimeout(() => {
        // Générer un nom de fichier avec la date actuelle
        const date = new Date().toISOString().split('T')[0];
        const filename = `performance_report_${date}.csv`;

        // Dans une implémentation réelle, nous téléchargerions le fichier ici
        // Voici comment on pourrait le faire dans un navigateur:
        /*
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        */

        console.log(`CSV exporté sous le nom: ${filename}`);

        resolve({
          success: true,
          message: 'CSV exporté avec succès',
          filename,
          data: csvContent
        });
      }, 1000);
    });
  } catch (error) {
    console.error('Erreur lors de l\'export CSV:', error);
    throw error;
  }
};

// Exporter les données au format Excel
export const exportToExcel = () => {
  // Implémentation fictive
  console.log('Exporting to Excel...');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Excel exported successfully' });
    }, 1000);
  });
};

// Variables pour la mise en cache des données
let cachedProjects = null;
let cachedTasks = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

// Fonction pour mettre à jour le statut des tâches en retard
const updateTasksStatus = (tasks) => {
  if (!Array.isArray(tasks) || tasks.length === 0) return tasks;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normaliser à minuit pour comparer uniquement les dates

  // Tableau pour stocker les tâches qui doivent être mises à jour sur le serveur
  const tasksToUpdateOnServer = [];

  const updatedTasks = tasks.map(task => {
    // Créer une copie de la tâche pour ne pas modifier l'original directement
    const updatedTask = { ...task };

    // Vérifier si la tâche a une date d'échéance
    if (updatedTask.dueDate) {
      try {
        // Normaliser la date d'échéance
        let dueDate;

        if (typeof updatedTask.dueDate === 'string') {
          dueDate = new Date(updatedTask.dueDate);
        } else if (updatedTask.dueDate instanceof Date) {
          dueDate = updatedTask.dueDate;
        } else if (updatedTask.dueDate && updatedTask.dueDate.$d) {
          // Gérer les objets dayjs
          dueDate = new Date(updatedTask.dueDate.$d);
        } else {
          // Format non reconnu, ne pas modifier le statut
          return updatedTask;
        }

        // Vérifier que la date est valide
        if (isNaN(dueDate.getTime())) {
          return updatedTask;
        }

        // Normaliser à minuit pour comparer uniquement les dates
        dueDate.setHours(0, 0, 0, 0);

        // Vérifier si la tâche est terminée
        const status = updatedTask.status ? updatedTask.status.toLowerCase() : '';
        const isCompleted = status === 'done' ||
                           status === 'terminée' ||
                           status === 'terminé' ||
                           status === 'completed' ||
                           status === 'achevé' ||
                           status === 'achevée';

        // Si la tâche n'est pas terminée et la date d'échéance est dépassée
        if (!isCompleted && dueDate < today) {
          // Ajouter un indicateur de retard
          updatedTask.isLate = true;

          // Si le statut n'est pas déjà "en retard" ou équivalent, le mettre à jour
          if (status !== 'late' &&
              status !== 'en retard' &&
              status !== 'delayed' &&
              status !== 'overdue') {

            // Conserver le statut original pour référence
            updatedTask.originalStatus = updatedTask.status;

            // Mettre à jour le statut pour indiquer le retard
            updatedTask.status = 'late';

            console.log(`Tâche "${updatedTask.title || 'Sans titre'}" marquée en retard (échéance: ${dueDate.toISOString().split('T')[0]})`);

            // Ajouter cette tâche à la liste des tâches à mettre à jour sur le serveur
            tasksToUpdateOnServer.push({
              id: updatedTask._id || updatedTask.id,
              status: 'late',
              isLate: true,
              originalStatus: updatedTask.originalStatus
            });
          }
        }
      } catch (error) {
        console.warn(`Erreur lors de la mise à jour du statut de la tâche:`, error);
      }
    }

    return updatedTask;
  });

  // Si des tâches ont été marquées en retard, les mettre à jour sur le serveur
  if (tasksToUpdateOnServer.length > 0) {
    updateTasksOnServer(tasksToUpdateOnServer);
  }

  return updatedTasks;
};

// Fonction pour mettre à jour les tâches sur le serveur
const updateTasksOnServer = async (tasksToUpdate) => {
  if (!Array.isArray(tasksToUpdate) || tasksToUpdate.length === 0) return;

  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Impossible de mettre à jour les tâches sur le serveur: aucun token d\'authentification trouvé');
    return;
  }

  console.log(`Mise à jour de ${tasksToUpdate.length} tâches sur le serveur...`);

  // Mettre à jour chaque tâche individuellement
  for (const task of tasksToUpdate) {
    try {
      if (!task.id) {
        console.warn('Impossible de mettre à jour une tâche sans ID');
        continue;
      }

      await axios.put(`${API_URL}/tasks/${task.id}`,
        { status: task.status, isLate: task.isLate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(`Tâche ${task.id} mise à jour avec succès sur le serveur (statut: ${task.status})`);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la tâche ${task.id} sur le serveur:`, error);
    }
  }
};

// Récupérer et analyser les performances des projets
export const getProjectsPerformance = async (filters = {}) => {
  try {
    console.log('Récupération des données de performance avec filtres:', filters);

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Aucun token d\'authentification trouvé');
      return getDefaultPerformanceData();
    }

    let projects = [];
    let tasks = [];

    // Vérifier si nous pouvons utiliser les données en cache
    const now = new Date().getTime();
    const shouldUseCache = lastFetchTime && (now - lastFetchTime < CACHE_DURATION) &&
                          cachedProjects && cachedTasks &&
                          !filters.forceRefresh; // Permettre de forcer le rafraîchissement

    if (shouldUseCache) {
      console.log('Utilisation des données en cache');
      projects = [...cachedProjects];

      // Même avec les données en cache, nous devons mettre à jour les statuts des tâches
      // car les dates d'échéance peuvent être dépassées depuis la dernière vérification
      const cachedTasksCopy = [...cachedTasks];
      tasks = updateTasksStatus(cachedTasksCopy);
      console.log(`${tasks.length} tâches en cache avec statuts mis à jour`);
    } else {
      console.log('Récupération des données fraîches depuis l\'API');

      try {
        // Récupérer les projets et les tâches en parallèle pour améliorer les performances
        const [projectsResponse, tasksResponse] = await Promise.all([
          axios.get(`${API_URL}/projects`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000 // Timeout de 15 secondes
          }),
          axios.get(`${API_URL}/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000
          })
        ]);

        // Vérifier les réponses
        if (!projectsResponse.data || !projectsResponse.data.projects) {
          console.error('Format de réponse invalide pour les projets:', projectsResponse.data);

          // Utiliser les données en cache si disponibles, sinon retourner des données par défaut
          if (cachedProjects) {
            console.log('Utilisation des projets en cache suite à une erreur');
            projects = [...cachedProjects];
          } else {
            return getDefaultPerformanceData();
          }
        } else {
          projects = projectsResponse.data.projects;
          // Mettre à jour le cache
          cachedProjects = [...projects];
        }

        if (!tasksResponse.data || !tasksResponse.data.tasks) {
          console.error('Format de réponse invalide pour les tâches:', tasksResponse.data);

          // Utiliser les données en cache si disponibles, sinon retourner des données par défaut
          if (cachedTasks) {
            console.log('Utilisation des tâches en cache suite à une erreur');
            tasks = [...cachedTasks];
          } else {
            return getDefaultPerformanceData();
          }
        } else {
          // Récupérer les tâches de la réponse
          const rawTasks = tasksResponse.data.tasks;

          // Mettre à jour le statut des tâches en retard
          tasks = updateTasksStatus(rawTasks);
          console.log(`${tasks.length} tâches récupérées et statuts mis à jour`);

          // Mettre à jour le cache avec les tâches dont les statuts ont été mis à jour
          cachedTasks = [...tasks];
        }

        // Mettre à jour l'horodatage du cache
        lastFetchTime = now;
      } catch (fetchError) {
        console.error('Erreur lors de la récupération des données:', fetchError);

        // Utiliser les données en cache si disponibles
        if (cachedProjects && cachedTasks) {
          console.log('Utilisation des données en cache suite à une erreur de récupération');
          projects = [...cachedProjects];
          tasks = [...cachedTasks];
        } else {
          return getDefaultPerformanceData();
        }
      }
    }

    // Vérifier que nous avons des données à traiter
    if (!projects.length) {
      console.warn('Aucun projet récupéré');
      return getDefaultPerformanceData();
    }

    console.log(`${projects.length} projets et ${tasks.length} tâches récupérés`);

    // Appliquer les filtres si présents
    if (filters.projectId) {
      console.log(`Filtering by project ID: ${filters.projectId}`);
      projects = projects.filter(project => project._id === filters.projectId);
      console.log(`After project filter: ${projects.length} projects`);
    }

    // Appliquer les filtres de date si présents
    try {
      if (filters.dateRange && Array.isArray(filters.dateRange) && filters.dateRange.length === 2 &&
          filters.dateRange[0] && filters.dateRange[1]) {

        let startDate, endDate;

        try {
          // Convertir les objets dayjs en objets Date si nécessaire
          if (filters.dateRange[0].$d) {
            startDate = new Date(filters.dateRange[0].$d);
          } else if (typeof filters.dateRange[0] === 'string') {
            startDate = new Date(filters.dateRange[0]);
          } else if (filters.dateRange[0] instanceof Date) {
            startDate = filters.dateRange[0];
          } else {
            throw new Error('Format de date de début invalide');
          }

          if (filters.dateRange[1].$d) {
            endDate = new Date(filters.dateRange[1].$d);
          } else if (typeof filters.dateRange[1] === 'string') {
            endDate = new Date(filters.dateRange[1]);
          } else if (filters.dateRange[1] instanceof Date) {
            endDate = filters.dateRange[1];
          } else {
            throw new Error('Format de date de fin invalide');
          }

          // Vérifier que les dates sont valides
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Dates invalides');
          }

          // Régler l'heure de début à 00:00:00 et l'heure de fin à 23:59:59 pour inclure toute la journée
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);

          console.log(`Filtrage par plage de dates: ${startDate.toISOString()} à ${endDate.toISOString()}`);

          // Filtrer les projets par date
          const filteredProjects = [];

          for (const project of projects) {
            if (!project.startDate || !project.endDate) continue;

            try {
              // Normaliser les dates du projet
              const projectStartDate = new Date(project.startDate);
              const projectEndDate = new Date(project.endDate);

              // Vérifier que les dates du projet sont valides
              if (isNaN(projectStartDate.getTime()) || isNaN(projectEndDate.getTime())) {
                console.warn(`Dates invalides pour le projet ${project._id || project.projectName}:`,
                  { startDate: project.startDate, endDate: project.endDate });
                continue;
              }

              // Régler l'heure de début à 00:00:00 et l'heure de fin à 23:59:59
              projectStartDate.setHours(0, 0, 0, 0);
              projectEndDate.setHours(23, 59, 59, 999);

              // Un projet est inclus si sa période chevauche la période de filtre
              // (début du projet <= fin de la période) ET (fin du projet >= début de la période)
              const isIncluded = (projectStartDate <= endDate && projectEndDate >= startDate);

              if (isIncluded) {
                filteredProjects.push(project);
                console.log(`Projet inclus: ${project.projectName}, Début: ${projectStartDate.toISOString()}, Fin: ${projectEndDate.toISOString()}`);
              }
            } catch (dateError) {
              console.warn(`Erreur lors du traitement des dates pour le projet ${project._id || project.projectName}:`, dateError);
            }
          }

          projects = filteredProjects;
          console.log(`Après filtrage par date: ${projects.length} projets`);

          // Filtrer les tâches par date et par projet
          const filteredTasks = [];

          for (const task of tasks) {
            try {
              // Ne garder que les tâches associées aux projets filtrés
              let isInFilteredProject = false;

              if (task.project) {
                const taskProjectId = typeof task.project === 'object' ? task.project._id : task.project;
                isInFilteredProject = projects.some(project => project._id === taskProjectId);
              }

              if (!isInFilteredProject) continue;

              let isInDateRange = false;

              // Si la tâche a une date d'échéance, vérifier si elle est dans la plage
              if (task.dueDate) {
                try {
                  const dueDate = new Date(task.dueDate);

                  if (!isNaN(dueDate.getTime())) {
                    const isDueDateInRange = dueDate >= startDate && dueDate <= endDate;

                    if (isDueDateInRange) {
                      isInDateRange = true;
                    }
                  }
                } catch (dueDateError) {
                  console.warn(`Erreur lors du traitement de la date d'échéance pour la tâche ${task._id || task.title}:`, dueDateError);
                }
              }

              // Vérifier si la tâche a été créée ou mise à jour dans la période
              if (!isInDateRange && task.createdAt) {
                try {
                  const taskCreatedDate = new Date(task.createdAt);

                  if (!isNaN(taskCreatedDate.getTime())) {
                    if (taskCreatedDate >= startDate && taskCreatedDate <= endDate) {
                      isInDateRange = true;
                    }
                  }
                } catch (createdDateError) {
                  console.warn(`Erreur lors du traitement de la date de création pour la tâche ${task._id || task.title}:`, createdDateError);
                }
              }

              if (!isInDateRange && task.updatedAt) {
                try {
                  const taskUpdatedDate = new Date(task.updatedAt);

                  if (!isNaN(taskUpdatedDate.getTime())) {
                    if (taskUpdatedDate >= startDate && taskUpdatedDate <= endDate) {
                      isInDateRange = true;
                    }
                  }
                } catch (updatedDateError) {
                  console.warn(`Erreur lors du traitement de la date de mise à jour pour la tâche ${task._id || task.title}:`, updatedDateError);
                }
              }

              if (isInDateRange) {
                filteredTasks.push(task);
              }
            } catch (taskError) {
              console.warn(`Erreur lors du filtrage de la tâche ${task._id || task.title}:`, taskError);
            }
          }

          tasks = filteredTasks;
          console.log(`Après filtrage des tâches: ${tasks.length} tâches`);
        } catch (dateParsingError) {
          console.error('Erreur lors du traitement des dates de filtrage:', dateParsingError);
        }
      }
    } catch (filterError) {
      console.error('Erreur lors de l\'application des filtres de date:', filterError);
    }

    // Calculer les métriques de performance pour chaque projet
    const projectsWithPerformance = projects.map(project => {
      // Filtrer les tâches associées à ce projet (gestion correcte des références d'objets et des IDs)
      // Utiliser une méthode plus robuste pour identifier les tâches d'un projet
      const projectTasks = tasks.filter(task => {
        if (!task || !task.project) return false;

        try {
          // Gérer tous les cas possibles de référence de projet
          let taskProjectId;

          if (typeof task.project === 'object' && task.project !== null) {
            // Si task.project est un objet, extraire l'ID
            taskProjectId = task.project._id || task.project.id;
          } else if (typeof task.project === 'string') {
            // Si task.project est une chaîne, c'est probablement déjà l'ID
            taskProjectId = task.project;
          } else {
            // Autres cas non gérés
            return false;
          }

          // Vérifier si l'ID de la tâche correspond à l'ID du projet actuel
          const projectId = project._id || project.id;

          // Comparer les IDs en tenant compte des différents formats possibles
          return taskProjectId === projectId ||
                 taskProjectId.toString() === projectId.toString();
        } catch (error) {
          console.warn(`Erreur lors de la comparaison des IDs pour la tâche et le projet:`, error);
          return false;
        }
      });

      console.log(`Projet "${project.projectName || project._id}": ${projectTasks.length} tâches associées`);

      // Calculer le taux d'achèvement (pourcentage de tâches terminées)
      const totalProjectTasks = projectTasks.length;

      // Compter les tâches terminées en tenant compte de tous les statuts possibles
      const completedTasks = projectTasks.filter(task => {
        const status = task.status ? task.status.toLowerCase() : '';
        return status === 'done' ||
               status === 'terminée' ||
               status === 'terminé' ||
               status === 'completed' ||
               status === 'achevé' ||
               status === 'achevée';
      }).length;

      const completionRate = totalProjectTasks > 0 ? Math.round((completedTasks / totalProjectTasks) * 100) : 0;

      // Calculer l'efficacité temporelle (durée réelle vs prévue)
      // Vérifier que les dates sont valides
      let startDate, endDate, plannedDuration, actualDuration, timeEfficiency;

      try {
        // Vérifier si les dates sont valides
        if (!project.startDate || !project.endDate) {
          // Si les dates sont manquantes, utiliser des valeurs par défaut
          plannedDuration = 0;
          actualDuration = 0;
          timeEfficiency = 0;
        } else {
          startDate = new Date(project.startDate);
          endDate = new Date(project.endDate);

          // Vérifier que les dates sont valides
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn(`Dates invalides pour le projet ${project._id}:`, { startDate: project.startDate, endDate: project.endDate });
            plannedDuration = 0;
            actualDuration = 0;
            timeEfficiency = 0;
          } else {
            // Calculer la durée prévue en jours
            plannedDuration = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))); // au moins 1 jour

            const today = new Date();

            // Déterminer si le projet est terminé
            const isCompleted = project.status === 'Completed' ||
                               project.status === 'Terminé' ||
                               project.status === 'Archived' ||
                               project.status === 'Archivé';

            // Si le projet est terminé, utiliser la date de fin réelle, sinon utiliser aujourd'hui
            const actualEndDate = isCompleted ? endDate : today;

            // Calculer la durée réelle (au moins 1 jour)
            actualDuration = Math.max(1, Math.round((actualEndDate - startDate) / (1000 * 60 * 60 * 24)));

            // Calculer l'efficacité temporelle
            // Si le projet est terminé et dans les délais, l'efficacité est de 100%
            if (isCompleted && actualEndDate <= endDate) {
              timeEfficiency = 100;
            } else {
              // Sinon, calculer le ratio entre durée prévue et durée réelle
              timeEfficiency = Math.min(100, Math.round((plannedDuration / actualDuration) * 100));
            }
          }
        }
      } catch (error) {
        console.error(`Erreur lors du calcul de l'efficacité temporelle pour le projet ${project._id}:`, error);
        plannedDuration = 0;
        actualDuration = 0;
        timeEfficiency = 0;
      }

      // Calculer le niveau de risque basé sur les tâches en retard
      const today = new Date();
      let lateTasks = [];

      try {
        // Filtrer les tâches qui sont en retard
        lateTasks = projectTasks.filter(task => {
          // Méthode 1: Vérifier si la tâche a été marquée comme en retard par updateTasksStatus
          if (task.isLate === true) {
            return true;
          }

          // Méthode 2: Vérifier si le statut de la tâche indique un retard
          const status = task.status ? task.status.toLowerCase() : '';
          if (status === 'late' || status === 'en retard' || status === 'delayed' || status === 'overdue') {
            return true;
          }

          // Méthode 3: Vérification traditionnelle (pour la compatibilité)
          if (!task.dueDate) return false;

          // Vérifier si la tâche est terminée
          const isCompleted = status === 'done' ||
                             status === 'terminée' ||
                             status === 'terminé' ||
                             status === 'completed' ||
                             status === 'achevé' ||
                             status === 'achevée';

          if (isCompleted) return false;

          // Vérifier si la date d'échéance est dépassée
          try {
            // Normaliser la date d'échéance
            let dueDate;

            if (typeof task.dueDate === 'string') {
              dueDate = new Date(task.dueDate);
            } else if (task.dueDate instanceof Date) {
              dueDate = task.dueDate;
            } else if (task.dueDate && task.dueDate.$d) {
              dueDate = new Date(task.dueDate.$d);
            } else {
              return false;
            }

            if (isNaN(dueDate.getTime())) return false;

            // La tâche est en retard si sa date d'échéance est antérieure à aujourd'hui
            const isLate = dueDate < today;

            if (isLate && !task.isLate) {
              // Marquer la tâche comme en retard si ce n'est pas déjà fait
              task.isLate = true;
              console.log(`Tâche en retard détectée (méthode 3): "${task.title || 'Sans titre'}" (échéance: ${dueDate.toISOString().split('T')[0]})`);
            }

            return isLate;
          } catch (error) {
            return false;
          }
        });

        console.log(`Projet "${project.projectName || project._id}": ${lateTasks.length} tâches en retard sur ${projectTasks.length} tâches`);
      } catch (error) {
        console.error(`Erreur lors du calcul des tâches en retard pour le projet ${project._id || project.projectName}:`, error);
      }

      // Calculer le niveau de risque (pourcentage de tâches en retard)
      const riskLevel = totalProjectTasks > 0 ? Math.round((lateTasks.length / totalProjectTasks) * 100) : 0;

      // Déterminer le statut du projet
      let status;

      // Vérifier d'abord si le projet est terminé
      if (project.status === 'Completed' ||
          project.status === 'Terminé' ||
          project.status === 'Archived' ||
          project.status === 'Archivé') {
        status = 'completed';
      }
      // Sinon, déterminer le statut en fonction des métriques
      else if (riskLevel > 30) {
        status = 'at-risk';
      } else if (timeEfficiency < 70) {
        status = 'delayed';
      } else {
        status = 'in-progress';
      }

      // Calculer l'utilisation des ressources (fictif pour l'instant)
      const resourceUtilization = Math.floor(Math.random() * 30) + 70; // Valeur entre 70 et 100

      // Extraire et normaliser les détails du projet
      const projectDetails = {
        _id: project._id || project.id || '',
        projectName: project.projectName || project.name || 'Projet sans nom',
        description: project.description || '',
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.endDate ? new Date(project.endDate) : null,
        status: project.status || 'in-progress',
        priority: project.priority || 'medium',
        team: project.team || [],
        createdAt: project.createdAt ? new Date(project.createdAt) : null,
        updatedAt: project.updatedAt ? new Date(project.updatedAt) : null
      };

      // Créer un objet de performance avec des valeurs par défaut pour éviter les erreurs
      const performance = {
        completionRate: completionRate || 0,
        timeEfficiency: Math.min(100, timeEfficiency || 0), // Plafonner à 100%
        riskLevel: riskLevel || 0,
        status: status || 'in-progress',
        resourceUtilization: resourceUtilization || 0,
        taskCount: totalProjectTasks || 0,
        completedTaskCount: completedTasks || 0,
        lateTaskCount: lateTasks ? lateTasks.length : 0,
        plannedDuration: plannedDuration || 0,
        actualDuration: actualDuration || 0,
        // Ajouter des métriques supplémentaires
        progressRate: completionRate || 0, // Alias pour completionRate
        efficiency: Math.min(100, timeEfficiency || 0), // Alias pour timeEfficiency
        risk: riskLevel || 0, // Alias pour riskLevel
        tasksTotal: totalProjectTasks || 0, // Alias pour taskCount
        tasksCompleted: completedTasks || 0, // Alias pour completedTaskCount
        tasksLate: lateTasks ? lateTasks.length : 0, // Alias pour lateTaskCount
        // Ajouter des informations sur les tâches
        tasks: projectTasks.map(task => ({
          id: task._id || task.id || '',
          title: task.title || 'Tâche sans titre',
          status: task.status || '',
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          isLate: lateTasks.some(lateTask =>
            (lateTask._id && task._id && lateTask._id === task._id) ||
            (lateTask.id && task.id && lateTask.id === task.id)
          )
        }))
      };

      // Ajouter des logs pour le débogage
      console.log(`Performance calculée pour le projet "${projectDetails.projectName}":`, {
        completionRate: performance.completionRate,
        timeEfficiency: performance.timeEfficiency,
        riskLevel: performance.riskLevel,
        status: performance.status,
        taskCount: performance.taskCount,
        lateTaskCount: performance.lateTaskCount
      });

      // Retourner un objet projet enrichi avec les détails normalisés et les métriques de performance
      return {
        ...projectDetails,
        performance
      };
    });

    // Calculer les KPIs globaux pour tous les projets
    let averageCompletionRate = 0;
    let averageTimeEfficiency = 0;
    let totalRisks = 0;
    let projectsAtRisk = 0;

    try {
      // Éviter la division par zéro si aucun projet n'est présent
      if (projectsWithPerformance.length > 0) {
        // Calculer la moyenne des taux d'achèvement
        const totalCompletionRate = projectsWithPerformance.reduce((sum, project) => {
          const rate = project.performance.completionRate || 0;
          return sum + rate;
        }, 0);
        averageCompletionRate = Math.round(totalCompletionRate / projectsWithPerformance.length);

        // Calculer la moyenne des efficacités temporelles
        const totalTimeEfficiency = projectsWithPerformance.reduce((sum, project) => {
          const efficiency = project.performance.timeEfficiency || 0;
          return sum + efficiency;
        }, 0);
        averageTimeEfficiency = Math.round(totalTimeEfficiency / projectsWithPerformance.length);

        // Calculer le nombre total de risques (tâches en retard)
        totalRisks = projectsWithPerformance.reduce((sum, project) => {
          const lateCount = project.performance.lateTaskCount || 0;
          return sum + lateCount;
        }, 0);

        // Compter les projets à risque
        projectsAtRisk = projectsWithPerformance.filter(project =>
          project.performance.status === 'at-risk'
        ).length;
      }

      // Ajouter des logs pour le débogage
      console.log('KPIs globaux calculés:', {
        averageCompletionRate,
        averageTimeEfficiency,
        totalRisks,
        projectsAtRisk,
        totalProjects: projectsWithPerformance.length
      });
    } catch (error) {
      console.error('Erreur lors du calcul des KPIs globaux:', error);
    }

    // Préparer les données pour les graphiques
    let performanceChartData = [];
    let statusDistribution = {
      completed: 0,
      inProgress: 0,
      delayed: 0,
      atRisk: 0
    };

    try {
      // Créer les données pour le graphique de performance
      performanceChartData = projectsWithPerformance.map(project => {
        try {
          // Extraire le nom du projet avec une gestion sécurisée
          const projectName = project.projectName || project.name ||
                             (project._id ? `Projet ${project._id.substring(0, 5)}` : 'Projet inconnu');

          // Extraire les métriques de performance avec des valeurs par défaut
          const completion = project.performance ? (project.performance.completionRate || 0) : 0;
          const efficiency = project.performance ? (project.performance.timeEfficiency || 0) : 0;
          const risk = project.performance ? (project.performance.riskLevel || 0) : 0;
          const taskCount = project.performance ? (project.performance.taskCount || 0) : 0;
          const completedTasks = project.performance ? (project.performance.completedTaskCount || 0) : 0;
          const lateTasks = project.performance ? (project.performance.lateTaskCount || 0) : 0;

          // Extraire les dates du projet
          let startDate = null;
          let endDate = null;

          try {
            if (project.startDate) {
              startDate = new Date(project.startDate);
              if (isNaN(startDate.getTime())) startDate = null;
            }

            if (project.endDate) {
              endDate = new Date(project.endDate);
              if (isNaN(endDate.getTime())) endDate = null;
            }
          } catch (dateError) {
            console.warn(`Erreur lors de la conversion des dates pour le projet "${projectName}":`, dateError);
          }

          // Calculer la durée du projet en jours
          let duration = 0;
          if (startDate && endDate) {
            duration = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
          }

          return {
            id: project._id || project.id || '',
            name: projectName,
            completion,
            efficiency,
            risk,
            taskCount,
            completedTasks,
            lateTasks,
            status: project.performance ? (project.performance.status || 'in-progress') : 'in-progress',
            startDate: startDate ? startDate.toISOString().split('T')[0] : null,
            endDate: endDate ? endDate.toISOString().split('T')[0] : null,
            duration,
            description: project.description || ''
          };
        } catch (error) {
          console.error(`Erreur lors de la préparation des données de graphique pour le projet:`, error);
          return {
            name: 'Projet inconnu',
            completion: 0,
            efficiency: 0,
            risk: 0,
            taskCount: 0,
            completedTasks: 0,
            lateTasks: 0,
            status: 'in-progress'
          };
        }
      });

      // Calculer la distribution des statuts
      if (projectsWithPerformance.length > 0) {
        statusDistribution = {
          completed: projectsWithPerformance.filter(p => p.performance && p.performance.status === 'completed').length,
          inProgress: projectsWithPerformance.filter(p => p.performance && p.performance.status === 'in-progress').length,
          delayed: projectsWithPerformance.filter(p => p.performance && p.performance.status === 'delayed').length,
          atRisk: projectsWithPerformance.filter(p => p.performance && p.performance.status === 'at-risk').length
        };
      }

      // Ajouter des logs pour le débogage
      console.log('Données des graphiques préparées:', {
        performanceChartDataCount: performanceChartData.length,
        statusDistribution
      });
    } catch (error) {
      console.error('Erreur lors de la préparation des données pour les graphiques:', error);
    }

    // Générer des recommandations basées sur l'analyse
    let recommendations = [];

    try {
      // Recommandation 1: Projets à risque
      if (projectsAtRisk > 0) {
        recommendations.push({
          id: 1,
          title: `${projectsAtRisk} projet(s) à risque détecté(s)`,
          description: `${projectsAtRisk} projet(s) présentent un niveau de risque élevé. Considérez une révision des échéances ou une réallocation des ressources.`,
          type: 'warning'
        });
      }

      // Recommandation 2: Efficacité temporelle
      if (averageTimeEfficiency < 80) {
        recommendations.push({
          id: 2,
          title: 'Efficacité temporelle faible',
          description: `L'efficacité temporelle moyenne des projets est de ${Math.round(averageTimeEfficiency)}%. Envisagez de revoir la planification des projets.`,
          type: 'info'
        });
      }

      // Recommandation 3: Projet le plus performant
      if (projectsWithPerformance.length > 0) {
        try {
          // Trier les projets par performance (somme du taux d'achèvement et de l'efficacité)
          const sortedProjects = [...projectsWithPerformance].sort((a, b) => {
            const scoreA = (a.performance ? (a.performance.completionRate || 0) : 0) +
                          (a.performance ? (a.performance.timeEfficiency || 0) : 0);
            const scoreB = (b.performance ? (b.performance.completionRate || 0) : 0) +
                          (b.performance ? (b.performance.timeEfficiency || 0) : 0);
            return scoreB - scoreA;
          });

          // Prendre le meilleur projet
          const bestProject = sortedProjects[0];

          if (bestProject && bestProject.projectName) {
            recommendations.push({
              id: 3,
              title: `Projet performant: ${bestProject.projectName}`,
              description: `Le projet ${bestProject.projectName} montre d'excellentes performances. Analysez ses méthodes de gestion pour les appliquer à d'autres projets.`,
              type: 'success'
            });
          }
        } catch (error) {
          console.error('Erreur lors de l\'identification du meilleur projet:', error);
        }
      }

      // Recommandation 4: Tâches en retard
      if (totalRisks > 0) {
        recommendations.push({
          id: 4,
          title: `${totalRisks} tâche(s) en retard identifiée(s)`,
          description: `${totalRisks} tâche(s) ont dépassé leur date d'échéance. Une attention immédiate est requise pour éviter des retards dans les projets.`,
          type: 'warning'
        });
      }

      // Ajouter des logs pour le débogage
      console.log(`${recommendations.length} recommandations générées`);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      // Assurer qu'il y a au moins une recommandation
      recommendations = [{
        id: 1,
        title: 'Analyse des données',
        description: 'Continuez à ajouter des données de projets et de tâches pour obtenir des recommandations plus précises.',
        type: 'info'
      }];
    }

    // Préparer l'objet de retour avec des valeurs par défaut pour éviter les erreurs
    const result = {
      projects: projectsWithPerformance || [],
      kpis: {
        averageCompletionRate: Math.round(averageCompletionRate) || 0,
        averageTimeEfficiency: Math.round(averageTimeEfficiency) || 0,
        totalRisks: totalRisks || 0,
        projectsAtRisk: projectsAtRisk || 0
      },
      charts: {
        performanceChartData: performanceChartData || [],
        statusDistribution: statusDistribution || {
          completed: 0,
          inProgress: 0,
          delayed: 0,
          atRisk: 0
        }
      },
      recommendations: recommendations || []
    };

    // Ajouter un log final pour le débogage
    console.log('Données de performance prêtes à être retournées:', {
      projectCount: result.projects.length,
      hasChartData: result.charts.performanceChartData.length > 0,
      recommendationCount: result.recommendations.length
    });

    return result;
  } catch (error) {
    console.error('Error fetching and analyzing projects performance:', error);
    return getDefaultPerformanceData();
  }
};

// Fonction pour générer des données de performance par défaut
const getDefaultPerformanceData = () => {
  console.log('Génération de données de performance par défaut');

  return {
    projects: [],
    kpis: {
      averageCompletionRate: 0,
      averageTimeEfficiency: 0,
      totalRisks: 0,
      projectsAtRisk: 0
    },
    charts: {
      performanceChartData: [],
      statusDistribution: {
        completed: 0,
        inProgress: 0,
        delayed: 0,
        atRisk: 0
      }
    },
    recommendations: [{
      id: 1,
      title: 'Aucune donnée disponible',
      description: 'Ajoutez des projets et des tâches pour obtenir des analyses de performance.',
      type: 'info'
    }]
  };
};
