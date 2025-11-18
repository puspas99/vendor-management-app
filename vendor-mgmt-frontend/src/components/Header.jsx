import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { FiUser, FiSettings, FiLogOut, FiChevronDown, FiHelpCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    if (loggingOut) return;
    
    setLoggingOut(true);
    setShowDropdown(false);
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed, but you will be redirected');
      navigate('/login', { replace: true });
    }
  };

  const getUserInitials = () => {
    if (!user?.username) return 'U';
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      marginLeft: '260px'
    }}>
      {/* Left side - Vendor Management branding */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          paddingRight: '16px',
          borderRight: '2px solid #e5e7eb'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #0a5f3f 0%, #0c6f3e 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>
            VM
          </div>
          <div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '700', 
              color: '#0c6f3e',
              lineHeight: 1.2
            }}>
              Vendor Management System
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              marginTop: '2px'
            }}>
              Streamline Your Procurement Process
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Notification Bell and User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <NotificationBell />
        
        {/* User Profile Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            {/* User Avatar */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {getUserInitials()}
            </div>
            
            {/* User Name */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                {user?.username || 'User'}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {user?.role || 'Procurement'}
              </div>
            </div>
            
            <FiChevronDown 
              size={16} 
              style={{ 
                color: '#6b7280',
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s'
              }} 
            />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '8px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: '200px',
              overflow: 'hidden',
              zIndex: 1000
            }}>
              <div
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/settings');
                }}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '14px',
                  color: '#1f2937'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <FiUser size={16} />
                <span>Profile</span>
              </div>

              <div
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/settings');
                }}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '14px',
                  color: '#1f2937'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <FiSettings size={16} />
                <span>Settings</span>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', margin: '4px 0' }} />

              <div
                onClick={handleLogout}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: loggingOut ? 'wait' : 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '14px',
                  color: '#ef4444',
                  opacity: loggingOut ? 0.6 : 1
                }}
                onMouseEnter={(e) => !loggingOut && (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <FiLogOut size={16} />
                <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Help Icon */}
        <button
          onClick={() => navigate('/help')}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'white',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            color: '#6b7280'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f9fafb';
            e.currentTarget.style.color = '#0c6f3e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#6b7280';
          }}
          title="Help & Support"
        >
          <FiHelpCircle size={20} />
        </button>
      </div>
    </header>
  );
}
