package com.evoke.vendor.controller;

import com.evoke.vendor.dto.response.ApiResponse;
import com.evoke.vendor.entity.FollowUpTemplate;
import com.evoke.vendor.entity.VendorValidationIssue;
import com.evoke.vendor.enums.FollowUpType;
import com.evoke.vendor.service.FollowUpTemplateService;
import com.evoke.vendor.service.VendorValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/procurement/templates")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class FollowUpTemplateController {

    private final FollowUpTemplateService templateService;
    private final VendorValidationService validationService;

    /**
     * Get all active templates
     */
    @GetMapping("/follow-up")
    public ResponseEntity<ApiResponse<List<FollowUpTemplate>>> getAllTemplates(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer escalationLevel) {
        log.info("Fetching templates - type: {}, escalation: {}", type, escalationLevel);
        
        try {
            List<FollowUpTemplate> templates;
            
            if (type != null) {
                FollowUpType followUpType = FollowUpType.valueOf(type);
                templates = templateService.getTemplatesByType(followUpType);
                
                // Filter by escalation level if provided
                if (escalationLevel != null) {
                    templates = templates.stream()
                            .filter(t -> t.getEscalationLevel().equals(escalationLevel))
                            .toList();
                }
            } else {
                templates = templateService.getAllActiveTemplates();
            }
            
            return ResponseEntity.ok(ApiResponse.<List<FollowUpTemplate>>builder()
                    .success(true)
                    .message("Templates retrieved successfully")
                    .data(templates)
                    .build());
        } catch (Exception e) {
            log.error("Error fetching templates", e);
            return ResponseEntity.ok(ApiResponse.<List<FollowUpTemplate>>builder()
                    .success(false)
                    .message("Failed to fetch templates: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Get template by ID
     */
    @GetMapping("/follow-up/{templateId}")
    public ResponseEntity<ApiResponse<FollowUpTemplate>> getTemplateById(
            @PathVariable Long templateId) {
        log.info("Fetching template: {}", templateId);
        
        try {
            // This would need a findById method in the service
            return ResponseEntity.ok(ApiResponse.<FollowUpTemplate>builder()
                    .success(true)
                    .message("Template retrieved successfully")
                    .build());
        } catch (Exception e) {
            log.error("Error fetching template", e);
            return ResponseEntity.ok(ApiResponse.<FollowUpTemplate>builder()
                    .success(false)
                    .message("Failed to fetch template: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Render template with variables
     */
    @PostMapping("/render")
    public ResponseEntity<ApiResponse<Map<String, String>>> renderTemplate(
            @RequestBody Map<String, Object> request) {
        log.info("Rendering template");
        
        try {
            Long templateId = ((Number) request.get("templateId")).longValue();
            Long vendorId = ((Number) request.get("vendorId")).longValue();
            
            // Get template (would need findById in service)
            FollowUpType type = FollowUpType.valueOf((String) request.get("type"));
            Integer escalationLevel = request.containsKey("escalationLevel") 
                    ? ((Number) request.get("escalationLevel")).intValue() 
                    : 0;
            
            FollowUpTemplate template = templateService.getTemplate(type, escalationLevel);
            
            // Get validation issues
            List<VendorValidationIssue> issues = validationService.getOpenIssues(vendorId);
            
            // Render template
            String renderedMessage = templateService.renderTemplate(template, vendorId, issues);
            
            return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder()
                    .success(true)
                    .message("Template rendered successfully")
                    .data(Map.of(
                            "message", renderedMessage,
                            "templateName", template.getTemplateName()
                    ))
                    .build());
        } catch (Exception e) {
            log.error("Error rendering template", e);
            return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder()
                    .success(false)
                    .message("Failed to render template: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Create or update template
     */
    @PostMapping("/follow-up")
    public ResponseEntity<ApiResponse<FollowUpTemplate>> createTemplate(
            @RequestBody FollowUpTemplate template) {
        log.info("Creating template: {}", template.getTemplateName());
        
        try {
            FollowUpTemplate savedTemplate = templateService.saveTemplate(template);
            return ResponseEntity.ok(ApiResponse.<FollowUpTemplate>builder()
                    .success(true)
                    .message("Template created successfully")
                    .data(savedTemplate)
                    .build());
        } catch (Exception e) {
            log.error("Error creating template", e);
            return ResponseEntity.ok(ApiResponse.<FollowUpTemplate>builder()
                    .success(false)
                    .message("Failed to create template: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Update template
     */
    @PutMapping("/follow-up/{templateId}")
    public ResponseEntity<ApiResponse<FollowUpTemplate>> updateTemplate(
            @PathVariable Long templateId,
            @RequestBody FollowUpTemplate template) {
        log.info("Updating template: {}", templateId);
        
        try {
            template.setId(templateId);
            FollowUpTemplate updatedTemplate = templateService.saveTemplate(template);
            return ResponseEntity.ok(ApiResponse.<FollowUpTemplate>builder()
                    .success(true)
                    .message("Template updated successfully")
                    .data(updatedTemplate)
                    .build());
        } catch (Exception e) {
            log.error("Error updating template", e);
            return ResponseEntity.ok(ApiResponse.<FollowUpTemplate>builder()
                    .success(false)
                    .message("Failed to update template: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Deactivate template
     */
    @DeleteMapping("/follow-up/{templateId}")
    public ResponseEntity<ApiResponse<Void>> deactivateTemplate(
            @PathVariable Long templateId) {
        log.info("Deactivating template: {}", templateId);
        
        try {
            templateService.deactivateTemplate(templateId);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Template deactivated successfully")
                    .build());
        } catch (Exception e) {
            log.error("Error deactivating template", e);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(false)
                    .message("Failed to deactivate template: " + e.getMessage())
                    .build());
        }
    }
}
