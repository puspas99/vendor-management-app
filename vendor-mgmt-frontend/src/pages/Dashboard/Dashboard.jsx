import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { 
  FiTrendingUp, 
  FiUsers, 
  FiCheckCircle, 
  FiClock,
  FiAlertCircle,
  FiActivity,
  FiBarChart2,
  FiBell
} from 'react-icons/fi';
import Sidebar from './Sidebar';
import Header from '../../components/Header';
import styles from './Dashboard.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, followUpsRes, activitiesRes] = await Promise.all([
          fetch('https://vendor-onboarding-mgmt.azurewebsites.net/api/v1/procurement/analytics', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          }),
          fetch('https://vendor-onboarding-mgmt.azurewebsites.net/api/v1/procurement/follow-ups', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          }),
          fetch('https://vendor-onboarding-mgmt.azurewebsites.net/api/v1/procurement/activity-log/all', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          })
        ]);

        if (analyticsRes.ok) {
          const aJson = await analyticsRes.json();
          setAnalytics(aJson?.data ?? aJson ?? null);
        }

        if (followUpsRes.ok) {
          const fJson = await followUpsRes.json();
          const followUpsData = fJson?.data ?? (Array.isArray(fJson) ? fJson : []);
          setFollowUps(followUpsData);
        }

        if (activitiesRes.ok) {
          const actJson = await activitiesRes.json();
          const activities = actJson?.data ?? (Array.isArray(actJson) ? actJson : []);
          setRecentActivities(activities.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('https://vendor-onboarding-mgmt.azurewebsites.net/api/v1/procurement/vendors', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.ok) {
        const json = await response.json();
        const vendorsData = json?.data ?? (Array.isArray(json) ? json : []);
        setVendors(vendorsData);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const totalVendors = vendors.length;
  const requestedVendors = vendors.filter(v => v.status === 'REQUESTED').length;
  const validatedVendors = vendors.filter(v => v.status === 'VALIDATED').length;
  const deniedVendors = vendors.filter(v => v.status === 'DENIED').length;
  const inProgressVendors = vendors.filter(v => v.status === 'IN_PROGRESS' || v.status === 'AWAITING_RESPONSE' || v.status === 'AWAITING_VALIDATION').length;
  const completedVendors = vendors.filter(v => v.status === 'COMPLETED' || v.status === 'APPROVED').length;
  const pendingFollowUps = followUps.filter(f => f.status === 'PENDING').length;

  // Debug: Log vendor statuses
  useEffect(() => {
    if (vendors.length > 0) {
      console.log('All vendor statuses:', vendors.map(v => v.status));
      console.log('Status counts:', {
        REQUESTED: requestedVendors,
        VALIDATED: validatedVendors,
        IN_PROGRESS: inProgressVendors,
        COMPLETED: completedVendors,
        DENIED: deniedVendors
      });
    }
  }, [vendors]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Status distribution for Doughnut chart
  const statusChartData = {
    labels: ['Requested', 'In Progress', 'Completed', 'Validated', 'Denied'],
    datasets: [{
      data: [
        requestedVendors,
        inProgressVendors,
        completedVendors,
        validatedVendors,
        deniedVendors
      ],
      backgroundColor: [
        '#3b82f6',  // Blue for Requested
        '#f59e0b',  // Orange for In Progress
        '#10b981',  // Green for Completed
        '#8b5cf6',  // Purple for Validated
        '#ef4444'   // Red for Denied
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Activity trend for Line chart - Use recent activities to create trend
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return days;
  };

  const parseActivityDate = (timestamp) => {
    if (!timestamp) return null;
    
    // Handle Java LocalDateTime array format [year, month, day, hour, minute, second, nanoseconds]
    if (Array.isArray(timestamp)) {
      const [year, month, day] = timestamp;
      return new Date(year, month - 1, day); // month is 1-indexed in Java
    }
    
    // Handle ISO string or standard date
    return new Date(timestamp);
  };

  const getActivityCountsByDay = () => {
    const last7Days = getLast7Days();
    const counts = new Array(7).fill(0);
    
    console.log('Recent activities:', recentActivities);
    
    recentActivities.forEach(activity => {
      if (activity.performedAt || activity.timestamp || activity.createdAt) {
        const timestamp = activity.performedAt || activity.timestamp || activity.createdAt;
        const activityDate = parseActivityDate(timestamp);
        
        if (activityDate && !isNaN(activityDate.getTime())) {
          const formattedDate = activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const index = last7Days.indexOf(formattedDate);
          console.log('Activity date:', formattedDate, 'Index:', index);
          if (index !== -1) {
            counts[index]++;
          }
        }
      }
    });
    
    console.log('Activity counts by day:', counts);
    return counts;
  };

  const activityTrendData = {
    labels: analytics?.monthlyStats?.map(m => m.month) || getLast7Days(),
    datasets: [{
      label: 'Activities',
      data: analytics?.monthlyStats?.map(m => m.count) || getActivityCountsByDay(),
      borderColor: '#0c6f3e',
      backgroundColor: 'rgba(12, 111, 62, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#0c6f3e',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          font: { size: 12 },
          padding: 10
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} activities`;
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11 }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: { size: 11 }
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div className={styles.mainContent}>
          <div className={styles.dashboardContainer}>
            {/* Header */}
            <div className={styles.dashboardHeader} style={{ 
              background: 'linear-gradient(135deg, #0a5f3f 0%, #0c6f3e 100%)',
              padding: '32px',
              borderRadius: '16px',
              marginBottom: '32px',
              boxShadow: '0 4px 12px rgba(10, 95, 63, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <FiBarChart2 size={32} color="white" />
                </div>
                <div>
                  <h1 style={{ 
                    fontSize: '32px', 
                    fontWeight: '700', 
                    color: 'white',
                    margin: 0,
                    marginBottom: '8px'
                  }}>
                    Procurement Dashboard
                  </h1>
                  <p style={{ 
                    fontSize: '16px', 
                    color: 'rgba(255, 255, 255, 0.9)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FiActivity size={16} />
                    Monitor vendor onboarding and procurement activities
                  </p>
                </div>
              </div>
            </div>

          {/* KPI Cards */}
          <div className={styles.kpiGrid}>
            <div 
              className={styles.kpiCard} 
              onClick={() => navigate('/vendors')}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <FiUsers size={24} />
              </div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiValue}>{totalVendors}</h3>
                <p className={styles.kpiLabel}>Total Vendors</p>
              </div>
            </div>

            <div 
              className={styles.kpiCard}
              onClick={() => navigate('/vendors')}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <FiClock size={24} />
              </div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiValue}>{requestedVendors}</h3>
                <p className={styles.kpiLabel}>Pending Requests</p>
              </div>
            </div>

            <div 
              className={styles.kpiCard}
              onClick={() => navigate('/vendors')}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <FiCheckCircle size={24} />
              </div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiValue}>{validatedVendors}</h3>
                <p className={styles.kpiLabel}>Validated</p>
              </div>
            </div>

            <div 
              className={styles.kpiCard}
              onClick={() => navigate('/follow-ups')}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                <FiBell size={24} />
              </div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiValue}>{pendingFollowUps}</h3>
                <p className={styles.kpiLabel}>Pending Follow-ups</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <FiBarChart2 size={20} />
                <h3>Vendor Status Distribution</h3>
              </div>
              <div className={styles.chartContainer}>
                {totalVendors > 0 ? (
                  <Doughnut 
                    data={statusChartData} 
                    options={chartOptions}
                  />
                ) : (
                  <div style={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    No vendor data available
                  </div>
                )}
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <FiTrendingUp size={20} />
                <h3>Activity Trend</h3>
              </div>
              <div className={styles.chartContainer}>
                {(analytics?.monthlyStats?.length > 0 || recentActivities.length > 0) ? (
                  <Line 
                    data={activityTrendData} 
                    options={lineChartOptions}
                  />
                ) : (
                  <div style={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    No activity data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section - Follow-ups & Activities */}
          <div className={styles.bottomGrid}>
            {/* Pending Follow-ups */}
            <div className={styles.listCard}>
              <div className={styles.listHeader}>
                <FiAlertCircle size={20} />
                <h3>Pending Follow-ups</h3>
                <button 
                  className={styles.viewAllBtn}
                  onClick={() => navigate('/follow-ups')}
                >
                  View All
                </button>
              </div>
              <div className={styles.listContent}>
                {followUps.filter(f => f.status === 'PENDING').slice(0, 5).length > 0 ? (
                  followUps.filter(f => f.status === 'PENDING').slice(0, 5).map((followUp, index) => (
                    <div key={index} className={styles.listItem}>
                      <div className={styles.itemIcon}>
                        <FiBell size={16} />
                      </div>
                      <div className={styles.itemContent}>
                        <p className={styles.itemTitle}>{followUp.followUpReason || 'Follow-up Required'}</p>
                        <p className={styles.itemMeta}>
                          {followUp.followUpType} • {formatDate(followUp.createdAt)}
                        </p>
                      </div>
                      <span className={styles.statusBadge} style={{ background: '#fef3c7', color: '#92400e' }}>
                        Pending
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyState}>No pending follow-ups</p>
                )}
              </div>
            </div>

            {/* Recent Activities */}
            <div className={styles.listCard}>
              <div className={styles.listHeader}>
                <FiActivity size={20} />
                <h3>Recent Activities</h3>
                <button 
                  className={styles.viewAllBtn}
                  onClick={() => navigate('/activity-log')}
                >
                  View All
                </button>
              </div>
              <div className={styles.listContent}>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div key={index} className={styles.listItem}>
                      <div className={styles.itemIcon}>
                        <FiActivity size={16} />
                      </div>
                      <div className={styles.itemContent}>
                        <p className={styles.itemTitle}>{activity.description}</p>
                        <p className={styles.itemMeta}>
                          {activity.performedBy} • {formatDate(activity.performedAt)}
                        </p>
                      </div>
                      <span 
                        className={styles.activityType}
                        style={{ 
                          background: activity.activityType === 'CREATE' ? '#dbeafe' : 
                                     activity.activityType === 'UPDATE' ? '#fef3c7' : '#fee2e2',
                          color: activity.activityType === 'CREATE' ? '#1e40af' : 
                                 activity.activityType === 'UPDATE' ? '#92400e' : '#991b1b'
                        }}
                      >
                        {activity.activityType}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyState}>No recent activities</p>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
