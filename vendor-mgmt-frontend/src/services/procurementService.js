import api from './api';

const procurementService = {
  // Create vendor onboarding request (sends invitation email)
  createVendorRequest: async (vendorData) => {
    const response = await api.post('/procurement/vendor/onboarding-request', vendorData);
    return response.data;
  },

  // Get all vendors with optional status filter
  getAllVendors: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/procurement/vendors', { params });
    return response.data;
  },

  // Get vendor by ID
  getVendorById: async (id) => {
    const response = await api.get(`/procurement/vendor/${id}`);
    return response.data;
  },

  // Get vendor onboarding details
  getVendorDetails: async (id) => {
    const response = await api.get(`/procurement/vendor/${id}/details`);
    return response.data;
  },

  // Create follow-up
  createFollowUp: async (vendorId, followUpData) => {
    const response = await api.post(`/procurement/vendor/${vendorId}/follow-up`, followUpData);
    return response.data;
  },

  // Get vendor follow-ups
  getVendorFollowUps: async (vendorId) => {
    const response = await api.get(`/procurement/vendor/${vendorId}/follow-ups`);
    return response.data;
  },

  // Update vendor status
  updateVendorStatus: async (vendorId, status) => {
    const response = await api.put(`/procurement/vendor/${vendorId}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  // Resend invitation
  resendInvitation: async (vendorId) => {
    const response = await api.post(`/procurement/vendor/${vendorId}/resend-invitation`);
    return response.data;
  },

  // Resolve follow-up
  resolveFollowUp: async (followUpId) => {
    const response = await api.put(`/procurement/follow-up/${followUpId}/resolve`);
    return response.data;
  },

  // Soft delete vendor (temporary disable)
  softDeleteVendor: async (vendorId) => {
    const response = await api.delete(`/procurement/vendor/${vendorId}`);
    return response.data;
  },

  // Hard delete vendor (permanent removal)
  hardDeleteVendor: async (vendorId) => {
    const response = await api.delete(`/procurement/vendor/${vendorId}/permanent`);
    return response.data;
  },

  // Restore soft-deleted vendor
  restoreVendor: async (vendorId) => {
    const response = await api.put(`/procurement/vendor/${vendorId}/restore`);
    return response.data;
  },

  // Get deleted vendors
  getDeletedVendors: async () => {
    const response = await api.get('/procurement/vendors/deleted');
    return response.data;
  },

  // Get vendor activity log
  getVendorActivityLog: async (vendorId) => {
    const response = await api.get(`/procurement/vendor/${vendorId}/activity-log`);
    return response.data;
  },

  // Get all activities
  getAllActivities: async () => {
    const response = await api.get('/procurement/activity-log/all');
    return response.data;
  },

  // Export vendors to PDF
  exportVendorsToPDF: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/procurement/vendors/export/pdf', {
      params,
      responseType: 'blob', // Important for file download
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vendors_report_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'PDF exported successfully' };
  },

  // Export detailed vendor report to PDF
  exportDetailedVendorReport: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/procurement/vendors/export/detailed-pdf', {
      params,
      responseType: 'blob', // Important for file download
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vendors_detailed_report_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Detailed report exported successfully' };
  },

  // Get vendor analytics
  getVendorAnalytics: async () => {
    const response = await api.get('/procurement/analytics');
    return response.data;
  },

  // ========== Follow-up Management APIs ==========

  // Get all follow-ups with filters
  getAllFollowUps: async (status = 'ALL', type = 'ALL') => {
    const params = {};
    if (status !== 'ALL') params.status = status;
    if (type !== 'ALL') params.type = type;
    const response = await api.get('/procurement/follow-ups', { params });
    return response.data;
  },

  // ========== Validation APIs ==========

  // Get validation issues for a vendor
  getValidationIssues: async (vendorId) => {
    const response = await api.get(`/procurement/validation/issues/${vendorId}`);
    return response.data;
  },

  // Validate vendor data
  validateVendor: async (vendorId) => {
    const response = await api.post(`/procurement/validation/validate/${vendorId}`);
    return response.data;
  },

  // Resolve validation issue
  resolveValidationIssue: async (issueId, notes) => {
    const response = await api.post(`/procurement/validation/resolve/${issueId}`, { notes });
    return response.data;
  },

  // ========== Template APIs ==========

  // Get follow-up templates
  getFollowUpTemplates: async (type = null, escalationLevel = null) => {
    const params = {};
    if (type) params.type = type;
    if (escalationLevel !== null) params.escalationLevel = escalationLevel;
    const response = await api.get('/procurement/templates/follow-up', { params });
    return response.data;
  },

  // Render template with variables
  renderTemplate: async (data) => {
    const response = await api.post('/procurement/templates/render', data);
    return response.data;
  },

  // ========== AI Message Generation APIs ==========

  // Generate AI follow-up message
  generateAIMessage: async (data) => {
    const response = await api.post('/procurement/ai/generate-message', data);
    return response.data;
  },

  // Create follow-up with AI-generated message
  createAIFollowUp: async (data) => {
    const response = await api.post('/procurement/follow-ups/with-ai', data);
    return response.data;
  },
};

export default procurementService;
