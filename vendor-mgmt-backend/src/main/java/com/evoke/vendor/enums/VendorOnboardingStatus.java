package com.evoke.vendor.enums;

public enum VendorOnboardingStatus {
    REQUESTED("Requested", "Email sent, vendor hasn't opened the link"),
    AWAITING_RESPONSE("Waiting for vendor response", "Vendor opened the link but hasn't submitted data"),
    MISSING_DATA("Waiting for missing data", "Vendor shared partial or incorrect information"),
    AWAITING_VALIDATION("Waiting for validation", "Vendor submitted details, awaiting procurement review"),
    VALIDATED("Validated", "Vendor approved by procurement"),
    DENIED("Denied", "Vendor rejected by procurement"),
    DELETED("Deleted", "Vendor removed (soft delete)");

    private final String displayName;
    private final String description;

    VendorOnboardingStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public String toString() {
        return displayName;
    }
}
