package com.evoke.vendor.validation.rules;

import com.evoke.vendor.entity.VendorOnboarding;
import com.evoke.vendor.validation.ValidationResult;
import com.evoke.vendor.validation.ValidationRule;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class EmailFormatRule implements ValidationRule {
    
    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    @Override
    public String getRuleName() {
        return "EMAIL_FORMAT";
    }

    @Override
    public String getFieldName() {
        return "email";
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
                .errorMessage("Email address is required")
                .fieldName(getFieldName())
                .severity("HIGH")
                .issueType("MISSING_DATA")
                .suggestion("Please provide a valid email address")
                .build();
        }

        String email = value.toString().trim();
        boolean isValid = EMAIL_PATTERN.matcher(email).matches();

        return ValidationResult.builder()
            .valid(isValid)
            .errorMessage(isValid ? null : "Invalid email format")
            .fieldName(getFieldName())
            .currentValue(email)
            .expectedValue("user@example.com")
            .severity(isValid ? null : "HIGH")
            .issueType(isValid ? null : "INCORRECT_DATA")
            .suggestion(isValid ? null : "Email should be in format: user@domain.com")
            .build();
    }

    @Override
    public String getSuggestion() {
        return "Provide a valid email address in format: user@domain.com";
    }
}
