import api from './api';

const vendorService = {
  // Vendor OTP generation
  generateOtp: async (email) => {
    const response = await api.post('/vendor/otp/generate', { email });
    return response.data;
  },

  validateInvitation: async (token) => {
    const response = await api.get('/vendor/invite/validate', {
      params: { token }
    });
    return response.data;
  },

  // Vendor OTP verification
  verifyOtp: async (email, otpCode) => {
    const response = await api.post('/vendor/otp/verify', { email, otpCode });
    return response.data;
  },

  // Vendor onboarding submission
  submitOnboarding: async (formData) => {
    const response = await api.post('/vendor/onboarding', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get vendor by email
  getVendorByEmail: async (email) => {
    const response = await api.get(`/vendor/by-email`, {
      params: { email }
    });
    return response.data;
  },

  // Get onboarding data by vendor request ID
  getOnboardingByRequestId: async (requestId) => {
    const response = await api.get(`/vendor/onboarding/${requestId}`);
    return response.data;
  },
};

export default vendorService;
