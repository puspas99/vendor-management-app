package com.evoke.vendor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorOnboardingResponse {
    
    private Long id;
    private VendorRequestResponse vendorRequest;
    
    // Business Details
    private String legalBusinessName;
    private String businessRegistrationNumber;
    private String businessType;
    private Integer yearEstablished;
    private String businessAddress;
    private String numberOfEmployees;
    private String industrySector;
    private String businessDetailsFilePath;
    
    // Contact Details
    private String primaryContactName;
    private String jobTitle;
    private String emailAddress;
    private String phoneNumber;
    private String secondaryContactName;
    private String secondaryContactEmail;
    private String website;
    
    // Banking & Payment
    private String bankName;
    private String accountHolderName;
    private String accountNumber;
    private String accountType;
    private String routingSwiftCode;
    private String iban;
    private String paymentTerms;
    private String currency;
    
    // Compliance & Certifications
    private String taxIdentificationNumber;
    private String businessLicenseNumber;
    private LocalDate licenseExpiryDate;
    private String insuranceProvider;
    private String insurancePolicyNumber;
    private LocalDate insuranceExpiryDate;
    private String industryCertifications;
    private String complianceFilePath;
    
    // Metadata
    private Boolean isComplete;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private List<FollowUpResponse> followUps;
}
