package com.evoke.vendor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentVerificationResult {
    
    private boolean verified;
    private double confidenceScore;
    private String verificationStatus;  // HIGH_CONFIDENCE, MEDIUM_CONFIDENCE, LOW_CONFIDENCE, ERROR
    private String message;
    
    private List<String> matchedFields;
    private List<String> missingFields;
    private Map<String, String> fieldVerificationDetails;
    
    private Integer totalFieldsChecked;
    private Integer fieldsMatched;
    
    // Additional metadata
    private String documentType;
    private Long processingTimeMs;
}
