package com.evoke.vendor.validation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidationResult {
    private boolean valid;
    private String errorMessage;
    private String fieldName;
    private String currentValue;
    private String expectedValue;
    private String suggestion;
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    private String issueType; // MISSING_DATA, INCORRECT_DATA, etc.
}
