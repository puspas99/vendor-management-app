package com.evoke.vendor.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorOnboardingDto {

    // Business Details
    @NotBlank(message = "Legal business name is required")
    private String legalBusinessName;

    @NotBlank(message = "Business registration number is required")
    private String businessRegistrationNumber;

    @NotBlank(message = "Business type is required")
    private String businessType;

    @Min(value = 1800, message = "Year established must be valid (1800-2100)")
    @Max(value = 2100, message = "Year established must be valid (1800-2100)")
    private Integer yearEstablished;

    @NotBlank(message = "Business address is required")
    private String businessAddress;

    private String numberOfEmployees;

    private String industrySector;

    // Contact Details
    @NotBlank(message = "Primary contact name is required")
    private String primaryContactName;

    private String jobTitle;

    @NotBlank(message = "Email address is required")
    @Email(message = "Invalid email format")
    private String emailAddress;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Invalid phone number format")
    private String phoneNumber;

    private String secondaryContactName;

    @Email(message = "Invalid secondary email format")
    private String secondaryContactEmail;

    private String website;

    // Banking & Payment
    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Account holder name is required")
    private String accountHolderName;

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotBlank(message = "Account type is required")
    private String accountType;

    private String routingSwiftCode;

    private String iban;

    private String paymentTerms;

    private String currency;

    // Compliance & Certifications
    @NotBlank(message = "Tax identification number is required")
    private String taxIdentificationNumber;

    private String businessLicenseNumber;

    private LocalDate licenseExpiryDate;

    private String insuranceProvider;

    private String insurancePolicyNumber;

    private LocalDate insuranceExpiryDate;

    private String industryCertifications;

    @NotBlank(message = "Invitation token is required")
    private String invitationToken;
}
