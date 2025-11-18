import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DUMMY_VENDORS } from '../data/vendors';
import procurementService from '../services/procurementService';

const VendorsContext = createContext();

export function VendorsProvider({ children }) {
  const [vendors, setVendors] = useState(() => {
    try {
      const stored = localStorage.getItem('vendorsData');
      if (stored) return JSON.parse(stored);
    } catch (e) { /* ignore */ }
    return DUMMY_VENDORS.slice();
  });

  useEffect(() => {
    try { localStorage.setItem('vendorsData', JSON.stringify(vendors)); } catch (e) { /* ignore */ }
  }, [vendors]);

  const addVendor = useCallback(async (vendorData) => {
    try {
      const response = await procurementService.createVendorRequest(vendorData);
      if (response.success && response.data) {
        // Add the vendor to local state with the backend response data
        const newVendor = {
          id: response.data.id,
          name: response.data.vendorName,
          email: response.data.vendorEmail,
          contactPerson: response.data.contactPerson,
          contactNumber: response.data.contactNumber,
          category: response.data.vendorCategory,
          remarks: response.data.remarks,
          status: response.data.status || 'Pending',
          address: '-',
          contact: response.data.contactNumber,
        };
        setVendors(prev => [...prev, newVendor]);
        return { success: true, data: response.data };
      }
      // Return the full response including any validation error details
      return { 
        success: false, 
        message: response.message || 'Failed to create vendor request',
        data: response.data // Include validation errors if present
      };
    } catch (error) {
      console.error('Error creating vendor request:', error);
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        return { success: false, message: 'Authentication required. Please login again.', authError: true };
      }
      // Check if backend returned validation errors or other error details
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Failed to create vendor request',
          data: error.response.data.data // Pass validation errors if present
        };
      }
      return { success: false, message: error.response?.data?.message || error.message || 'Failed to create vendor request' };
    }
  }, []);

  const updateVendor = useCallback((vendorId, patch) => {
    setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, ...patch } : v));
  }, []);

  const getVendor = useCallback((vendorId) => vendors.find(v => v.id === vendorId), [vendors]);

  return (
    <VendorsContext.Provider value={{ vendors, addVendor, updateVendor, getVendor }}>
      {children}
    </VendorsContext.Provider>
  );
}

export function useVendors() {
  const ctx = useContext(VendorsContext);
  if (!ctx) throw new Error('useVendors must be used within VendorsProvider');
  return ctx;
}
