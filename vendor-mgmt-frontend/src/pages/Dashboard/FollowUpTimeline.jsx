import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import procurementService from '../../services/procurementService';

export default function FollowUpTimeline({ vendorId }) {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendorId) {
      fetchFollowUps();
    }
  }, [vendorId]);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const response = await procurementService.getVendorFollowUps(vendorId);
      if (response.success) {
        console.log('Follow-ups data received:', response.data);
        setFollowUps(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      toast.error('Failed to load follow-up timeline');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      MISSING_DATA: '#ef4444',
      INCORRECT_DATA: '#f59e0b',
      INCORRECT_FILE: '#f97316',
      DELAYED_RESPONSE: '#6366f1',
      UNRESPONSIVE: '#dc2626',
      DOCUMENT_VERIFICATION: '#8b5cf6',
      COMPLIANCE_CHECK: '#10b981',
      FINAL_APPROVAL: '#06b6d4'
    };
    return colors[type] || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      console.warn('No date provided');
      return 'Date not available';
    }
    
    try {
      console.log('Formatting date:', dateString, 'Type:', typeof dateString);
      
      let date;
      
      // Handle array format from Java LocalDateTime [year, month, day, hour, minute, second, nano]
      if (Array.isArray(dateString)) {
        const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = dateString;
        // Month is 1-indexed in Java, but 0-indexed in JavaScript
        date = new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1000000));
      } else {
        // Handle standard date string
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return `Invalid date`;
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays === 0) return 'Today at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      if (diffDays === 1) return 'Yesterday at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      }) + ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return `Error formatting date`;
    }
  };

  const getStatusIcon = (followUp) => {
    if (followUp.status === 'RESOLVED') return '✓';
    if (followUp.respondedAt) return '💬';
    if (followUp.readAt) return '👁️';
    if (followUp.sentAt || followUp.emailSent) return '📧';
    return '⏳';
  };

  const getStatusColor = (followUp) => {
    if (followUp.status === 'RESOLVED') return '#10b981';
    if (followUp.respondedAt) return '#3b82f6';
    if (followUp.readAt) return '#8b5cf6';
    if (followUp.sentAt || followUp.emailSent) return '#f59e0b';
    return '#6b7280';
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading timeline...
      </div>
    );
  }

  if (followUps.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '40px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
        <div style={{ fontSize: '16px', fontWeight: '600' }}>No Follow-ups Yet</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          Follow-ups will appear here as they are created
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '24px'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: '24px'
      }}>
        📅 Follow-up Timeline
      </h3>

      <div style={{ position: 'relative' }}>
        {/* Timeline line */}
        <div style={{
          position: 'absolute',
          left: '19px',
          top: '0',
          bottom: '0',
          width: '2px',
          background: '#e5e7eb'
        }} />

        {/* Timeline items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {followUps.map((followUp, index) => (
            <div
              key={followUp.id}
              style={{
                position: 'relative',
                paddingLeft: '48px'
              }}
            >
              {/* Timeline dot */}
              <div style={{
                position: 'absolute',
                left: '0',
                top: '0',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: getTypeColor(followUp.followUpType),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                color: 'white',
                fontWeight: '700',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1
              }}>
                {getStatusIcon(followUp)}
              </div>

              {/* Content card */}
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                borderLeftWidth: '3px',
                borderLeftColor: getTypeColor(followUp.followUpType)
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1f2937',
                      marginBottom: '4px'
                    }}>
                      {followUp.followUpType.replace(/_/g, ' ')}
                      {followUp.escalationLevel > 0 && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          background: '#fef2f2',
                          color: '#ef4444',
                          fontWeight: '700'
                        }}>
                          ESCALATION L{followUp.escalationLevel}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      Created {formatDate(followUp.createdAt || followUp.sentAt || followUp.emailSentAt)}
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    backgroundColor: getStatusColor(followUp) + '20',
                    color: getStatusColor(followUp)
                  }}>
                    {followUp.status}
                  </span>
                </div>

                {followUp.fieldsConcerned && (
                  <div style={{
                    fontSize: '13px',
                    color: '#374151',
                    marginBottom: '12px',
                    background: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px'
                  }}>
                    <strong>Fields:</strong> {followUp.fieldsConcerned}
                  </div>
                )}

                {followUp.message && (
                  <div style={{
                    fontSize: '13px',
                    color: '#4b5563',
                    lineHeight: '1.5',
                    marginBottom: '12px',
                    maxHeight: '100px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {followUp.message.substring(0, 200)}
                    {followUp.message.length > 200 && '...'}
                  </div>
                )}

                {/* Activity indicators */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '12px',
                  color: '#6b7280',
                  flexWrap: 'wrap'
                }}>
                  {followUp.aiGenerated && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      background: '#ede9fe',
                      borderRadius: '6px',
                      color: '#7c3aed'
                    }}>
                      🤖 AI Generated
                    </span>
                  )}

                  {followUp.emailSent && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      📧 Sent {formatDate(followUp.emailSentAt)}
                    </span>
                  )}

                  {followUp.emailOpened && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#8b5cf6'
                    }}>
                      👁️ Opened {formatDate(followUp.emailOpenedAt)}
                    </span>
                  )}

                  {followUp.respondedAt && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#3b82f6'
                    }}>
                      💬 Responded {formatDate(followUp.respondedAt)}
                    </span>
                  )}

                  {followUp.escalatedTo && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#ef4444'
                    }}>
                      ⚠️ Escalated to {followUp.escalatedTo}
                    </span>
                  )}
                </div>

                {/* Response time if resolved */}
                {followUp.status === 'RESOLVED' && followUp.respondedAt && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    background: '#d1fae5',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#065f46',
                    fontWeight: '600'
                  }}>
                    ✓ Resolved in {Math.floor(
                      (new Date(followUp.respondedAt) - new Date(followUp.createdAt)) / (1000 * 60 * 60 * 24)
                    )} days
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
