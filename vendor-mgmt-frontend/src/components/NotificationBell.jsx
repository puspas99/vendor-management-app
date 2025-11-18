import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setShowDropdown(false);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            border: '2px solid white'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setShowDropdown(false)}
          />
          <div style={{
            position: 'absolute',
            top: '50px',
            right: 0,
            width: '380px',
            maxHeight: '500px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f9fafb'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0a5f3f',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recentNotifications.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔕</div>
                  No notifications yet
                </div>
              ) : (
                recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      background: notification.isRead ? 'white' : '#f0f9ff',
                      transition: 'background 0.2s',
                      display: 'flex',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = notification.isRead ? 'white' : '#f0f9ff'}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: getSeverityColor(notification.severity) + '15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0
                    }}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '4px'
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#3b82f6',
                            flexShrink: 0,
                            marginLeft: '8px',
                            marginTop: '4px'
                          }} />
                        )}
                      </div>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: '13px',
                        color: '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notification.message}
                      </p>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 5 && (
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center',
                background: '#f9fafb'
              }}>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/notifications');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0a5f3f',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
