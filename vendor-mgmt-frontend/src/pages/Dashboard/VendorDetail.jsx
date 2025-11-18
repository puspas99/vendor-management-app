import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import styles from './Dashboard.module.css'
import Sidebar from './Sidebar'
import procurementService from '../../services/procurementService'
import ValidationIssuesList from './ValidationIssuesList'
import FollowUpTimeline from './FollowUpTimeline'

// Detail Field Component with Follow Up Icon
function DetailField({ label, value, onFollowUp }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <label style={{ fontWeight:600, fontSize:12, color: '#374151' }}>{label}</label>
        <button
          onClick={onFollowUp}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 14,
            cursor: 'pointer',
            padding: '2px 6px',
            color: '#0a5f3f'
          }}
          title="Request Follow Up"
        >
          ℹ️
        </button>
      </div>
      <p style={{ margin: 0, padding: '8px 10px', background: '#f9fafb', borderRadius: 6, fontSize: 13, color: '#1f2937' }}>
        {value || 'N/A'}
      </p>
    </div>
  )
}

// Simpler detail field for onboarding sections
function OnboardingField({ label, value, onFollowUp }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <label style={{ fontWeight:600, fontSize:12 }}>{label}</label>
        <button
          onClick={onFollowUp}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 14,
            cursor: 'pointer',
            padding: '2px 6px',
            color: '#0a5f3f'
          }}
          title="Request Follow Up"
        >
          ℹ️
        </button>
      </div>
      <p style={{ margin: 0, padding: '8px 10px', background: '#f9fafb', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 }}>
        {value || 'N/A'}
      </p>
    </div>
  )
}

export default function VendorDetail(){
  const { vendorId } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = React.useState(true)
  const [showMoveModal, setShowMoveModal] = React.useState(false)
  const [selectedStatus, setSelectedStatus] = React.useState('')
  const [vendorData, setVendorData] = React.useState(null)
  const [vendorDetails, setVendorDetails] = React.useState(null)
  const [followUps, setFollowUps] = React.useState([])
  const [followUpField, setFollowUpField] = React.useState('')
  const [showFollowUpModal, setShowFollowUpModal] = React.useState(false)
  const [followUpForm, setFollowUpForm] = React.useState({
    followUpType: '',
    message: ''
  })

  // Fetch vendor data
  React.useEffect(() => {
    const fetchVendorData = async () => {
      setLoading(true)
      try {
        // Fetch basic vendor info
        const vendorResponse = await procurementService.getVendorById(vendorId)
        if (vendorResponse.success && vendorResponse.data) {
          setVendorData(vendorResponse.data)
          setSelectedStatus(vendorResponse.data.status)
        }

        // Fetch vendor onboarding details (if submitted)
        try {
          const detailsResponse = await procurementService.getVendorDetails(vendorId)
          if (detailsResponse.success && detailsResponse.data) {
            setVendorDetails(detailsResponse.data)
          }
        } catch (err) {
          // Details might not exist yet - vendor hasn't filled onboarding form
          console.log('Vendor details not available yet')
        }

        // Fetch follow-ups
        try {
          const followUpsResponse = await procurementService.getVendorFollowUps(vendorId)
          if (followUpsResponse.success && followUpsResponse.data) {
            setFollowUps(followUpsResponse.data)
          }
        } catch (err) {
          console.log('No follow-ups available')
        }

      } catch (err) {
        console.error('Error fetching vendor:', err)
        toast.error(err.response?.data?.message || 'Failed to load vendor data')
      } finally {
        setLoading(false)
      }
    }

    if (vendorId) {
      fetchVendorData()
    }
  }, [vendorId])

  const handleMoveVendor = async () => {
    if (!selectedStatus || !vendorData) return

    try {
      await procurementService.updateVendorStatus(vendorId, selectedStatus)
      setVendorData(prev => ({ ...prev, status: selectedStatus }))
      setShowMoveModal(false)
      toast.success('Vendor status updated successfully')
    } catch (err) {
      console.error('Error updating status:', err)
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleFollowUp = (fieldName) => {
    setFollowUpField(fieldName)
    setShowFollowUpModal(true)
  }

  const handleSendFollowUp = async () => {
    if (!followUpForm.followUpType || !followUpForm.message.trim()) {
      toast.error('Please fill all follow-up fields')
      return
    }

    try {
      const response = await procurementService.createFollowUp(vendorId, {
        followUpType: followUpForm.followUpType,
        message: followUpForm.message,
        fieldsConcerned: followUpField
      })

      if (response.success) {
        toast.success('Follow-up sent successfully')
        setShowFollowUpModal(false)
        setFollowUpForm({ followUpType: '', message: '' })
        setFollowUpField('')
        
        // Refresh follow-ups
        const followUpsResponse = await procurementService.getVendorFollowUps(vendorId)
        if (followUpsResponse.success && followUpsResponse.data) {
          setFollowUps(followUpsResponse.data)
        }
      }
    } catch (err) {
      console.error('Error sending follow-up:', err)
      toast.error(err.response?.data?.message || 'Failed to send follow-up')
    }
  }

  const handleResendInvitation = async () => {
    try {
      await procurementService.resendInvitation(vendorId)
      toast.success('Invitation resent successfully')
    } catch (err) {
      console.error('Error resending invitation:', err)
      toast.error(err.response?.data?.message || 'Failed to resend invitation')
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          <h1 className={styles.title}>Loading...</h1>
        </main>
      </div>
    )
  }
  
  if (!vendorData) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          <h1 className={styles.title}>Vendor Not Found</h1>
          <p className={styles.subtitle}>The vendor you are looking for does not exist.</p>
          <button className={styles.newBtn} onClick={() => navigate(-1)}>Go Back</button>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 20px' }}>
        {/* Back Button */}
        <div style={{ marginBottom: 20 }}>
          <button className={styles.newBtn} onClick={() => navigate(-1)}>← Back</button>
        </div>

        {/* Vendor Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
          <div>
            <h1 className={styles.title} style={{ marginBottom: 4 }}>{vendorData.vendorName || 'Vendor'}</h1>
            <p className={styles.subtitle} style={{ margin: 0 }}>Vendor ID: {vendorData.id}</p>
          </div>
          <span className={styles.vendorStatus} style={{ padding: '8px 14px', fontSize: 13 }}>
            {vendorData.status || 'Pending'}
          </span>
        </div>

        {/* Basic Vendor Information */}
        <div style={{ marginBottom: 25, background:'#fff', padding:16, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 18, color: '#0c6f3e', marginBottom: 16, marginTop: 0 }}>Basic Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <DetailField 
              label="Vendor Name" 
              value={vendorData.vendorName}
              onFollowUp={() => handleFollowUp('Vendor Name')}
            />
            <DetailField 
              label="Vendor Email" 
              value={vendorData.vendorEmail}
              onFollowUp={() => handleFollowUp('Vendor Email')}
            />
            <DetailField 
              label="Contact Person" 
              value={vendorData.contactPerson}
              onFollowUp={() => handleFollowUp('Contact Person')}
            />
            <DetailField 
              label="Contact Number" 
              value={vendorData.contactNumber}
              onFollowUp={() => handleFollowUp('Contact Number')}
            />
            <DetailField 
              label="Vendor Category" 
              value={vendorData.vendorCategory}
              onFollowUp={() => handleFollowUp('Vendor Category')}
            />
            <DetailField 
              label="Address" 
              value={vendorData.address}
              onFollowUp={() => handleFollowUp('Address')}
            />
          </div>
          {vendorData.remarks && (
            <div style={{ marginTop: 16 }}>
              <div>
                <label style={{ fontWeight:600, fontSize:12, color: '#374151', display: 'block', marginBottom: 5 }}>Remarks</label>
                <p style={{ margin: 0, padding: '8px 10px', background: '#f9fafb', borderRadius: 6, fontSize: 13, color: '#1f2937' }}>
                  {vendorData.remarks}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Onboarding Details (if available) */}
        {vendorDetails && (
          <>
            {/* Business Details Section */}
            <div style={{ marginBottom: 20, background:'#fff', padding:16, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ margin:0, marginBottom:14, fontSize:18, color: '#0c6f3e' }}>Business Details</h2>
              
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
                <OnboardingField 
                  label="Legal Business Name" 
                  value={vendorDetails.legalBusinessName}
                  onFollowUp={() => handleFollowUp('Legal Business Name')}
                />
                <OnboardingField 
                  label="Registration Number" 
                  value={vendorDetails.businessRegistrationNumber}
                  onFollowUp={() => handleFollowUp('Registration Number')}
                />
                <OnboardingField 
                  label="Business Type" 
                  value={vendorDetails.businessType}
                  onFollowUp={() => handleFollowUp('Business Type')}
                />
                <OnboardingField 
                  label="Year Established" 
                  value={vendorDetails.yearEstablished}
                  onFollowUp={() => handleFollowUp('Year Established')}
                />
                <OnboardingField 
                  label="Number of Employees" 
                  value={vendorDetails.numberOfEmployees}
                  onFollowUp={() => handleFollowUp('Number of Employees')}
                />
                <OnboardingField 
                  label="Industry Sector" 
                  value={vendorDetails.industrySector}
                  onFollowUp={() => handleFollowUp('Industry Sector')}
                />
                <div style={{ gridColumn: '1 / -1' }}>
                  <OnboardingField 
                    label="Business Address" 
                    value={vendorDetails.businessAddress}
                    onFollowUp={() => handleFollowUp('Business Address')}
                  />
                </div>
              </div>
            </div>

            {/* Contact Details Section */}
            <div style={{ marginBottom: 20, background:'#fff', padding:16, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ margin:0, marginBottom:14, fontSize:18, color: '#0c6f3e' }}>Contact Details</h2>
              
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
                <OnboardingField 
                  label="Primary Contact Name" 
                  value={vendorDetails.primaryContactName}
                  onFollowUp={() => handleFollowUp('Primary Contact Name')}
                />
                <OnboardingField 
                  label="Job Title" 
                  value={vendorDetails.jobTitle}
                  onFollowUp={() => handleFollowUp('Job Title')}
                />
                <OnboardingField 
                  label="Email Address" 
                  value={vendorDetails.emailAddress}
                  onFollowUp={() => handleFollowUp('Email Address')}
                />
                <OnboardingField 
                  label="Phone Number" 
                  value={vendorDetails.phoneNumber}
                  onFollowUp={() => handleFollowUp('Phone Number')}
                />
                <OnboardingField 
                  label="Secondary Contact Name" 
                  value={vendorDetails.secondaryContactName}
                  onFollowUp={() => handleFollowUp('Secondary Contact Name')}
                />
                <OnboardingField 
                  label="Secondary Contact Email" 
                  value={vendorDetails.secondaryContactEmail}
                  onFollowUp={() => handleFollowUp('Secondary Contact Email')}
                />
                <OnboardingField 
                  label="Website" 
                  value={vendorDetails.website}
                  onFollowUp={() => handleFollowUp('Website')}
                />
              </div>
            </div>

            {/* Banking Details Section */}
            <div style={{ marginBottom: 20, background:'#fff', padding:16, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ margin:0, marginBottom:14, fontSize:18, color: '#0c6f3e' }}>Banking & Payment Details</h2>
              
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
                <OnboardingField 
                  label="Bank Name" 
                  value={vendorDetails.bankName}
                  onFollowUp={() => handleFollowUp('Bank Name')}
                />
                <OnboardingField 
                  label="Account Holder Name" 
                  value={vendorDetails.accountHolderName}
                  onFollowUp={() => handleFollowUp('Account Holder Name')}
                />
                <OnboardingField 
                  label="Account Number" 
                  value={vendorDetails.accountNumber}
                  onFollowUp={() => handleFollowUp('Account Number')}
                />
                <OnboardingField 
                  label="Account Type" 
                  value={vendorDetails.accountType}
                  onFollowUp={() => handleFollowUp('Account Type')}
                />
                <OnboardingField 
                  label="Routing/SWIFT Code" 
                  value={vendorDetails.routingSwiftCode}
                  onFollowUp={() => handleFollowUp('Routing/SWIFT Code')}
                />
                <OnboardingField 
                  label="IBAN" 
                  value={vendorDetails.iban}
                  onFollowUp={() => handleFollowUp('IBAN')}
                />
                <OnboardingField 
                  label="Payment Terms" 
                  value={vendorDetails.paymentTerms}
                  onFollowUp={() => handleFollowUp('Payment Terms')}
                />
                <OnboardingField 
                  label="Currency" 
                  value={vendorDetails.currency}
                  onFollowUp={() => handleFollowUp('Currency')}
                />
              </div>
            </div>

            {/* Compliance Details Section */}
            <div style={{ marginBottom: 20, background:'#fff', padding:16, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ margin:0, marginBottom:14, fontSize:18, color: '#0c6f3e' }}>Compliance & Certifications</h2>
              
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
                <OnboardingField 
                  label="Tax Identification Number" 
                  value={vendorDetails.taxIdentificationNumber}
                  onFollowUp={() => handleFollowUp('Tax Identification Number')}
                />
                <OnboardingField 
                  label="Business License Number" 
                  value={vendorDetails.businessLicenseNumber}
                  onFollowUp={() => handleFollowUp('Business License Number')}
                />
                <OnboardingField 
                  label="License Expiry Date" 
                  value={vendorDetails.licenseExpiryDate}
                  onFollowUp={() => handleFollowUp('License Expiry Date')}
                />
                <OnboardingField 
                  label="Insurance Provider" 
                  value={vendorDetails.insuranceProvider}
                  onFollowUp={() => handleFollowUp('Insurance Provider')}
                />
                <OnboardingField 
                  label="Insurance Policy Number" 
                  value={vendorDetails.insurancePolicyNumber}
                  onFollowUp={() => handleFollowUp('Insurance Policy Number')}
                />
                <OnboardingField 
                  label="Insurance Expiry Date" 
                  value={vendorDetails.insuranceExpiryDate}
                  onFollowUp={() => handleFollowUp('Insurance Expiry Date')}
                />
                <div style={{ gridColumn: '1 / -1' }}>
                  <OnboardingField 
                    label="Industry Certifications" 
                    value={vendorDetails.industryCertifications}
                    onFollowUp={() => handleFollowUp('Industry Certifications')}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {!vendorDetails && (
          <div style={{ 
            marginBottom: 20, 
            background:'#fef3c7', 
            padding:14, 
            borderRadius:10, 
            border: '1px solid #fbbf24'
          }}>
            <p style={{ margin: 0, color: '#92400e', fontWeight: 600, fontSize: 13 }}>
              ℹ️ Vendor has not yet completed the onboarding form.
            </p>
          </div>
        )}

        {/* Follow-ups Section */}
        <div style={{ marginBottom: 20, background:'#fff', padding:16, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ margin:0, marginBottom:14, fontSize:18, color: '#0c6f3e' }}>Follow-ups</h2>
          {followUps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {followUps.map((followUp, index) => (
                <div key={followUp.id || index} style={{
                  padding: 12,
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <strong style={{ color: '#374151', fontSize: 13 }}>{followUp.followUpType}</strong>
                    <span style={{ 
                      fontSize: 11, 
                      color: followUp.status === 'RESOLVED' ? '#059669' : '#d97706',
                      fontWeight: 600
                    }}>
                      {followUp.status || 'PENDING'}
                    </span>
                  </div>
                  <p style={{ margin: '6px 0', fontSize: 13, color: '#6b7280' }}>
                    {followUp.message}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                    Sent: {new Date(followUp.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: 30,
              textAlign: 'center',
              color: '#9ca3af',
              background: '#f9fafb',
              borderRadius: 8,
              border: '2px dashed #e5e7eb'
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No Follow-ups Yet</div>
              <div style={{ fontSize: 12 }}>Follow-ups will appear here as they are created</div>
            </div>
          )}
        </div>

        {/* Validation Issues */}
        <div style={{ marginBottom: 20 }}>
          <ValidationIssuesList vendorId={vendorId} />
        </div>

        {/* Follow-up Timeline */}
        <div style={{ marginBottom: 20 }}>
          <FollowUpTimeline vendorId={vendorId} />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, marginBottom: 30, flexWrap: 'wrap' }}>
          <button className={styles.newBtn} onClick={() => setShowMoveModal(true)}>
            Change Status
          </button>
          <button className={styles.newBtn} style={{ background: '#0a5f3f' }} onClick={handleResendInvitation}>
            Resend Invitation
          </button>
        </div>

        {/* Move Vendor Modal */}
        {showMoveModal && (
          <div className={styles.modalOverlay} onClick={() => setShowMoveModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setShowMoveModal(false)}>✕</button>
              <h2 style={{ marginTop: 0, marginBottom: 8, color: '#1f2937' }}>Change Vendor Status</h2>
              <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
                Current Status: <strong>{vendorData?.status || 'Unknown'}</strong>
              </p>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                  Select New Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="REQUESTED">Requested - Email sent, vendor hasn't opened link</option>
                  <option value="AWAITING_RESPONSE">Awaiting Response - Vendor opened link but hasn't submitted</option>
                  <option value="MISSING_DATA">Missing Data - Partial or incorrect information</option>
                  <option value="AWAITING_VALIDATION">Awaiting Validation - Submitted, pending review</option>
                  <option value="VALIDATED">Validated - Approved by procurement</option>
                  <option value="DENIED">Denied - Rejected by procurement</option>
                  <option value="DELETED">Deleted - Soft delete (can be restored)</option>
                </select>
                {selectedStatus && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                    {selectedStatus === 'REQUESTED' && '📧 Email sent, vendor hasn\'t opened the link'}
                    {selectedStatus === 'AWAITING_RESPONSE' && '⏳ Vendor opened the link but hasn\'t submitted data'}
                    {selectedStatus === 'MISSING_DATA' && '⚠️ Vendor shared partial or incorrect information'}
                    {selectedStatus === 'AWAITING_VALIDATION' && '🔍 Vendor submitted details, awaiting procurement review'}
                    {selectedStatus === 'VALIDATED' && '✅ Vendor approved by procurement'}
                    {selectedStatus === 'DENIED' && '❌ Vendor rejected by procurement'}
                    {selectedStatus === 'DELETED' && '🗑️ Vendor removed (soft delete)'}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleMoveVendor}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#0a5f3f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Update Status
                </button>
                <button
                  onClick={() => setShowMoveModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Follow-up Modal */}
        {showFollowUpModal && (
          <div className={styles.modalOverlay} onClick={() => setShowFollowUpModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setShowFollowUpModal(false)}>✕</button>
              <h2 style={{ marginTop: 0, marginBottom: 20, color: '#1f2937' }}>
                Send Follow-up for: {followUpField}
              </h2>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                  Issue Type *
                </label>
                <select
                  value={followUpForm.followUpType}
                  onChange={(e) => setFollowUpForm(prev => ({ ...prev, followUpType: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="">-- Select Issue Type --</option>
                  <option value="MISSING_DATA">Missing Data</option>
                  <option value="INCORRECT_DATA">Incorrect Data</option>
                  <option value="INCORRECT_FILE">Incorrect File</option>
                  <option value="DELAYED_RESPONSE">Delayed Response</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                  Message *
                </label>
                <textarea
                  value={followUpForm.message}
                  onChange={(e) => setFollowUpForm(prev => ({ ...prev, message: e.target.value }))}
                  rows="4"
                  placeholder="Enter follow-up message..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleSendFollowUp}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#0a5f3f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Send Follow-up
                </button>
                <button
                  onClick={() => setShowFollowUpModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  )
}
