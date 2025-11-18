import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCheck, FiChevronRight, FiChevronLeft, FiSave, FiUpload } from 'react-icons/fi';
import vendorService from '../../services/vendorService';
import documentVerificationService from '../../services/documentVerificationService';
import styles from './VendorOnboardingWizard.module.css';

const STEPS = [
  { id: 1, title: 'Business Details', subtitle: 'Company information' },
  { id: 2, title: 'Contact Details', subtitle: 'Primary & secondary contacts' },
  { id: 3, title: 'Banking & Payment', subtitle: 'Payment information' },
  { id: 4, title: 'Compliance & Certifications', subtitle: 'Legal compliance' }
];

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Partnership',
  'Limited Liability Company (LLC)',
  'Corporation',
  'Cooperative',
  'Non-Profit Organization',
  'Government Entity'
];

const INDUSTRY_SECTORS = [
  'IT Services',
  'Software Development',
  'Cloud Services',
  'Office Supplies',
  'Electronics',
  'Logistics & Transportation',
  'Manufacturing',
  'Construction',
  'Consulting Services',
  'Marketing & Advertising',
  'Raw Materials',
  'Packaging Materials',
  'Cleaning Services',
  'Security Services',
  'Facility Management',
  'Legal Services',
  'Accounting & Finance',
  'HR Services',
  'Training & Development',
  'Other'
];

const ACCOUNT_TYPES = ['Checking', 'Savings', 'Business'];
const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90'];
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' }
];

export default function VendorOnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  
  const businessFileRef = useRef(null);
  const contactFileRef = useRef(null);
  const bankingFileRef = useRef(null);
  const complianceFileRef = useRef(null);

  const [formData, setFormData] = useState({
    // Business Details
    legalBusinessName: '',
    businessRegistrationNumber: '',
    businessType: '',
    yearEstablished: '',
    businessAddress: '',
    numberOfEmployees: '',
    industrySector: '',
    businessDetailsFile: null,
    
    // Contact Details
    primaryContactName: '',
    jobTitle: '',
    emailAddress: '',
    phoneNumber: '',
    secondaryContactName: '',
    secondaryContactEmail: '',
    website: '',
    contactDetailsFile: null,
    
    // Banking & Payment
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    accountType: '',
    routingSwiftCode: '',
    iban: '',
    paymentTerms: '',
    currency: '',
    bankingDetailsFile: null,
    
    // Compliance & Certifications
    taxIdentificationNumber: '',
    businessLicenseNumber: '',
    licenseExpiryDate: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceExpiryDate: '',
    industryCertifications: '',
    complianceDetailsFile: null
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [verificationResults, setVerificationResults] = useState({});
  const [verifyingDocument, setVerifyingDocument] = useState(false);
  const [verificationWarnings, setVerificationWarnings] = useState({});

  // Check authentication and load existing data
  useEffect(() => {
    const vendorToken = localStorage.getItem('vendorAuthToken');
    if (!vendorToken) {
      toast.error('Please login first');
      navigate('/vendor-login');
      return;
    }
    
    // Fetch existing onboarding data if available
    setLoading(true);
    loadExistingData().finally(() => setLoading(false));
  }, [navigate]);

  const loadExistingData = async () => {
    try {
      const vendorEmail = localStorage.getItem('vendorEmail');
      console.log('Loading existing data for vendor email:', vendorEmail);
      
      if (!vendorEmail) {
        // If no email in localStorage, start fresh (don't load draft on first visit)
        console.log('No vendor email found, starting fresh');
        return;
      }

      // Helper function to convert Java LocalDate array to string
      const convertDateToString = (dateValue) => {
        if (!dateValue) return '';
        if (typeof dateValue === 'string') return dateValue;
        if (Array.isArray(dateValue) && dateValue.length >= 3) {
          // Java LocalDate format: [year, month, day]
          const [year, month, day] = dateValue;
          // JavaScript Date months are 0-indexed, Java months are 1-indexed
          const date = new Date(year, month - 1, day);
          return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
        }
        return '';
      };

      // Try to get vendor request ID from email
      console.log('Fetching vendor by email:', vendorEmail);
      const response = await vendorService.getVendorByEmail(vendorEmail);
      console.log('Vendor response:', response);
      
      if (response && response.data) {
        const vendorRequest = response.data;
        console.log('Vendor request ID:', vendorRequest.id);
        
        // Try to load existing onboarding data
        if (vendorRequest.id) {
          console.log('Fetching onboarding data for request ID:', vendorRequest.id);
          const onboardingResponse = await vendorService.getOnboardingByRequestId(vendorRequest.id);
          console.log('Onboarding response:', onboardingResponse);
          
          if (onboardingResponse && onboardingResponse.data) {
            const existingData = onboardingResponse.data;
            console.log('Existing onboarding data found:', existingData);
            
            // Map backend fields to form fields
            const mappedData = {
              legalBusinessName: existingData.legalBusinessName || '',
              businessRegistrationNumber: existingData.businessRegistrationNumber || '',
              businessType: existingData.businessType || '',
              yearEstablished: existingData.yearEstablished || '',
              businessAddress: existingData.businessAddress || '',
              numberOfEmployees: existingData.numberOfEmployees || '',
              industrySector: existingData.industrySector || '',
              
              primaryContactName: existingData.primaryContactName || '',
              jobTitle: existingData.jobTitle || '',
              emailAddress: existingData.emailAddress || vendorEmail, // Use vendorEmail as fallback
              phoneNumber: existingData.phoneNumber || '',
              secondaryContactName: existingData.secondaryContactName || '',
              secondaryContactEmail: existingData.secondaryContactEmail || '',
              website: existingData.website || '',
              
              bankName: existingData.bankName || '',
              accountHolderName: existingData.accountHolderName || '',
              accountNumber: existingData.accountNumber || '',
              accountType: existingData.accountType || '',
              routingSwiftCode: existingData.routingSwiftCode || '',
              iban: existingData.iban || '',
              paymentTerms: existingData.paymentTerms || '',
              currency: existingData.currency || '',
              
              taxIdentificationNumber: existingData.taxIdentificationNumber || '',
              businessLicenseNumber: existingData.businessLicenseNumber || '',
              licenseExpiryDate: convertDateToString(existingData.licenseExpiryDate),
              insuranceProvider: existingData.insuranceProvider || '',
              insurancePolicyNumber: existingData.insurancePolicyNumber || '',
              insuranceExpiryDate: convertDateToString(existingData.insuranceExpiryDate),
              industryCertifications: existingData.industryCertifications || ''
            };
            
            console.log('Mapped data to load into form:', mappedData);
            setFormData(prev => ({ ...prev, ...mappedData }));
            toast.success('Your previously submitted data has been loaded', { duration: 3000 });
            return; // Don't load draft if we found backend data
          } else {
            console.log('No existing onboarding data found in response');
          }
        }
      } else {
        console.log('No vendor request found for email:', vendorEmail);
      }
      
      // If no backend data found, try to at least set the email
      console.log('Setting email from localStorage:', vendorEmail);
      setFormData(prev => ({ ...prev, emailAddress: vendorEmail }));
      
      // Load draft if available
      loadDraftFromLocalStorage();
    } catch (error) {
      console.error('Error loading existing data:', error);
      // If backend fails, try to at least set the email
      const vendorEmail = localStorage.getItem('vendorEmail');
      if (vendorEmail) {
        console.log('Setting email after error:', vendorEmail);
        setFormData(prev => ({ ...prev, emailAddress: vendorEmail }));
      }
    }
  };

  const loadDraftFromLocalStorage = () => {
    const draft = localStorage.getItem('vendorOnboardingDraft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsedDraft }));
        toast.success('Draft loaded successfully', { duration: 2000 });
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [formData]);

  const saveDraft = () => {
    setAutoSaving(true);
    try {
      const draftData = { ...formData };
      // Remove file objects before saving
      delete draftData.businessDetailsFile;
      delete draftData.contactDetailsFile;
      delete draftData.bankingDetailsFile;
      delete draftData.complianceDetailsFile;
      
      localStorage.setItem('vendorOnboardingDraft', JSON.stringify(draftData));
      setTimeout(() => setAutoSaving(false), 1000);
    } catch (error) {
      console.error('Error saving draft:', error);
      setAutoSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF and Word documents are allowed');
        return;
      }
      
      setFormData(prev => ({ ...prev, [fieldName]: file }));
      
      if (errors[fieldName]) {
        setErrors(prev => ({ ...prev, [fieldName]: '' }));
      }

      toast.success(`${file.name} uploaded successfully`);

      // Verify document based on type (supports PDF, DOC, DOCX)
      const supportedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (supportedTypes.includes(file.type)) {
        if (fieldName === 'businessDetailsFile') {
          verifyBusinessDocument(file);
        } else if (fieldName === 'contactDetailsFile') {
          verifyContactDocument(file);
        } else if (fieldName === 'bankingDetailsFile') {
          verifyBankingDocument(file);
        } else if (fieldName === 'complianceDetailsFile') {
          verifyComplianceDocument(file);
        }
      } else if (['businessDetailsFile', 'contactDetailsFile', 'bankingDetailsFile', 'complianceDetailsFile'].includes(fieldName)) {
        toast('Document verification only available for PDF, DOC, and DOCX files', { icon: 'ℹ️' });
      }
    }
  };

  const verifyBusinessDocument = async (file) => {
    setVerifyingDocument(true);
    const verifyToast = toast.loading('Verifying document content...');
    
    try {
      const result = await documentVerificationService.verifyBusinessDetailsDocument(
        file,
        formData
      );

      setVerificationResults(prev => ({ ...prev, businessDetails: result }));

      // Update verification warnings for failed fields
      const newWarnings = {};
      if (result.missingFields && result.missingFields.length > 0) {
        // Map display names to field names
        const fieldMapping = {
          'Legal Business Name': 'legalBusinessName',
          'Registration Number': 'businessRegistrationNumber',
          'Business Type': 'businessType',
          'Year Established': 'yearEstablished',
          'Business Address': 'businessAddress'
        };
        
        result.missingFields.forEach(displayName => {
          const fieldName = fieldMapping[displayName];
          if (fieldName) {
            newWarnings[fieldName] = `Not found in uploaded document`;
          }
        });
      }
      setVerificationWarnings(newWarnings);

      toast.dismiss(verifyToast);

      if (result.verified) {
        if (result.confidenceScore >= 80) {
          toast.success(
            `✓ Document verified! ${result.confidenceScore.toFixed(1)}% match`,
            { duration: 4000, icon: '✅' }
          );
        } else {
          toast.success(
            `Document verified with ${result.confidenceScore.toFixed(1)}% confidence. Check highlighted fields.`,
            { duration: 5000, icon: '⚠️' }
          );
        }
      } else {
        toast.error(
          `Document verification failed: ${result.message}`,
          { duration: 5000 }
        );
      }

      // Show detailed results in console
      console.log('Document Verification Results:', result);
      
    } catch (error) {
      toast.dismiss(verifyToast);
      console.error('Document verification error:', error);
      toast.error('Unable to verify document. You can still proceed with submission.');
    } finally {
      setVerifyingDocument(false);
    }
  };

  const verifyContactDocument = async (file) => {
    setVerifyingDocument(true);
    const verifyToast = toast.loading('Verifying contact document...');
    
    try {
      const result = await documentVerificationService.verifyContactDetailsDocument(
        file,
        formData
      );

      setVerificationResults(prev => ({ ...prev, contactDetails: result }));

      // Update verification warnings for failed fields
      const newWarnings = {};
      if (result.missingFields && result.missingFields.length > 0) {
        const fieldMapping = {
          'Primary Contact Name': 'primaryContactName',
          'Email Address': 'emailAddress',
          'Phone Number': 'phoneNumber',
          'Job Title': 'jobTitle'
        };
        
        result.missingFields.forEach(displayName => {
          const fieldName = fieldMapping[displayName];
          if (fieldName) {
            newWarnings[fieldName] = `Not found in uploaded document`;
          }
        });
      }
      setVerificationWarnings(prev => ({ ...prev, ...newWarnings }));

      toast.dismiss(verifyToast);

      if (result.verified) {
        if (result.confidenceScore >= 80) {
          toast.success(
            `✓ Contact document verified! ${result.confidenceScore.toFixed(1)}% match`,
            { duration: 4000, icon: '✅' }
          );
        } else {
          toast.success(
            `Contact document verified with ${result.confidenceScore.toFixed(1)}% confidence. Check highlighted fields.`,
            { duration: 5000, icon: '⚠️' }
          );
        }
      } else {
        toast.error(
          `Contact document verification failed: ${result.message}`,
          { duration: 5000 }
        );
      }

      console.log('Contact Document Verification Results:', result);
      
    } catch (error) {
      toast.dismiss(verifyToast);
      console.error('Contact document verification error:', error);
      toast.error('Unable to verify document. You can still proceed with submission.');
    } finally {
      setVerifyingDocument(false);
    }
  };

  const verifyBankingDocument = async (file) => {
    setVerifyingDocument(true);
    const verifyToast = toast.loading('Verifying banking document...');
    
    try {
      const result = await documentVerificationService.verifyBankingDetailsDocument(
        file,
        formData
      );

      setVerificationResults(prev => ({ ...prev, bankingDetails: result }));

      const newWarnings = {};
      if (result.missingFields && result.missingFields.length > 0) {
        const fieldMapping = {
          'Bank Name': 'bankName',
          'Account Holder Name': 'accountHolderName',
          'Account Number': 'accountNumber',
          'Routing/SWIFT Code': 'routingSwiftCode'
        };
        
        result.missingFields.forEach(displayName => {
          const fieldName = fieldMapping[displayName];
          if (fieldName) {
            newWarnings[fieldName] = `Not found in uploaded document`;
          }
        });
      }
      setVerificationWarnings(prev => ({ ...prev, ...newWarnings }));

      toast.dismiss(verifyToast);

      if (result.verified) {
        if (result.confidenceScore >= 80) {
          toast.success(
            `✓ Banking document verified! ${result.confidenceScore.toFixed(1)}% match`,
            { duration: 4000, icon: '✅' }
          );
        } else {
          toast.success(
            `Banking document verified with ${result.confidenceScore.toFixed(1)}% confidence. Check highlighted fields.`,
            { duration: 5000, icon: '⚠️' }
          );
        }
      } else {
        toast.error(
          `Banking document verification failed: ${result.message}`,
          { duration: 5000 }
        );
      }

      console.log('Banking Document Verification Results:', result);
      
    } catch (error) {
      toast.dismiss(verifyToast);
      console.error('Banking document verification error:', error);
      toast.error('Unable to verify document. You can still proceed with submission.');
    } finally {
      setVerifyingDocument(false);
    }
  };

  const verifyComplianceDocument = async (file) => {
    setVerifyingDocument(true);
    const verifyToast = toast.loading('Verifying compliance document...');
    
    try {
      const result = await documentVerificationService.verifyComplianceDetailsDocument(
        file,
        formData
      );

      setVerificationResults(prev => ({ ...prev, complianceDetails: result }));

      const newWarnings = {};
      if (result.missingFields && result.missingFields.length > 0) {
        const fieldMapping = {
          'Tax Identification Number': 'taxIdentificationNumber',
          'Business License Number': 'businessLicenseNumber',
          'License Expiry Date': 'licenseExpiryDate',
          'Insurance Provider': 'insuranceProvider',
          'Insurance Policy Number': 'insurancePolicyNumber'
        };
        
        result.missingFields.forEach(displayName => {
          const fieldName = fieldMapping[displayName];
          if (fieldName) {
            newWarnings[fieldName] = `Not found in uploaded document`;
          }
        });
      }
      setVerificationWarnings(prev => ({ ...prev, ...newWarnings }));

      toast.dismiss(verifyToast);

      if (result.verified) {
        if (result.confidenceScore >= 80) {
          toast.success(
            `✓ Compliance document verified! ${result.confidenceScore.toFixed(1)}% match`,
            { duration: 4000, icon: '✅' }
          );
        } else {
          toast.success(
            `Compliance document verified with ${result.confidenceScore.toFixed(1)}% confidence. Check highlighted fields.`,
            { duration: 5000, icon: '⚠️' }
          );
        }
      } else {
        toast.error(
          `Compliance document verification failed: ${result.message}`,
          { duration: 5000 }
        );
      }

      console.log('Compliance Document Verification Results:', result);
      
    } catch (error) {
      toast.dismiss(verifyToast);
      console.error('Compliance document verification error:', error);
      toast.error('Unable to verify document. You can still proceed with submission.');
    } finally {
      setVerifyingDocument(false);
    }
  };

  // Validation for Step 1: Business Details
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.legalBusinessName.trim()) {
      newErrors.legalBusinessName = 'Legal business name is required';
    } else if (!/^[a-zA-Z0-9\s&.,'-]+$/.test(formData.legalBusinessName)) {
      newErrors.legalBusinessName = 'Only alphanumeric characters allowed';
    }
    
    if (!formData.businessRegistrationNumber.trim()) {
      newErrors.businessRegistrationNumber = 'Registration number is required';
    }
    
    if (!formData.businessType) {
      newErrors.businessType = 'Business type is required';
    }
    
    if (!formData.yearEstablished) {
      newErrors.yearEstablished = 'Year established is required';
    } else {
      const year = parseInt(formData.yearEstablished, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear) {
        newErrors.yearEstablished = `Year must be between 1800 and ${currentYear}`;
      }
    }
    
    if (!formData.businessAddress.trim()) {
      newErrors.businessAddress = 'Business address is required';
    }
    
    if (!formData.numberOfEmployees) {
      newErrors.numberOfEmployees = 'Number of employees is required';
    }
    
    if (!formData.industrySector) {
      newErrors.industrySector = 'Industry/Sector is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation for Step 2: Contact Details
  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.primaryContactName.trim()) {
      newErrors.primaryContactName = 'Primary contact name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.primaryContactName)) {
      newErrors.primaryContactName = 'Only alphabets allowed';
    }
    
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }
    
    if (!formData.emailAddress.trim()) {
      newErrors.emailAddress = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      newErrors.emailAddress = 'Invalid email format';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      const cleanPhone = formData.phoneNumber.replace(/[\s-().]/g, '');
      if (!/^[+]?[0-9]{7,15}$/.test(cleanPhone)) {
        newErrors.phoneNumber = 'Invalid phone number format';
      }
    }
    
    // Optional secondary contact validation
    if (formData.secondaryContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.secondaryContactEmail)) {
      newErrors.secondaryContactEmail = 'Invalid email format';
    }
    
    if (formData.website && formData.website.trim()) {
      const url = formData.website.trim();
      if (!/^https?:\/\/.+/.test(url) && !/^www\..+/.test(url) && !/.+\..+/.test(url)) {
        newErrors.website = 'Please enter a valid website URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation for Step 3: Banking & Payment
  const validateStep3 = () => {
    const newErrors = {};
    
    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }
    
    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    } else if (formData.accountHolderName !== formData.legalBusinessName) {
      // Warning but not blocking
      toast('Account holder name should match business name', { icon: '⚠️' });
    }
    
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else {
      const cleanAccount = formData.accountNumber.replace(/[\s-]/g, '');
      if (!/^[0-9]{6,20}$/.test(cleanAccount)) {
        newErrors.accountNumber = 'Account number must be 6-20 digits';
      }
    }
    
    if (!formData.accountType) {
      newErrors.accountType = 'Account type is required';
    }
    
    if (!formData.routingSwiftCode.trim()) {
      newErrors.routingSwiftCode = 'Routing/SWIFT code is required';
    }
    
    if (formData.iban && formData.iban.trim()) {
      const cleanIban = formData.iban.replace(/\s/g, '').toUpperCase();
      if (cleanIban.length > 0 && (cleanIban.length < 5 || cleanIban.length > 34 || !/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIban))) {
        newErrors.iban = 'Invalid IBAN format';
      }
    }
    
    if (!formData.paymentTerms) {
      newErrors.paymentTerms = 'Payment terms are required';
    }
    
    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation for Step 4: Compliance & Certifications
  const validateStep4 = () => {
    const newErrors = {};
    
    if (!formData.taxIdentificationNumber.trim()) {
      newErrors.taxIdentificationNumber = 'Tax ID is required';
    }
    
    // Business license is optional, but if expiry date is provided, validate it
    if (formData.licenseExpiryDate) {
      const expiryDate = new Date(formData.licenseExpiryDate);
      const today = new Date();
      if (expiryDate <= today) {
        newErrors.licenseExpiryDate = 'License expiry date must be in the future';
      }
    }
    
    // If license number is provided, expiry date should also be provided
    if (formData.businessLicenseNumber.trim() && !formData.licenseExpiryDate) {
      newErrors.licenseExpiryDate = 'License expiry date required when license number is provided';
    }
    
    // Insurance fields are optional, but if filled, validate them
    if (formData.insuranceExpiryDate) {
      const expiryDate = new Date(formData.insuranceExpiryDate);
      const today = new Date();
      if (expiryDate <= today) {
        newErrors.insuranceExpiryDate = 'Insurance expiry date must be in the future';
      }
    }
    
    // If insurance provider is filled, policy number should also be filled
    if (formData.insuranceProvider.trim() && !formData.insurancePolicyNumber.trim()) {
      newErrors.insurancePolicyNumber = 'Policy number required when provider is specified';
    }
    
    // If policy number is filled, provider should also be filled
    if (formData.insurancePolicyNumber.trim() && !formData.insuranceProvider.trim()) {
      newErrors.insuranceProvider = 'Provider required when policy number is specified';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: return validateStep1();
      case 2: return validateStep2();
      case 3: return validateStep3();
      case 4: return validateStep4();
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      saveDraft();
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      window.scrollTo(0, 0);
    } else {
      // Show specific errors with detailed messages
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        console.log('Validation errors:', errors);
        
        // Show the first error message in detail
        const firstError = errors[errorFields[0]];
        toast.error(firstError, { duration: 4000 });
        
        // If there are multiple errors, show count
        if (errorFields.length > 1) {
          setTimeout(() => {
            toast.error(`${errorFields.length} fields need attention. Scroll down to see all errors.`, { 
              duration: 3000 
            });
          }, 500);
        }
      } else {
        toast.error('Please fix the errors before proceeding');
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setLoading(true);

    try {
      const invitationToken = localStorage.getItem('invitationToken');
      if (!invitationToken) {
        toast.error('Invitation token not found. Please use the invitation link.');
        navigate('/vendor-login');
        return;
      }

      const submitData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== null && value !== '' && value !== undefined) {
          if (key.endsWith('File') && value instanceof File) {
            submitData.append(key, value);
          } else if (key === 'yearEstablished') {
            submitData.append(key, parseInt(value, 10));
          } else if (!key.endsWith('File')) {
            submitData.append(key, value);
          }
        }
      });
      
      submitData.append('invitationToken', invitationToken);

      const response = await vendorService.submitOnboarding(submitData);
      
      if (response.success) {
        toast.success('Onboarding form submitted successfully!');
        
        // Clear draft and auth data
        localStorage.removeItem('vendorOnboardingDraft');
        localStorage.removeItem('vendorAuthToken');
        localStorage.removeItem('vendorEmail');
        localStorage.removeItem('vendorRole');
        
        setTimeout(() => {
          navigate('/vendor-onboarding-success');
        }, 1500);
      } else {
        // Handle backend validation errors
        if (response.data && typeof response.data === 'object') {
          const backendErrors = {};
          const touchedFields = {};
          Object.keys(response.data).forEach(field => {
            backendErrors[field] = response.data[field];
            touchedFields[field] = true; // Mark fields as touched to show errors
          });
          setErrors(prev => ({ ...prev, ...backendErrors }));
          setTouched(prev => ({ ...prev, ...touchedFields }));
          
          // Show all validation errors in toast with field names
          const errorMessages = Object.entries(backendErrors).map(([field, message]) => {
            // Convert camelCase to readable format
            const readableField = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return `${readableField}: ${message}`;
          }).join(', ');
          
          toast.error(`Validation failed - ${errorMessages}`, { duration: 5000 });
          
          // Find which step has errors and navigate to it
          const errorFields = Object.keys(backendErrors);
          if (errorFields.some(f => ['legalBusinessName', 'businessRegistrationNumber', 'businessType', 'yearEstablished', 'businessAddress', 'numberOfEmployees', 'industrySector'].includes(f))) {
            setCurrentStep(1);
          } else if (errorFields.some(f => ['primaryContactName', 'jobTitle', 'emailAddress', 'phoneNumber', 'secondaryContactName', 'secondaryContactEmail', 'website'].includes(f))) {
            setCurrentStep(2);
          } else if (errorFields.some(f => ['bankName', 'accountHolderName', 'accountNumber', 'accountType', 'routingSwiftCode', 'iban', 'paymentTerms', 'currency'].includes(f))) {
            setCurrentStep(3);
          } else if (errorFields.some(f => ['taxIdentificationNumber', 'businessLicenseNumber', 'licenseExpiryDate', 'insuranceProvider', 'insurancePolicyNumber', 'insuranceExpiryDate', 'industryCertifications'].includes(f))) {
            setCurrentStep(4);
          }
        } else {
          toast.error(response.message || 'Failed to submit onboarding form');
        }
      }
    } catch (err) {
      console.error('Error submitting onboarding form:', err);
      
      // Handle backend validation errors from error response
      if (err.response?.data?.data && typeof err.response.data.data === 'object') {
        const backendErrors = {};
        const touchedFields = {};
        Object.keys(err.response.data.data).forEach(field => {
          backendErrors[field] = err.response.data.data[field];
          touchedFields[field] = true; // Mark fields as touched to show errors
        });
        setErrors(prev => ({ ...prev, ...backendErrors }));
        setTouched(prev => ({ ...prev, ...touchedFields }));
        
        // Show all validation errors in toast with field names
        const errorMessages = Object.entries(backendErrors).map(([field, message]) => {
          // Convert camelCase to readable format
          const readableField = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          return `${readableField}: ${message}`;
        }).join(', ');
        
        toast.error(`Validation failed - ${errorMessages}`, { duration: 5000 });
      } else {
        toast.error(
          err.response?.data?.message || 
          'Failed to submit onboarding form. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar}>
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={styles.progressStep}>
              <div className={`${styles.stepCircle} ${
                currentStep > step.id ? styles.stepCompleted :
                currentStep === step.id ? styles.stepActive :
                styles.stepInactive
              }`}>
                {currentStep > step.id ? <FiCheck /> : step.id}
              </div>
              <div className={styles.stepInfo}>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepSubtitle}>{step.subtitle}</div>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`${styles.progressLine} ${
                currentStep > step.id ? styles.lineCompleted : styles.lineInactive
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderInput = (name, label, options = {}) => {
    const { 
      type = 'text', 
      placeholder = '', 
      required = false,
      helpText = '',
      pattern = null,
      min = null,
      max = null,
      rows = 3
    } = options;

    const hasError = errors[name];
    const isTouched = touched[name];
    const hasWarning = verificationWarnings[name];
    
    // Check verification status across all document types
    const isVerified = 
      verificationResults.businessDetails?.matchedFields?.includes(
        name === 'legalBusinessName' ? 'Legal Business Name' :
        name === 'businessRegistrationNumber' ? 'Registration Number' :
        name === 'businessType' ? 'Business Type' :
        name === 'yearEstablished' ? 'Year Established' :
        name === 'businessAddress' ? 'Business Address' : ''
      ) ||
      verificationResults.contactDetails?.matchedFields?.includes(
        name === 'primaryContactName' ? 'Primary Contact Name' :
        name === 'emailAddress' ? 'Email Address' :
        name === 'phoneNumber' ? 'Phone Number' :
        name === 'jobTitle' ? 'Job Title' : ''
      ) ||
      verificationResults.bankingDetails?.matchedFields?.includes(
        name === 'bankName' ? 'Bank Name' :
        name === 'accountHolderName' ? 'Account Holder Name' :
        name === 'accountNumber' ? 'Account Number' :
        name === 'routingSwiftCode' ? 'Routing/SWIFT Code' : ''
      ) ||
      verificationResults.complianceDetails?.matchedFields?.includes(
        name === 'taxIdentificationNumber' ? 'Tax Identification Number' :
        name === 'businessLicenseNumber' ? 'Business License Number' :
        name === 'licenseExpiryDate' ? 'License Expiry Date' :
        name === 'insuranceProvider' ? 'Insurance Provider' :
        name === 'insurancePolicyNumber' ? 'Insurance Policy Number' : ''
      );

    return (
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          {label} {required && <span className={styles.required}>*</span>}
          {isVerified && <span style={{ color: '#10b981', marginLeft: '8px', fontSize: '14px' }}>✓ Verified</span>}
          {hasWarning && !hasError && <span style={{ color: '#f59e0b', marginLeft: '8px', fontSize: '14px' }}>⚠ Check document</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            name={name}
            value={formData[name]}
            onChange={handleChange}
            onBlur={() => setTouched(prev => ({ ...prev, [name]: true }))}
            placeholder={placeholder}
            rows={rows}
            className={`${styles.formInput} ${hasError && isTouched ? styles.inputError : hasWarning && !hasError ? styles.inputWarning : ''}`}
            disabled={loading}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            onBlur={() => setTouched(prev => ({ ...prev, [name]: true }))}
            placeholder={placeholder}
            pattern={pattern}
            min={min}
            max={max}
            className={`${styles.formInput} ${hasError && isTouched ? styles.inputError : hasWarning && !hasError ? styles.inputWarning : ''}`}
            disabled={loading}
          />
        )}
        {helpText && <p className={styles.helpText}>{helpText}</p>}
        {hasError && isTouched && <p className={styles.errorText}>{hasError}</p>}
        {hasWarning && !hasError && <p className={styles.warningText}>{hasWarning}</p>}
      </div>
    );
  };

  const renderSelect = (name, label, optionsArray, options = {}) => {
    const { required = false, helpText = '' } = options;
    const hasError = errors[name];
    const isTouched = touched[name];

    return (
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
        <select
          name={name}
          value={formData[name]}
          onChange={handleChange}
          onBlur={() => setTouched(prev => ({ ...prev, [name]: true }))}
          className={`${styles.formInput} ${hasError && isTouched ? styles.inputError : ''}`}
          disabled={loading}
        >
          <option value="">-- Select {label} --</option>
          {optionsArray.map(opt => (
            <option key={typeof opt === 'string' ? opt : opt.code} value={typeof opt === 'string' ? opt : opt.code}>
              {typeof opt === 'string' ? opt : `${opt.code} - ${opt.name}`}
            </option>
          ))}
        </select>
        {helpText && <p className={styles.helpText}>{helpText}</p>}
        {hasError && isTouched && <p className={styles.errorText}>{hasError}</p>}
      </div>
    );
  };

  const renderFileUpload = (fieldName, label, ref, options = {}) => {
    const { helpText = 'Accepted formats: PDF, DOC, DOCX (Max 10MB)' } = options;
    const file = formData[fieldName];

    return (
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{label}</label>
        <input
          ref={ref}
          type="file"
          onChange={(e) => handleFileChange(e, fieldName)}
          accept=".pdf,.doc,.docx"
          style={{ display: 'none' }}
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={loading}
          className={styles.fileUploadButton}
        >
          <FiUpload />
          <span>{file ? `✓ ${file.name}` : 'Click to upload document'}</span>
        </button>
        <p className={styles.helpText}>{helpText}</p>
      </div>
    );
  };

  const renderStep1 = () => (
    <div className={styles.stepContent}>
      <h2 className={styles.sectionTitle}>Business Details</h2>
      <p className={styles.sectionDescription}>
        Please provide accurate business information as it appears on legal documents and tax filings.
      </p>
      
      <div className={styles.formGrid}>
        {renderInput('legalBusinessName', 'Legal Business Name', {
          required: true,
          placeholder: 'e.g., ABC Corporation Ltd.',
          helpText: 'Official registered company name'
        })}
        
        {renderInput('businessRegistrationNumber', 'Business Registration Number', {
          required: true,
          placeholder: 'e.g., 123456789',
          helpText: 'Unique company registration or tax ID'
        })}
      </div>

      <div className={styles.formGrid}>
        {renderSelect('businessType', 'Business Type', BUSINESS_TYPES, {
          required: true,
          helpText: 'Legal structure of your business'
        })}
        
        {renderInput('yearEstablished', 'Year Established', {
          type: 'number',
          required: true,
          min: '1800',
          max: new Date().getFullYear().toString(),
          placeholder: 'e.g., 2015',
          helpText: 'Year when company was officially registered'
        })}
      </div>

      {renderInput('businessAddress', 'Business Address', {
        type: 'textarea',
        required: true,
        placeholder: 'Complete address including street, city, state/province, postal code, country',
        helpText: 'Primary business location or registered office',
        rows: 4
      })}

      <div className={styles.formGrid}>
        {renderSelect('numberOfEmployees', 'Number of Employees', ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'], {
          required: true,
          helpText: 'Total workforce size'
        })}
        
        {renderSelect('industrySector', 'Industry/Sector', INDUSTRY_SECTORS, {
          required: true,
          helpText: 'Primary business sector'
        })}
      </div>

      {renderFileUpload('businessDetailsFile', 'Business Details Document (Business.pdf)', businessFileRef, {
        helpText: 'Upload business registration certificate, articles of incorporation, or similar document'
      })}
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.stepContent}>
      <h2 className={styles.sectionTitle}>Contact Details</h2>
      <p className={styles.sectionDescription}>
        Provide contact information for primary and backup personnel responsible for vendor relationship.
      </p>

      <div className={styles.formGrid}>
        {renderInput('primaryContactName', 'Primary Contact Name', {
          required: true,
          placeholder: 'e.g., John Smith',
          helpText: 'Full name of main contact person'
        })}
        
        {renderInput('jobTitle', 'Job Title', {
          required: true,
          placeholder: 'e.g., CEO, Procurement Manager',
          helpText: 'Role/position within the organization'
        })}
      </div>

      <div className={styles.formGrid}>
        {renderInput('emailAddress', 'Email Address', {
          type: 'email',
          required: true,
          placeholder: 'contact@company.com',
          helpText: 'Primary business email for official correspondence',
          readOnly: true
        })}
        
        {renderInput('phoneNumber', 'Phone Number', {
          type: 'tel',
          required: true,
          placeholder: '+1234567890',
          helpText: 'Direct business phone (10-15 digits)'
        })}
      </div>

      <div className={styles.formGrid}>
        {renderInput('secondaryContactName', 'Secondary Contact Name', {
          placeholder: 'e.g., Jane Doe',
          helpText: 'Backup contact person (optional)'
        })}
        
        {renderInput('secondaryContactEmail', 'Secondary Contact Email', {
          type: 'email',
          placeholder: 'backup@company.com',
          helpText: 'Alternate contact email (optional)'
        })}
      </div>

      {renderInput('website', 'Company Website', {
        type: 'url',
        placeholder: 'https://www.company.com',
        helpText: 'Your company website URL (optional)'
      })}

      {renderFileUpload('contactDetailsFile', 'Contact Information Document (Contact Information.pdf)', contactFileRef, {
        helpText: 'Upload document verifying contact details (optional)'
      })}
    </div>
  );

  const renderStep3 = () => (
    <div className={styles.stepContent}>
      <h2 className={styles.sectionTitle}>Banking & Payment Information</h2>
      <p className={styles.sectionDescription}>
        Secure banking details for payment processing. All information is encrypted and stored securely.
      </p>

      <div className={styles.formGrid}>
        {renderInput('bankName', 'Bank Name', {
          required: true,
          placeholder: 'e.g., Chase Bank, HSBC',
          helpText: 'Name of financial institution'
        })}
        
        {renderInput('accountHolderName', 'Account Holder Name', {
          required: true,
          placeholder: 'Must match business name',
          helpText: 'Legal name on the bank account'
        })}
      </div>

      <div className={styles.formGrid}>
        {renderInput('accountNumber', 'Account Number', {
          required: true,
          placeholder: '12345678',
          helpText: 'Bank account number (8-18 digits)'
        })}
        
        {renderSelect('accountType', 'Account Type', ACCOUNT_TYPES, {
          required: true,
          helpText: 'Type of bank account'
        })}
      </div>

      <div className={styles.formGrid}>
        {renderInput('routingSwiftCode', 'Routing/SWIFT Code', {
          required: true,
          placeholder: 'e.g., CHASUS33 or 123456789',
          helpText: 'Bank routing number (domestic) or SWIFT code (international)'
        })}
        
        {renderInput('iban', 'IBAN (if applicable)', {
          placeholder: 'e.g., GB82WEST12345698765432',
          helpText: 'International Bank Account Number (optional)'
        })}
      </div>

      <div className={styles.formGrid}>
        {renderSelect('paymentTerms', 'Payment Terms', PAYMENT_TERMS, {
          required: true,
          helpText: 'Preferred payment schedule'
        })}
        
        {renderSelect('currency', 'Currency', CURRENCIES, {
          required: true,
          helpText: 'Preferred currency for transactions'
        })}
      </div>

      {renderFileUpload('bankingDetailsFile', 'Banking Information Document (Banking Information.pdf)', bankingFileRef, {
        helpText: 'Upload bank statement, void check, or bank letter (optional)'
      })}
    </div>
  );

  const renderStep4 = () => (
    <div className={styles.stepContent}>
      <h2 className={styles.sectionTitle}>Compliance & Certifications</h2>
      <p className={styles.sectionDescription}>
        Provide legal compliance information and relevant industry certifications.
      </p>

      <div className={styles.formGrid}>
        {renderInput('taxIdentificationNumber', 'Tax Identification Number', {
          required: true,
          placeholder: 'e.g., 12-3456789 or VAT123456',
          helpText: 'Official tax ID, VAT number, or EIN'
        })}
        
        {renderInput('businessLicenseNumber', 'Business License Number', {
          required: true,
          placeholder: 'e.g., BL123456',
          helpText: 'Valid license number for business operation'
        })}
      </div>

      <div className={styles.formGrid}>
        {renderInput('licenseExpiryDate', 'License Expiry Date', {
          type: 'date',
          required: true,
          helpText: 'Expiration date of business license'
        })}
        
        {renderInput('insuranceProvider', 'Insurance Provider', {
          required: true,
          placeholder: 'e.g., State Farm, Allianz',
          helpText: 'Company providing liability/business insurance'
        })}
      </div>

      <div className={styles.formGrid}>
        {renderInput('insurancePolicyNumber', 'Insurance Policy Number', {
          required: true,
          placeholder: 'e.g., POL123456',
          helpText: 'Unique identifier for insurance policy'
        })}
        
        {renderInput('insuranceExpiryDate', 'Insurance Expiry Date', {
          type: 'date',
          required: true,
          helpText: 'Date when current insurance coverage expires'
        })}
      </div>

      {renderInput('industryCertifications', 'Industry Certifications', {
        type: 'textarea',
        placeholder: 'e.g., ISO 9001:2015, SOC 2 Type II, CMMI Level 5',
        helpText: 'List relevant quality or industry-specific certifications (optional)',
        rows: 3
      })}

      {renderFileUpload('complianceDetailsFile', 'Compliance & Certifications Document (Compliance & Certifications.pdf)', complianceFileRef, {
        helpText: 'Upload business license, insurance certificate, tax documents, or certifications'
      })}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <div className={styles.wizardContainer}>
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p style={{ marginTop: '20px', color: '#0a5f3f', fontSize: '16px' }}>Loading your information...</p>
        </div>
      ) : (
        <div className={styles.wizardCard}>
          {/* Header */}
          <div className={styles.header}>
            <img src="/Logo.png" alt="Logo" className={styles.logo} />
            <h1 className={styles.title}>Vendor Onboarding Form</h1>
            <p className={styles.subtitle}>
              Complete the form step-by-step. Your progress is automatically saved.
            </p>
            {autoSaving && (
              <div className={styles.autoSaveIndicator}>
                <FiSave /> Auto-saving...
              </div>
            )}
          </div>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          {renderCurrentStep()}

          {/* Navigation Buttons */}
          <div className={styles.navigationButtons}>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
              className={styles.btnSecondary}
            >
              <FiChevronLeft /> Previous
            </button>

            <button
              type="button"
              onClick={saveDraft}
              className={styles.btnDraft}
              disabled={loading}
            >
              <FiSave /> Save as Draft
            </button>

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className={styles.btnPrimary}
              >
                Next <FiChevronRight />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={styles.btnSubmit}
              >
                {loading ? 'Submitting...' : 'Submit Form'}
              </button>
            )}
          </div>
        </form>

        {/* Help Text */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Need help? Contact us at <a href="mailto:support@devxcelerate.com">support@devxcelerate.com</a>
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
