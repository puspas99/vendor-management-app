package com.evoke.vendor.enums;

public enum ActivityType {
    VENDOR_REQUEST_CREATED("Vendor request created"),
    INVITATION_SENT("Invitation email sent"),
    INVITATION_RESENT("Invitation resent"),
    LINK_OPENED("Vendor opened invitation link"),
    OTP_GENERATED("OTP generated and sent"),
    OTP_VERIFIED("OTP verified successfully"),
    FORM_SUBMITTED("Onboarding form submitted"),
    STATUS_UPDATED("Status updated"),
    FOLLOW_UP_CREATED("Follow-up created"),
    FOLLOW_UP_RESOLVED("Follow-up resolved"),
    VENDOR_APPROVED("Vendor approved"),
    VENDOR_DENIED("Vendor denied"),
    VENDOR_DELETED("Vendor deleted"),
    VENDOR_RESTORED("Vendor restored"),
    EMAIL_SENT("Email sent"),
    DOCUMENT_UPLOADED("Document uploaded"),
    COMMENT_ADDED("Comment added");

    private final String displayName;

    ActivityType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    @Override
    public String toString() {
        return displayName;
    }
}
