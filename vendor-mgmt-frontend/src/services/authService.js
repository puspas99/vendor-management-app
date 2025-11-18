import api from './api';

const authService = {
  // Procurement team login
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  // Procurement team registration
  register: async (username, email, password, fullName) => {
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
      fullName,
    });
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Logout
  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },
};

export default authService;
