import React from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import styles from './Dashboard.module.css'
import Sidebar from './Sidebar'
import procurementService from '../../services/procurementService'

export default function AddVendor() {
  const navigate = useNavigate()
  const [formData, setFormData] = React.useState({
    vendorName: '',
    vendorEmail: '',
    contactPerson: '',
    contactNumber: '',
    vendorCategory: '',
    remarks: ''
  })

  const [errors, setErrors] = React.useState({})
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if(errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if(!formData.vendorName.trim()) newErrors.vendorName = 'Vendor name is required'
    if(!formData.vendorEmail.trim()) newErrors.vendorEmail = 'Email is required'
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.vendorEmail)) newErrors.vendorEmail = 'Invalid email format'
    if(!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required'
    if(!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required'
    if(!formData.vendorCategory.trim()) newErrors.vendorCategory = 'Category is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if(!validateForm()) {
      toast.error('Please fill all required fields correctly')
      return
    }

    setLoading(true)

    try {
      const response = await procurementService.createVendorRequest(formData)
      
      if (response.success) {
        toast.success('Vendor onboarding request created! Invitation email sent.')
        setShowSuccess(true)
        
        setTimeout(() => {
          navigate('/vendors')
        }, 2000)
      } else {
        toast.error(response.message || 'Failed to create vendor request')
      }
    } catch (err) {
      console.error('Error creating vendor request:', err)
      toast.error(
        err.response?.data?.message || 
        'Failed to create vendor request. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      vendorName: '',
      vendorEmail: '',
      contactPerson: '',
      contactNumber: '',
      vendorCategory: '',
      remarks: ''
    })
    setErrors({})
  }

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Back Button */}
          <div style={{ marginBottom: 25 }}>
            <button className={styles.newBtn} onClick={() => navigate(-1)}>← Back</button>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: 30 }}>
            <h1 className={styles.title}>Create Vendor Onboarding Request</h1>
            <p className={styles.subtitle}>Fill in the form below to send an onboarding invitation to a new vendor</p>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div style={{
              background: '#d4edda',
              color: '#155724',
              padding: '16px 20px',
              borderRadius: '8px',
              marginBottom: 20,
              border: '1px solid #c3e6cb'
            }}>
              ✓ Vendor onboarding request created successfully! Invitation email sent. Redirecting...
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.vendorForm}>
          <div className={styles.formRow}>
            
            {/* Vendor Name */}
            <div className={styles.formCol}>
              <label className={styles.formLabel}>
                Vendor Name *
              </label>
              <input
                type="text"
                name="vendorName"
                value={formData.vendorName}
                onChange={handleChange}
                placeholder="Enter vendor name"
                disabled={loading}
                className={styles.formInput}
                style={{ borderColor: errors.vendorName ? '#dc2626' : undefined }}
              />
              {errors.vendorName && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: 4 }}>{errors.vendorName}</p>}
            </div>

            {/* Email */}
            <div className={styles.formCol}>
              <label className={styles.formLabel}>
                Email *
              </label>
              <input
                type="email"
                name="vendorEmail"
                value={formData.vendorEmail}
                onChange={handleChange}
                placeholder="Enter email address"
                disabled={loading}
                className={styles.formInput}
                style={{ borderColor: errors.vendorEmail ? '#dc2626' : undefined }}
              />
              {errors.vendorEmail && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: 4 }}>{errors.vendorEmail}</p>}
            </div>

          </div>

          <div className={styles.formRow}>
            {/* Contact Person */}
            <div className={styles.formCol}>
              <label className={styles.formLabel}>
                Contact Person *
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="Enter contact person name"
                disabled={loading}
                className={styles.formInput}
                style={{ borderColor: errors.contactPerson ? '#dc2626' : undefined }}
              />
              {errors.contactPerson && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: 4 }}>{errors.contactPerson}</p>}
            </div>

            {/* Contact Number */}
            <div className={styles.formCol}>
              <label className={styles.formLabel}>
                Contact Number *
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="Enter phone number"
                disabled={loading}
                className={styles.formInput}
                style={{ borderColor: errors.contactNumber ? '#dc2626' : undefined }}
              />
              {errors.contactNumber && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: 4 }}>{errors.contactNumber}</p>}
            </div>

          </div>

          <div className={styles.formRow}>
            {/* Category */}
            <div className={styles.formCol}>
              <label className={styles.formLabel}>
                Category *
              </label>
              <select
                name="vendorCategory"
                value={formData.vendorCategory}
                onChange={handleChange}
                disabled={loading}
                className={styles.formInput}
                style={{ borderColor: errors.vendorCategory ? '#dc2626' : undefined, cursor: 'pointer' }}
              >
                <option value="">-- Select Category --</option>
                <option value="IT Services">IT Services</option>
                <option value="Software Development">Software Development</option>
                <option value="Cloud Services">Cloud Services</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Electronics">Electronics</option>
                <option value="Logistics & Transportation">Logistics & Transportation</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Construction">Construction</option>
                <option value="Consulting Services">Consulting Services</option>
                <option value="Marketing & Advertising">Marketing & Advertising</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Packaging Materials">Packaging Materials</option>
                <option value="Cleaning Services">Cleaning Services</option>
                <option value="Security Services">Security Services</option>
                <option value="Facility Management">Facility Management</option>
                <option value="Legal Services">Legal Services</option>
                <option value="Accounting & Finance">Accounting & Finance</option>
                <option value="HR Services">HR Services</option>
                <option value="Training & Development">Training & Development</option>
                <option value="Other">Other</option>
              </select>
              {errors.vendorCategory && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: 4 }}>{errors.vendorCategory}</p>}
            </div>
          </div>

          {/* Remarks - Full Width */}
          <div className={styles.formCol}>
            <label className={styles.formLabel}>
              Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="Add any additional remarks about this vendor"
              rows="4"
              disabled={loading}
              className={styles.formInput}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Form Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: loading ? '#9ca3af' : '#0a5f3f',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'background 0.3s ease'
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = '#084a2e')}
              onMouseOut={(e) => !loading && (e.target.style.background = '#0a5f3f')}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'background 0.3s ease'
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = '#d1d5db')}
              onMouseOut={(e) => !loading && (e.target.style.background = '#e5e7eb')}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.background = '#e5e7eb'
                  e.target.style.borderColor = '#9ca3af'
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.background = '#f3f4f6'
                  e.target.style.borderColor = '#d1d5db'
                }
              }}
            >
              Cancel
            </button>
          </div>
        </form>
        </div>
      </main>
    </div>
  )
}

