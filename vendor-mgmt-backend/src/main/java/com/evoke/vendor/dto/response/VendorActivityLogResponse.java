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
public class VendorActivityLogResponse {
    
    private Long id;
    private Long vendorRequestId;
    private String vendorName;
    private String activityType;
    private String description;
    private String details;
    private String performedBy;
    private String performedByRole;
    private LocalDateTime performedAt;
    private String ipAddress;
}
