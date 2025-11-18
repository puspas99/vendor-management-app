package com.evoke.vendor.validation.rules;

import com.evoke.vendor.entity.VendorOnboarding;
import com.evoke.vendor.validation.ValidationResult;
import com.evoke.vendor.validation.ValidationRule;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class PhoneNumberFormatRule implements ValidationRule {
    
    private static final Pattern PHONE_PATTERN = 
        Pattern.compile("^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$");

    @Override
    public String getRuleName() {
        return "PHONE_FORMAT";
    }

    @Override
    public String getFieldName() {
        return "phoneNumber";
    }

    @Override
    public boolean isRequired() {
        return true;
    }

    @Override
    public ValidationResult validate(Object value, VendorOnboarding context) {
        if (value == null || value.toString().trim().isEmpty()) {
            return ValidationResult.builder()
                .valid(false)
                .errorMessage("Phone number is required")
                .fieldName(getFieldName())
                .severity("HIGH")
                .issueType("MISSING_DATA")
                .suggestion("Please provide a valid phone number")
                .build();
        }

        String phone = value.toString().trim();
        boolean isValid = PHONE_PATTERN.matcher(phone).matches() && phone.length() >= 10;

        return ValidationResult.builder()
            .valid(isValid)
            .errorMessage(isValid ? null : "Invalid phone number format")
            .fieldName(getFieldName())
            .currentValue(phone)
            .expectedValue("+1-234-567-8900")
            .severity(isValid ? null : "MEDIUM")
            .issueType(isValid ? null : "INCORRECT_DATA")
            .suggestion(isValid ? null : "Phone number should be at least 10 digits, with optional country code")
            .build();
    }

    @Override
    public String getSuggestion() {
        return "Provide a valid phone number (minimum 10 digits)";
    }
}
