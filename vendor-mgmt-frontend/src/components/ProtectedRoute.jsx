import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Check localStorage as a fallback for immediate auth status
  const token = localStorage.getItem('authToken');
  const storedAuth = localStorage.getItem('isAuthenticated') === 'true';

  console.log('ProtectedRoute check:', {
    path: location.pathname,
    loading,
    isAuthenticated,
    hasToken: !!token,
    storedAuth
  });

  if (loading) {
    console.log('ProtectedRoute: Still loading, showing loading screen');
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  // Allow access if either:
  // 1. Context says authenticated, OR
  // 2. We have a valid token in localStorage (even if context state hasn't updated yet)
  const shouldAllowAccess = isAuthenticated || (token && storedAuth);

  if (!shouldAllowAccess) {
    console.log('ProtectedRoute: Access DENIED - redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  console.log('ProtectedRoute: Access GRANTED - rendering protected content');
  return children;
}
