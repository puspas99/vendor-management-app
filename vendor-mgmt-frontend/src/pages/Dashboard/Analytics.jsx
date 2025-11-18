import React, { useState, useEffect } from 'react';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
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
  FiBarChart2, 
  FiPieChart, 
  FiTrendingUp, 
  FiDownload,
  FiFilter,
  FiCalendar,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle
} from 'react-icons/fi';
import Sidebar from './Sidebar';
import Header from '../../components/Header';
import styles from './Analytics.module.css';

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

const Analytics = () => {
  const [vendors, setVendors] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // all, 30days, 90days, year
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [vendorsRes, analyticsRes, followUpsRes, activitiesRes] = await Promise.all([
        fetch('http://localhost:8080/api/v1/procurement/vendors', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        }),
        fetch('http://localhost:8080/api/v1/procurement/analytics', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        }),
        fetch('http://localhost:8080/api/v1/procurement/follow-ups', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        }),
        fetch('http://localhost:8080/api/v1/procurement/activity-log/all', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        })
      ]);

      if (vendorsRes.ok) {
        const json = await vendorsRes.json();
        console.debug('vendorsRes JSON:', json);
        // Support both wrapped ApiResponse { data: [...] } and raw array responses
        const vendorsData = json?.data ?? (Array.isArray(json) ? json : []);
        setVendors(vendorsData);
        console.debug('Parsed vendors count:', vendorsData.length);
      } else {
        console.warn('Failed to fetch vendors', vendorsRes.status);
      }

      if (analyticsRes.ok) {
        const json = await analyticsRes.json();
        console.debug('analyticsRes JSON:', json);
        setAnalytics(json?.data ?? json ?? null);
      } else {
        console.warn('Failed to fetch analytics', analyticsRes.status);
      }

      if (followUpsRes.ok) {
        const json = await followUpsRes.json();
        console.debug('followUpsRes JSON:', json);
        const followUpsData = json?.data ?? (Array.isArray(json) ? json : []);
        setFollowUps(followUpsData);
      } else {
        console.warn('Failed to fetch follow-ups', followUpsRes.status);
      }

      if (activitiesRes.ok) {
        const json = await activitiesRes.json();
        console.debug('activitiesRes JSON:', json);
        const activitiesData = json?.data ?? (Array.isArray(json) ? json : []);
        setActivities(activitiesData);
      } else {
        console.warn('Failed to fetch activities', activitiesRes.status);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter vendors by time range
  const filterByTimeRange = (items, dateField = 'createdAt') => {
    if (timeRange === 'all') return items;
    
    const now = new Date();
    const cutoff = new Date();
    
    if (timeRange === '30days') cutoff.setDate(now.getDate() - 30);
    else if (timeRange === '90days') cutoff.setDate(now.getDate() - 90);
    else if (timeRange === 'year') cutoff.setFullYear(now.getFullYear() - 1);
    
    return items.filter(item => new Date(item[dateField]) >= cutoff);
  };

  // Apply filters
  const filteredVendors = categoryFilter === 'all' 
    ? filterByTimeRange(vendors)
    : filterByTimeRange(vendors.filter(v => v.vendorCategory === categoryFilter));

  // Calculate metrics
  const totalVendors = filteredVendors.length;
  const requestedVendors = filteredVendors.filter(v => v.status === 'REQUESTED').length;
  const validatedVendors = filteredVendors.filter(v => v.status === 'VALIDATED').length;
  const inProgressVendors = filteredVendors.filter(v => v.status === 'IN_PROGRESS').length;
  const deniedVendors = filteredVendors.filter(v => v.status === 'DENIED').length;

  const totalFollowUps = followUps.length;
  const pendingFollowUps = followUps.filter(f => f.status === 'PENDING').length;
  const resolvedFollowUps = followUps.filter(f => f.status === 'RESOLVED').length;

  // Use fixed list of vendor categories (plus 'all') to keep reporting consistent
  const categories = [
    'all',
    'IT Services',
    'Software Development',
    'Cloud Services',
    'Office Supplies',
    'Electronics',
    'Logistics & Transportation',
    'Manufacturing',
    'Construction',
    'Consulting Services',
    'Marketing & Advertising',
    'Raw Materials',
    'Packaging Materials',
    'Cleaning Services',
    'Security Services',
    'Facility Management',
    'Legal Services',
    'Accounting & Finance',
    'HR Services',
    'Training & Development',
    'Other'
  ];

  // Status Distribution Chart
  const statusChartData = {
    labels: ['Requested', 'Validated', 'In Progress', 'Denied'],
    datasets: [{
      data: [requestedVendors, validatedVendors, inProgressVendors, deniedVendors],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0
    }]
  };

  // Monthly Trend Chart
  const monthlyTrendData = {
    labels: analytics?.monthlyStats?.map(m => m.month) || [],
    datasets: [{
      label: 'Vendors Added',
      data: analytics?.monthlyStats?.map(m => m.count) || [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  // Category Distribution Chart
  const categoryData = categories.slice(1).reduce((acc, cat) => {
    acc[cat] = vendors.filter(v => v.vendorCategory === cat).length;
    return acc;
  }, {});

  const categoryChartData = {
    labels: Object.keys(categoryData),
    datasets: [{
      label: 'Vendors',
      data: Object.values(categoryData),
      backgroundColor: [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140', '#30cfd0', '#330867'
      ],
      borderWidth: 0
    }]
  };

  // Follow-up Status Chart
  const followUpChartData = {
    labels: ['Pending', 'Resolved', 'Escalated'],
    datasets: [{
      data: [
        pendingFollowUps,
        resolvedFollowUps,
        followUps.filter(f => f.escalationLevel > 0).length
      ],
      backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
      borderWidth: 0
    }]
  };

  // Activity Type Distribution
  const activityTypes = activities.reduce((acc, act) => {
    acc[act.activityType] = (acc[act.activityType] || 0) + 1;
    return acc;
  }, {});

  const activityChartData = {
    labels: Object.keys(activityTypes),
    datasets: [{
      label: 'Activities',
      data: Object.values(activityTypes),
      backgroundColor: '#3b82f6',
      borderRadius: 8
    }]
  };

  // Export function
  const handleExport = () => {
    const data = {
      summary: {
        totalVendors,
        requestedVendors,
        validatedVendors,
        inProgressVendors,
        deniedVendors,
        totalFollowUps,
        pendingFollowUps,
        resolvedFollowUps
      },
      vendors: filteredVendors,
      followUps,
      activities,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={styles.dashboardLayout}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header />
          <div className={styles.mainContent}>
            <div className={styles.loading}>Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div className={styles.mainContent}>
          <div className={styles.analyticsContainer}>
            {/* Header with Filters */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <h1 className={styles.title}>Analytics & Reports</h1>
                <p className={styles.subtitle}>Comprehensive vendor management insights</p>
              </div>
              <button className={styles.exportBtn} onClick={handleExport}>
                <FiDownload size={18} />
                Export Data
              </button>
            </div>

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <FiCalendar size={18} />
              <label>Time Range:</label>
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <FiFilter size={18} />
              <label>Category:</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <FiUsers size={24} />
              </div>
              <div className={styles.summaryContent}>
                <h3>{totalVendors}</h3>
                <p>Total Vendors</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <FiCheckCircle size={24} />
              </div>
              <div className={styles.summaryContent}>
                <h3>{validatedVendors}</h3>
                <p>Validated</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <FiClock size={24} />
              </div>
              <div className={styles.summaryContent}>
                <h3>{requestedVendors}</h3>
                <p>Pending Requests</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                <FiAlertTriangle size={24} />
              </div>
              <div className={styles.summaryContent}>
                <h3>{pendingFollowUps}</h3>
                <p>Pending Follow-ups</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className={styles.chartsSection}>
            {/* Row 1: Status & Monthly Trend */}
            <div className={styles.chartRow}>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <FiPieChart size={20} />
                  <h3>Vendor Status Distribution</h3>
                </div>
                <div className={styles.chartContainer}>
                  <Doughnut 
                    data={statusChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { padding: 15, font: { size: 12 } }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <FiTrendingUp size={20} />
                  <h3>Monthly Vendor Trend</h3>
                </div>
                <div className={styles.chartContainer}>
                  <Line 
                    data={monthlyTrendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Category Distribution & Follow-ups */}
            <div className={styles.chartRow}>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <FiBarChart2 size={20} />
                  <h3>Category Distribution</h3>
                </div>
                <div className={styles.chartContainer}>
                  <Bar 
                    data={categoryChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } }
                    }}
                  />
                </div>
              </div>

              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <FiPieChart size={20} />
                  <h3>Follow-up Status</h3>
                </div>
                <div className={styles.chartContainer}>
                  <Pie 
                    data={followUpChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { padding: 15, font: { size: 12 } }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Activity Types */}
            <div className={styles.chartRow}>
              <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.chartHeader}>
                  <FiBarChart2 size={20} />
                  <h3>Activity Type Distribution</h3>
                </div>
                <div className={styles.chartContainer}>
                  <Bar 
                    data={activityChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } },
                      indexAxis: 'y'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Table */}
          <div className={styles.statsTable}>
            <h3>Detailed Statistics</h3>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Vendors</td>
                  <td>{totalVendors}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Validated Vendors</td>
                  <td>{validatedVendors}</td>
                  <td>{totalVendors > 0 ? ((validatedVendors / totalVendors) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td>Requested Vendors</td>
                  <td>{requestedVendors}</td>
                  <td>{totalVendors > 0 ? ((requestedVendors / totalVendors) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td>In Progress</td>
                  <td>{inProgressVendors}</td>
                  <td>{totalVendors > 0 ? ((inProgressVendors / totalVendors) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td>Denied Vendors</td>
                  <td>{deniedVendors}</td>
                  <td>{totalVendors > 0 ? ((deniedVendors / totalVendors) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className={styles.separator}>
                  <td>Total Follow-ups</td>
                  <td>{totalFollowUps}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Pending Follow-ups</td>
                  <td>{pendingFollowUps}</td>
                  <td>{totalFollowUps > 0 ? ((pendingFollowUps / totalFollowUps) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td>Resolved Follow-ups</td>
                  <td>{resolvedFollowUps}</td>
                  <td>{totalFollowUps > 0 ? ((resolvedFollowUps / totalFollowUps) * 100).toFixed(1) : 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
