import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import Sidebar from './Sidebar';
import Header from '../../components/Header';
import styles from './Dashboard.module.css';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } = useNotifications();
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, READ

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'READ') return n.isRead;
    return true;
  });

  const getNotificationIcon = (type) => {
    const icons = {
      VENDOR_REQUEST_CREATED: '📝',
      VENDOR_RESPONSE_RECEIVED: '📬',
      FORM_SUBMITTED: '📋',
      STATUS_CHANGED: '🔄',
      FOLLOW_UP_REQUIRED: '📌',
      MISSING_DATA: '⚠️',
      VALIDATION_PENDING: '🔍',
      VENDOR_APPROVED: '✅',
      VENDOR_DENIED: '❌',
      DEADLINE_APPROACHING: '⏰',
      DOCUMENT_UPLOADED: '📎',
      VENDOR_UNRESPONSIVE: '🚨',
    };
    return icons[type] || '🔔';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    };
    return colors[severity] || '#6b7280';
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main className={styles.mainContent}>
          {/* Header */}
          <div className={styles.header}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0c6f3e', marginBottom: '8px' }}>
              Notifications
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Stay updated on vendor activities and status changes
            </p>
          </div>

        {/* Filters and Actions */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilter('ALL')}
              style={{
                padding: '8px 16px',
                background: filter === 'ALL' ? '#0a5f3f' : 'white',
                color: filter === 'ALL' ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              style={{
                padding: '8px 16px',
                background: filter === 'UNREAD' ? '#0a5f3f' : 'white',
                color: filter === 'UNREAD' ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Unread ({notifications.filter(n => !n.isRead).length})
            </button>
            <button
              onClick={() => setFilter('READ')}
              style={{
                padding: '8px 16px',
                background: filter === 'READ' ? '#0a5f3f' : 'white',
                color: filter === 'READ' ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Read ({notifications.filter(n => n.isRead).length})
            </button>
          </div>

          {notifications.some(n => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: '8px 16px',
                background: '#0a5f3f',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔕</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '18px' }}>
              No {filter.toLowerCase()} notifications
            </h3>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
              {filter === 'UNREAD' ? 'All caught up!' : 'Notifications will appear here'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  background: notification.isRead ? 'white' : '#f0f9ff',
                  borderRadius: '12px',
                  padding: '20px',
                  border: `2px solid ${notification.isRead ? '#e5e7eb' : '#bfdbfe'}`,
                  cursor: notification.actionUrl ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onClick={() => handleNotificationClick(notification)}
                onMouseEnter={(e) => {
                  if (notification.actionUrl) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                  {/* Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: getSeverityColor(notification.severity) + '15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                          {notification.title}
                        </h3>
                        {notification.vendorName && (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            background: '#f3f4f6',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#6b7280',
                            marginBottom: '8px'
                          }}>
                            {notification.vendorName}
                          </span>
                        )}
                      </div>
                      {!notification.isRead && (
                        <span style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#3b82f6',
                          flexShrink: 0,
                          marginLeft: '12px'
                        }} />
                      )}
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                      {notification.message}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                        {formatDateTime(notification.createdAt)}
                      </span>
                      {notification.actionUrl && (
                        <span style={{ fontSize: '13px', color: '#0a5f3f', fontWeight: 500 }}>
                          View Details →
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '18px',
                      cursor: 'pointer',
                      padding: '4px',
                      flexShrink: 0
                    }}
                    title="Delete notification"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
