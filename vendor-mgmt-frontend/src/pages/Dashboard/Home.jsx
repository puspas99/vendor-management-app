import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiTrendingUp, FiUsers, FiCheckCircle, FiClock, FiArrowRight, FiShield, FiZap, FiActivity } from 'react-icons/fi'
import styles from './Dashboard.module.css'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import Header from '../../components/Header'
import procurementService from '../../services/procurementService'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalVendors: 0,
    activeVendors: 0,
    pendingVendors: 0,
    completedVendors: 0,
    requestedVendors: 0,
    inProgressVendors: 0,
    deniedVendors: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorsResponse, activitiesResponse] = await Promise.all([
          procurementService.getAllVendors(),
          procurementService.getAllActivities()
        ])

        if (vendorsResponse.success && vendorsResponse.data) {
          const vendors = vendorsResponse.data
          console.log('Vendors data for pipeline:', vendors);
          console.log('Status counts:', {
            requested: vendors.filter(v => v.status === 'REQUESTED').length,
            inProgress: vendors.filter(v => v.status === 'IN_PROGRESS' || v.status === 'AWAITING_RESPONSE' || v.status === 'AWAITING_VALIDATION').length,
            validated: vendors.filter(v => v.status === 'VALIDATED').length,
            denied: vendors.filter(v => v.status === 'DENIED').length
          });
          
          setStats({
            totalVendors: vendors.length,
            activeVendors: vendors.filter(v => v.status?.toLowerCase() === 'active').length,
            pendingVendors: vendors.filter(v => v.status?.toLowerCase() === 'pending').length,
            completedVendors: vendors.filter(v => v.status?.toLowerCase() === 'validated' || v.status === 'VALIDATED').length,
            requestedVendors: vendors.filter(v => v.status === 'REQUESTED').length,
            inProgressVendors: vendors.filter(v => v.status === 'IN_PROGRESS' || v.status === 'AWAITING_RESPONSE' || v.status === 'AWAITING_VALIDATION' || v.status?.toLowerCase() === 'in_progress').length,
            deniedVendors: vendors.filter(v => v.status === 'DENIED' || v.status?.toLowerCase() === 'denied').length
          })
        }

        if (activitiesResponse.success && activitiesResponse.data) {
          setRecentActivities(activitiesResponse.data.slice(0, 5))
        }
      } catch (error) {
        console.error('Error fetching home data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#f9fafb'
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({ ...prev, files: [...prev.files, ...files] }))
    if (fileInputRef.current) fileInputRef.current.value = null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.vendorName || !formData.vendorEmail || !formData.contactPerson || !formData.contactNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    // Check if user is authenticated
    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Please login first to create vendor requests')
      navigate('/login')
      return
    }

    // Create vendor request data for backend
    const vendorRequestData = {
      vendorName: formData.vendorName,
      vendorEmail: formData.vendorEmail,
      contactPerson: formData.contactPerson,
      contactNumber: formData.contactNumber,
      vendorCategory: formData.vendorCategory || 'General',
      remarks: formData.remarks || ''
    }

    try {
      toast.loading('Sending invitation...', { id: 'vendor-request' })
      const result = await addVendor(vendorRequestData)
      
      if (result.success) {
        toast.success('Vendor invitation sent successfully!', { id: 'vendor-request' })
        
        // Reset form
        setFormData({
          vendorName: '',
          vendorEmail: '',
          contactPerson: '',
          contactNumber: '',
          vendorCategory: '',
          remarks: '',
          files: []
        })
        setShowForm(false)
      } else {
        // Dismiss the loading toast first
        toast.dismiss('vendor-request')
        
        // Check if there are detailed validation errors in the data field
        if (result.data && typeof result.data === 'object' && Object.keys(result.data).length > 0) {
          // Display each field error separately without the main validation message
          const errorFields = Object.entries(result.data);
          
          errorFields.forEach(([field, error], index) => {
            setTimeout(() => {
              toast.error(`${field}: ${error}`, {
                duration: 6000,
                style: {
                  background: '#fee',
                  color: '#c00',
                  maxWidth: '500px'
                }
              });
            }, index * 100);
          });
        } else {
          // Single error message
          toast.error(result.message || 'Failed to send vendor invitation', { 
            duration: 5000,
            style: {
              background: '#fee',
              color: '#c00',
              maxWidth: '500px'
            }
          });
        }
        
        // If it's an auth error, redirect to login
        if (result.authError) {
          setTimeout(() => navigate('/login'), 2000)
        }
      }
    } catch (error) {
      console.error('Error submitting vendor request:', error)
      toast.error('An error occurred while submitting the request', { id: 'vendor-request' })
    }
  }

  const handleCancel = () => {
    setFormData({
      vendorName: '',
      vendorEmail: '',
      contactPerson: '',
      contactNumber: '',
      vendorCategory: '',
      remarks: '',
      files: []
    })
    setShowForm(false)
  }

  const getActivityIcon = (type) => {
    const icons = {
      VENDOR_REQUEST_CREATED: '📝',
      INVITATION_SENT: '📧',
      FORM_SUBMITTED: '📋',
      STATUS_UPDATED: '🔄',
      VENDOR_APPROVED: '✅',
      VENDOR_DENIED: '❌'
    }
    return icons[type] || '📋'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main className={styles.mainContent}>
          {/* Hero Section */}
          <div style={{
            background: 'linear-gradient(135deg, #0a5f3f 0%, #0c6f3e 100%)',
            borderRadius: '16px',
            padding: '48px 40px',
            marginBottom: '32px',
            color: 'white',
            boxShadow: '0 8px 24px rgba(10, 95, 63, 0.2)'
          }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '12px', margin: 0 }}>
            Welcome to Vendor Management System
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px' }}>
            Streamline your vendor onboarding, tracking, and management processes
          </p>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'white',
                color: '#0a5f3f',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s'
              }}
            >
              View Dashboard <FiArrowRight />
            </button>
            <button
              onClick={() => navigate('/vendors')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid white',
                padding: '14px 28px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s'
              }}
            >
              View All Vendors <FiUsers />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            Quick Overview
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  background: '#dbeafe',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiUsers size={24} color="#3b82f6" />
                </div>
                <FiTrendingUp size={20} color="#10b981" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                {loading ? '...' : stats.totalVendors}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Vendors</div>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  background: '#d1fae5',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiCheckCircle size={24} color="#10b981" />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                {loading ? '...' : stats.completedVendors}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Validated Vendors</div>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  background: '#fef3c7',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiClock size={24} color="#f59e0b" />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                {loading ? '...' : stats.pendingVendors}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Pending Review</div>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  background: '#dcfce7',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiActivity size={24} color="#059669" />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                {loading ? '...' : stats.activeVendors}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Active Vendors</div>
            </div>
          </div>
        </div>

        {/* Project Progress Pipeline */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            Vendor Onboarding Pipeline
          </h2>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              {/* Stage 1: Requested */}
              <div style={{ flex: 1, minWidth: '180px', textAlign: 'center' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: 'white',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  {loading ? '...' : stats.requestedVendors}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                  Requested
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Initial requests
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  marginTop: '12px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: stats.totalVendors > 0 ? `${(stats.requestedVendors / stats.totalVendors) * 100}%` : '0%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                <FiArrowRight size={24} color="#9ca3af" />
              </div>

              {/* Stage 2: In Progress */}
              <div style={{ flex: 1, minWidth: '180px', textAlign: 'center' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: 'white',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}>
                  {loading ? '...' : stats.inProgressVendors}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                  In Progress
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Under review
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  marginTop: '12px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: stats.totalVendors > 0 ? `${(stats.inProgressVendors / stats.totalVendors) * 100}%` : '0%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                <FiArrowRight size={24} color="#9ca3af" />
              </div>

              {/* Stage 3: Validated */}
              <div style={{ flex: 1, minWidth: '180px', textAlign: 'center' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: 'white',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>
                  {loading ? '...' : stats.completedVendors}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                  Validated
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Approved vendors
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  marginTop: '12px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: stats.totalVendors > 0 ? `${(stats.completedVendors / stats.totalVendors) * 100}%` : '0%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                <FiArrowRight size={24} color="#9ca3af" />
              </div>

              {/* Stage 4: Denied */}
              <div style={{ flex: 1, minWidth: '180px', textAlign: 'center' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: 'white',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}>
                  {loading ? '...' : stats.deniedVendors}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                  Denied
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Rejected requests
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  marginTop: '12px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: stats.totalVendors > 0 ? `${(stats.deniedVendors / stats.totalVendors) * 100}%` : '0%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>

            {/* Overall Progress Summary */}
            <div style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                  Overall Completion Rate
                </span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                  {stats.totalVendors > 0 ? Math.round((stats.completedVendors / stats.totalVendors) * 100) : 0}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                background: '#e5e7eb',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: stats.totalVendors > 0 ? `${(stats.completedVendors / stats.totalVendors) * 100}%` : '0%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            Key Features
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => navigate('/follow-ups')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                background: '#e0f2fe',
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <FiZap size={28} color="#0284c7" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
                Automated Follow-ups
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                AI-powered follow-up system to track vendor responses and automate reminders
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => navigate('/notifications')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                background: '#fce7f3',
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <FiShield size={28} color="#db2777" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
                Real-time Notifications
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                Stay updated with instant notifications for vendor activities and status changes
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => navigate('/activity-log')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                background: '#f3e8ff',
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <FiActivity size={28} color="#9333ea" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
                Activity Tracking
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                Complete audit trail of all vendor interactions and system activities
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivities.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Recent Activity
              </h2>
              <button
                onClick={() => navigate('/activity-log')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0a5f3f',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                View All <FiArrowRight size={16} />
              </button>
            </div>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              {recentActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: index < recentActivities.length - 1 ? '1px solid #e5e7eb' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div style={{
                    fontSize: '24px',
                    flexShrink: 0
                  }}>
                    {getActivityIcon(activity.activityType)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                      {activity.description}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {activity.vendorName} • {formatDate(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  )
}
