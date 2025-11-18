package com.evoke.vendor.service;

import com.evoke.vendor.entity.VendorOnboarding;
import com.evoke.vendor.entity.VendorValidationIssue;
import com.evoke.vendor.enums.ValidationIssueSeverity;
import com.evoke.vendor.enums.ValidationIssueStatus;
import com.evoke.vendor.repository.VendorValidationIssueRepository;
import com.evoke.vendor.validation.ValidationResult;
import com.evoke.vendor.validation.ValidationRule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorValidationService {
    
    private final List<ValidationRule> validationRules;
    private final VendorValidationIssueRepository issueRepository;
    private final FollowUpService followUpService;

    @Transactional
    public List<VendorValidationIssue> validateVendorData(VendorOnboarding vendor) {
        log.info("Starting validation for vendor onboarding: {}", vendor.getId());
        List<VendorValidationIssue> issues = new ArrayList<>();
        
        for (ValidationRule rule : validationRules) {
            try {
                Object fieldValue = extractFieldValue(vendor, rule.getFieldName());
                ValidationResult result = rule.validate(fieldValue, vendor);
                
                if (!result.isValid()) {
                    // Save issue to database
                    VendorValidationIssue issue = VendorValidationIssue.builder()
                        .vendorOnboarding(vendor)
                        .issueType(result.getIssueType() != null ? result.getIssueType() : rule.getRuleName())
                        .fieldName(rule.getFieldName())
                        .currentValue(result.getCurrentValue())
                        .expectedValue(result.getExpectedValue())
                        .errorMessage(result.getErrorMessage())
                        .validationRule(rule.getRuleName())
                        .severity(ValidationIssueSeverity.valueOf(result.getSeverity()))
                        .status(ValidationIssueStatus.OPEN)
                        .build();
                        
                    VendorValidationIssue savedIssue = issueRepository.save(issue);
                    issues.add(savedIssue);
                    
                    log.debug("Validation failed for field {}: {}", rule.getFieldName(), result.getErrorMessage());
                }
            } catch (Exception e) {
                log.error("Error validating field {}: {}", rule.getFieldName(), e.getMessage(), e);
            }
        }
        
        log.info("Validation completed. Found {} issue(s) for vendor onboarding: {}", issues.size(), vendor.getId());
        return issues;
    }
    
    @Transactional
    public void autoTriggerFollowUp(VendorOnboarding vendor, List<VendorValidationIssue> issues) {
        if (issues.isEmpty()) {
            log.info("No validation issues found, skipping follow-up for vendor: {}", vendor.getId());
            return;
        }
        
        log.info("Auto-triggering follow-ups for {} issue(s) for vendor: {}", issues.size(), vendor.getId());
        
        // Group issues by type
        var groupedIssues = issues.stream()
            .collect(Collectors.groupingBy(VendorValidationIssue::getIssueType));
        
        // Generate follow-up for each issue type
        for (var entry : groupedIssues.entrySet()) {
            String issueType = entry.getKey();
            List<VendorValidationIssue> typeIssues = entry.getValue();
            
            log.debug("Creating follow-up for issue type: {} with {} issue(s)", issueType, typeIssues.size());
            
            // Build message context
            String fieldsConcerned = typeIssues.stream()
                .map(VendorValidationIssue::getFieldName)
                .collect(Collectors.joining(", "));
            
            String message = buildFollowUpMessage(issueType, typeIssues);
            
            // Create automatic follow-up
            followUpService.createAutomaticFollowUp(
                vendor,
                issueType,
                message,
                fieldsConcerned
            );
        }
    }
    
    @Transactional(readOnly = true)
    public List<VendorValidationIssue> getOpenIssues(Long vendorOnboardingId) {
        return issueRepository.findByVendorOnboardingIdAndStatus(
            vendorOnboardingId, 
            ValidationIssueStatus.OPEN
        );
    }
    
    @Transactional
    public void resolveIssue(Long issueId, String resolvedBy, String notes) {
        VendorValidationIssue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new IllegalArgumentException("Validation issue not found: " + issueId));
        
        issue.setStatus(ValidationIssueStatus.RESOLVED);
        issue.setResolvedBy(resolvedBy);
        issue.setResolutionNotes(notes);
        issue.setResolvedAt(java.time.LocalDateTime.now());
        
        issueRepository.save(issue);
        log.info("Resolved validation issue: {}", issueId);
    }
    
    private Object extractFieldValue(VendorOnboarding vendor, String fieldName) {
        try {
            // Handle nested fields (e.g., "contactDetails.emailAddress")
            String[] parts = fieldName.split("\\.");
            Object currentObject = vendor;
            
            for (String part : parts) {
                if (currentObject == null) return null;
                
                Field field = currentObject.getClass().getDeclaredField(part);
                field.setAccessible(true);
                currentObject = field.get(currentObject);
            }
            
            return currentObject;
        } catch (Exception e) {
            log.warn("Could not extract field value for {}: {}", fieldName, e.getMessage());
            return null;
        }
    }
    
    private String buildFollowUpMessage(String issueType, List<VendorValidationIssue> issues) {
        StringBuilder message = new StringBuilder();
        message.append("We have identified the following issues with your submission:\n\n");
        
        for (VendorValidationIssue issue : issues) {
            message.append("• ").append(issue.getFieldName())
                   .append(": ").append(issue.getErrorMessage())
                   .append("\n");
        }
        
        message.append("\nPlease review and update the information at your earliest convenience.");
        return message.toString();
    }
}
