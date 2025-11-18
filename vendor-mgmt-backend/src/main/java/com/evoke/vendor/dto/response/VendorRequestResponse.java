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
public class VendorRequestResponse {
    
    private Long id;
    private String vendorName;
    private String vendorEmail;
    private String contactPerson;
    private String contactNumber;
    private String vendorCategory;
    private String remarks;
    private String status;
    private LocalDateTime invitationSentAt;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
