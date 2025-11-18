package com.evoke.vendor.controller;

import com.evoke.vendor.dto.response.ApiResponse;
import com.evoke.vendor.entity.FollowUp;
import com.evoke.vendor.entity.VendorValidationIssue;
import com.evoke.vendor.enums.FollowUpType;
import com.evoke.vendor.service.AIFollowUpService;
import com.evoke.vendor.service.VendorValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/procurement")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AIFollowUpController {

    private final AIFollowUpService aiFollowUpService;
    private final VendorValidationService validationService;

    /**
     * Generate AI message for follow-up
     */
    @PostMapping("/ai/generate-message")
    public ResponseEntity<ApiResponse<AIFollowUpService.AIMessageResponse>> generateAIMessage(
            @RequestBody Map<String, Object> request) {
        log.info("Generating AI message");
        
        try {
            Long vendorId = ((Number) request.get("vendorId")).longValue();
            Long templateId = request.containsKey("templateId") 
                    ? ((Number) request.get("templateId")).longValue() 
                    : null;
            FollowUpType followUpType = FollowUpType.valueOf((String) request.get("followUpType"));
            Integer escalationLevel = request.containsKey("escalationLevel")
                    ? ((Number) request.get("escalationLevel")).intValue()
                    : 0;
            
            // Get validation issues
            List<VendorValidationIssue> issues = validationService.getOpenIssues(vendorId);
            
            // Generate AI message
            AIFollowUpService.AIMessageResponse response = aiFollowUpService.generateAIMessage(
                    vendorId, followUpType, escalationLevel, issues);
            
            return ResponseEntity.ok(ApiResponse.<AIFollowUpService.AIMessageResponse>builder()
                    .success(true)
                    .message("AI message generated successfully")
                    .data(response)
                    .build());
        } catch (Exception e) {
            log.error("Error generating AI message", e);
            return ResponseEntity.ok(ApiResponse.<AIFollowUpService.AIMessageResponse>builder()
                    .success(false)
                    .message("Failed to generate AI message: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Create follow-up with AI-generated message
     */
    @PostMapping("/follow-ups/with-ai")
    public ResponseEntity<ApiResponse<FollowUp>> createAIFollowUp(
            @RequestBody Map<String, Object> request) {
        log.info("Creating AI follow-up");
        
        try {
            Long vendorId = ((Number) request.get("vendorId")).longValue();
            FollowUpType followUpType = FollowUpType.valueOf((String) request.get("followUpType"));
            Integer escalationLevel = request.containsKey("escalationLevel")
                    ? ((Number) request.get("escalationLevel")).intValue()
                    : 0;
            String fieldsConcerned = (String) request.get("fieldsConcerned");
            
            // Get validation issues
            List<VendorValidationIssue> issues = validationService.getOpenIssues(vendorId);
            
            // Create AI follow-up
            FollowUp followUp = aiFollowUpService.createAIFollowUp(
                    vendorId, followUpType, escalationLevel, issues, fieldsConcerned);
            
            return ResponseEntity.ok(ApiResponse.<FollowUp>builder()
                    .success(true)
                    .message("AI follow-up created successfully")
                    .data(followUp)
                    .build());
        } catch (Exception e) {
            log.error("Error creating AI follow-up", e);
            return ResponseEntity.ok(ApiResponse.<FollowUp>builder()
                    .success(false)
                    .message("Failed to create AI follow-up: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Mark AI message as edited
     */
    @PostMapping("/ai/mark-edited/{historyId}")
    public ResponseEntity<ApiResponse<Void>> markMessageEdited(
            @PathVariable Long historyId,
            @RequestBody Map<String, String> request) {
        log.info("Marking AI message as edited: {}", historyId);
        
        try {
            String editedMessage = request.get("editedMessage");
            aiFollowUpService.markMessageEdited(historyId, editedMessage);
            
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Message marked as edited")
                    .build());
        } catch (Exception e) {
            log.error("Error marking message as edited", e);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(false)
                    .message("Failed to mark message as edited: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Rate AI-generated message
     */
    @PostMapping("/ai/rate/{historyId}")
    public ResponseEntity<ApiResponse<Void>> rateMessage(
            @PathVariable Long historyId,
            @RequestBody Map<String, Object> request) {
        log.info("Rating AI message: {}", historyId);
        
        try {
            Integer rating = ((Number) request.get("rating")).intValue();
            String feedback = (String) request.get("feedback");
            
            aiFollowUpService.rateMessage(historyId, rating, feedback);
            
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Message rated successfully")
                    .build());
        } catch (Exception e) {
            log.error("Error rating message", e);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(false)
                    .message("Failed to rate message: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Get AI usage statistics
     */
    @GetMapping("/ai/stats")
    public ResponseEntity<ApiResponse<AIFollowUpService.AIUsageStats>> getUsageStats() {
        log.info("Fetching AI usage statistics");
        
        try {
            AIFollowUpService.AIUsageStats stats = aiFollowUpService.getUsageStats();
            
            return ResponseEntity.ok(ApiResponse.<AIFollowUpService.AIUsageStats>builder()
                    .success(true)
                    .message("AI usage statistics retrieved")
                    .data(stats)
                    .build());
        } catch (Exception e) {
            log.error("Error fetching AI usage stats", e);
            return ResponseEntity.ok(ApiResponse.<AIFollowUpService.AIUsageStats>builder()
                    .success(false)
                    .message("Failed to fetch AI usage stats: " + e.getMessage())
                    .build());
        }
    }
}
