package com.evoke.vendor.service;

import com.evoke.vendor.dto.request.VendorOnboardingDto;
import com.evoke.vendor.dto.response.DocumentVerificationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentVerificationService {

    private static final int MINIMUM_MATCH_SCORE = 60; // 60% match threshold
    private static final double HIGH_CONFIDENCE_THRESHOLD = 80.0;
    private static final double MEDIUM_CONFIDENCE_THRESHOLD = 60.0;

    /**
     * Verify business details document against provided business information
     */
    public DocumentVerificationResult verifyBusinessDetailsDocument(
            MultipartFile document, 
            VendorOnboardingDto businessData) {
        
        if (document == null || document.isEmpty()) {
            return DocumentVerificationResult.builder()
                    .verified(false)
                    .confidenceScore(0.0)
                    .verificationStatus("NO_DOCUMENT")
                    .message("No document provided for verification")
                    .build();
        }

        try {
            String documentText = extractTextFromDocument(document);
            
            if (documentText == null || documentText.trim().isEmpty()) {
                return DocumentVerificationResult.builder()
                        .verified(false)
                        .confidenceScore(0.0)
                        .verificationStatus("EXTRACTION_FAILED")
                        .message("Unable to extract text from document. Please ensure document is readable.")
                        .build();
            }

            return performBusinessDetailsVerification(documentText, businessData);
            
        } catch (IOException e) {
            log.error("Error processing document for verification", e);
            return DocumentVerificationResult.builder()
                    .verified(false)
                    .confidenceScore(0.0)
                    .verificationStatus("ERROR")
                    .message("Error processing document: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Extract text content from document (PDF, DOC, or DOCX)
     */
    private String extractTextFromDocument(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();
        
        log.info("Extracting text from document: {} (type: {})", filename, contentType);
        
        // Determine file type from content type or filename
        if (contentType != null && contentType.equals("application/pdf") || 
            (filename != null && filename.toLowerCase().endsWith(".pdf"))) {
            return extractTextFromPdf(file);
        } else if (contentType != null && contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
                   (filename != null && filename.toLowerCase().endsWith(".docx"))) {
            return extractTextFromDocx(file);
        } else if (contentType != null && contentType.equals("application/msword") ||
                   (filename != null && filename.toLowerCase().endsWith(".doc"))) {
            return extractTextFromDoc(file);
        } else {
            throw new IOException("Unsupported document format. Only PDF, DOC, and DOCX files are supported.");
        }
    }

    /**
     * Extract text content from PDF document
     */
    private String extractTextFromPdf(MultipartFile file) throws IOException {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            log.info("Extracted {} characters from PDF document", text.length());
            return text;
        }
    }

    /**
     * Extract text content from DOCX document (Office 2007+)
     */
    private String extractTextFromDocx(MultipartFile file) throws IOException {
        try (XWPFDocument document = new XWPFDocument(file.getInputStream());
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            String text = extractor.getText();
            log.info("Extracted {} characters from DOCX document", text.length());
            return text;
        }
    }

    /**
     * Extract text content from DOC document (Office 97-2003)
     */
    private String extractTextFromDoc(MultipartFile file) throws IOException {
        try (HWPFDocument document = new HWPFDocument(file.getInputStream());
             WordExtractor extractor = new WordExtractor(document)) {
            String text = extractor.getText();
            log.info("Extracted {} characters from DOC document", text.length());
            return text;
        }
    }

    /**
     * Perform comprehensive verification of business details
     */
    private DocumentVerificationResult performBusinessDetailsVerification(
            String documentText, 
            VendorOnboardingDto businessData) {
        
        Map<String, Boolean> fieldMatches = new LinkedHashMap<>();
        Map<String, String> fieldDetails = new LinkedHashMap<>();
        List<String> missingFields = new ArrayList<>();
        List<String> matchedFields = new ArrayList<>();
        
        String normalizedText = normalizeText(documentText);
        
        // 1. Verify Legal Business Name
        String businessName = businessData.getLegalBusinessName();
        if (businessName != null && !businessName.trim().isEmpty()) {
            boolean nameMatch = findTextMatch(normalizedText, businessName, 85);
            fieldMatches.put("legalBusinessName", nameMatch);
            if (nameMatch) {
                matchedFields.add("Legal Business Name");
                fieldDetails.put("legalBusinessName", "✓ Found in document");
            } else {
                missingFields.add("Legal Business Name");
                fieldDetails.put("legalBusinessName", "✗ Not found or doesn't match");
            }
        }

        // 2. Verify Business Registration Number
        String regNumber = businessData.getBusinessRegistrationNumber();
        if (regNumber != null && !regNumber.trim().isEmpty()) {
            boolean regMatch = findTextMatch(normalizedText, regNumber, 95);
            fieldMatches.put("businessRegistrationNumber", regMatch);
            if (regMatch) {
                matchedFields.add("Registration Number");
                fieldDetails.put("businessRegistrationNumber", "✓ Found in document");
            } else {
                missingFields.add("Registration Number");
                fieldDetails.put("businessRegistrationNumber", "✗ Not found or doesn't match");
            }
        }

        // 3. Verify Business Type
        String businessType = businessData.getBusinessType();
        if (businessType != null && !businessType.trim().isEmpty()) {
            boolean typeMatch = findTextMatch(normalizedText, businessType, 75);
            fieldMatches.put("businessType", typeMatch);
            if (typeMatch) {
                matchedFields.add("Business Type");
                fieldDetails.put("businessType", "✓ Found in document");
            } else {
                fieldDetails.put("businessType", "⚠ Not found (optional)");
            }
        }

        // 4. Verify Year Established
        Integer year = businessData.getYearEstablished();
        if (year != null) {
            boolean yearMatch = findYearMatch(normalizedText, year);
            fieldMatches.put("yearEstablished", yearMatch);
            if (yearMatch) {
                matchedFields.add("Year Established");
                fieldDetails.put("yearEstablished", "✓ Found in document");
            } else {
                fieldDetails.put("yearEstablished", "⚠ Not found (optional)");
            }
        }

        // 5. Verify Business Address (partial match acceptable)
        String address = businessData.getBusinessAddress();
        if (address != null && !address.trim().isEmpty()) {
            boolean addressMatch = findAddressMatch(normalizedText, address);
            fieldMatches.put("businessAddress", addressMatch);
            if (addressMatch) {
                matchedFields.add("Business Address");
                fieldDetails.put("businessAddress", "✓ Found in document");
            } else {
                missingFields.add("Business Address");
                fieldDetails.put("businessAddress", "✗ Not found or doesn't match");
            }
        }

        // Calculate verification score
        long totalFields = fieldMatches.size();
        long matchedCount = fieldMatches.values().stream().filter(Boolean::booleanValue).count();
        double confidenceScore = totalFields > 0 ? (matchedCount * 100.0 / totalFields) : 0.0;

        // Determine verification status
        String status;
        String message;
        boolean verified;

        if (confidenceScore >= HIGH_CONFIDENCE_THRESHOLD) {
            status = "HIGH_CONFIDENCE";
            message = String.format("Document verification successful! %d/%d fields matched.", 
                    matchedCount, totalFields);
            verified = true;
        } else if (confidenceScore >= MEDIUM_CONFIDENCE_THRESHOLD) {
            status = "MEDIUM_CONFIDENCE";
            message = String.format("Document partially verified. %d/%d fields matched. Please review: %s", 
                    matchedCount, totalFields, String.join(", ", missingFields));
            verified = true;
        } else {
            status = "LOW_CONFIDENCE";
            message = String.format("Document verification failed. Only %d/%d fields matched. Missing: %s", 
                    matchedCount, totalFields, String.join(", ", missingFields));
            verified = false;
        }

        return DocumentVerificationResult.builder()
                .verified(verified)
                .confidenceScore(confidenceScore)
                .verificationStatus(status)
                .message(message)
                .matchedFields(matchedFields)
                .missingFields(missingFields)
                .fieldVerificationDetails(fieldDetails)
                .totalFieldsChecked((int) totalFields)
                .fieldsMatched((int) matchedCount)
                .build();
    }

    /**
     * Normalize text for comparison
     */
    private String normalizeText(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replaceAll("\\s+", " ")
                .replaceAll("[^a-z0-9\\s]", "")
                .trim();
    }

    /**
     * Find text match with fuzzy matching
     */
    private boolean findTextMatch(String documentText, String searchText, int threshold) {
        if (searchText == null || searchText.trim().isEmpty()) return false;
        
        String normalizedSearch = normalizeText(searchText);
        
        // Exact match
        if (documentText.contains(normalizedSearch)) {
            return true;
        }

        // Partial word match
        String[] words = normalizedSearch.split("\\s+");
        int matchedWords = 0;
        for (String word : words) {
            if (word.length() > 2 && documentText.contains(word)) {
                matchedWords++;
            }
        }

        int matchPercentage = words.length > 0 ? (matchedWords * 100 / words.length) : 0;
        return matchPercentage >= threshold;
    }

    /**
     * Find year match in document
     */
    private boolean findYearMatch(String documentText, Integer year) {
        if (year == null) return false;
        
        String yearStr = year.toString();
        Pattern pattern = Pattern.compile("\\b" + yearStr + "\\b");
        Matcher matcher = pattern.matcher(documentText);
        return matcher.find();
    }

    /**
     * Find address match with partial matching
     */
    private boolean findAddressMatch(String documentText, String address) {
        if (address == null || address.trim().isEmpty()) return false;
        
        String normalizedAddress = normalizeText(address);
        
        // Split address into components
        String[] components = normalizedAddress.split("[,\\s]+");
        int matchedComponents = 0;
        
        for (String component : components) {
            if (component.length() > 2 && documentText.contains(component)) {
                matchedComponents++;
            }
        }

        // At least 40% of address components should match
        return components.length > 0 && (matchedComponents * 100.0 / components.length) >= 40;
    }

    /**
     * Verify contact details document
     */
    public DocumentVerificationResult verifyContactDetailsDocument(
            MultipartFile document, 
            VendorOnboardingDto contactData) {
        
        if (document == null || document.isEmpty()) {
            return createNoDocumentResult();
        }

        try {
            String documentText = extractTextFromDocument(document);
            
            if (documentText == null || documentText.trim().isEmpty()) {
                return DocumentVerificationResult.builder()
                        .verified(false)
                        .confidenceScore(0.0)
                        .verificationStatus("EXTRACTION_FAILED")
                        .message("Unable to extract text from document. Please ensure document is readable.")
                        .build();
            }
            
            return performContactDetailsVerification(documentText, contactData);
        } catch (IOException e) {
            log.error("Error processing contact document", e);
            return createErrorResult(e.getMessage());
        }
    }

    private DocumentVerificationResult performContactDetailsVerification(
            String documentText, 
            VendorOnboardingDto contactData) {
        
        Map<String, Boolean> fieldMatches = new LinkedHashMap<>();
        List<String> matchedFields = new ArrayList<>();
        List<String> missingFields = new ArrayList<>();
        Map<String, String> fieldDetails = new LinkedHashMap<>();
        
        String normalizedText = normalizeText(documentText);
        
        // Verify primary contact name
        if (contactData.getPrimaryContactName() != null && !contactData.getPrimaryContactName().trim().isEmpty()) {
            boolean nameMatch = findTextMatch(normalizedText, contactData.getPrimaryContactName(), 80);
            fieldMatches.put("primaryContactName", nameMatch);
            if (nameMatch) {
                matchedFields.add("Primary Contact Name");
                fieldDetails.put("primaryContactName", "✓ Found in document");
            } else {
                missingFields.add("Primary Contact Name");
                fieldDetails.put("primaryContactName", "✗ Not found or doesn't match");
            }
        }
        
        // Verify email
        if (contactData.getEmailAddress() != null && !contactData.getEmailAddress().trim().isEmpty()) {
            boolean emailMatch = findTextMatch(normalizedText, contactData.getEmailAddress(), 95);
            fieldMatches.put("emailAddress", emailMatch);
            if (emailMatch) {
                matchedFields.add("Email Address");
                fieldDetails.put("emailAddress", "✓ Found in document");
            } else {
                missingFields.add("Email Address");
                fieldDetails.put("emailAddress", "✗ Not found or doesn't match");
            }
        }

        // Verify phone
        if (contactData.getPhoneNumber() != null && !contactData.getPhoneNumber().trim().isEmpty()) {
            boolean phoneMatch = findPhoneMatch(normalizedText, contactData.getPhoneNumber());
            fieldMatches.put("phoneNumber", phoneMatch);
            if (phoneMatch) {
                matchedFields.add("Phone Number");
                fieldDetails.put("phoneNumber", "✓ Found in document");
            } else {
                missingFields.add("Phone Number");
                fieldDetails.put("phoneNumber", "✗ Not found or doesn't match");
            }
        }
        
        // Verify job title
        if (contactData.getJobTitle() != null && !contactData.getJobTitle().trim().isEmpty()) {
            boolean titleMatch = findTextMatch(normalizedText, contactData.getJobTitle(), 75);
            fieldMatches.put("jobTitle", titleMatch);
            if (titleMatch) {
                matchedFields.add("Job Title");
                fieldDetails.put("jobTitle", "✓ Found in document");
            } else {
                fieldDetails.put("jobTitle", "⚠ Not found (optional)");
            }
        }

        double confidenceScore = calculateConfidenceScore(fieldMatches);
        boolean verified = confidenceScore >= MINIMUM_MATCH_SCORE;
        
        log.info("Contact details verification: {} fields checked, {} matched, {}% confidence",
                fieldMatches.size(), matchedFields.size(), String.format("%.1f", confidenceScore));
        
        return DocumentVerificationResult.builder()
                .verified(verified)
                .confidenceScore(confidenceScore)
                .verificationStatus(getStatusFromScore(confidenceScore))
                .matchedFields(matchedFields)
                .missingFields(missingFields)
                .fieldVerificationDetails(fieldDetails)
                .totalFieldsChecked(fieldMatches.size())
                .fieldsMatched(matchedFields.size())
                .message(verified ? 
                    String.format("Contact details verified with %.1f%% confidence", confidenceScore) :
                    String.format("Contact details verification incomplete: %.1f%% match (minimum 60%% required)", confidenceScore))
                .build();
    }

    /**
     * Verify banking details document
     */
    public DocumentVerificationResult verifyBankingDetailsDocument(
            MultipartFile document,
            VendorOnboardingDto bankingData) {
        
        if (document == null || document.isEmpty()) {
            return createNoDocumentResult();
        }

        try {
            String documentText = extractTextFromDocument(document);
            
            if (documentText == null || documentText.trim().isEmpty()) {
                return DocumentVerificationResult.builder()
                        .verified(false)
                        .confidenceScore(0.0)
                        .verificationStatus("EXTRACTION_FAILED")
                        .message("Unable to extract text from document. Please ensure document is readable.")
                        .build();
            }
            
            return performBankingDetailsVerification(documentText, bankingData);
        } catch (IOException e) {
            log.error("Error processing banking document", e);
            return createErrorResult(e.getMessage());
        }
    }

    private DocumentVerificationResult performBankingDetailsVerification(
            String documentText,
            VendorOnboardingDto bankingData) {
        
        Map<String, Boolean> fieldMatches = new LinkedHashMap<>();
        List<String> matchedFields = new ArrayList<>();
        List<String> missingFields = new ArrayList<>();
        Map<String, String> fieldDetails = new LinkedHashMap<>();
        
        String normalizedText = normalizeText(documentText);
        
        // Verify bank name
        if (bankingData.getBankName() != null && !bankingData.getBankName().trim().isEmpty()) {
            boolean bankMatch = findTextMatch(normalizedText, bankingData.getBankName(), 80);
            fieldMatches.put("bankName", bankMatch);
            if (bankMatch) {
                matchedFields.add("Bank Name");
                fieldDetails.put("bankName", "✓ Found in document");
            } else {
                missingFields.add("Bank Name");
                fieldDetails.put("bankName", "✗ Not found or doesn't match");
            }
        }
        
        // Verify account holder name
        if (bankingData.getAccountHolderName() != null && !bankingData.getAccountHolderName().trim().isEmpty()) {
            boolean holderMatch = findTextMatch(normalizedText, bankingData.getAccountHolderName(), 85);
            fieldMatches.put("accountHolderName", holderMatch);
            if (holderMatch) {
                matchedFields.add("Account Holder Name");
                fieldDetails.put("accountHolderName", "✓ Found in document");
            } else {
                missingFields.add("Account Holder Name");
                fieldDetails.put("accountHolderName", "✗ Not found or doesn't match");
            }
        }
        
        // Verify account number (last 4 digits)
        if (bankingData.getAccountNumber() != null && !bankingData.getAccountNumber().trim().isEmpty()) {
            String accountNum = bankingData.getAccountNumber().replaceAll("[^0-9]", "");
            if (accountNum.length() >= 4) {
                String last4 = accountNum.substring(accountNum.length() - 4);
                boolean accountMatch = documentText.contains(last4);
                fieldMatches.put("accountNumber", accountMatch);
                if (accountMatch) {
                    matchedFields.add("Account Number");
                    fieldDetails.put("accountNumber", "✓ Partial match found (last 4 digits)");
                } else {
                    missingFields.add("Account Number");
                    fieldDetails.put("accountNumber", "✗ Account number not found");
                }
            }
        }
        
        // Verify routing/SWIFT code
        if (bankingData.getRoutingSwiftCode() != null && !bankingData.getRoutingSwiftCode().trim().isEmpty()) {
            boolean routingMatch = findTextMatch(normalizedText, bankingData.getRoutingSwiftCode(), 90);
            fieldMatches.put("routingSwiftCode", routingMatch);
            if (routingMatch) {
                matchedFields.add("Routing/SWIFT Code");
                fieldDetails.put("routingSwiftCode", "✓ Found in document");
            } else {
                fieldDetails.put("routingSwiftCode", "⚠ Not found (may vary by document)");
            }
        }

        double confidenceScore = calculateConfidenceScore(fieldMatches);
        boolean verified = confidenceScore >= MINIMUM_MATCH_SCORE;
        
        log.info("Banking details verification: {} fields checked, {} matched, {}% confidence",
                fieldMatches.size(), matchedFields.size(), String.format("%.1f", confidenceScore));
        
        return DocumentVerificationResult.builder()
                .verified(verified)
                .confidenceScore(confidenceScore)
                .verificationStatus(getStatusFromScore(confidenceScore))
                .matchedFields(matchedFields)
                .missingFields(missingFields)
                .fieldVerificationDetails(fieldDetails)
                .totalFieldsChecked(fieldMatches.size())
                .fieldsMatched(matchedFields.size())
                .message(verified ?
                    String.format("Banking details verified with %.1f%% confidence", confidenceScore) :
                    String.format("Banking details verification incomplete: %.1f%% match (minimum 60%% required)", confidenceScore))
                .build();
    }

    /**
     * Verify compliance details document
     */
    public DocumentVerificationResult verifyComplianceDetailsDocument(
            MultipartFile document,
            VendorOnboardingDto complianceData) {
        
        if (document == null || document.isEmpty()) {
            return createNoDocumentResult();
        }

        try {
            String documentText = extractTextFromDocument(document);
            
            if (documentText == null || documentText.trim().isEmpty()) {
                return DocumentVerificationResult.builder()
                        .verified(false)
                        .confidenceScore(0.0)
                        .verificationStatus("EXTRACTION_FAILED")
                        .message("Unable to extract text from document. Please ensure document is readable.")
                        .build();
            }
            
            return performComplianceDetailsVerification(documentText, complianceData);
        } catch (IOException e) {
            log.error("Error processing compliance document", e);
            return createErrorResult(e.getMessage());
        }
    }

    private DocumentVerificationResult performComplianceDetailsVerification(
            String documentText,
            VendorOnboardingDto complianceData) {
        
        Map<String, Boolean> fieldMatches = new LinkedHashMap<>();
        List<String> matchedFields = new ArrayList<>();
        List<String> missingFields = new ArrayList<>();
        Map<String, String> fieldDetails = new LinkedHashMap<>();
        
        String normalizedText = normalizeText(documentText);
        
        // Verify tax identification number
        if (complianceData.getTaxIdentificationNumber() != null && !complianceData.getTaxIdentificationNumber().trim().isEmpty()) {
            boolean taxMatch = findTextMatch(normalizedText, complianceData.getTaxIdentificationNumber(), 95);
            fieldMatches.put("taxIdentificationNumber", taxMatch);
            if (taxMatch) {
                matchedFields.add("Tax Identification Number");
                fieldDetails.put("taxIdentificationNumber", "✓ Found in document");
            } else {
                missingFields.add("Tax Identification Number");
                fieldDetails.put("taxIdentificationNumber", "✗ Not found or doesn't match");
            }
        }
        
        // Verify business license number
        if (complianceData.getBusinessLicenseNumber() != null && !complianceData.getBusinessLicenseNumber().trim().isEmpty()) {
            boolean licenseMatch = findTextMatch(normalizedText, complianceData.getBusinessLicenseNumber(), 90);
            fieldMatches.put("businessLicenseNumber", licenseMatch);
            if (licenseMatch) {
                matchedFields.add("Business License Number");
                fieldDetails.put("businessLicenseNumber", "✓ Found in document");
            } else {
                missingFields.add("Business License Number");
                fieldDetails.put("businessLicenseNumber", "✗ Not found or doesn't match");
            }
        }
        
        // Verify license expiry date
        if (complianceData.getLicenseExpiryDate() != null) {
            String expiryDate = complianceData.getLicenseExpiryDate().toString();
            boolean expiryMatch = findDateMatch(normalizedText, expiryDate);
            fieldMatches.put("licenseExpiryDate", expiryMatch);
            if (expiryMatch) {
                matchedFields.add("License Expiry Date");
                fieldDetails.put("licenseExpiryDate", "✓ Found in document");
            } else {
                fieldDetails.put("licenseExpiryDate", "⚠ Date not found (format may vary)");
            }
        }
        
        // Verify insurance provider
        if (complianceData.getInsuranceProvider() != null && !complianceData.getInsuranceProvider().trim().isEmpty()) {
            boolean insuranceMatch = findTextMatch(normalizedText, complianceData.getInsuranceProvider(), 80);
            fieldMatches.put("insuranceProvider", insuranceMatch);
            if (insuranceMatch) {
                matchedFields.add("Insurance Provider");
                fieldDetails.put("insuranceProvider", "✓ Found in document");
            } else {
                fieldDetails.put("insuranceProvider", "⚠ Not found (optional)");
            }
        }
        
        // Verify insurance policy number
        if (complianceData.getInsurancePolicyNumber() != null && !complianceData.getInsurancePolicyNumber().trim().isEmpty()) {
            boolean policyMatch = findTextMatch(normalizedText, complianceData.getInsurancePolicyNumber(), 90);
            fieldMatches.put("insurancePolicyNumber", policyMatch);
            if (policyMatch) {
                matchedFields.add("Insurance Policy Number");
                fieldDetails.put("insurancePolicyNumber", "✓ Found in document");
            } else {
                fieldDetails.put("insurancePolicyNumber", "⚠ Not found (optional)");
            }
        }

        double confidenceScore = calculateConfidenceScore(fieldMatches);
        boolean verified = confidenceScore >= MINIMUM_MATCH_SCORE;
        
        log.info("Compliance details verification: {} fields checked, {} matched, {}% confidence",
                fieldMatches.size(), matchedFields.size(), String.format("%.1f", confidenceScore));
        
        return DocumentVerificationResult.builder()
                .verified(verified)
                .confidenceScore(confidenceScore)
                .verificationStatus(getStatusFromScore(confidenceScore))
                .matchedFields(matchedFields)
                .missingFields(missingFields)
                .fieldVerificationDetails(fieldDetails)
                .totalFieldsChecked(fieldMatches.size())
                .fieldsMatched(matchedFields.size())
                .message(verified ?
                    String.format("Compliance details verified with %.1f%% confidence", confidenceScore) :
                    String.format("Compliance details verification incomplete: %.1f%% match (minimum 60%% required)", confidenceScore))
                .build();
    }

    private boolean findDateMatch(String documentText, String dateString) {
        if (dateString == null) return false;
        
        // Try different date formats
        String[] dateParts = dateString.split("-");
        if (dateParts.length == 3) {
            String year = dateParts[0];
            String month = dateParts[1];
            String day = dateParts[2];
            
            // Check various date formats
            return documentText.contains(dateString) ||
                   documentText.contains(day + "/" + month + "/" + year) ||
                   documentText.contains(month + "/" + day + "/" + year) ||
                   documentText.contains(day + "-" + month + "-" + year);
        }
        
        return documentText.contains(dateString);
    }

    private boolean findPhoneMatch(String documentText, String phoneNumber) {
        if (phoneNumber == null) return false;
        
        String digits = phoneNumber.replaceAll("[^0-9]", "");
        if (digits.length() < 7) return false;
        
        String docDigits = documentText.replaceAll("[^0-9]", "");
        return docDigits.contains(digits.substring(Math.max(0, digits.length() - 10)));
    }

    private double calculateConfidenceScore(Map<String, Boolean> fieldMatches) {
        if (fieldMatches.isEmpty()) return 0.0;
        long matched = fieldMatches.values().stream().filter(Boolean::booleanValue).count();
        return (matched * 100.0) / fieldMatches.size();
    }

    private String getStatusFromScore(double score) {
        if (score >= HIGH_CONFIDENCE_THRESHOLD) return "HIGH_CONFIDENCE";
        if (score >= MEDIUM_CONFIDENCE_THRESHOLD) return "MEDIUM_CONFIDENCE";
        return "LOW_CONFIDENCE";
    }

    private DocumentVerificationResult createNoDocumentResult() {
        return DocumentVerificationResult.builder()
                .verified(false)
                .confidenceScore(0.0)
                .verificationStatus("NO_DOCUMENT")
                .message("No document provided for verification")
                .build();
    }

    private DocumentVerificationResult createErrorResult(String error) {
        return DocumentVerificationResult.builder()
                .verified(false)
                .confidenceScore(0.0)
                .verificationStatus("ERROR")
                .message("Error processing document: " + error)
                .build();
    }
}
