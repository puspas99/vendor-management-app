package com.evoke.vendor.service;

import com.evoke.vendor.entity.FollowUpTemplate;
import com.evoke.vendor.entity.VendorOnboarding;
import com.evoke.vendor.entity.VendorValidationIssue;
import com.evoke.vendor.enums.FollowUpType;
import com.evoke.vendor.repository.FollowUpTemplateRepository;
import com.evoke.vendor.repository.VendorOnboardingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class FollowUpTemplateService {

    private final FollowUpTemplateRepository templateRepository;
    private final VendorOnboardingRepository vendorRepository;

    /**
     * Get template by type and escalation level
     */
    public FollowUpTemplate getTemplate(FollowUpType type, Integer escalationLevel) {
        log.info("Fetching template for type: {}, escalation level: {}", type, escalationLevel);
        
        Optional<FollowUpTemplate> template = templateRepository
                .findByFollowUpTypeAndEscalationLevel(type.name(), escalationLevel);
        
        if (template.isEmpty() && escalationLevel > 0) {
            // Fallback to base template if escalation template not found
            log.warn("Escalation template not found, falling back to base template");
            template = templateRepository.findByFollowUpTypeAndEscalationLevel(type.name(), 0);
        }
        
        return template.orElseThrow(() -> 
            new RuntimeException("No template found for type: " + type));
    }

    /**
     * Get all active templates
     */
    public List<FollowUpTemplate> getAllActiveTemplates() {
        return templateRepository.findByIsActiveTrue();
    }

    /**
     * Get templates by type
     */
    public List<FollowUpTemplate> getTemplatesByType(FollowUpType type) {
        return templateRepository.findByFollowUpTypeAndIsActiveTrue(type.name());
    }

    /**
     * Render template with variable substitution
     */
    public String renderTemplate(FollowUpTemplate template, Long vendorId, 
                                  List<VendorValidationIssue> validationIssues) {
        log.info("Rendering template: {} for vendor: {}", template.getTemplateName(), vendorId);
        
        VendorOnboarding vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + vendorId));
        
        Map<String, String> variables = buildVariableMap(vendor, validationIssues);
        String content = template.getBodyTemplate();
        
        // Replace all variables in format {{variableName}}
        Pattern pattern = Pattern.compile("\\{\\{([^}]+)\\}\\}");
        Matcher matcher = pattern.matcher(content);
        
        StringBuffer result = new StringBuffer();
        while (matcher.find()) {
            String variableName = matcher.group(1).trim();
            String replacement = variables.getOrDefault(variableName, "");
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);
        
        log.info("Template rendered successfully");
        return result.toString();
    }

    /**
     * Build variable map for template substitution
     */
    private Map<String, String> buildVariableMap(VendorOnboarding vendor, 
                                                   List<VendorValidationIssue> issues) {
        Map<String, String> variables = new HashMap<>();
        
        // Basic vendor information from VendorRequest
        String vendorName = vendor.getVendorRequest() != null && vendor.getVendorRequest().getVendorName() != null 
            ? vendor.getVendorRequest().getVendorName() : "";
        String vendorEmail = vendor.getVendorRequest() != null && vendor.getVendorRequest().getVendorEmail() != null 
            ? vendor.getVendorRequest().getVendorEmail() : "";
        String contactPerson = vendor.getVendorRequest() != null && vendor.getVendorRequest().getContactPerson() != null 
            ? vendor.getVendorRequest().getContactPerson() : "";
        String contactNumber = vendor.getVendorRequest() != null && vendor.getVendorRequest().getContactNumber() != null 
            ? vendor.getVendorRequest().getContactNumber() : "";
        
        variables.put("vendorName", vendorName);
        variables.put("vendorEmail", vendorEmail);
        variables.put("contactPerson", contactPerson);
        variables.put("contactNumber", contactNumber);
        
        // Validation issues
        if (issues != null && !issues.isEmpty()) {
            StringBuilder missingFields = new StringBuilder();
            StringBuilder incorrectFields = new StringBuilder();
            int criticalCount = 0;
            
            for (VendorValidationIssue issue : issues) {
                if (issue.getFieldName().contains("missing") || 
                    issue.getErrorMessage().toLowerCase().contains("missing")) {
                    if (missingFields.length() > 0) missingFields.append(", ");
                    missingFields.append(issue.getFieldName());
                }
                
                if (issue.getErrorMessage().toLowerCase().contains("incorrect") ||
                    issue.getErrorMessage().toLowerCase().contains("invalid")) {
                    if (incorrectFields.length() > 0) incorrectFields.append(", ");
                    incorrectFields.append(issue.getFieldName());
                }
                
                if ("CRITICAL".equals(issue.getSeverity().name())) {
                    criticalCount++;
                }
            }
            
            variables.put("missingFields", missingFields.toString());
            variables.put("incorrectFields", incorrectFields.toString());
            variables.put("issueCount", String.valueOf(issues.size()));
            variables.put("criticalIssueCount", String.valueOf(criticalCount));
            
            // Build detailed issue list
            StringBuilder issueList = new StringBuilder();
            for (int i = 0; i < issues.size(); i++) {
                VendorValidationIssue issue = issues.get(i);
                issueList.append(String.format("%d. %s: %s", 
                    i + 1, issue.getFieldName(), issue.getErrorMessage()));
                if (i < issues.size() - 1) {
                    issueList.append("\n");
                }
            }
            variables.put("issueList", issueList.toString());
        } else {
            variables.put("missingFields", "");
            variables.put("incorrectFields", "");
            variables.put("issueCount", "0");
            variables.put("criticalIssueCount", "0");
            variables.put("issueList", "");
        }
        
        // Current date
        variables.put("currentDate", new Date().toString());
        
        // System information
        variables.put("companyName", "Evoke Technologies");
        variables.put("supportEmail", "procurement@evoke.com");
        variables.put("portalUrl", "https://vendor-portal.evoke.com");
        
        return variables;
    }

    /**
     * Create or update template
     */
    @Transactional
    public FollowUpTemplate saveTemplate(FollowUpTemplate template) {
        log.info("Saving template: {}", template.getTemplateName());
        return templateRepository.save(template);
    }

    /**
     * Deactivate template
     */
    @Transactional
    public void deactivateTemplate(Long templateId) {
        log.info("Deactivating template: {}", templateId);
        FollowUpTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found: " + templateId));
        template.setIsActive(false);
        templateRepository.save(template);
    }

    /**
     * Get template with AI prompt
     */
    public String getAIPrompt(FollowUpType type, Integer escalationLevel) {
        FollowUpTemplate template = getTemplate(type, escalationLevel);
        return template.getAiSystemPrompt();
    }
}
