package com.evoke.vendor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowUpResponse {
    
    private Long id;
    private Long vendorOnboardingId;
    private String vendorName;
    private String followUpType;
    private String message;
    private String fieldsConcerned;
    private String initiatedBy;
    private Boolean isAutomatic;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
