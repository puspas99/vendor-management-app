package com.evoke.vendor.enums;

public enum FollowUpType {
    MISSING_DATA("Missing Required Data"),
    INCOMPLETE_DATA("Incomplete Optional Data"),
    INCORRECT_DATA("Incorrect or Invalid Data"),
    INCORRECT_FILE("File Format or Content Issue"),
    EXPIRED_DOCUMENT("Expired Document"),
    DELAYED_RESPONSE("Delayed Response"),
    UNRESPONSIVE("Vendor Unresponsive"),
    CLARIFICATION_NEEDED("Clarification Needed"),
    COMPLIANCE_ISSUE("Compliance Requirement Not Met"),
    MANUAL("Manual Follow-up");

    private final String description;

    FollowUpType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
