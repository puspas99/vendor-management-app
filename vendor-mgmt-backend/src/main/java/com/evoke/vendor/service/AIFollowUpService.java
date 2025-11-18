package com.evoke.vendor.service;

import com.evoke.vendor.entity.*;
import com.evoke.vendor.enums.FollowUpType;
import com.evoke.vendor.repository.AIMessageHistoryRepository;
import com.evoke.vendor.repository.FollowUpRepository;
import com.evoke.vendor.repository.VendorOnboardingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIFollowUpService {

    private final FollowUpTemplateService templateService;
    private final AIMessageHistoryRepository aiHistoryRepository;
    private final VendorOnboardingRepository vendorRepository;
    private final FollowUpRepository followUpRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${openai.api.key:7Lj73ONR6omSLjX3sqipNHQclaDj0VqenCC6DTDhAlMGVaAhR3eqJQQJ99BKACYeBjFXJ3w3AAABACOGppD2}")
    private String openAiApiKey;

    @Value("${openai.api.url:https://devxcelerate.openai.azure.com/openai/v1/chat/completions}")
    private String openAiApiUrl;

    @Value("${openai.model:gpt-4}")
    private String openAiModel;

    @Value("${openai.enabled:false}")
    private boolean openAiEnabled;

    /**
     * Generate AI-powered follow-up message
     */
    @Transactional
    public AIMessageResponse generateAIMessage(Long vendorId, FollowUpType followUpType,
                                                Integer escalationLevel,
                                                List<VendorValidationIssue> validationIssues) {
        log.info("Generating AI message for vendor: {}, type: {}", vendorId, followUpType);

        VendorOnboarding vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + vendorId));

        // Get template and AI prompt
        FollowUpTemplate template = templateService.getTemplate(followUpType, escalationLevel);
        String aiPrompt = template.getAiUserPromptTemplate();
        String baseTemplate = template.getBodyTemplate();

        String generatedMessage;
        boolean aiGenerated = false;
        Integer tokensUsed = null;
        String aiModel = null;

        if (openAiEnabled && aiPrompt != null && !aiPrompt.isEmpty()) {
            try {
                // Generate message using AI
                AIResponse aiResponse = callOpenAI(aiPrompt, vendor, validationIssues);
                generatedMessage = aiResponse.getMessage();
                tokensUsed = aiResponse.getTokensUsed();
                aiModel = aiResponse.getModel();
                aiGenerated = true;

                log.info("AI message generated successfully. Tokens used: {}", tokensUsed);
            } catch (Exception e) {
                log.error("AI generation failed, falling back to template: {}", e.getMessage());
                generatedMessage = templateService.renderTemplate(template, vendorId, validationIssues);
            }
        } else {
            log.info("AI disabled or no AI prompt, using template only");
            generatedMessage = templateService.renderTemplate(template, vendorId, validationIssues);
        }

        // Save AI history
        AIMessageHistory history = AIMessageHistory.builder()
                .aiModel(aiModel)
                .aiPrompt(aiPrompt)
                .generatedMessage(generatedMessage)
                .wasEdited(false)
                .tokensUsed(tokensUsed)
                .build();
        aiHistoryRepository.save(history);

        return AIMessageResponse.builder()
                .message(generatedMessage)
                .aiGenerated(aiGenerated)
                .tokensUsed(tokensUsed)
                .model(aiModel)
                .templateId(template.getId())
                .historyId(history.getId())
                .build();
    }

    /**
     * Call OpenAI API
     */
    private AIResponse callOpenAI(String prompt, VendorOnboarding vendor,
                                   List<VendorValidationIssue> issues) throws Exception {
        if ("PLACEHOLDER_KEY".equals(openAiApiKey)) {
            throw new RuntimeException("OpenAI API key not configured");
        }

        // Build context for AI
        StringBuilder context = new StringBuilder();
        context.append("Vendor Information:\n");
        context.append("Name: ").append(vendor.getVendorRequest() != null ? vendor.getVendorRequest().getVendorName() : "N/A").append("\n");
        context.append("Email: ").append(vendor.getVendorRequest() != null ? vendor.getVendorRequest().getVendorEmail() : "N/A").append("\n");
        context.append("Contact: ").append(vendor.getVendorRequest() != null ? vendor.getVendorRequest().getContactPerson() : "N/A").append("\n");

        if (issues != null && !issues.isEmpty()) {
            context.append("\nValidation Issues:\n");
            for (int i = 0; i < issues.size(); i++) {
                VendorValidationIssue issue = issues.get(i);
                context.append(String.format("%d. %s (%s): %s\n",
                        i + 1,
                        issue.getFieldName(),
                        issue.getSeverity(),
                        issue.getErrorMessage()));
            }
        }

        // Build request
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", openAiModel);
        requestBody.put("messages", List.of(
                Map.of("role", "system", "content", prompt),
                Map.of("role", "user", "content", context.toString())
        ));
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 500);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAiApiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        log.info("Calling OpenAI API: {}", openAiApiUrl);
        ResponseEntity<String> response = restTemplate.postForEntity(
                openAiApiUrl,
                request,
                String.class
        );

        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            String message = responseJson.at("/choices/0/message/content").asText();
            int tokensUsed = responseJson.at("/usage/total_tokens").asInt();

            return AIResponse.builder()
                    .message(message)
                    .tokensUsed(tokensUsed)
                    .model(openAiModel)
                    .build();
        } else {
            throw new RuntimeException("OpenAI API call failed: " + response.getStatusCode());
        }
    }

    /**
     * Create follow-up with AI-generated message
     */
    @Transactional
    public FollowUp createAIFollowUp(Long vendorId, FollowUpType followUpType,
                                      Integer escalationLevel,
                                      List<VendorValidationIssue> validationIssues,
                                      String fieldsConcerned) {
        log.info("Creating AI follow-up for vendor: {}", vendorId);

        AIMessageResponse aiResponse = generateAIMessage(vendorId, followUpType,
                escalationLevel, validationIssues);

        VendorOnboarding vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + vendorId));

        FollowUp followUp = FollowUp.builder()
                .vendorOnboarding(vendor)
                .followUpType(followUpType.name())
                .fieldsConcerned(fieldsConcerned)
                .message(aiResponse.getMessage())
                .status("PENDING")
                .aiGenerated(aiResponse.isAiGenerated())
                .aiModel(aiResponse.getModel())
                .aiPromptVersion("1") // Version tracking as string
                .escalationLevel(escalationLevel != null ? escalationLevel : 0)
                .createdAt(LocalDateTime.now())
                .build();

        followUp = followUpRepository.save(followUp);
        log.info("AI follow-up created with ID: {}", followUp.getId());

        return followUp;
    }

    /**
     * Update AI message history when message is edited
     */
    @Transactional
    public void markMessageEdited(Long historyId, String editedMessage) {
        log.info("Marking AI message as edited: {}", historyId);
        AIMessageHistory history = aiHistoryRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("AI history not found: " + historyId));

        history.setWasEdited(true);
        history.setFeedback(editedMessage); // Store edited version in feedback field
        aiHistoryRepository.save(history);
    }

    /**
     * Rate AI-generated message
     */
    @Transactional
    public void rateMessage(Long historyId, Integer rating, String feedback) {
        log.info("Rating AI message: {} with rating: {}", historyId, rating);
        AIMessageHistory history = aiHistoryRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("AI history not found: " + historyId));

        history.setUserRating(rating);
        history.setFeedback(feedback);
        aiHistoryRepository.save(history);
    }

    /**
     * Get AI usage statistics
     */
    public AIUsageStats getUsageStats() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long totalMessages = aiHistoryRepository.count();
        Double avgTokens = aiHistoryRepository.getAverageTokensUsed(thirtyDaysAgo);
        long editedCount = aiHistoryRepository.countEditedMessages(thirtyDaysAgo);
        Double avgRating = aiHistoryRepository.getAverageRating(thirtyDaysAgo);

        return AIUsageStats.builder()
                .totalMessagesGenerated(totalMessages)
                .averageTokensUsed(avgTokens != null ? avgTokens : 0.0)
                .editedMessagesCount(editedCount)
                .averageRating(avgRating != null ? avgRating : 0.0)
                .editRate(totalMessages > 0 ? (double) editedCount / totalMessages * 100 : 0.0)
                .build();
    }

    // Inner classes for responses
    @lombok.Builder
    @lombok.Data
    public static class AIMessageResponse {
        private String message;
        private boolean aiGenerated;
        private Integer tokensUsed;
        private String model;
        private Long templateId;
        private Long historyId;
    }

    @lombok.Builder
    @lombok.Data
    private static class AIResponse {
        private String message;
        private Integer tokensUsed;
        private String model;
    }

    @lombok.Builder
    @lombok.Data
    public static class AIUsageStats {
        private Long totalMessagesGenerated;
        private Double averageTokensUsed;
        private Long editedMessagesCount;
        private Double averageRating;
        private Double editRate;
    }
}
