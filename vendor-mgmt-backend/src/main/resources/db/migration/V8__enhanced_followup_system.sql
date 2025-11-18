-- V8: Enhanced Follow-up Management System with AI Integration

-- 1. Enhance follow_ups table with new columns
ALTER TABLE dbo.follow_ups ADD follow_up_reason VARCHAR(100);
ALTER TABLE dbo.follow_ups ADD ai_generated BIT DEFAULT 0;
ALTER TABLE dbo.follow_ups ADD ai_model VARCHAR(50);
ALTER TABLE dbo.follow_ups ADD ai_prompt_version VARCHAR(20);
ALTER TABLE dbo.follow_ups ADD sent_at DATETIME2;
ALTER TABLE dbo.follow_ups ADD read_at DATETIME2;
ALTER TABLE dbo.follow_ups ADD responded_at DATETIME2;
ALTER TABLE dbo.follow_ups ADD escalation_level INT DEFAULT 0;
ALTER TABLE dbo.follow_ups ADD escalated_to VARCHAR(100);
ALTER TABLE dbo.follow_ups ADD escalated_at DATETIME2;
ALTER TABLE dbo.follow_ups ADD email_sent BIT DEFAULT 0;
ALTER TABLE dbo.follow_ups ADD email_sent_at DATETIME2;
ALTER TABLE dbo.follow_ups ADD email_opened BIT DEFAULT 0;
ALTER TABLE dbo.follow_ups ADD email_opened_at DATETIME2;
GO

-- 2. Create follow_up_templates table
CREATE TABLE dbo.follow_up_templates (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    template_name VARCHAR(100) NOT NULL,
    follow_up_type VARCHAR(50) NOT NULL,
    escalation_level INT DEFAULT 0,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    use_ai_enhancement BIT DEFAULT 1,
    ai_system_prompt TEXT,
    ai_user_prompt_template TEXT,
    available_variables TEXT,
    created_by VARCHAR(100),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2,
    is_active BIT DEFAULT 1
);
GO

-- 3. Create vendor_validation_issues table
CREATE TABLE dbo.vendor_validation_issues (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    vendor_onboarding_id BIGINT NOT NULL,
    issue_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100),
    field_path VARCHAR(255),
    current_value TEXT,
    expected_value TEXT,
    validation_rule TEXT,
    error_message TEXT,
    status VARCHAR(20) DEFAULT 'OPEN',
    severity VARCHAR(20) DEFAULT 'MEDIUM',
    resolved_by VARCHAR(100),
    resolved_at DATETIME2,
    resolution_notes TEXT,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (vendor_onboarding_id) REFERENCES dbo.vendor_onboarding(id)
);
GO

-- 4. Create ai_message_history table
CREATE TABLE dbo.ai_message_history (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    follow_up_id BIGINT,
    ai_model VARCHAR(50),
    ai_prompt TEXT NOT NULL,
    context_data TEXT,
    ai_response TEXT,
    generated_message TEXT,
    tokens_used INT,
    was_edited BIT DEFAULT 0,
    user_rating INT,
    feedback TEXT,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (follow_up_id) REFERENCES dbo.follow_ups(id)
);
GO

-- 5. Create escalation_rules table
CREATE TABLE dbo.escalation_rules (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    rule_name VARCHAR(100) NOT NULL,
    follow_up_type VARCHAR(50),
    min_unresolved_count INT DEFAULT 2,
    days_since_last_followup INT DEFAULT 3,
    escalation_level INT NOT NULL,
    notify_roles TEXT,
    notify_users TEXT,
    escalation_template_id BIGINT,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (escalation_template_id) REFERENCES dbo.follow_up_templates(id)
);
GO

-- 6. Create indexes for performance
CREATE INDEX idx_validation_vendor ON dbo.vendor_validation_issues(vendor_onboarding_id);
CREATE INDEX idx_validation_status ON dbo.vendor_validation_issues(status);
CREATE INDEX idx_validation_severity ON dbo.vendor_validation_issues(severity);
CREATE INDEX idx_ai_history_followup ON dbo.ai_message_history(follow_up_id);
CREATE INDEX idx_followup_escalation ON dbo.follow_ups(escalation_level);
CREATE INDEX idx_followup_ai_generated ON dbo.follow_ups(ai_generated);
CREATE INDEX idx_template_type ON dbo.follow_up_templates(follow_up_type, escalation_level);
GO

-- 7. Insert default follow-up templates
INSERT INTO dbo.follow_up_templates (
    template_name, follow_up_type, escalation_level, 
    subject_template, body_template, use_ai_enhancement,
    ai_system_prompt, ai_user_prompt_template, available_variables, is_active
)
VALUES 
-- Missing Data Templates
('Missing Data - First Contact', 'MISSING_DATA', 0,
 'Action Required: Missing Information - {{vendorName}}',
 'Dear {{contactPerson}},

Thank you for your interest in partnering with us. We have reviewed your submission and noticed that some required information is missing:

{{missingFieldsList}}

To proceed with your onboarding, please provide the missing information at your earliest convenience. You can update your details using the link below:

{{onboardingLink}}

If you have any questions or need assistance, please don''t hesitate to contact us.

Best regards,
{{senderName}}
Procurement Team',
 1,
 'You are a professional business communication assistant for a vendor management system. Your role is to draft polite, clear, and actionable follow-up emails to vendors. Be professional but friendly. Clearly state the issue and required action. Provide specific details. Include deadlines when applicable. Offer assistance. Keep tone encouraging, not accusatory.',
 'Generate a follow-up email for vendor {{vendorName}} ({{companyName}}) who is missing the following required fields: {{missingFields}}. This is the first contact. The contact person is {{contactPerson}}. They submitted the form on {{submissionDate}}.',
 'vendorName,companyName,contactPerson,missingFields,missingFieldsList,onboardingLink,submissionDate,senderName',
 1),

('Missing Data - Second Follow-up', 'MISSING_DATA', 1,
 'Reminder: Missing Information Required - {{vendorName}}',
 'Dear {{contactPerson}},

This is a friendly reminder regarding your vendor onboarding application submitted on {{submissionDate}}.

We previously reached out about missing information. To complete your onboarding, we still need:

{{missingFieldsList}}

Please provide this information within the next 3 business days to avoid delays in processing your application.

Update your information here: {{onboardingLink}}

Should you have any questions, we are here to help.

Best regards,
{{senderName}}
Procurement Team',
 1,
 'You are following up for the second time with a vendor who has not responded. Be polite but more direct about the urgency. Include a specific deadline (3 business days). Maintain a professional tone.',
 'Generate a second follow-up email for vendor {{vendorName}} who still has missing data. First contact was {{daysSinceLastContact}} days ago. Missing fields: {{missingFields}}. Add urgency with a 3-day deadline.',
 'vendorName,companyName,contactPerson,missingFields,missingFieldsList,onboardingLink,submissionDate,daysSinceLastContact,senderName',
 1),

-- Incorrect Data Templates
('Incorrect Data - First Contact', 'INCORRECT_DATA', 0,
 'Action Required: Data Corrections Needed - {{vendorName}}',
 'Dear {{contactPerson}},

Thank you for submitting your vendor onboarding information. We have reviewed your submission and identified some data that requires correction:

{{incorrectFieldsList}}

Please review and update the information at your earliest convenience:
{{onboardingLink}}

If you believe this is an error or have questions, please contact us immediately.

Best regards,
{{senderName}}
Procurement Team',
 1,
 'You are notifying a vendor about data validation errors. Be clear about what is wrong and what is expected. Use bullet points for multiple issues. Be helpful, not critical.',
 'Generate an email for vendor {{vendorName}} regarding data validation errors. Issues found: {{validationIssues}}. First notification. Contact: {{contactPerson}}.',
 'vendorName,companyName,contactPerson,incorrectFields,incorrectFieldsList,validationIssues,onboardingLink,senderName',
 1),

-- File Issues Templates
('Incorrect File - First Contact', 'INCORRECT_FILE', 0,
 'Action Required: File Upload Issue - {{vendorName}}',
 'Dear {{contactPerson}},

We have reviewed your submitted documents and found some issues that need to be addressed:

{{fileIssuesList}}

Please re-upload the correct files using the following link:
{{onboardingLink}}

Accepted file formats: {{acceptedFormats}}
Maximum file size: {{maxFileSize}}

If you need clarification on the requirements, please let us know.

Best regards,
{{senderName}}
Procurement Team',
 1,
 'You are notifying a vendor about file upload issues. Be specific about what is wrong with each file. Remind them of accepted formats and size limits. Be helpful.',
 'Generate an email for vendor {{vendorName}} regarding file upload issues. Problems: {{fileIssues}}. Accepted formats: {{acceptedFormats}}. Max size: {{maxFileSize}}.',
 'vendorName,companyName,contactPerson,fileIssues,fileIssuesList,acceptedFormats,maxFileSize,onboardingLink,senderName',
 1),

-- Delayed Response Templates
('Delayed Response - Gentle Reminder', 'DELAYED_RESPONSE', 0,
 'Gentle Reminder: Pending Vendor Application - {{vendorName}}',
 'Dear {{contactPerson}},

We hope this message finds you well. We wanted to follow up on your vendor onboarding application submitted on {{submissionDate}}.

We have not yet received a response to our previous communication sent {{daysSinceLastContact}} days ago.

To continue the onboarding process, please review and complete the outstanding items:
{{onboardingLink}}

If you are no longer interested or need more time, please let us know so we can update our records accordingly.

Best regards,
{{senderName}}
Procurement Team',
 1,
 'You are sending a gentle reminder to a vendor who has not responded. Be understanding and offer flexibility. Ask if they need more time or have questions.',
 'Generate a gentle reminder for vendor {{vendorName}} who has not responded for {{daysSinceLastContact}} days. Original submission was on {{submissionDate}}. Be understanding but encourage action.',
 'vendorName,companyName,contactPerson,submissionDate,daysSinceLastContact,onboardingLink,senderName',
 1),

-- Unresponsive Escalation
('Unresponsive Vendor - Final Notice', 'UNRESPONSIVE', 2,
 'Final Notice: Vendor Application Status - {{vendorName}}',
 'Dear {{contactPerson}},

This is a final notice regarding your vendor onboarding application for {{companyName}}.

Despite multiple attempts to reach you ({{followUpCount}} follow-ups over {{daysSinceFirstContact}} days), we have not received the required information or response.

This is your last opportunity to complete the onboarding process. Please respond within 2 business days, or your application will be marked as inactive.

To reactivate: {{onboardingLink}}

If you have any questions or concerns, please contact us immediately.

Regards,
{{senderName}}
Procurement Team',
 1,
 'You are sending a final notice to an unresponsive vendor. Be direct and professional. State clearly this is the last opportunity. Include specific consequences of non-response. Set a 2-day deadline.',
 'Generate a final notice for unresponsive vendor {{vendorName}}. They have received {{followUpCount}} follow-ups over {{daysSinceFirstContact}} days with no response. This is escalation level {{escalationLevel}}. Be firm but professional.',
 'vendorName,companyName,contactPerson,followUpCount,daysSinceFirstContact,daysSinceLastContact,escalationLevel,onboardingLink,senderName',
 1);
GO

-- 8. Insert default escalation rules
INSERT INTO dbo.escalation_rules (
    rule_name, follow_up_type, min_unresolved_count, 
    days_since_last_followup, escalation_level, 
    notify_roles, is_active
)
VALUES 
('Missing Data - Level 1', 'MISSING_DATA', 1, 3, 1, '["PROCUREMENT", "USER"]', 1),
('Missing Data - Level 2', 'MISSING_DATA', 2, 5, 2, '["PROCUREMENT", "ADMIN"]', 1),
('Unresponsive - Critical', 'UNRESPONSIVE', 2, 7, 2, '["ADMIN", "PROCUREMENT_MANAGER"]', 1),
('Incorrect Data - Level 1', 'INCORRECT_DATA', 1, 3, 1, '["PROCUREMENT"]', 1),
('File Issues - Level 1', 'INCORRECT_FILE', 1, 3, 1, '["PROCUREMENT"]', 1);
GO

PRINT 'V8 Migration completed successfully: Enhanced follow-up system with AI integration';
