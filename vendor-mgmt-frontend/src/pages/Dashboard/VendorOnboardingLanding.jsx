import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import vendorService from '../../services/vendorService';

/**
 * Vendor Onboarding Landing Page
 * This page is accessed via the secure link sent in the invitation email
 * It validates the token, shows vendor details, and handles OTP verification
 */
export default function VendorOnboardingLanding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const otpSentParam = searchParams.get('otpSent') === 'true';
  
  const [loading, setLoading] = useState(true);
  const [validatingToken, setValidatingToken] = useState(true);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [otpSent, setOtpSent] = useState(otpSentParam);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  // Validate invitation token on load
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setValidatingToken(false);
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await vendorService.validateInvitation(token);
      
      if (response.success && response.data) {
        setVendorInfo(response.data);
        setError('');
        
        // If OTP was already sent (via backend redirect), show OTP input
        if (otpSentParam) {
          toast.success('OTP has been sent to your email!');
        }
      } else {
        setError(response.message || 'Invalid invitation token');
      }
    } catch (err) {
      console.error('Error validating token:', err);
      setError(
        err.response?.data?.message || 
        'This invitation link is invalid or has expired. Please contact the procurement team.'
      );
    } finally {
      setValidatingToken(false);
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!vendorInfo?.vendorEmail) {
      toast.error('Vendor email not found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await vendorService.generateOtp(vendorInfo.vendorEmail);
      
      if (response.success) {
        toast.success('OTP sent to your email!');
        setOtpSent(true);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(
        err.response?.data?.message || 
        'Failed to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifying(true);

    try {
      const response = await vendorService.verifyOtp(vendorInfo.vendorEmail, otp);
      
      if (response.success && response.data) {
        const { token: authToken, email: vendorEmail, role } = response.data;
        
        // Store vendor auth token and email
        localStorage.setItem('vendorAuthToken', authToken);
        localStorage.setItem('vendorEmail', vendorEmail);
        localStorage.setItem('vendorRole', role);
        localStorage.setItem('invitationToken', token);
        
        toast.success('Verification successful! Redirecting to onboarding form...');
        
        // Redirect to vendor onboarding form
        setTimeout(() => {
          navigate('/vendor-onboarding-form');
        }, 1000);
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(
        err.response?.data?.message || 
        'Invalid OTP or OTP has expired. Please try again.'
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    await handleSendOTP();
  };

  // Loading state
  if (loading || validatingToken) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Validating your invitation...</p>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired token)
  if (error && !vendorInfo) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={styles.errorTitle}>Invalid Invitation</h2>
          <p style={styles.errorText}>{error}</p>
          <p style={styles.helpText}>
            Please contact the procurement team for a new invitation link.
          </p>
        </div>
      </div>
    );
  }

  // Main content - show vendor info and OTP verification
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Onboarding Invitation</h1>
          <p style={styles.subtitle}>Complete your onboarding process</p>
        </div>

        {/* Vendor Information */}
        {vendorInfo && (
          <div style={styles.infoSection}>
            <h3 style={styles.infoTitle}>Invitation Details</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Vendor Name:</span>
                <span style={styles.infoValue}>{vendorInfo.vendorName}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Email:</span>
                <span style={styles.infoValue}>{vendorInfo.vendorEmail}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Contact Person:</span>
                <span style={styles.infoValue}>{vendorInfo.contactPerson}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Category:</span>
                <span style={styles.infoValue}>{vendorInfo.vendorCategory}</span>
              </div>
            </div>
          </div>
        )}

        <div style={styles.divider}></div>

        {/* OTP Verification Section */}
        {!otpSent ? (
          <div style={styles.otpSection}>
            <h3 style={styles.sectionTitle}>Email Verification Required</h3>
            <p style={styles.sectionText}>
              To proceed with your onboarding, we need to verify your email address.
              Click the button below to receive a one-time password (OTP).
            </p>
            <button
              onClick={handleSendOTP}
              disabled={loading}
              style={styles.sendButton}
            >
              {loading ? 'Sending...' : 'Send OTP to My Email'}
            </button>
          </div>
        ) : (
          <div style={styles.otpSection}>
            <h3 style={styles.sectionTitle}>Enter Your OTP</h3>
            <p style={styles.sectionText}>
              We've sent a 6-digit verification code to <strong>{vendorInfo?.vendorEmail}</strong>
            </p>
            
            <form onSubmit={handleVerifyOTP} style={styles.form}>
              <div style={styles.formGroup}>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                    setError('');
                  }}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  style={styles.otpInput}
                  autoFocus
                />
              </div>

              {error && (
                <div style={styles.errorMessage}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={verifying || otp.length !== 6}
                style={{
                  ...styles.verifyButton,
                  ...(verifying || otp.length !== 6 ? styles.disabledButton : {})
                }}
              >
                {verifying ? 'Verifying...' : 'Verify OTP & Continue'}
              </button>

              <div style={styles.resendSection}>
                <span style={styles.resendText}>Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  style={styles.resendButton}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Help Section */}
        <div style={styles.helpSection}>
          <p style={styles.helpText}>
            <strong>Note:</strong> The OTP will expire in 5 minutes. If you encounter any issues,
            please contact our procurement team.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxWidth: '600px',
    width: '100%',
    padding: '40px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#718096',
  },
  infoSection: {
    marginBottom: '24px',
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '16px',
  },
  infoGrid: {
    display: 'grid',
    gap: '12px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    background: '#f7fafc',
    borderRadius: '8px',
  },
  infoLabel: {
    fontWeight: '500',
    color: '#4a5568',
  },
  infoValue: {
    fontWeight: '600',
    color: '#2d3748',
  },
  divider: {
    height: '1px',
    background: '#e2e8f0',
    margin: '24px 0',
  },
  otpSection: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '12px',
  },
  sectionText: {
    fontSize: '14px',
    color: '#718096',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  sendButton: {
    width: '100%',
    padding: '14px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
  form: {
    marginTop: '20px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  otpInput: {
    width: '100%',
    padding: '16px',
    fontSize: '24px',
    textAlign: 'center',
    letterSpacing: '8px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  verifyButton: {
    width: '100%',
    padding: '14px',
    background: '#48bb78',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
  disabledButton: {
    background: '#cbd5e0',
    cursor: 'not-allowed',
  },
  errorMessage: {
    background: '#fed7d7',
    color: '#c53030',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  resendSection: {
    marginTop: '20px',
    textAlign: 'center',
  },
  resendText: {
    fontSize: '14px',
    color: '#718096',
    marginRight: '8px',
  },
  resendButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  helpSection: {
    marginTop: '24px',
    padding: '16px',
    background: '#edf2f7',
    borderRadius: '8px',
  },
  helpText: {
    fontSize: '13px',
    color: '#4a5568',
    lineHeight: '1.6',
    margin: 0,
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  loadingText: {
    textAlign: 'center',
    color: '#718096',
    fontSize: '16px',
  },
  errorIcon: {
    fontSize: '64px',
    textAlign: 'center',
    marginBottom: '16px',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#c53030',
    textAlign: 'center',
    marginBottom: '12px',
  },
  errorText: {
    fontSize: '16px',
    color: '#718096',
    textAlign: 'center',
    marginBottom: '20px',
  },
};
