package com.evoke.vendor.validation.rules;

import com.evoke.vendor.entity.VendorOnboarding;
import com.evoke.vendor.validation.ValidationResult;
import com.evoke.vendor.validation.ValidationRule;
import org.springframework.stereotype.Component;

@Component
public class MandatoryFieldRule implements ValidationRule {
    
    private final String fieldName;
    private final String displayName;

    public MandatoryFieldRule() {
        this.fieldName = "companyName";
        this.displayName = "Company Name";
    }

    public MandatoryFieldRule(String fieldName, String displayName) {
        this.fieldName = fieldName;
        this.displayName = displayName;
    }

    @Override
    public String getRuleName() {
        return "MANDATORY_FIELD";
    }

    @Override
    public String getFieldName() {
        return fieldName;
    }

    @Override
    public boolean isRequired() {
        return true;
    }

    @Override
    public ValidationResult validate(Object value, VendorOnboarding context) {
        boolean isEmpty = value == null || 
                         (value instanceof String && ((String) value).trim().isEmpty());

        return ValidationResult.builder()
            .valid(!isEmpty)
            .errorMessage(isEmpty ? displayName + " is required" : null)
            .fieldName(fieldName)
            .currentValue(value != null ? value.toString() : "null")
            .expectedValue("Non-empty value")
            .severity(isEmpty ? "HIGH" : null)
            .issueType(isEmpty ? "MISSING_DATA" : null)
            .suggestion(isEmpty ? "Please provide " + displayName : null)
            .build();
    }

    @Override
    public String getSuggestion() {
        return "Please provide " + displayName;
    }
}
