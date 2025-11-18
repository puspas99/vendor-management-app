import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import vendorService from '../../services/vendorService';

export default function VendorOTPLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailFromUrl = searchParams.get('email') || '';
  const tokenFromUrl = searchParams.get('token') || '';
  
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP
  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle token-based auto-login from follow-up email
  useEffect(() => {
    if (tokenFromUrl) {
      handleTokenLogin(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleTokenLogin = async (token) => {
    setLoading(true);
    try {
      // Validate the invitation token and get vendor info
      const response = await vendorService.validateInvitation(token);
      
      if (response.success && response.data) {
        const vendorEmail = response.data.email || response.data.vendorEmail;
        
        if (vendorEmail) {
          // Store vendor email for data loading
          localStorage.setItem('vendorEmail', vendorEmail);
          localStorage.setItem('vendorAuthToken', token);
          
          toast.success('Welcome back! Loading your information...');
          
          // Navigate to the onboarding form
          navigate('/vendor-onboarding-form');
        } else {
          setError('Unable to validate your access. Please use the OTP login below.');
          toast.error('Access validation failed');
        }
      } else {
        setError('Your access link has expired or is invalid. Please use the OTP login below.');
        toast.error('Please login with OTP');
      }
    } catch (err) {
      console.error('Error validating token:', err);
      // Don't expose technical errors to vendors
      setError('Unable to access your account using this link. Please login using OTP below.');
      toast.error('Please login with OTP to continue');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await vendorService.generateOtp(email);
      
      if (response.success) {
        toast.success('OTP sent to your email!');
        setStep(2);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(
        err.response?.data?.message || 
        'Failed to send OTP. Please check your email and try again.'
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

    setLoading(true);

    try {
      const response = await vendorService.verifyOtp(email, otp);
      
      if (response.success && response.data) {
        const { token, email: vendorEmail, role } = response.data;
        
        // Store vendor auth token
        localStorage.setItem('vendorAuthToken', token);
        localStorage.setItem('vendorEmail', vendorEmail);
        localStorage.setItem('vendorRole', role);
        
        toast.success('Login successful!');
        
        // Redirect to vendor onboarding form
        navigate('/vendor-onboarding-form');
      } else {
        setError(response.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(
        err.response?.data?.message || 
        'Invalid or expired OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    setError('');
    setLoading(true);

    try {
      const response = await vendorService.generateOtp(email);
      
      if (response.success) {
        toast.success('New OTP sent to your email!');
      } else {
        toast.error(response.message || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error('Error resending OTP:', err);
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a5f3f, #013d1f)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        maxWidth: '480px',
        width: '100%',
        padding: '40px'
      }}>
        {/* Logo/Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/Logo.png" alt="Logo" style={{ width: 100, height: 'auto', marginBottom: 16 }} />
          <h1 style={{ margin: '0 0 8px', fontSize: 28, color: '#0c6f3e' }}>
            Vendor Onboarding
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
            {step === 1 ? 'Enter your email to receive OTP' : 'Enter the OTP sent to your email'}
          </p>
        </div>

        {/* Step 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 8,
                color: '#374151'
              }}>
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: 20,
                fontSize: 14
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#9ca3af' : '#0a5f3f',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s ease'
              }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 8,
                color: '#374151'
              }}>
                Enter 6-Digit OTP *
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                }}
                placeholder="000000"
                disabled={loading}
                required
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: 20,
                  letterSpacing: '8px',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  fontWeight: 600
                }}
              />
              <p style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: '#6b7280',
                textAlign: 'center'
              }}>
                OTP sent to: <strong>{email}</strong>
              </p>
            </div>

            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: 20,
                fontSize: 14
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#9ca3af' : '#0a5f3f',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s ease',
                marginBottom: 12
              }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0a5f3f',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Resend OTP
              </button>
              <span style={{ margin: '0 8px', color: '#d1d5db' }}>|</span>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Change Email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
