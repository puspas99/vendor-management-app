package com.evoke.vendor;

public final class Constants {
    
    private Constants() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    // OTP Constants
    public static final int DEFAULT_OTP_LENGTH = 6;
    public static final long DEFAULT_OTP_EXPIRATION_MS = 300000L; // 5 minutes
    
    // JWT Constants
    public static final long DEFAULT_JWT_EXPIRATION_MS = 86400000L; // 24 hours
    
    // File Upload Constants
    public static final long MAX_FILE_SIZE = 10485760L; // 10MB
    public static final String[] ALLOWED_FILE_EXTENSIONS = {"pdf", "doc", "docx", "jpg", "jpeg", "png"};
    
    // Email Constants
    public static final String EMAIL_SUBJECT_VENDOR_INVITATION = "Onboarding Invitation";
    public static final String EMAIL_SUBJECT_OTP = "Your OTP for Onboarding";
    public static final String EMAIL_SUBJECT_FOLLOW_UP = "Follow-up Required: Onboarding";
    
    // Vendor Status - matches VendorOnboardingStatus enum
    public static final String STATUS_REQUESTED = "REQUESTED";
    public static final String STATUS_AWAITING_RESPONSE = "AWAITING_RESPONSE";
    public static final String STATUS_MISSING_DATA = "MISSING_DATA";
    public static final String STATUS_AWAITING_VALIDATION = "AWAITING_VALIDATION";
    public static final String STATUS_VALIDATED = "VALIDATED";
    public static final String STATUS_DENIED = "DENIED";
    public static final String STATUS_DELETED = "DELETED";
    
    // Follow-up Types
    public static final String FOLLOW_UP_MISSING_DATA = "MISSING_DATA";
    public static final String FOLLOW_UP_INCORRECT_DATA = "INCORRECT_DATA";
    public static final String FOLLOW_UP_INCORRECT_FILE = "INCORRECT_FILE";
    public static final String FOLLOW_UP_DELAYED_RESPONSE = "DELAYED_RESPONSE";
    public static final String FOLLOW_UP_MANUAL = "MANUAL";
    
    // Security Roles
    public static final String ROLE_PROCUREMENT = "ROLE_PROCUREMENT";
    public static final String ROLE_VENDOR = "ROLE_VENDOR";
    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    
    // API Endpoints
    public static final String API_BASE_PATH = "/api";
    public static final String API_VENDOR_PATH = "/api/vendor";
    public static final String API_PROCUREMENT_PATH = "/api/procurement";
}
