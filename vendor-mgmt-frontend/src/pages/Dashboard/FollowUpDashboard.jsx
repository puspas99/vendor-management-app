import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import procurementService from '../../services/procurementService';
import styles from './Dashboard.module.css';

export default function FollowUpDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    critical: 0
  });

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchFollowUps();
  }, [filterStatus, filterType]);

  // Also fetch when navigating to this page
  useEffect(() => {
    fetchFollowUps();
  }, [location.pathname]);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      console.log('Fetching follow-ups with filters:', { filterStatus, filterType });
      const response = await procurementService.getAllFollowUps(filterStatus, filterType);
      console.log('Full response object:', JSON.stringify(response, null, 2));
      console.log('Response.success value:', response.success);
      console.log('Response.success type:', typeof response.success);
      console.log('Response.success === true:', response.success === true);
      console.log('Response.success == true:', response.success == true);
      console.log('Response has data:', !!response.data);
      console.log('Response.data is array:', Array.isArray(response.data));
      
      // Just check if data exists and is an array
      if (response && response.data && Array.isArray(response.data)) {
        console.log('Setting follow-ups data:', response.data.length, 'items');
        setFollowUps(response.data);
        calculateStats(response.data);
      } else {
        console.error('Invalid response structure:', response);
        setFollowUps([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      pending: data.filter(f => f.status === 'PENDING' || f.status === 'SENT').length,
      resolved: data.filter(f => f.status === 'RESOLVED').length,
      critical: data.filter(f => f.escalationLevel >= 2).length
    });
  };

  const handleResolve = async (followUpId) => {
    try {
      await procurementService.resolveFollowUp(followUpId);
      toast.success('Follow-up marked as resolved');
      fetchFollowUps();
    } catch (error) {
      toast.error('Failed to resolve follow-up');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      SENT: '#3b82f6',
      PENDING: '#f59e0b',
      RESOLVED: '#10b981'
    };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: colors[status] + '20',
        color: colors[status]
      }}>
        {status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const colors = {
      MISSING_DATA: '#ef4444',
      INCORRECT_DATA: '#f59e0b',
      INCORRECT_FILE: '#f97316',
      DELAYED_RESPONSE: '#6366f1',
      UNRESPONSIVE: '#dc2626'
    };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: colors[type] + '20',
        color: colors[type]
      }}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      let date;
      
      // Handle Java LocalDateTime array format [year, month, day, hour, minute, second, nanoseconds]
      if (Array.isArray(dateString)) {
        const [year, month, day, hour, minute, second, nano] = dateString;
        // Month is 1-indexed in Java, 0-indexed in JavaScript
        date = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0, Math.floor((nano || 0) / 1000000));
      } else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              Follow-up Management
            </h1>
          </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Follow-ups</div>
            <div style={{ fontSize: '36px', fontWeight: '700', marginTop: '8px' }}>{stats.total}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Pending</div>
            <div style={{ fontSize: '36px', fontWeight: '700', marginTop: '8px' }}>{stats.pending}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Resolved</div>
            <div style={{ fontSize: '36px', fontWeight: '700', marginTop: '8px' }}>{stats.resolved}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Critical</div>
            <div style={{ fontSize: '36px', fontWeight: '700', marginTop: '8px' }}>{stats.critical}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          gap: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            >
              <option value="ALL">All Status</option>
              <option value="SENT">Sent</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            >
              <option value="ALL">All Types</option>
              <option value="MISSING_DATA">Missing Data</option>
              <option value="INCORRECT_DATA">Incorrect Data</option>
              <option value="INCORRECT_FILE">Incorrect File</option>
              <option value="DELAYED_RESPONSE">Delayed Response</option>
              <option value="UNRESPONSIVE">Unresponsive</option>
            </select>
          </div>

          <button
            onClick={fetchFollowUps}
            style={{
              marginLeft: 'auto',
              padding: '8px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              alignSelf: 'flex-end'
            }}
          >
            Refresh
          </button>
        </div>

        {/* Follow-ups List */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div>Loading follow-ups...</div>
            </div>
          ) : followUps.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              No follow-ups found
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    VENDOR
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    TYPE
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    STATUS
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    CREATED
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    AI
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {followUps.map((followUp) => (
                  <tr key={followUp.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      <div style={{ fontWeight: '600' }}>{followUp.vendorName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {followUp.fieldsConcerned || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getTypeBadge(followUp.followUpType)}
                      {followUp.escalationLevel > 0 && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          color: '#ef4444',
                          fontWeight: '600'
                        }}>
                          L{followUp.escalationLevel}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(followUp.status)}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {formatDate(followUp.createdAt)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {followUp.aiGenerated && (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: '#8b5cf620',
                          color: '#8b5cf6'
                        }}>
                          🤖 AI
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => navigate(`/vendors/${followUp.vendorOnboardingId}`)}
                          style={{
                            padding: '6px 12px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>
                        {followUp.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolve(followUp.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}
