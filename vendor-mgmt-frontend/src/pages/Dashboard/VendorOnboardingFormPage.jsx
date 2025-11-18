import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import vendorService from '../../services/vendorService';

export default function VendorOnboardingFormPage() {
  const navigate = useNavigate();
  const businessFileRef = useRef(null);
  const complianceFileRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Business Details
    legalBusinessName: '',
    businessRegistrationNumber: '',
    businessType: '',
    yearEstablished: '',
    businessAddress: '',
    numberOfEmployees: '',
    industrySector: '',
    
    // Contact Details
    primaryContactName: '',
    jobTitle: '',
    emailAddress: '',
    phoneNumber: '',
    secondaryContactName: '',
    secondaryContactEmail: '',
    website: '',
    
    // Banking & Payment
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    accountType: '',
    routingSwiftCode: '',
    iban: '',
    paymentTerms: '',
    currency: '',
    
    // Compliance & Certifications
    taxIdentificationNumber: '',
    businessLicenseNumber: '',
    licenseExpiryDate: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceExpiryDate: '',
    industryCertifications: '',
    
    // Files
    businessDetailsFile: null,
    complianceFile: null
  });

  const [errors, setErrors] = useState({});

  // Check if vendor is authenticated
  React.useEffect(() => {
    const vendorToken = localStorage.getItem('vendorAuthToken');
    if (!vendorToken) {
      toast.error('Please login first');
      navigate('/vendor-login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, [fieldName]: file }));
      
      if (errors[fieldName]) {
        setErrors(prev => ({ ...prev, [fieldName]: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Business Details - Required
    if (!formData.legalBusinessName.trim()) newErrors.legalBusinessName = 'Legal business name is required';
    if (!formData.businessRegistrationNumber.trim()) newErrors.businessRegistrationNumber = 'Registration number is required';
    if (!formData.businessType) newErrors.businessType = 'Business type is required';
    if (!formData.yearEstablished) {
      newErrors.yearEstablished = 'Year established is required';
    } else {
      const year = parseInt(formData.yearEstablished, 10);
      if (isNaN(year) || year < 1800 || year > new Date().getFullYear()) {
        newErrors.yearEstablished = `Year must be between 1800 and ${new Date().getFullYear()}`;
      }
    }
    if (!formData.businessAddress.trim()) newErrors.businessAddress = 'Business address is required';
    if (!formData.numberOfEmployees) newErrors.numberOfEmployees = 'Number of employees is required';
    
    // Contact Details - Required
    if (!formData.primaryContactName.trim()) newErrors.primaryContactName = 'Primary contact name is required';
    if (!formData.emailAddress.trim()) {
      newErrors.emailAddress = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      newErrors.emailAddress = 'Invalid email format';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[+]?[0-9]{10,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number (10-15 digits, optional +)';
    }
    
    // Banking - Required
    if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
    if (!formData.accountHolderName.trim()) newErrors.accountHolderName = 'Account holder name is required';
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
    if (!formData.accountType) newErrors.accountType = 'Account type is required';
    
    // Compliance - Required
    if (!formData.taxIdentificationNumber.trim()) newErrors.taxIdentificationNumber = 'Tax ID is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      // Get invitation token from localStorage
      const invitationToken = localStorage.getItem('invitationToken');
      if (!invitationToken) {
        toast.error('Invitation token not found. Please use the invitation link.');
        navigate('/vendor-login');
        return;
      }

      // Create FormData for multipart/form-data submission
      const submitData = new FormData();
      
      // Append all form fields with proper type conversion
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== null && value !== '' && value !== undefined &&
            key !== 'businessDetailsFile' && key !== 'complianceFile') {
          // Convert yearEstablished to integer
          if (key === 'yearEstablished') {
            submitData.append(key, parseInt(value, 10));
          } else {
            submitData.append(key, value);
          }
        }
      });
      
      // Add invitation token
      submitData.append('invitationToken', invitationToken);
      
      // Append files if present
      if (formData.businessDetailsFile) {
        submitData.append('businessDetailsFile', formData.businessDetailsFile);
      }
      
      if (formData.complianceFile) {
        submitData.append('complianceFile', formData.complianceFile);
      }

      const response = await vendorService.submitOnboarding(submitData);
      
      if (response.success) {
        toast.success('Onboarding form submitted successfully!');
        
        // Clear vendor auth data
        localStorage.removeItem('vendorAuthToken');
        localStorage.removeItem('vendorEmail');
        localStorage.removeItem('vendorRole');
        
        // Show success message and redirect
        setTimeout(() => {
          navigate('/vendor-onboarding-success');
        }, 1500);
      } else {
        toast.error(response.message || 'Failed to submit onboarding form');
      }
    } catch (err) {
      console.error('Error submitting onboarding form:', err);
      toast.error(
        err.response?.data?.message || 
        'Failed to submit onboarding form. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  const errorInputStyle = {
    ...inputStyle,
    border: '2px solid #dc2626'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a5f3f, #013d1f)',
      padding: '50px 20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        padding: '40px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/Logo.png" alt="Logo" style={{ width: 100, height: 'auto', marginBottom: 16 }} />
          <h1 style={{ margin: '0 0 8px', fontSize: 32, color: '#0c6f3e' }}>
            Vendor Onboarding Form
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
            Please provide complete and accurate information for onboarding
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Business Information Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, color: '#0c6f3e', marginBottom: 20, borderBottom: '2px solid #0c6f3e', paddingBottom: 8 }}>
              Business Information
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {/* Legal Business Name */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Legal Business Name *
                </label>
                <input
                  name="legalBusinessName"
                  value={formData.legalBusinessName}
                  onChange={handleChange}
                  style={errors.legalBusinessName ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                />
                {errors.legalBusinessName && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.legalBusinessName}</p>}
              </div>

              {/* Business Registration Number */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Business Registration Number *
                </label>
                <input
                  name="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={handleChange}
                  style={errors.businessRegistrationNumber ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                />
                {errors.businessRegistrationNumber && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.businessRegistrationNumber}</p>}
              </div>

              {/* Business Type */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Business Type *
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  style={errors.businessType ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Limited Liability Company">Limited Liability Company (LLC)</option>
                  <option value="Corporation">Corporation</option>
                  <option value="Cooperative">Cooperative</option>
                </select>
                {errors.businessType && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.businessType}</p>}
              </div>

              {/* Year Established */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Year Established *
                </label>
                <input
                  type="number"
                  name="yearEstablished"
                  value={formData.yearEstablished}
                  onChange={handleChange}
                  min="1800"
                  max={new Date().getFullYear()}
                  style={errors.yearEstablished ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                />
                {errors.yearEstablished && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.yearEstablished}</p>}
              </div>

              {/* Number of Employees */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Number of Employees *
                </label>
                <select
                  name="numberOfEmployees"
                  value={formData.numberOfEmployees}
                  onChange={handleChange}
                  style={errors.numberOfEmployees ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
                {errors.numberOfEmployees && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.numberOfEmployees}</p>}
              </div>

              {/* Industry Sector */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Industry Sector *
                </label>
                <input
                  name="industrySector"
                  value={formData.industrySector}
                  onChange={handleChange}
                  placeholder="e.g., IT, Manufacturing, Construction"
                  style={errors.industrySector ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                />
                {errors.industrySector && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.industrySector}</p>}
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, color: '#0c6f3e', marginBottom: 20, borderBottom: '2px solid #0c6f3e', paddingBottom: 8 }}>
              Address Information
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
              {/* Business Address */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Business Address *
                </label>
                <textarea
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  placeholder="Complete business address with street, city, state, postal code, country"
                  rows="3"
                  style={{ ...inputStyle, resize: 'vertical', border: errors.businessAddress ? '2px solid #dc2626' : '1px solid #d1d5db' }}
                  disabled={loading}
                  required
                />
                {errors.businessAddress && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.businessAddress}</p>}
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, color: '#0c6f3e', marginBottom: 20, borderBottom: '2px solid #0c6f3e', paddingBottom: 8 }}>
              Contact Information
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {/* Primary Contact Name */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Primary Contact Name *
                </label>
                <input
                  name="primaryContactName"
                  value={formData.primaryContactName}
                  onChange={handleChange}
                  placeholder="Full name"
                  style={errors.primaryContactName ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                />
                {errors.primaryContactName && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.primaryContactName}</p>}
              </div>

              {/* Job Title */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Job Title
                </label>
                <input
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="e.g., CEO, Manager"
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              {/* Email Address */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleChange}
                  placeholder="contact@company.com"
                  style={errors.emailAddress ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                />
                {errors.emailAddress && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.emailAddress}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g., 1234567890 or +1234567890"
                  style={errors.phoneNumber ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                />
                {errors.phoneNumber && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.phoneNumber}</p>}
              </div>

              {/* Secondary Contact Name */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Secondary Contact Name
                </label>
                <input
                  name="secondaryContactName"
                  value={formData.secondaryContactName}
                  onChange={handleChange}
                  placeholder="Optional"
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              {/* Secondary Contact Email */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Secondary Contact Email
                </label>
                <input
                  type="email"
                  name="secondaryContactEmail"
                  value={formData.secondaryContactEmail}
                  onChange={handleChange}
                  placeholder="Optional"
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              {/* Website */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://www.company.com"
                  style={inputStyle}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Banking & Payment Information Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, color: '#0c6f3e', marginBottom: 20, borderBottom: '2px solid #0c6f3e', paddingBottom: 8 }}>
              Banking & Payment Information
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {/* Bank Name */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Bank Name *
                </label>
                <input
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="e.g., Chase Bank"
                  style={errors.bankName ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                />
                {errors.bankName && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.bankName}</p>}
              </div>

              {/* Account Holder Name */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Account Holder Name *
                </label>
                <input
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  placeholder="As per bank records"
                  style={errors.accountHolderName ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                />
                {errors.accountHolderName && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.accountHolderName}</p>}
              </div>

              {/* Account Number */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Account Number *
                </label>
                <input
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="Bank account number"
                  style={errors.accountNumber ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                />
                {errors.accountNumber && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.accountNumber}</p>}
              </div>

              {/* Account Type */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Account Type *
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  style={errors.accountType ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="Checking">Checking</option>
                  <option value="Savings">Savings</option>
                  <option value="Business">Business</option>
                </select>
                {errors.accountType && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.accountType}</p>}
              </div>

              {/* Routing/SWIFT Code */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Routing/SWIFT Code
                </label>
                <input
                  name="routingSwiftCode"
                  value={formData.routingSwiftCode}
                  onChange={handleChange}
                  placeholder="For international transfers"
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              {/* IBAN */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  IBAN
                </label>
                <input
                  name="iban"
                  value={formData.iban}
                  onChange={handleChange}
                  placeholder="International Bank Account Number"
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Payment Terms
                </label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={loading}
                >
                  <option value="">-- Select --</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Net 90">Net 90</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={loading}
                >
                  <option value="">-- Select --</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>
            </div>
          </div>

          {/* Compliance & Certifications Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, color: '#0c6f3e', marginBottom: 20, borderBottom: '2px solid #0c6f3e', paddingBottom: 8 }}>
              Compliance & Certifications
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {/* Tax ID */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Tax Identification Number *
                </label>
                <input
                  name="taxIdentificationNumber"
                  value={formData.taxIdentificationNumber}
                  onChange={handleChange}
                  placeholder="Tax ID"
                  style={errors.taxIdentificationNumber ? errorInputStyle : inputStyle}
                  disabled={loading}
                  required
                />
                {errors.taxIdentificationNumber && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.taxIdentificationNumber}</p>}
              </div>

              {/* Business License Number */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Business License Number
                </label>
                <input
                  name="businessLicenseNumber"
                  value={formData.businessLicenseNumber}
                  onChange={handleChange}
                  placeholder="License number"
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              {/* License Expiry Date */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  License Expiry Date
                </label>
                <input
                  type="date"
                  name="licenseExpiryDate"
                  value={formData.licenseExpiryDate}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              {/* Insurance Provider */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Insurance Provider
                </label>
                <input
                  name="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={handleChange}
                  placeholder="Insurance company name"
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              {/* Insurance Policy Number */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Insurance Policy Number
                </label>
                <input
                  name="insurancePolicyNumber"
                  value={formData.insurancePolicyNumber}
                  onChange={handleChange}
                  placeholder="Policy number"
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              {/* Insurance Expiry Date */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Insurance Expiry Date
                </label>
                <input
                  type="date"
                  name="insuranceExpiryDate"
                  value={formData.insuranceExpiryDate}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              {/* Industry Certifications */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Industry Certifications
                </label>
                <textarea
                  name="industryCertifications"
                  value={formData.industryCertifications}
                  onChange={handleChange}
                  placeholder="List any relevant certifications (ISO, quality standards, etc.)"
                  rows="2"
                  style={{ ...inputStyle, resize: 'vertical' }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Document Uploads Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, color: '#0c6f3e', marginBottom: 20, borderBottom: '2px solid #0c6f3e', paddingBottom: 8 }}>
              Document Uploads
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {/* Business Details File */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Business Details Document
                </label>
                <input
                  ref={businessFileRef}
                  type="file"
                  onChange={(e) => handleFileChange(e, 'businessDetailsFile')}
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => businessFileRef.current?.click()}
                  disabled={loading}
                  style={{
                    ...inputStyle,
                    cursor: 'pointer',
                    background: '#f9fafb',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: 13, color: formData.businessDetailsFile ? '#059669' : '#6b7280' }}>
                    {formData.businessDetailsFile ? `✓ ${formData.businessDetailsFile.name}` : 'Click to upload (PDF, DOC, DOCX)'}
                  </span>
                  <span style={{ fontSize: 18 }}>📎</span>
                </button>
              </div>

              {/* Compliance File */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Compliance Document
                </label>
                <input
                  ref={complianceFileRef}
                  type="file"
                  onChange={(e) => handleFileChange(e, 'complianceFile')}
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => complianceFileRef.current?.click()}
                  disabled={loading}
                  style={{
                    ...inputStyle,
                    cursor: 'pointer',
                    background: '#f9fafb',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: 13, color: formData.complianceFile ? '#059669' : '#6b7280' }}>
                    {formData.complianceFile ? `✓ ${formData.complianceFile.name}` : 'Click to upload (PDF, DOC, DOCX)'}
                  </span>
                  <span style={{ fontSize: 18 }}>📎</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 40px',
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
              {loading ? 'Submitting...' : 'Submit Onboarding Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
