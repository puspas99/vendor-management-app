package com.evoke.vendor.controller;

import com.evoke.vendor.dto.request.VendorOnboardingDto;
import com.evoke.vendor.dto.response.DocumentVerificationResult;
import com.evoke.vendor.service.DocumentVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/vendor/document-verification")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DocumentVerificationController {

    private final DocumentVerificationService documentVerificationService;

    /**
     * Verify business details document against provided data
     */
    @PostMapping("/business-details")
    public ResponseEntity<DocumentVerificationResult> verifyBusinessDetails(
            @RequestParam("document") MultipartFile document,
            @ModelAttribute VendorOnboardingDto businessData) {
        
        log.info("Received document verification request for business details");
        
        long startTime = System.currentTimeMillis();
        DocumentVerificationResult result = documentVerificationService
                .verifyBusinessDetailsDocument(document, businessData);
        long processingTime = System.currentTimeMillis() - startTime;
        
        result.setProcessingTimeMs(processingTime);
        result.setDocumentType("BUSINESS_DETAILS");
        
        log.info("Document verification completed in {}ms - Verified: {}, Score: {}%", 
                processingTime, result.isVerified(), result.getConfidenceScore());
        
        return ResponseEntity.ok(result);
    }

    /**
     * Verify contact details document against provided data
     */
    @PostMapping("/contact-details")
    public ResponseEntity<DocumentVerificationResult> verifyContactDetails(
            @RequestParam("document") MultipartFile document,
            @ModelAttribute VendorOnboardingDto contactData) {
        
        log.info("Received document verification request for contact details");
        
        long startTime = System.currentTimeMillis();
        DocumentVerificationResult result = documentVerificationService
                .verifyContactDetailsDocument(document, contactData);
        long processingTime = System.currentTimeMillis() - startTime;
        
        result.setProcessingTimeMs(processingTime);
        result.setDocumentType("CONTACT_DETAILS");
        
        log.info("Contact details verification completed in {}ms - Verified: {}, Score: {}%", 
                processingTime, result.isVerified(), result.getConfidenceScore());
        
        return ResponseEntity.ok(result);
    }

    /**
     * Verify banking details document against provided data
     */
    @PostMapping("/banking-details")
    public ResponseEntity<DocumentVerificationResult> verifyBankingDetails(
            @RequestParam("document") MultipartFile document,
            @ModelAttribute VendorOnboardingDto bankingData) {
        
        log.info("Received document verification request for banking details");
        
        long startTime = System.currentTimeMillis();
        DocumentVerificationResult result = documentVerificationService
                .verifyBankingDetailsDocument(document, bankingData);
        long processingTime = System.currentTimeMillis() - startTime;
        
        result.setProcessingTimeMs(processingTime);
        result.setDocumentType("BANKING_DETAILS");
        
        log.info("Banking details verification completed in {}ms - Verified: {}, Score: {}%", 
                processingTime, result.isVerified(), result.getConfidenceScore());
        
        return ResponseEntity.ok(result);
    }

    /**
     * Verify compliance details document against provided data
     */
    @PostMapping("/compliance-details")
    public ResponseEntity<DocumentVerificationResult> verifyComplianceDetails(
            @RequestParam("document") MultipartFile document,
            @ModelAttribute VendorOnboardingDto complianceData) {
        
        log.info("Received document verification request for compliance details");
        
        long startTime = System.currentTimeMillis();
        DocumentVerificationResult result = documentVerificationService
                .verifyComplianceDetailsDocument(document, complianceData);
        long processingTime = System.currentTimeMillis() - startTime;
        
        result.setProcessingTimeMs(processingTime);
        result.setDocumentType("COMPLIANCE_DETAILS");
        
        log.info("Compliance details verification completed in {}ms - Verified: {}, Score: {}%", 
                processingTime, result.isVerified(), result.getConfidenceScore());
        
        return ResponseEntity.ok(result);
    }
}
