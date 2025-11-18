import api from './api';

const documentVerificationService = {
  /**
   * Verify business details document against form data
   * @param {FormData} formData - Should contain the document file and business data
   * @returns {Promise} - Verification result with confidence score
   */
  verifyBusinessDetailsDocument: async (document, businessData) => {
    const formData = new FormData();
    formData.append('document', document);
    
    // Append business data fields
    Object.keys(businessData).forEach(key => {
      if (businessData[key] !== null && businessData[key] !== '' && businessData[key] !== undefined) {
        formData.append(key, businessData[key]);
      }
    });

    const response = await api.post('/vendor/document-verification/business-details', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Verify contact details document against form data
   * @param {File} document - The uploaded document file
   * @param {Object} contactData - Contact information to verify
   * @returns {Promise} - Verification result
   */
  verifyContactDetailsDocument: async (document, contactData) => {
    const formData = new FormData();
    formData.append('document', document);
    
    // Append contact data fields
    Object.keys(contactData).forEach(key => {
      if (contactData[key] !== null && contactData[key] !== '' && contactData[key] !== undefined) {
        formData.append(key, contactData[key]);
      }
    });

    const response = await api.post('/vendor/document-verification/contact-details', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Verify banking details document against form data
   * @param {File} document - The uploaded document file
   * @param {Object} bankingData - Banking information to verify
   * @returns {Promise} - Verification result
   */
  verifyBankingDetailsDocument: async (document, bankingData) => {
    const formData = new FormData();
    formData.append('document', document);
    
    // Append banking data fields
    Object.keys(bankingData).forEach(key => {
      if (bankingData[key] !== null && bankingData[key] !== '' && bankingData[key] !== undefined) {
        formData.append(key, bankingData[key]);
      }
    });

    const response = await api.post('/vendor/document-verification/banking-details', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Verify compliance details document against form data
   * @param {File} document - The uploaded document file
   * @param {Object} complianceData - Compliance information to verify
   * @returns {Promise} - Verification result
   */
  verifyComplianceDetailsDocument: async (document, complianceData) => {
    const formData = new FormData();
    formData.append('document', document);
    
    // Append compliance data fields
    Object.keys(complianceData).forEach(key => {
      if (complianceData[key] !== null && complianceData[key] !== '' && complianceData[key] !== undefined) {
        formData.append(key, complianceData[key]);
      }
    });

    const response = await api.post('/vendor/document-verification/compliance-details', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default documentVerificationService;
