import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await notificationService.getAllNotifications();
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      // Silently fail for 401 errors (authentication issues)
      if (error.response?.status !== 401) {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data || 0);
      }
    } catch (error) {
      // Silently fail for 401 errors (authentication issues)
      if (error.response?.status !== 401) {
        console.error('Error fetching unread count:', error);
      }
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear notifications when not authenticated
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Add a small delay to ensure token is set
    const initTimer = setTimeout(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 500);

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
