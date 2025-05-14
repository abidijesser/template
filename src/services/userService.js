import axios from 'axios';

const API_URL = 'http://localhost:3001/api/auth';

// Get all users
export const fetchUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get user profile
export const fetchUserProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Get users for meeting participant selection
export const fetchMeetingParticipants = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Return all users except the current user (who will be the organizer)
    const currentUserId = localStorage.getItem('userId');
    let users = response.data.users || [];
    
    // Filter out the current user if needed
    if (currentUserId) {
      users = users.filter(user => user._id !== currentUserId);
    }
    
    return {
      success: true,
      users
    };
  } catch (error) {
    console.error('Error fetching meeting participants:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Error fetching participants'
    };
  }
};
