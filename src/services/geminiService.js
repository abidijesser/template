import axios from 'axios';
import { getAllGeminiData } from './geminiDataService';

const API_URL = 'http://localhost:3001/api/gemini'; // URL for our Gemini API endpoint

/**
 * Test the connection to the Gemini API
 * @returns {Promise<Object>} - The test result
 */
export const testGeminiConnection = async () => {
  try {
    console.log('Testing Gemini API connection...');
    const response = await axios.get(`${API_URL}/test-connection`);
    console.log('Gemini API test result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error testing Gemini API connection:', error);
    return {
      success: false,
      error: error.message,
      details: error.response ? error.response.data : 'No response data'
    };
  }
};

/**
 * Vérifie si le message correspond à une question prédéfinie
 * @param {string} message - Le message à vérifier
 * @returns {boolean} - True si c'est une question prédéfinie
 */
const isPredefinedQuestion = (message) => {
  const predefinedQuestions = [
    'Quelles sont mes tâches aujourd\'hui ?',
    'Quels projets sont en retard ?',
    'Qui est disponible dans l\'équipe ?',
    'Comment ajouter une nouvelle tâche ?'
  ];

  return predefinedQuestions.includes(message.trim());
};

/**
 * Traite une question prédéfinie avec les données contextuelles
 * @param {string} question - La question prédéfinie
 * @param {Object} contextData - Les données contextuelles
 * @returns {string} - La réponse formatée
 */
const processPredefinedQuestion = (question, contextData) => {
  switch (question.trim()) {
    case 'Quelles sont mes tâches aujourd\'hui ?':
      if (contextData.todayTasks && contextData.todayTasks.length > 0) {
        const tasksList = contextData.todayTasks.map(task =>
          `- ${task.title} (${task.status}, priorité: ${task.priority})`
        ).join('\n');
        return `Voici vos tâches pour aujourd'hui :\n${tasksList}`;
      } else {
        return "Vous n'avez pas de tâches prévues pour aujourd'hui.";
      }

    case 'Quels projets sont en retard ?':
      if (contextData.delayedProjects && contextData.delayedProjects.length > 0) {
        const projectsList = contextData.delayedProjects.map(project =>
          `- ${project.name} (date de fin prévue: ${new Date(project.endDate).toLocaleDateString()})`
        ).join('\n');
        return `Voici les projets en retard :\n${projectsList}`;
      } else {
        return "Aucun projet n'est actuellement en retard.";
      }

    case 'Qui est disponible dans l\'équipe ?':
      if (contextData.availableMembers && contextData.availableMembers.length > 0) {
        const membersList = contextData.availableMembers.map(member =>
          `- ${member.name} (${member.email})`
        ).join('\n');
        return `Voici les membres disponibles dans l'équipe :\n${membersList}`;
      } else {
        return "Je n'ai pas pu déterminer qui est disponible dans l'équipe.";
      }

    case 'Comment ajouter une nouvelle tâche ?':
      return `Pour ajouter une nouvelle tâche, suivez ces étapes :
1. Accédez à la section "Tâches" dans le menu principal
2. Cliquez sur le bouton "Ajouter une tâche" en haut à droite
3. Remplissez le formulaire avec les détails de la tâche (titre, description, date d'échéance, priorité)
4. Sélectionnez un projet auquel associer la tâche (optionnel)
5. Assignez la tâche à un membre de l'équipe (optionnel)
6. Cliquez sur "Enregistrer" pour créer la tâche`;

    default:
      return null;
  }
};

/**
 * Send a message to Gemini and get a response
 * @param {string} message - The message to send to Gemini
 * @returns {Promise<Object>} - The response from Gemini
 */
export const sendMessageToGemini = async (message) => {
  try {
    console.log('Sending message to Gemini API:', message);

    // Vérifier si c'est une question prédéfinie
    if (isPredefinedQuestion(message)) {
      console.log('Detected predefined question, fetching context data...');

      try {
        // Récupérer les données contextuelles
        const contextData = await getAllGeminiData();
        console.log('Context data fetched:', contextData);

        // Traiter la question avec les données contextuelles
        const response = processPredefinedQuestion(message, contextData);

        if (response) {
          console.log('Generated response for predefined question:', response);
          return {
            content: response,
            timestamp: new Date(),
            type: 'bot',
            source: 'local'
          };
        }
      } catch (contextError) {
        console.error('Error fetching context data:', contextError);
        // En cas d'erreur, on continue avec l'API Gemini
      }
    }

    // Si ce n'est pas une question prédéfinie ou si le traitement a échoué, utiliser l'API Gemini
    console.log('Using Gemini API for response');
    console.log('API URL:', API_URL);

    const response = await axios.post(API_URL, { message });
    console.log('Received response from Gemini:', response.data);

    return response.data;
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};
