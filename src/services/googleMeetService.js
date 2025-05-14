import axios from '../utils/axios';

/**
 * Génère un lien Google Meet via l'API du serveur
 * @param {string} date - Date de la réunion au format ISO
 * @returns {Promise<{success: boolean, meetLink: string}>} - Résultat de la génération
 */
export const generateMeetLink = async (date) => {
  try {
    const response = await axios.post('/api/calendar/generate-meet-link', { date });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la génération du lien Google Meet:', error);
    
    // Vérifier si l'utilisateur doit s'authentifier
    if (error.response?.data?.code === 'NOT_AUTHENTICATED') {
      return {
        success: false,
        error: 'Vous devez vous connecter à Google Calendar',
        needsAuth: true
      };
    }
    
    // Vérifier si l'authentification a expiré
    if (error.response?.data?.code === 'REAUTHORIZATION_REQUIRED') {
      return {
        success: false,
        error: 'Votre connexion à Google Calendar a expiré. Veuillez vous reconnecter.',
        needsAuth: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Vérifie si l'utilisateur est authentifié avec Google Calendar
 * @returns {Promise<{success: boolean, isAuthenticated: boolean}>} - Résultat de la vérification
 */
export const checkGoogleCalendarAuth = async () => {
  try {
    const response = await axios.get('/api/calendar/check-auth');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification Google Calendar:', error);
    return {
      success: false,
      isAuthenticated: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Obtient l'URL d'authentification Google Calendar
 * @returns {Promise<{success: boolean, authUrl: string}>} - URL d'authentification
 */
export const getGoogleCalendarAuthUrl = async () => {
  try {
    const response = await axios.get('/api/calendar/auth-url');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'URL d\'authentification:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};
