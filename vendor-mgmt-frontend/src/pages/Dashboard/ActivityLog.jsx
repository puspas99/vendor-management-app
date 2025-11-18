import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import procurementService from '../../services/procurementService';
import Sidebar from './Sidebar';
import Header from '../../components/Header';
import styles from './Dashboard.module.css';

export default function ActivityLog() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchAllActivities();
  }, []);

  const fetchAllActivities = async () => {
    try {
      setLoading(true);
      const response = await procurementService.getAllActivities();
      if (response.success) {
        setActivities(response.data || []);
      } else {
        toast.error(response.message || 'Failed to fetch activities');
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      if (error.response?.status === 401) {
        // Authentication error - will be handled by interceptor
        return;
      }
      toast.error('Failed to load activity log');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorActivities = async (vendorId) => {
    try {
      setLoading(true);
      const response = await procurementService.getVendorActivityLog(vendorId);
      if (response.success) {
        setActivities(response.data || []);
        setSelectedVendor(vendorId);
      } else {
        toast.error(response.message || 'Failed to fetch vendor activities');
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching vendor activities:', error);
      if (error.response?.status === 401) {
        return;
      }
      toast.error('Failed to load vendor activity log');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = filterType === 'ALL' 
    ? activities 
    : activities.filter(a => a.activityType === filterType);

  const getActivityIcon = (type) => {
    const icons = {
      VENDOR_REQUEST_CREATED: '📝',
      INVITATION_SENT: '📧',
      INVITATION_RESENT: '🔁',
      LINK_OPENED: '🔗',
      OTP_GENERATED: '🔐',
      OTP_VERIFIED: '✓',
      FORM_SUBMITTED: '📋',
      STATUS_UPDATED: '🔄',
      FOLLOW_UP_CREATED: '📌',
      FOLLOW_UP_RESOLVED: '✅',
      VENDOR_APPROVED: '👍',
      VENDOR_DENIED: '❌',
      VENDOR_DELETED: '🗑️',
      VENDOR_RESTORED: '♻️',
      EMAIL_SENT: '✉️',
      DOCUMENT_UPLOADED: '📎',
      COMMENT_ADDED: '💬'
    };
    return icons[type] || '📋';
  };

  const getActivityColor = (type) => {
    const colors = {
      VENDOR_REQUEST_CREATED: '#3b82f6',
      INVITATION_SENT: '#10b981',
      LINK_OPENED: '#8b5cf6',
      OTP_VERIFIED: '#10b981',
      FORM_SUBMITTED: '#f59e0b',
      STATUS_UPDATED: '#6366f1',
      VENDOR_APPROVED: '#10b981',
      VENDOR_DENIED: '#ef4444',
      VENDOR_DELETED: '#dc2626',
      VENDOR_RESTORED: '#10b981',
    };
    return colors[type] || '#6b7280';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const uniqueVendors = [...new Set(activities.map(a => ({ id: a.vendorRequestId, name: a.vendorName })))];

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main className={styles.mainContent}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div className={styles.header}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0c6f3e', marginBottom: '8px' }}>
                Vendor Activity Log
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Timeline of all vendor actions, communications, and status updates
              </p>
            </div>

          {/* Filters */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '24px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <button
              onClick={() => {
                setSelectedVendor(null);
                fetchAllActivities();
              }}
              style={{
                padding: '8px 16px',
                background: selectedVendor === null ? '#0a5f3f' : 'white',
                color: selectedVendor === null ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              All Vendors
            </button>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Activities</option>
              <option value="VENDOR_REQUEST_CREATED">Request Created</option>
              <option value="INVITATION_SENT">Invitation Sent</option>
              <option value="LINK_OPENED">Link Opened</option>
              <option value="OTP_VERIFIED">OTP Verified</option>
              <option value="FORM_SUBMITTED">Form Submitted</option>
              <option value="STATUS_UPDATED">Status Updated</option>
              <option value="VENDOR_APPROVED">Approved</option>
              <option value="VENDOR_DENIED">Denied</option>
            </select>

            <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: 'auto' }}>
              {filteredActivities.length} activities
            </span>
          </div>

          {/* Activity Timeline */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Loading activity log...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280', marginBottom: '8px' }}>No activities found</p>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>Activities will appear here as vendors are managed</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Timeline Line */}
              <div style={{
                position: 'absolute',
                left: '20px',
                top: '20px',
                bottom: '20px',
                width: '2px',
                background: '#e5e7eb'
              }} />

              {filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  style={{
                    position: 'relative',
                    paddingLeft: '56px',
                    paddingBottom: '24px',
                    marginBottom: index < filteredActivities.length - 1 ? '16px' : 0
                  }}
                >
                  {/* Timeline Dot */}
                  <div style={{
                    position: 'absolute',
                    left: '8px',
                    top: '8px',
                    width: '26px',
                    height: '26px',
                    background: getActivityColor(activity.activityType),
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    boxShadow: '0 0 0 4px white'
                  }}>
                    {getActivityIcon(activity.activityType)}
                  </div>

                  {/* Activity Card */}
                  <div style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                          {activity.description}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#6b7280' }}>
                          <span style={{ fontWeight: 500 }}>Vendor:</span> {activity.vendorName}
                          {' • '}
                          <span style={{ fontWeight: 500 }}>By:</span> {activity.performedBy}
                          {activity.performedByRole && ` (${activity.performedByRole})`}
                        </p>
                      </div>
                      <span style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                        {formatDate(activity.performedAt)}
                      </span>
                    </div>

                    {activity.details && (
                      <p style={{ 
                        fontSize: '13px', 
                        color: '#6b7280', 
                        background: '#f9fafb',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginTop: '8px'
                      }}>
                        {activity.details}
                      </p>
                    )}

                    {activity.ipAddress && (
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                        IP: {activity.ipAddress}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
