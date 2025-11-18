package com.evoke.vendor.controller;

import com.evoke.vendor.dto.response.ApiResponse;
import com.evoke.vendor.entity.VendorOnboarding;
import com.evoke.vendor.entity.VendorValidationIssue;
import com.evoke.vendor.repository.VendorOnboardingRepository;
import com.evoke.vendor.repository.VendorValidationIssueRepository;
import com.evoke.vendor.service.VendorValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/procurement/validation")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ValidationController {

    private final VendorValidationService validationService;
    private final VendorOnboardingRepository vendorRepository;
    private final VendorValidationIssueRepository issueRepository;

    /**
     * Get validation issues for a vendor
     */
    @GetMapping("/issues/{vendorId}")
    public ResponseEntity<ApiResponse<List<VendorValidationIssue>>> getValidationIssues(
            @PathVariable Long vendorId) {
        log.info("Fetching validation issues for vendor: {}", vendorId);
        
        try {
            List<VendorValidationIssue> issues = validationService.getOpenIssues(vendorId);
            return ResponseEntity.ok(ApiResponse.<List<VendorValidationIssue>>builder()
                    .success(true)
                    .message("Validation issues retrieved successfully")
                    .data(issues)
                    .build());
        } catch (Exception e) {
            log.error("Error fetching validation issues", e);
            return ResponseEntity.ok(ApiResponse.<List<VendorValidationIssue>>builder()
                    .success(false)
                    .message("Failed to fetch validation issues: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Validate vendor data
     */
    @PostMapping("/validate/{vendorId}")
    public ResponseEntity<ApiResponse<List<VendorValidationIssue>>> validateVendor(
            @PathVariable Long vendorId) {
        log.info("Validating vendor: {}", vendorId);
        
        try {
            // Fetch vendor first
            VendorOnboarding vendor = vendorRepository.findById(vendorId)
                    .orElseThrow(() -> new RuntimeException("Vendor not found: " + vendorId));
            
            List<VendorValidationIssue> issues = validationService.validateVendorData(vendor);
            
            // Automatically trigger follow-ups if issues found
            if (!issues.isEmpty()) {
                validationService.autoTriggerFollowUp(vendor, issues);
            }
            
            return ResponseEntity.ok(ApiResponse.<List<VendorValidationIssue>>builder()
                    .success(true)
                    .message(issues.isEmpty() 
                            ? "Vendor data is valid" 
                            : "Validation completed with " + issues.size() + " issues")
                    .data(issues)
                    .build());
        } catch (Exception e) {
            log.error("Error validating vendor", e);
            return ResponseEntity.ok(ApiResponse.<List<VendorValidationIssue>>builder()
                    .success(false)
                    .message("Validation failed: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Resolve validation issue
     */
    @PostMapping("/resolve/{issueId}")
    public ResponseEntity<ApiResponse<VendorValidationIssue>> resolveIssue(
            @PathVariable Long issueId,
            @RequestBody(required = false) Map<String, String> request) {
        log.info("Resolving validation issue: {}", issueId);
        
        try {
            String notes = request != null ? request.get("notes") : null;
            String resolvedBy = request != null ? request.get("resolvedBy") : "System";
            validationService.resolveIssue(issueId, resolvedBy, notes);
            
            // Fetch the updated issue
            VendorValidationIssue issue = issueRepository.findById(issueId)
                    .orElseThrow(() -> new RuntimeException("Issue not found: " + issueId));
            
            return ResponseEntity.ok(ApiResponse.<VendorValidationIssue>builder()
                    .success(true)
                    .message("Issue resolved successfully")
                    .data(issue)
                    .build());
        } catch (Exception e) {
            log.error("Error resolving issue", e);
            return ResponseEntity.ok(ApiResponse.<VendorValidationIssue>builder()
                    .success(false)
                    .message("Failed to resolve issue: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Get critical issues count for a vendor
     */
    @GetMapping("/critical-count/{vendorId}")
    public ResponseEntity<ApiResponse<Long>> getCriticalIssuesCount(
            @PathVariable Long vendorId) {
        log.info("Fetching critical issues count for vendor: {}", vendorId);
        
        try {
            long count = validationService.getOpenIssues(vendorId).stream()
                    .filter(issue -> "CRITICAL".equals(issue.getSeverity().name()))
                    .count();
            
            return ResponseEntity.ok(ApiResponse.<Long>builder()
                    .success(true)
                    .message("Critical issues count retrieved")
                    .data(count)
                    .build());
        } catch (Exception e) {
            log.error("Error fetching critical issues count", e);
            return ResponseEntity.ok(ApiResponse.<Long>builder()
                    .success(false)
                    .message("Failed to fetch count: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Get all open issues count
     */
    @GetMapping("/open-count/{vendorId}")
    public ResponseEntity<ApiResponse<Long>> getOpenIssuesCount(
            @PathVariable Long vendorId) {
        log.info("Fetching open issues count for vendor: {}", vendorId);
        
        try {
            long count = validationService.getOpenIssues(vendorId).size();
            
            return ResponseEntity.ok(ApiResponse.<Long>builder()
                    .success(true)
                    .message("Open issues count retrieved")
                    .data(count)
                    .build());
        } catch (Exception e) {
            log.error("Error fetching open issues count", e);
            return ResponseEntity.ok(ApiResponse.<Long>builder()
                    .success(false)
                    .message("Failed to fetch count: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Bulk resolve issues
     */
    @PostMapping("/resolve-bulk")
    public ResponseEntity<ApiResponse<Integer>> resolveBulkIssues(
            @RequestBody Map<String, Object> request) {
        log.info("Bulk resolving validation issues");
        
        try {
            @SuppressWarnings("unchecked")
            List<Long> issueIds = (List<Long>) request.get("issueIds");
            String notes = (String) request.get("notes");
            String resolvedBy = (String) request.getOrDefault("resolvedBy", "System");
            
            int resolvedCount = 0;
            for (Long issueId : issueIds) {
                try {
                    validationService.resolveIssue(issueId, resolvedBy, notes);
                    resolvedCount++;
                } catch (Exception e) {
                    log.error("Failed to resolve issue: {}", issueId, e);
                }
            }
            
            return ResponseEntity.ok(ApiResponse.<Integer>builder()
                    .success(true)
                    .message(resolvedCount + " issues resolved successfully")
                    .data(resolvedCount)
                    .build());
        } catch (Exception e) {
            log.error("Error bulk resolving issues", e);
            return ResponseEntity.ok(ApiResponse.<Integer>builder()
                    .success(false)
                    .message("Bulk resolve failed: " + e.getMessage())
                    .build());
        }
    }
}
