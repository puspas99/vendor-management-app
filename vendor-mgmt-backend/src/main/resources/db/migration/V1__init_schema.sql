-- Create roles table
CREATE TABLE dbo.roles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME2(6) NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2(6) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UK_roles_name UNIQUE (name)
);

-- Create Users table
CREATE TABLE dbo.users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255),
    full_name NVARCHAR(255) NOT NULL,
    department NVARCHAR(100),
    enabled BIT NOT NULL DEFAULT 1,
    status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    account_non_expired BIT NOT NULL DEFAULT 1,
    account_non_locked BIT NOT NULL DEFAULT 1,
    credentials_non_expired BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2
);

-- Create users_roles junction table
CREATE TABLE dbo.users_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    CONSTRAINT PK_users_roles PRIMARY KEY (user_id, role_id),
    CONSTRAINT FK_users_roles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
    CONSTRAINT FK_users_roles_role FOREIGN KEY (role_id) REFERENCES dbo.roles(id) ON DELETE CASCADE
);

-- Create refresh_tokens table
CREATE TABLE dbo.refresh_tokens (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    expiry_date DATETIMEOFFSET(6) NOT NULL,
    revoked BIT NOT NULL DEFAULT 0,
    created_at DATETIME2(6) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UK_refresh_tokens_token UNIQUE (token),
    CONSTRAINT FK_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON dbo.users(username);
CREATE INDEX idx_users_email ON dbo.users(email);
CREATE INDEX idx_users_enabled ON dbo.users(enabled);
CREATE INDEX idx_refresh_tokens_token ON dbo.refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON dbo.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expiry_date ON dbo.refresh_tokens(expiry_date);
CREATE INDEX idx_refresh_tokens_revoked ON dbo.refresh_tokens(revoked);

-- Insert default roles
INSERT INTO dbo.roles (name, description, created_at, updated_at) VALUES 
    ('ROLE_USER', 'Standard user role', SYSDATETIME(), SYSDATETIME()),
    ('ROLE_ADMIN', 'Administrator role with full access', SYSDATETIME(), SYSDATETIME()),
    ('ROLE_VENDOR', 'Vendor role with limited access', SYSDATETIME(), SYSDATETIME());
GO

-- Create trigger for users updated_at
CREATE TRIGGER trg_users_updated_at
ON dbo.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.users
    SET updated_at = SYSDATETIME()
    FROM dbo.users u
    INNER JOIN inserted i ON u.id = i.id;
END;
GO

-- Create trigger for roles updated_at
CREATE TRIGGER trg_roles_updated_at
ON dbo.roles
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.roles
    SET updated_at = SYSDATETIME()
    FROM dbo.roles r
    INNER JOIN inserted i ON r.id = i.id;
END;
GO

-- Create Vendor Requests table
CREATE TABLE dbo.vendor (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    vendor_name NVARCHAR(200) NOT NULL,
    vendor_email NVARCHAR(255) NOT NULL UNIQUE,
    contact_person NVARCHAR(100) NOT NULL,
    contact_number NVARCHAR(20) NOT NULL,
    vendor_category NVARCHAR(100) NOT NULL,
    remarks NVARCHAR(MAX),
    status NVARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    invitation_token NVARCHAR(255) UNIQUE,
    invitation_sent_at DATETIME2,
    invitation_expires_at DATETIME2,
    created_by NVARCHAR(255) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2,
    deleted_at DATETIME2,
    
    -- Check constraint for valid status values
    CONSTRAINT CK_vendor_status 
        CHECK (status IN ('REQUESTED', 'AWAITING_RESPONSE', 'MISSING_DATA', 'AWAITING_VALIDATION', 'VALIDATED', 'DENIED', 'DELETED'))
);


-- Create Vendor Onboarding Main table
CREATE TABLE dbo.vendor_onboarding (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    vendor_request_id BIGINT NOT NULL,
    status NVARCHAR(50),
    is_complete BIT NOT NULL DEFAULT 0,
    submitted_at DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2,
    deleted_at DATETIME2,
    
    FOREIGN KEY (vendor_request_id) REFERENCES dbo.vendor(id) ON DELETE CASCADE,
    
    -- Check constraint for valid status values
    CONSTRAINT CK_vendor_onboarding_status 
        CHECK (status IN ('REQUESTED', 'AWAITING_RESPONSE', 'MISSING_DATA', 'AWAITING_VALIDATION', 'VALIDATED', 'DENIED', 'DELETED') OR status IS NULL)
);

-- Create Business Details table
CREATE TABLE dbo.vendor_business_details (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    vendor_onboarding_id BIGINT NOT NULL,
    legal_business_name NVARCHAR(255) NOT NULL,
    business_registration_number NVARCHAR(100) NOT NULL,
    business_type NVARCHAR(100) NOT NULL,
    year_established INT,
    business_address NVARCHAR(MAX),
    number_of_employees NVARCHAR(50),
    industry_sector NVARCHAR(100),
    business_details_file_path NVARCHAR(500),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2,
    
    FOREIGN KEY (vendor_onboarding_id) REFERENCES dbo.vendor_onboarding(id) ON DELETE CASCADE
);

-- Create Contact Details table
CREATE TABLE dbo.vendor_contact_details (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    vendor_onboarding_id BIGINT NOT NULL,
    primary_contact_name NVARCHAR(255) NOT NULL,
    job_title NVARCHAR(100),
    email_address NVARCHAR(255) NOT NULL,
    phone_number NVARCHAR(20) NOT NULL,
    secondary_contact_name NVARCHAR(255),
    secondary_contact_email NVARCHAR(255),
    website NVARCHAR(500),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2,
    
    FOREIGN KEY (vendor_onboarding_id) REFERENCES dbo.vendor_onboarding(id) ON DELETE CASCADE
);

-- Create Banking & Payment Details table
CREATE TABLE dbo.vendor_banking_details (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    vendor_onboarding_id BIGINT NOT NULL,
    bank_name NVARCHAR(255) NOT NULL,
    account_holder_name NVARCHAR(255) NOT NULL,
    account_number NVARCHAR(100) NOT NULL,
    account_type NVARCHAR(50) NOT NULL,
    routing_swift_code NVARCHAR(50),
    iban NVARCHAR(50),
    payment_terms NVARCHAR(255),
    currency NVARCHAR(10),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2,
    
    FOREIGN KEY (vendor_onboarding_id) REFERENCES dbo.vendor_onboarding(id) ON DELETE CASCADE
);

-- Create Compliance & Certifications table
CREATE TABLE dbo.vendor_compliance_details (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    vendor_onboarding_id BIGINT NOT NULL,
    tax_identification_number NVARCHAR(100) NOT NULL,
    business_license_number NVARCHAR(100),
    license_expiry_date DATE,
    insurance_provider NVARCHAR(255),
    insurance_policy_number NVARCHAR(100),
    insurance_expiry_date DATE,
    industry_certifications NVARCHAR(MAX),
    compliance_file_path NVARCHAR(500),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2,
    
    FOREIGN KEY (vendor_onboarding_id) REFERENCES dbo.vendor_onboarding(id) ON DELETE CASCADE
);

-- Create OTP Tokens table
CREATE TABLE dbo.otp_tokens (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL,
    otp_code NVARCHAR(10) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    is_used BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    used_at DATETIME2
);

-- Create Follow-ups table
CREATE TABLE dbo.follow_ups (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    vendor_onboarding_id BIGINT NOT NULL,
    follow_up_type NVARCHAR(50) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    fields_concerned NVARCHAR(MAX),
    initiated_by NVARCHAR(255) NOT NULL,
    is_automatic BIT NOT NULL,
    status NVARCHAR(50) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    resolved_at DATETIME2,
    
    FOREIGN KEY (vendor_onboarding_id) REFERENCES dbo.vendor_onboarding(id) ON DELETE CASCADE
);


-- Create indexes for better performance
CREATE INDEX idx_vendor_email ON dbo.vendor(vendor_email);
CREATE INDEX idx_vendor_status ON dbo.vendor(status);
CREATE INDEX idx_vendor_token ON dbo.vendor(invitation_token);
CREATE INDEX idx_vendor_onboarding_request_id ON dbo.vendor_onboarding(vendor_request_id);
CREATE INDEX idx_vendor_business_details_onboarding_id ON dbo.vendor_business_details(vendor_onboarding_id);
CREATE INDEX idx_vendor_contact_details_onboarding_id ON dbo.vendor_contact_details(vendor_onboarding_id);
CREATE INDEX idx_vendor_banking_details_onboarding_id ON dbo.vendor_banking_details(vendor_onboarding_id);
CREATE INDEX idx_vendor_compliance_details_onboarding_id ON dbo.vendor_compliance_details(vendor_onboarding_id);
CREATE INDEX idx_otp_tokens_email ON dbo.otp_tokens(email);
CREATE INDEX idx_follow_ups_onboarding_id ON dbo.follow_ups(vendor_onboarding_id);
CREATE INDEX idx_follow_ups_status ON dbo.follow_ups(status);

-- Create vendor activity log table
CREATE TABLE dbo.vendor_activity_log (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    vendor_request_id BIGINT NOT NULL,
    activity_type NVARCHAR(50) NOT NULL,
    description NVARCHAR(500) NOT NULL,
    details NVARCHAR(MAX),
    performed_by NVARCHAR(100) NOT NULL,
    performed_by_role NVARCHAR(50),
    performed_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    ip_address NVARCHAR(100),
    
    FOREIGN KEY (vendor_request_id) REFERENCES dbo.vendor(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_activity_log_vendor_id ON dbo.vendor_activity_log(vendor_request_id);
CREATE INDEX idx_activity_log_performed_at ON dbo.vendor_activity_log(performed_at DESC);
CREATE INDEX idx_activity_log_activity_type ON dbo.vendor_activity_log(activity_type);
CREATE INDEX idx_activity_log_performed_by ON dbo.vendor_activity_log(performed_by);

-- Create notifications table for procurement team alerts

CREATE TABLE notifications (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    recipient_username NVARCHAR(100) NOT NULL,
    type NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(500),
    vendor_request_id BIGINT,
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL,
    read_at DATETIME2,
    action_url NVARCHAR(255),
    
    CONSTRAINT FK_notification_vendor_request 
        FOREIGN KEY (vendor_request_id) 
        REFERENCES vendor(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_notification_recipient ON notifications(recipient_username, created_at DESC);
CREATE INDEX idx_notification_unread ON notifications(recipient_username, is_read, created_at DESC);
CREATE INDEX idx_notification_created_at ON notifications(created_at DESC);
