import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function VendorOnboardingSuccess() {
  const navigate = useNavigate();

  const handleClose = () => {
    // Clear any vendor-related data from localStorage
    localStorage.removeItem('vendorAuthToken');
    localStorage.removeItem('vendorEmail');
    localStorage.removeItem('vendorRole');
    localStorage.removeItem('invitationToken');
    
    // Navigate to login page
    navigate('/login');
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
        maxWidth: '500px',
        width: '100%',
        padding: '50px 40px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Close X Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1,
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#0a5f3f'}
          onMouseLeave={(e) => e.target.style.color = '#6b7280'}
          title="Close and return to login"
        >
          ✕
        </button>

        {/* Success Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          background: '#d1fae5',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '40px'
        }}>
          ✓
        </div>

        {/* Success Message */}
        <h1 style={{
          margin: '0 0 16px',
          fontSize: 28,
          color: '#0c6f3e',
          fontWeight: 700
        }}>
          Submission Successful!
        </h1>
        
        <p style={{
          margin: '0 0 24px',
          fontSize: 16,
          color: '#374151',
          lineHeight: 1.6
        }}>
          Thank you for completing the vendor onboarding form. Your information has been successfully submitted and is now under review by our procurement team.
        </p>

        <div style={{
          background: '#f0fdf4',
          border: '1px solid #a7f3d0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: 24,
          textAlign: 'left'
        }}>
          <p style={{
            margin: '0 0 8px',
            fontSize: 14,
            color: '#065f46',
            fontWeight: 600
          }}>
            What happens next?
          </p>
          <ul style={{
            margin: 0,
            paddingLeft: 20,
            fontSize: 14,
            color: '#047857',
            lineHeight: 1.8
          }}>
            <li>Our team will review your submission</li>
            <li>We may contact you for additional information if needed</li>
            <li>You'll receive an email with the approval status</li>
            <li>Approved vendors will receive further onboarding instructions</li>
          </ul>
        </div>

        <p style={{
          margin: 0,
          fontSize: 13,
          color: '#6b7280'
        }}>
          If you have any questions, please contact our procurement team.
        </p>

        <div style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '12px 32px',
              background: '#0a5f3f',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.3s ease',
              marginBottom: 12
            }}
            onMouseEnter={(e) => e.target.style.background = '#084d33'}
            onMouseLeave={(e) => e.target.style.background = '#0a5f3f'}
          >
            Close & Return to Login
          </button>
          <p style={{
            margin: 0,
            fontSize: 12,
            color: '#9ca3af'
          }}>
            Click the button above to return to the login page
          </p>
        </div>
      </div>
    </div>
  );
}
