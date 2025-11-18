package com.evoke.vendor.enums;

public enum NotificationType {
    VENDOR_REQUEST_CREATED("Vendor Request Created", "info"),
    VENDOR_RESPONSE_RECEIVED("Vendor Response Received", "success"),
    FORM_SUBMITTED("Form Submitted", "success"),
    STATUS_CHANGED("Status Changed", "info"),
    FOLLOW_UP_REQUIRED("Follow-up Required", "warning"),
    MISSING_DATA("Missing Data", "warning"),
    VALIDATION_PENDING("Validation Pending", "warning"),
    VENDOR_APPROVED("Vendor Approved", "success"),
    VENDOR_DENIED("Vendor Denied", "error"),
    DEADLINE_APPROACHING("Deadline Approaching", "warning"),
    DOCUMENT_UPLOADED("Document Uploaded", "info"),
    VENDOR_UNRESPONSIVE("Vendor Unresponsive", "error");

    private final String displayName;
    private final String severity; // info, success, warning, error

    NotificationType(String displayName, String severity) {
        this.displayName = displayName;
        this.severity = severity;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getSeverity() {
        return severity;
    }
}
