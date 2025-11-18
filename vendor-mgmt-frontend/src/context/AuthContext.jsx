import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('AuthContext: User authenticated from localStorage:', parsedUser.username || parsedUser.email);
      } catch (error) {
        console.error('AuthContext: Error parsing user info:', error);
        logout();
      }
    } else {
      console.log('AuthContext: No auth token found in localStorage');
    }
    setLoading(false);
  }, []);

  const login = (token, userInfo) => {
    console.log('AuthContext.login: Setting authenticated state');
    localStorage.setItem('authToken', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('isAuthenticated', 'true');
    setUser(userInfo);
    setIsAuthenticated(true);
    setLoading(false); // Ensure loading is false after login
    console.log('AuthContext.login: State updated - isAuthenticated: true, token:', token.substring(0, 20) + '...');
    
    // Return a promise that resolves after state is set
    return Promise.resolve();
  };

  const logout = async () => {
    try {
      // Call backend logout API to revoke refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const authService = (await import('../services/authService')).default;
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local storage and state
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('dummyUser');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
      console.log('AuthContext: User logged out');
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('userInfo', JSON.stringify(updatedUser));
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    updateUser,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
