import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Get auth headers
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

/**
 * Fetch upcoming meetings for the connected user
 * @returns {Promise<Array>} List of upcoming meetings
 */
export const fetchUpcomingMeetings = async () => {
  try {
    const response = await axios.get(`${API_URL}/meetings`, getAuthHeaders());
    
    if (response.data.success) {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      
      // Filter meetings that are scheduled in the next 7 days
      const upcomingMeetings = response.data.meetings.filter(meeting => {
        const meetingDate = new Date(meeting.startTime);
        return meetingDate >= now && meetingDate <= nextWeek && meeting.status !== 'completed';
      });
      
      // Sort by start time (closest first)
      return upcomingMeetings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error);
    return [];
  }
};

/**
 * Fetch upcoming task deadlines for the connected user
 * @returns {Promise<Array>} List of upcoming task deadlines
 */
export const fetchUpcomingTaskDeadlines = async () => {
  try {
    const response = await axios.get(`${API_URL}/tasks`, getAuthHeaders());
    
    if (response.data.success) {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      
      const userId = localStorage.getItem('userId');
      
      // Filter tasks that are assigned to the current user and due in the next 7 days
      const upcomingTasks = response.data.tasks.filter(task => {
        if (!task.dueDate || task.status === 'Done') return false;
        
        const dueDate = new Date(task.dueDate);
        const isAssignedToUser = task.assignedTo && task.assignedTo._id === userId;
        
        return dueDate >= now && dueDate <= nextWeek && isAssignedToUser;
      });
      
      // Sort by due date (closest first)
      return upcomingTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching upcoming task deadlines:', error);
    return [];
  }
};

/**
 * Combine and format upcoming events (meetings and task deadlines)
 * @returns {Promise<Array>} Combined list of upcoming events
 */
export const fetchUpcomingEvents = async () => {
  try {
    const [meetings, tasks] = await Promise.all([
      fetchUpcomingMeetings(),
      fetchUpcomingTaskDeadlines()
    ]);
    
    // Format meetings
    const formattedMeetings = meetings.map(meeting => ({
      id: meeting._id,
      title: meeting.title,
      date: new Date(meeting.startTime),
      type: 'Réunion',
      priority: 'high',
      originalData: meeting
    }));
    
    // Format tasks
    const formattedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      date: new Date(task.dueDate),
      type: 'Échéance',
      priority: task.priority === 'High' ? 'high' : task.priority === 'Medium' ? 'medium' : 'low',
      originalData: task
    }));
    
    // Combine and sort by date
    const combinedEvents = [...formattedMeetings, ...formattedTasks];
    combinedEvents.sort((a, b) => a.date - b.date);
    
    return combinedEvents.slice(0, 5); // Limit to 5 events
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
};
