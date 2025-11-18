package com.evoke.vendor.validation;

import com.evoke.vendor.entity.VendorOnboarding;

public interface ValidationRule {
    String getRuleName();
    String getFieldName();
    ValidationResult validate(Object value, VendorOnboarding context);
    String getSuggestion();
    boolean isRequired();
}
