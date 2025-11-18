import api from './api';

const notificationService = {
  // Get all notifications for current user
  getAllNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Get only unread notifications
  getUnreadNotifications: async () => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  // Get recent notifications (last X hours)
  getRecentNotifications: async (hours = 24) => {
    const response = await api.get(`/notifications/recent?hours=${hours}`);
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/count');
    return response.data;
  },

  // Mark a notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export default notificationService;
