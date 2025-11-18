package com.evoke.vendor.service;

import com.evoke.vendor.Constants;
import com.evoke.vendor.entity.VendorOnboarding;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class ValidationService {

    private final FollowUpService followUpService;

    public void validateAndCreateFollowUps(VendorOnboarding vendorOnboarding) {
        Objects.requireNonNull(vendorOnboarding, "Vendor onboarding cannot be null");

        List<String> missingFields = new ArrayList<>();
        List<String> invalidFields = new ArrayList<>();

        // Validate business details
        if (vendorOnboarding.getBusinessDetails() != null) {
            var bd = vendorOnboarding.getBusinessDetails();
            if (bd.getYearEstablished() == null) {
                missingFields.add("Year Established");
            }
            if (bd.getNumberOfEmployees() == null) {
                missingFields.add("Number of Employees");
            }
            if (bd.getIndustrySector() == null || bd.getIndustrySector().isEmpty()) {
                missingFields.add("Industry/Sector");
            }
            if (bd.getBusinessDetailsFilePath() == null) {
                missingFields.add("Business Details File");
            }
        } else {
            missingFields.add("Business Details");
        }

        // Validate contact details
        if (vendorOnboarding.getContactDetails() != null) {
            var cd = vendorOnboarding.getContactDetails();
            if (cd.getJobTitle() == null || cd.getJobTitle().isEmpty()) {
                missingFields.add("Job Title");
            }
            if (cd.getWebsite() == null || cd.getWebsite().isEmpty()) {
                missingFields.add("Website");
            }
        } else {
            missingFields.add("Contact Details");
        }

        // Validate banking details
        if (vendorOnboarding.getBankingDetails() != null) {
            var bkd = vendorOnboarding.getBankingDetails();
            if (bkd.getRoutingSwiftCode() == null || bkd.getRoutingSwiftCode().isEmpty()) {
                missingFields.add("Routing/SWIFT Code");
            }
            if (bkd.getPaymentTerms() == null || bkd.getPaymentTerms().isEmpty()) {
                missingFields.add("Payment Terms");
            }
            if (bkd.getCurrency() == null || bkd.getCurrency().isEmpty()) {
                missingFields.add("Currency");
            }
        } else {
            missingFields.add("Banking Details");
        }

        // Validate compliance details
        if (vendorOnboarding.getComplianceDetails() != null) {
            var cpd = vendorOnboarding.getComplianceDetails();
            if (cpd.getLicenseExpiryDate() != null && 
                cpd.getLicenseExpiryDate().isBefore(LocalDate.now())) {
                invalidFields.add("Business License (Expired on " + cpd.getLicenseExpiryDate() + ")");
            }
            if (cpd.getInsuranceExpiryDate() != null && 
                cpd.getInsuranceExpiryDate().isBefore(LocalDate.now())) {
                invalidFields.add("Insurance Policy (Expired on " + cpd.getInsuranceExpiryDate() + ")");
            }
        } else {
            missingFields.add("Compliance Details");
        }

        if (!missingFields.isEmpty()) {
            String message = "The following required fields are missing or incomplete:\n" +
                    String.join(", ", missingFields) + "\n\n" +
                    "Please provide the missing information to complete your onboarding process.";
            
            followUpService.createAutomaticFollowUp(
                    vendorOnboarding,
                    Constants.FOLLOW_UP_MISSING_DATA,
                    message,
                    String.join(", ", missingFields)
            );
        }

        if (!invalidFields.isEmpty()) {
            String message = "The following fields contain invalid or expired information:\n" +
                    String.join(", ", invalidFields) + "\n\n" +
                    "Please update these fields with valid information.";
            
            followUpService.createAutomaticFollowUp(
                    vendorOnboarding,
                    Constants.FOLLOW_UP_INCORRECT_DATA,
                    message,
                    String.join(", ", invalidFields)
            );
        }

        if (missingFields.isEmpty() && invalidFields.isEmpty()) {
            log.info("Vendor onboarding validation passed for: {}", vendorOnboarding.getId());
        } else {
            log.info("Vendor onboarding validation issues found for: {}. Follow-ups created.", vendorOnboarding.getId());
        }
    }

    public boolean isValidEmail(String email) {
        if (email == null || email.isEmpty()) {
            return false;
        }
        return email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    public boolean isValidPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return false;
        }
        return phoneNumber.matches("^[+]?[0-9]{10,15}$");
    }
}
