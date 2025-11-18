package com.evoke.vendor.service;

import com.evoke.vendor.Constants;
import com.evoke.vendor.dto.request.VendorOnboardingDto;
import com.evoke.vendor.dto.response.FollowUpResponse;
import com.evoke.vendor.dto.response.VendorOnboardingResponse;
import com.evoke.vendor.dto.response.VendorRequestResponse;
import com.evoke.vendor.entity.*;
import com.evoke.vendor.enums.VendorOnboardingStatus;
import com.evoke.vendor.repository.VendorOnboardingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorOnboardingService {

    private final VendorOnboardingRepository vendorOnboardingRepository;
    private final VendorRequestService vendorRequestService;
    private final FileStorageService fileStorageService;
    private final ValidationService validationService;
    private final NotificationService notificationService;
    private final DocumentVerificationService documentVerificationService;

    @Transactional
    public VendorOnboardingResponse submitVendorOnboarding(
            VendorOnboardingDto dto,
            MultipartFile businessDetailsFile,
            MultipartFile contactDetailsFile,
            MultipartFile bankingDetailsFile,
            MultipartFile complianceFile
    ) {
        Objects.requireNonNull(dto, "Vendor onboarding data cannot be null");

        VendorRequest vendorRequest = vendorRequestService.getVendorRequestByToken(dto.getInvitationToken());

        String businessDetailsFilePath = null;
        String contactDetailsFilePath = null;
        String bankingDetailsFilePath = null;
        String complianceFilePath = null;

        // Verify and store business details document
        if (businessDetailsFile != null && !businessDetailsFile.isEmpty()) {
            log.info("Verifying business details document");
            var verificationResult = documentVerificationService.verifyBusinessDetailsDocument(
                    businessDetailsFile, dto);
            
            log.info("Document verification result: {} - Score: {}%, Status: {}", 
                    verificationResult.isVerified(), 
                    verificationResult.getConfidenceScore(),
                    verificationResult.getVerificationStatus());
            
            if (!verificationResult.isVerified()) {
                log.warn("Business details document verification failed: {}", verificationResult.getMessage());
                // Store verification result for follow-up
                // Note: Still storing the file but flagging for manual review
            }
            
            businessDetailsFilePath = fileStorageService.storeFile(businessDetailsFile);
        }

        if (contactDetailsFile != null && !contactDetailsFile.isEmpty()) {
            contactDetailsFilePath = fileStorageService.storeFile(contactDetailsFile);
        }

        if (bankingDetailsFile != null && !bankingDetailsFile.isEmpty()) {
            bankingDetailsFilePath = fileStorageService.storeFile(bankingDetailsFile);
        }

        if (complianceFile != null && !complianceFile.isEmpty()) {
            complianceFilePath = fileStorageService.storeFile(complianceFile);
        }

        // Check if onboarding already exists for this vendor request
        VendorOnboarding vendorOnboarding = vendorOnboardingRepository.findByVendorRequestId(vendorRequest.getId())
                .orElse(null);
        
        if (vendorOnboarding == null) {
            // Create new onboarding record
            log.info("Creating new onboarding record for vendor request ID: {}", vendorRequest.getId());
            vendorOnboarding = VendorOnboarding.builder()
                    .vendorRequest(vendorRequest)
                    .isComplete(true)
                    .submittedAt(LocalDateTime.now())
                    .build();
        } else {
            // Update existing onboarding record
            log.info("Updating existing onboarding record ID: {} for vendor request ID: {}", 
                    vendorOnboarding.getId(), vendorRequest.getId());
            vendorOnboarding.setIsComplete(true);
            vendorOnboarding.setSubmittedAt(LocalDateTime.now());
        }

        vendorOnboarding = vendorOnboardingRepository.save(vendorOnboarding);

        // Update or create business details
        VendorBusinessDetails businessDetails = vendorOnboarding.getBusinessDetails();
        if (businessDetails == null) {
            log.info("Creating new business details for vendor onboarding ID: {}", vendorOnboarding.getId());
            businessDetails = VendorBusinessDetails.builder()
                    .vendorOnboarding(vendorOnboarding)
                    .build();
        } else {
            log.info("Updating existing business details ID: {} for vendor onboarding ID: {}", 
                    businessDetails.getId(), vendorOnboarding.getId());
        }
        businessDetails.setLegalBusinessName(dto.getLegalBusinessName());
        businessDetails.setBusinessRegistrationNumber(dto.getBusinessRegistrationNumber());
        businessDetails.setBusinessType(dto.getBusinessType());
        businessDetails.setYearEstablished(dto.getYearEstablished());
        businessDetails.setBusinessAddress(dto.getBusinessAddress());
        businessDetails.setNumberOfEmployees(dto.getNumberOfEmployees());
        businessDetails.setIndustrySector(dto.getIndustrySector());
        if (businessDetailsFilePath != null) {
            businessDetails.setBusinessDetailsFilePath(businessDetailsFilePath);
        }

        // Update or create contact details
        VendorContactDetails contactDetails = vendorOnboarding.getContactDetails();
        if (contactDetails == null) {
            log.info("Creating new contact details for vendor onboarding ID: {}", vendorOnboarding.getId());
            contactDetails = VendorContactDetails.builder()
                    .vendorOnboarding(vendorOnboarding)
                    .build();
        } else {
            log.info("Updating existing contact details ID: {} for vendor onboarding ID: {}", 
                    contactDetails.getId(), vendorOnboarding.getId());
        }
        contactDetails.setPrimaryContactName(dto.getPrimaryContactName());
        contactDetails.setJobTitle(dto.getJobTitle());
        contactDetails.setEmailAddress(dto.getEmailAddress());
        contactDetails.setPhoneNumber(dto.getPhoneNumber());
        contactDetails.setSecondaryContactName(dto.getSecondaryContactName());
        contactDetails.setSecondaryContactEmail(dto.getSecondaryContactEmail());
        contactDetails.setWebsite(dto.getWebsite());
        if (contactDetailsFilePath != null) {
            contactDetails.setContactDetailsFilePath(contactDetailsFilePath);
        }

        // Update or create banking details
        VendorBankingDetails bankingDetails = vendorOnboarding.getBankingDetails();
        if (bankingDetails == null) {
            log.info("Creating new banking details for vendor onboarding ID: {}", vendorOnboarding.getId());
            bankingDetails = VendorBankingDetails.builder()
                    .vendorOnboarding(vendorOnboarding)
                    .build();
        } else {
            log.info("Updating existing banking details ID: {} for vendor onboarding ID: {}", 
                    bankingDetails.getId(), vendorOnboarding.getId());
        }
        bankingDetails.setBankName(dto.getBankName());
        bankingDetails.setAccountHolderName(dto.getAccountHolderName());
        bankingDetails.setAccountNumber(dto.getAccountNumber());
        bankingDetails.setAccountType(dto.getAccountType());
        bankingDetails.setRoutingSwiftCode(dto.getRoutingSwiftCode());
        bankingDetails.setIban(dto.getIban());
        bankingDetails.setPaymentTerms(dto.getPaymentTerms());
        bankingDetails.setCurrency(dto.getCurrency());
        if (bankingDetailsFilePath != null) {
            bankingDetails.setBankingDetailsFilePath(bankingDetailsFilePath);
        }

        // Update or create compliance details
        VendorComplianceDetails complianceDetails = vendorOnboarding.getComplianceDetails();
        if (complianceDetails == null) {
            log.info("Creating new compliance details for vendor onboarding ID: {}", vendorOnboarding.getId());
            complianceDetails = VendorComplianceDetails.builder()
                    .vendorOnboarding(vendorOnboarding)
                    .build();
        } else {
            log.info("Updating existing compliance details ID: {} for vendor onboarding ID: {}", 
                    complianceDetails.getId(), vendorOnboarding.getId());
        }
        complianceDetails.setTaxIdentificationNumber(dto.getTaxIdentificationNumber());
        complianceDetails.setBusinessLicenseNumber(dto.getBusinessLicenseNumber());
        complianceDetails.setLicenseExpiryDate(dto.getLicenseExpiryDate());
        complianceDetails.setInsuranceProvider(dto.getInsuranceProvider());
        complianceDetails.setInsurancePolicyNumber(dto.getInsurancePolicyNumber());
        complianceDetails.setInsuranceExpiryDate(dto.getInsuranceExpiryDate());
        complianceDetails.setIndustryCertifications(dto.getIndustryCertifications());
        if (complianceFilePath != null) {
            complianceDetails.setComplianceFilePath(complianceFilePath);
        }

        // Set relationships
        vendorOnboarding.setBusinessDetails(businessDetails);
        vendorOnboarding.setContactDetails(contactDetails);
        vendorOnboarding.setBankingDetails(bankingDetails);
        vendorOnboarding.setComplianceDetails(complianceDetails);
        vendorOnboarding.setStatus(VendorOnboardingStatus.AWAITING_VALIDATION);

        vendorOnboarding = vendorOnboardingRepository.save(vendorOnboarding);
        
        // Update vendor request status to awaiting validation
        vendorRequestService.updateVendorRequestStatus(vendorRequest.getId(), VendorOnboardingStatus.AWAITING_VALIDATION);
        
        // Notify procurement team about form submission
        notificationService.notifyFormSubmitted(vendorRequest);

        validationService.validateAndCreateFollowUps(vendorOnboarding);

        log.info("Vendor onboarding submitted for: {}", dto.getEmailAddress());
        return mapToResponse(vendorOnboarding);
    }

    @Transactional(readOnly = true)
    public VendorOnboardingResponse getVendorOnboardingById(Long id) {
        Objects.requireNonNull(id, "ID cannot be null");
        
        VendorOnboarding vendorOnboarding = vendorOnboardingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor onboarding not found with id: " + id));
        
        return mapToResponse(vendorOnboarding);
    }

    @Transactional(readOnly = true)
    public VendorOnboardingResponse getVendorOnboardingByRequestId(Long requestId) {
        Objects.requireNonNull(requestId, "Request ID cannot be null");
        
        VendorOnboarding vendorOnboarding = vendorOnboardingRepository.findByVendorRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor onboarding not found for request id: " + requestId));
        
        return mapToResponse(vendorOnboarding);
    }

    @Transactional(readOnly = true)
    public List<VendorOnboardingResponse> getAllVendorOnboardings() {
        return vendorOnboardingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private VendorOnboardingResponse mapToResponse(VendorOnboarding vo) {
        VendorRequestResponse vendorRequestResponse = VendorRequestResponse.builder()
                .id(vo.getVendorRequest().getId())
                .vendorName(vo.getVendorRequest().getVendorName())
                .vendorEmail(vo.getVendorRequest().getVendorEmail())
                .contactPerson(vo.getVendorRequest().getContactPerson())
                .contactNumber(vo.getVendorRequest().getContactNumber())
                .vendorCategory(vo.getVendorRequest().getVendorCategory())
                .status(vo.getVendorRequest().getStatus() != null ? vo.getVendorRequest().getStatus().name() : null)
                .createdBy(vo.getVendorRequest().getCreatedBy())
                .createdAt(vo.getVendorRequest().getCreatedAt())
                .build();

        List<FollowUpResponse> followUps = vo.getFollowUps().stream()
                .map(f -> FollowUpResponse.builder()
                        .id(f.getId())
                        .followUpType(f.getFollowUpType())
                        .message(f.getMessage())
                        .fieldsConcerned(f.getFieldsConcerned())
                        .initiatedBy(f.getInitiatedBy())
                        .isAutomatic(f.getIsAutomatic())
                        .status(f.getStatus())
                        .createdAt(f.getCreatedAt())
                        .resolvedAt(f.getResolvedAt())
                        .build())
                .collect(Collectors.toList());

        VendorBusinessDetails bd = vo.getBusinessDetails();
        VendorContactDetails cd = vo.getContactDetails();
        VendorBankingDetails bkd = vo.getBankingDetails();
        VendorComplianceDetails cpd = vo.getComplianceDetails();

        return VendorOnboardingResponse.builder()
                .id(vo.getId())
                .vendorRequest(vendorRequestResponse)
                .legalBusinessName(bd != null ? bd.getLegalBusinessName() : null)
                .businessRegistrationNumber(bd != null ? bd.getBusinessRegistrationNumber() : null)
                .businessType(bd != null ? bd.getBusinessType() : null)
                .yearEstablished(bd != null ? bd.getYearEstablished() : null)
                .businessAddress(bd != null ? bd.getBusinessAddress() : null)
                .numberOfEmployees(bd != null ? bd.getNumberOfEmployees() : null)
                .industrySector(bd != null ? bd.getIndustrySector() : null)
                .businessDetailsFilePath(bd != null ? bd.getBusinessDetailsFilePath() : null)
                .primaryContactName(cd != null ? cd.getPrimaryContactName() : null)
                .jobTitle(cd != null ? cd.getJobTitle() : null)
                .emailAddress(cd != null ? cd.getEmailAddress() : null)
                .phoneNumber(cd != null ? cd.getPhoneNumber() : null)
                .secondaryContactName(cd != null ? cd.getSecondaryContactName() : null)
                .secondaryContactEmail(cd != null ? cd.getSecondaryContactEmail() : null)
                .website(cd != null ? cd.getWebsite() : null)
                .bankName(bkd != null ? bkd.getBankName() : null)
                .accountHolderName(bkd != null ? bkd.getAccountHolderName() : null)
                .accountNumber(bkd != null ? bkd.getAccountNumber() : null)
                .accountType(bkd != null ? bkd.getAccountType() : null)
                .routingSwiftCode(bkd != null ? bkd.getRoutingSwiftCode() : null)
                .iban(bkd != null ? bkd.getIban() : null)
                .paymentTerms(bkd != null ? bkd.getPaymentTerms() : null)
                .currency(bkd != null ? bkd.getCurrency() : null)
                .taxIdentificationNumber(cpd != null ? cpd.getTaxIdentificationNumber() : null)
                .businessLicenseNumber(cpd != null ? cpd.getBusinessLicenseNumber() : null)
                .licenseExpiryDate(cpd != null ? cpd.getLicenseExpiryDate() : null)
                .insuranceProvider(cpd != null ? cpd.getInsuranceProvider() : null)
                .insurancePolicyNumber(cpd != null ? cpd.getInsurancePolicyNumber() : null)
                .insuranceExpiryDate(cpd != null ? cpd.getInsuranceExpiryDate() : null)
                .industryCertifications(cpd != null ? cpd.getIndustryCertifications() : null)
                .complianceFilePath(cpd != null ? cpd.getComplianceFilePath() : null)
                .isComplete(vo.getIsComplete())
                .submittedAt(vo.getSubmittedAt())
                .createdAt(vo.getCreatedAt())
                .updatedAt(vo.getUpdatedAt())
                .followUps(followUps)
                .build();
    }

    @Transactional(readOnly = true)
    public VendorOnboardingResponse getOnboardingByEmail(String email) {
        Objects.requireNonNull(email, "Email cannot be null");
        
        VendorOnboarding vendorOnboarding = vendorOnboardingRepository.findByVendorRequest_VendorEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No onboarding found for email: " + email));
        
        return mapToResponse(vendorOnboarding);
    }

    @Transactional(readOnly = true)
    public VendorOnboardingResponse getOnboardingByRequestId(Long requestId) {
        Objects.requireNonNull(requestId, "Request ID cannot be null");
        
        VendorOnboarding vendorOnboarding = vendorOnboardingRepository.findByVendorRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("No onboarding found for vendor request ID: " + requestId));
        
        return mapToResponse(vendorOnboarding);
    }
}
