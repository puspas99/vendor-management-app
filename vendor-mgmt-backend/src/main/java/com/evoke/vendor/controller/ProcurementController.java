package com.evoke.vendor.controller;

import com.evoke.vendor.dto.request.FollowUpRequestDto;
import com.evoke.vendor.dto.request.VendorRequestDto;
import com.evoke.vendor.dto.response.*;
import com.evoke.vendor.entity.FollowUp;
import com.evoke.vendor.enums.VendorOnboardingStatus;
import com.evoke.vendor.scheduler.UnresponsiveVendorScheduler;
import com.evoke.vendor.service.FollowUpService;
import com.evoke.vendor.service.VendorActivityLogService;
import com.evoke.vendor.service.VendorAnalyticsService;
import com.evoke.vendor.service.VendorOnboardingService;
import com.evoke.vendor.service.VendorPdfExportService;
import com.evoke.vendor.service.VendorRequestService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/procurement")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@SecurityRequirement(name = "Bearer Authentication")
public class ProcurementController {

    private final VendorRequestService vendorRequestService;
    private final VendorOnboardingService vendorOnboardingService;
    private final FollowUpService followUpService;
    private final VendorActivityLogService activityLogService;
    private final UnresponsiveVendorScheduler unresponsiveVendorScheduler;
    private final VendorPdfExportService pdfExportService;
    private final VendorAnalyticsService analyticsService;

    @PostMapping("/vendor/onboarding-request")
    public ResponseEntity<ApiResponse<VendorRequestResponse>> createVendorRequest(
            @Valid @RequestBody VendorRequestDto requestDto
    ) {
        try {
            VendorRequestResponse response = vendorRequestService.createVendorRequest(requestDto);
          
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(
                            "Vendor onboarding request created and invitation sent",
                            response
                    ));
        } catch (IllegalArgumentException e) {
            log.error("Validation error creating vendor request", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating vendor request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create vendor request: " + e.getMessage()));
        }
    }

    @GetMapping("/vendors")
    public ResponseEntity<ApiResponse<List<VendorRequestResponse>>> getAllVendors(
            @RequestParam(required = false) String status
    ) {
        try {
            List<VendorRequestResponse> vendors;
            
            if (status != null && !status.isEmpty()) {
                try {
                    VendorOnboardingStatus enumStatus = VendorOnboardingStatus.valueOf(status.toUpperCase());
                    vendors = vendorRequestService.getVendorRequestsByStatus(enumStatus);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status value: {}", status);
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(ApiResponse.error("Invalid status value: " + status + ". Valid values are: " + 
                                java.util.Arrays.toString(VendorOnboardingStatus.values())));
                }
            } else {
                vendors = vendorRequestService.getAllVendorRequests();
            }

            return ResponseEntity.ok(ApiResponse.success(
                    "Vendors retrieved successfully",
                    vendors
            ));
        } catch (Exception e) {
            log.error("Error retrieving vendors", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve vendors: " + e.getMessage()));
        }
    }

    @GetMapping("/vendors/deleted")
    public ResponseEntity<ApiResponse<List<VendorRequestResponse>>> getDeletedVendors() {
        try {
            List<VendorRequestResponse> vendors = vendorRequestService.getDeletedVendorRequests();
            return ResponseEntity.ok(ApiResponse.success(
                    "Deleted vendors retrieved successfully",
                    vendors
            ));
        } catch (Exception e) {
            log.error("Error retrieving deleted vendors", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve deleted vendors: " + e.getMessage()));
        }
    }

    @GetMapping("/vendor/{id}")
    public ResponseEntity<ApiResponse<VendorRequestResponse>> getVendorById(@PathVariable Long id) {
        try {
            VendorRequestResponse vendor = vendorRequestService.getVendorRequestById(id);
            return ResponseEntity.ok(ApiResponse.success(
                    "Vendor retrieved successfully",
                    vendor
            ));
        } catch (IllegalArgumentException e) {
            log.error("Vendor not found", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error retrieving vendor", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve vendor: " + e.getMessage()));
        }
    }

    @GetMapping("/vendor/{id}/details")
    public ResponseEntity<ApiResponse<VendorOnboardingResponse>> getVendorDetails(@PathVariable Long id) {
        try {
            VendorOnboardingResponse details = vendorOnboardingService.getVendorOnboardingByRequestId(id);
            return ResponseEntity.ok(ApiResponse.success(
                    "Vendor details retrieved successfully",
                    details
            ));
        } catch (IllegalArgumentException e) {
            log.error("Vendor details not found", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error retrieving vendor details", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve vendor details: " + e.getMessage()));
        }
    }

    @PostMapping("/vendor/{id}/follow-up")
    public ResponseEntity<ApiResponse<FollowUpResponse>> createFollowUp(
            @PathVariable Long id,
            @Valid @RequestBody FollowUpRequestDto requestDto
    ) {
        try {
            VendorOnboardingResponse vendorOnboarding = vendorOnboardingService.getVendorOnboardingByRequestId(id);
            FollowUpResponse response = followUpService.createFollowUp(vendorOnboarding.getId(), requestDto);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(
                            "Follow-up created and sent successfully",
                            response
                    ));
        } catch (IllegalArgumentException e) {
            log.error("Validation error creating follow-up", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating follow-up", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create follow-up: " + e.getMessage()));
        }
    }

    @GetMapping("/vendor/{id}/follow-ups")
    public ResponseEntity<ApiResponse<List<FollowUpResponse>>> getVendorFollowUps(@PathVariable Long id) {
        try {
            VendorOnboardingResponse vendorOnboarding = vendorOnboardingService.getVendorOnboardingByRequestId(id);
            List<FollowUpResponse> followUps = followUpService.getFollowUpsByVendorOnboarding(vendorOnboarding.getId());
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Follow-ups retrieved successfully",
                    followUps
            ));
        } catch (IllegalArgumentException e) {
            log.error("Vendor not found", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error retrieving follow-ups", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve follow-ups: " + e.getMessage()));
        }
    }

    @PutMapping("/vendor/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateVendorStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        try {
            VendorOnboardingStatus enumStatus;
            try {
                enumStatus = VendorOnboardingStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status value: {}", status);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Invalid status value: " + status + ". Valid values are: " + 
                            java.util.Arrays.toString(VendorOnboardingStatus.values())));
            }
            vendorRequestService.updateVendorRequestStatus(id, enumStatus);
            return ResponseEntity.ok(ApiResponse.success(
                    "Vendor status updated successfully",
                    null
            ));
        } catch (IllegalArgumentException e) {
            log.error("Validation error updating status", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating vendor status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update vendor status: " + e.getMessage()));
        }
    }

    @DeleteMapping("/vendor/{id}")
    public ResponseEntity<ApiResponse<String>> softDeleteVendor(@PathVariable Long id) {
        try {
            vendorRequestService.softDeleteVendorRequest(id);
            return ResponseEntity.ok(ApiResponse.success(
                    "Vendor soft deleted successfully (can be restored)",
                    null
            ));
        } catch (IllegalArgumentException e) {
            log.error("Vendor not found", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error soft deleting vendor", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to soft delete vendor: " + e.getMessage()));
        }
    }

    @DeleteMapping("/vendor/{id}/permanent")
    public ResponseEntity<ApiResponse<String>> hardDeleteVendor(@PathVariable Long id) {
        try {
            vendorRequestService.hardDeleteVendorRequest(id);
            return ResponseEntity.ok(ApiResponse.success(
                    "Vendor permanently deleted",
                    null
            ));
        } catch (IllegalArgumentException e) {
            log.error("Vendor not found", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error permanently deleting vendor", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to permanently delete vendor: " + e.getMessage()));
        }
    }

    @PutMapping("/vendor/{id}/restore")
    public ResponseEntity<ApiResponse<String>> restoreVendor(@PathVariable Long id) {
        try {
            vendorRequestService.restoreVendorRequest(id);
            return ResponseEntity.ok(ApiResponse.success(
                    "Vendor restored successfully",
                    null
            ));
        } catch (IllegalArgumentException e) {
            log.error("Vendor not found", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error restoring vendor", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to restore vendor: " + e.getMessage()));
        }
    }

    @PostMapping("/vendor/{id}/resend-invitation")
    public ResponseEntity<ApiResponse<String>> resendInvitation(@PathVariable Long id) {
        try {
            vendorRequestService.resendInvitation(id);
            return ResponseEntity.ok(ApiResponse.success(
                    "Invitation resent successfully",
                    null
            ));
        } catch (IllegalArgumentException e) {
            log.error("Vendor not found", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error resending invitation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to resend invitation: " + e.getMessage()));
        }
    }

    @PutMapping("/follow-up/{followUpId}/resolve")
    public ResponseEntity<ApiResponse<String>> resolveFollowUp(@PathVariable Long followUpId) {
        try {
            followUpService.resolveFollowUp(followUpId);
            return ResponseEntity.ok(ApiResponse.success(
                    "Follow-up resolved successfully",
                    null
            ));
        } catch (IllegalArgumentException e) {
            log.error("Follow-up not found", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error resolving follow-up", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to resolve follow-up: " + e.getMessage()));
        }
    }

    // ========== Activity Log Endpoints ==========
    
    @GetMapping("/vendor/{id}/activity-log")
    public ResponseEntity<ApiResponse<List<VendorActivityLogResponse>>> getVendorActivityLog(
            @PathVariable Long id
    ) {
        try {
            List<VendorActivityLogResponse> activities = activityLogService.getVendorActivityLog(id);
            return ResponseEntity.ok(ApiResponse.success(
                    "Activity log retrieved successfully",
                    activities
            ));
        } catch (Exception e) {
            log.error("Error retrieving activity log", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve activity log: " + e.getMessage()));
        }
    }

    @GetMapping("/activity-log/all")
    public ResponseEntity<ApiResponse<List<VendorActivityLogResponse>>> getAllActivities() {
        try {
            List<VendorActivityLogResponse> activities = activityLogService.getAllActivities();
            return ResponseEntity.ok(ApiResponse.success(
                    "All activities retrieved successfully",
                    activities
            ));
        } catch (Exception e) {
            log.error("Error retrieving all activities", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve activities: " + e.getMessage()));
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        // Create a user-friendly error message
        StringBuilder message = new StringBuilder("Validation failed: ");
        errors.forEach((field, error) -> 
            message.append(field).append(" - ").append(error).append("; ")
        );
        
        log.warn("Validation errors: {}", errors);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(message.toString().trim(), errors));
    }
    
    /**
     * Manual trigger for unresponsive vendor check (for testing purposes).
     * In production, this runs automatically daily at 9 AM.
     */
    @PostMapping("/check-unresponsive-vendors")
    public ResponseEntity<ApiResponse<String>> checkUnresponsiveVendors() {
        try {
            log.info("Manual trigger for unresponsive vendor check initiated");
            unresponsiveVendorScheduler.checkUnresponsiveVendorsManually();
            return ResponseEntity.ok(
                    ApiResponse.success(
                            "Unresponsive vendor check completed successfully",
                            "Check logs for details on notifications sent"
                    )
            );
        } catch (Exception e) {
            log.error("Error during manual unresponsive vendor check", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to check unresponsive vendors: " + e.getMessage(), null));
        }
    }
    
    /**
     * Export vendor list to PDF
     */
    @GetMapping("/vendors/export/pdf")
    public ResponseEntity<byte[]> exportVendorsToPdf(@RequestParam(required = false) String status) {
        try {
            log.info("Exporting vendors to PDF, status filter: {}", status);
            
            // Get all vendors and filter if needed
            List<VendorRequestResponse> vendors = vendorRequestService.getAllVendorRequests();
            
            // Apply status filter if provided
            if (status != null && !status.isEmpty()) {
                final String filterStatus = status;
                vendors = vendors.stream()
                        .filter(v -> filterStatus.equalsIgnoreCase(v.getStatus()))
                        .toList();
            }
            
            // Generate PDF
            byte[] pdfBytes = pdfExportService.exportVendorListToPdf(vendors);
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "vendors_report.pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            
            log.info("PDF export completed successfully, size: {} bytes", pdfBytes.length);
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            log.error("Error exporting vendors to PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Export detailed vendor report to PDF with statistics
     */
    @GetMapping("/vendors/export/detailed-pdf")
    public ResponseEntity<byte[]> exportDetailedVendorReport(@RequestParam(required = false) String status) {
        try {
            log.info("Exporting detailed vendor report to PDF, status filter: {}", status);
            
            // Get all vendors and filter if needed
            List<VendorRequestResponse> vendors = vendorRequestService.getAllVendorRequests();
            
            // Apply status filter if provided
            if (status != null && !status.isEmpty()) {
                final String filterStatus = status;
                vendors = vendors.stream()
                        .filter(v -> filterStatus.equalsIgnoreCase(v.getStatus()))
                        .toList();
            }
            
            // Generate detailed PDF
            byte[] pdfBytes = pdfExportService.exportDetailedVendorReport(vendors);
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "vendors_detailed_report.pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            
            log.info("Detailed PDF export completed successfully, size: {} bytes", pdfBytes.length);
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            log.error("Error exporting detailed vendor report to PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get vendor analytics for dashboard
     */
    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<VendorAnalyticsResponse>> getVendorAnalytics() {
        try {
            log.info("Fetching vendor analytics");
            VendorAnalyticsResponse analytics = analyticsService.getVendorAnalytics();
            return ResponseEntity.ok(ApiResponse.success("Analytics retrieved successfully", analytics));
        } catch (Exception e) {
            log.error("Error fetching vendor analytics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch analytics: " + e.getMessage(), null));
        }
    }

    /**
     * Get all follow-ups with optional filters
     */
    @GetMapping("/follow-ups")
    public ResponseEntity<ApiResponse<List<com.evoke.vendor.dto.response.FollowUpResponse>>> getAllFollowUps(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {
        try {
            log.info("Fetching all follow-ups - status: {}, type: {}", status, type);
            List<com.evoke.vendor.dto.response.FollowUpResponse> followUps = followUpService.getAllFollowUps(status, type);
            return ResponseEntity.ok(ApiResponse.success("Follow-ups retrieved successfully", followUps));
        } catch (Exception e) {
            log.error("Error fetching follow-ups", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch follow-ups: " + e.getMessage(), null));
        }
    }
}

