package com.evoke.vendor.service;

import com.evoke.vendor.dto.request.VendorRequestDto;
import com.evoke.vendor.dto.response.VendorRequestResponse;
import com.evoke.vendor.entity.VendorRequest;
import com.evoke.vendor.enums.ActivityType;
import com.evoke.vendor.enums.VendorOnboardingStatus;
import com.evoke.vendor.repository.VendorRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorRequestService {

    private final VendorRequestRepository vendorRequestRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private VendorActivityLogService activityLogService;

    @Value("${application.frontend.url:https://vendor-onboarding-mgmt.azurewebsites.net}")
    private String frontendUrl;
    
    @Value("${application.backend.url:https://vendor-onboarding-mgmt.azurewebsites.net/}")
    private String backendUrl;

    // Setter for circular dependency resolution
    public void setActivityLogService(VendorActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @Transactional
    public VendorRequestResponse createVendorRequest(VendorRequestDto requestDto) {
        Objects.requireNonNull(requestDto, "Vendor request cannot be null");

        if (vendorRequestRepository.existsByVendorEmail(requestDto.getVendorEmail())) {
            throw new IllegalArgumentException("Vendor with this email already exists");
        }

        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        String invitationToken = UUID.randomUUID().toString();

        VendorRequest vendorRequest = VendorRequest.builder()
                .vendorName(requestDto.getVendorName())
                .vendorEmail(requestDto.getVendorEmail())
                .contactPerson(requestDto.getContactPerson())
                .contactNumber(requestDto.getContactNumber())
                .vendorCategory(requestDto.getVendorCategory())
                .remarks(requestDto.getRemarks())
                .status(VendorOnboardingStatus.REQUESTED)
                .invitationToken(invitationToken)
                .invitationSentAt(LocalDateTime.now())
                .invitationExpiresAt(LocalDateTime.now().plusDays(7))
                .createdBy(currentUser)
                .build();

        vendorRequest = vendorRequestRepository.save(vendorRequest);

        // Log activity
        if (activityLogService != null) {
            activityLogService.logActivity(
                    vendorRequest.getId(),
                    ActivityType.VENDOR_REQUEST_CREATED,
                    "Vendor request created by " + currentUser,
                    String.format("Vendor: %s, Email: %s, Category: %s", 
                            requestDto.getVendorName(), requestDto.getVendorEmail(), requestDto.getVendorCategory())
            );
        }
        
        // Create notification for procurement team
        notificationService.notifyVendorRequestCreated(vendorRequest);

        // Build a link that will trigger OTP generation on the backend and then redirect
        // the vendor to the frontend onboarding page. This allows the vendor to click
        // a single link in their email which sends the OTP to their email and opens
        // the onboarding form.
        String invitationLink = String.format("%s/api/v1/vendor/invite/generate-otp?token=%s", backendUrl, invitationToken);
        emailService.sendVendorInvitationEmail(
            requestDto.getVendorEmail(),
            requestDto.getVendorName(),
            invitationLink
        );

        // Log email sent activity
        if (activityLogService != null) {
            activityLogService.logActivity(
                    vendorRequest.getId(),
                    ActivityType.INVITATION_SENT,
                    "Invitation email sent to " + requestDto.getVendorEmail(),
                    "Invitation link expires at: " + vendorRequest.getInvitationExpiresAt()
            );
        }

        log.info("Vendor request created for: {}", requestDto.getVendorEmail());
        return mapToResponse(vendorRequest);
    }

    @Transactional(readOnly = true)
    public List<VendorRequestResponse> getAllVendorRequests() {
        return vendorRequestRepository.findAllActive().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VendorRequestResponse> getDeletedVendorRequests() {
        return vendorRequestRepository.findAllDeleted().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VendorRequestResponse> getVendorRequestsByStatus(VendorOnboardingStatus status) {
        Objects.requireNonNull(status, "Status cannot be null");
        return vendorRequestRepository.findActiveByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VendorRequestResponse getVendorRequestById(Long id) {
        Objects.requireNonNull(id, "ID cannot be null");
        
        VendorRequest vendorRequest = vendorRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor request not found with id: " + id));
        
        return mapToResponse(vendorRequest);
    }

    @Transactional(readOnly = true)
    public VendorRequest getVendorRequestByToken(String token) {
        Objects.requireNonNull(token, "Token cannot be null");
        
        VendorRequest vendorRequest = vendorRequestRepository.findByInvitationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        if (vendorRequest.getInvitationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invitation link has expired");
        }

        return vendorRequest;
    }

    @Transactional(readOnly = true)
    public VendorRequestResponse getVendorRequestResponseByToken(String token) {
        try {
            VendorRequest vendorRequest = getVendorRequestByToken(token);
            return mapToResponse(vendorRequest);
        } catch (org.springframework.orm.jpa.JpaSystemException e) {
            // Handle case where there are duplicate onboarding records
            log.warn("JPA error when fetching vendor by token, attempting workaround: {}", e.getMessage());
            // Try fetching without triggering the relationship load
            VendorRequest vendorRequest = vendorRequestRepository.findByInvitationToken(token)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));
            return VendorRequestResponse.builder()
                    .id(vendorRequest.getId())
                    .vendorName(vendorRequest.getVendorName())
                    .vendorEmail(vendorRequest.getVendorEmail())
                    .contactPerson(vendorRequest.getContactPerson())
                    .contactNumber(vendorRequest.getContactNumber())
                    .vendorCategory(vendorRequest.getVendorCategory())
                    .remarks(vendorRequest.getRemarks())
                    .status(vendorRequest.getStatus().name())
                    .invitationSentAt(vendorRequest.getInvitationSentAt())
                    .createdBy(vendorRequest.getCreatedBy())
                    .createdAt(vendorRequest.getCreatedAt())
                    .updatedAt(vendorRequest.getUpdatedAt())
                    .build();
        }
    }

    @Transactional(readOnly = true)
    public VendorRequestResponse getVendorRequestByEmail(String email) {
        Objects.requireNonNull(email, "Email cannot be null");
        
        VendorRequest vendorRequest = vendorRequestRepository.findByVendorEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Vendor request not found for email: " + email));
        
        return mapToResponse(vendorRequest);
    }

    @Transactional
    public void updateVendorRequestStatus(Long id, VendorOnboardingStatus status) {
        Objects.requireNonNull(id, "ID cannot be null");
        Objects.requireNonNull(status, "Status cannot be null");
        
        VendorRequest vendorRequest = vendorRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor request not found with id: " + id));
        
        VendorOnboardingStatus oldStatus = vendorRequest.getStatus();
        vendorRequest.setStatus(status);
        vendorRequestRepository.save(vendorRequest);
        
        // Log status change activity
        if (activityLogService != null) {
            activityLogService.logActivity(
                    id,
                    ActivityType.STATUS_UPDATED,
                    String.format("Status changed from %s to %s", oldStatus, status),
                    String.format("Previous: %s, New: %s", oldStatus.getDisplayName(), status.getDisplayName())
            );
        }
        
        // Notify about status change
        notificationService.notifyStatusChanged(vendorRequest, oldStatus.name(), status.name());
        
        // Special notifications for specific statuses
        if (status == VendorOnboardingStatus.AWAITING_VALIDATION) {
            notificationService.notifyValidationPending(vendorRequest);
        }
        
        log.info("Vendor request {} status updated to: {}", id, status);
    }

    @Transactional
    public void softDeleteVendorRequest(Long id) {
        Objects.requireNonNull(id, "ID cannot be null");
        
        VendorRequest vendorRequest = vendorRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor request not found with id: " + id));
        
        vendorRequest.setStatus(VendorOnboardingStatus.DELETED);
        vendorRequest.setDeletedAt(LocalDateTime.now());
        vendorRequestRepository.save(vendorRequest);
        
        log.info("Vendor request {} soft deleted", id);
    }

    @Transactional
    public void hardDeleteVendorRequest(Long id) {
        Objects.requireNonNull(id, "ID cannot be null");
        
        VendorRequest vendorRequest = vendorRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor request not found with id: " + id));
        
        vendorRequestRepository.delete(vendorRequest);
        
        log.info("Vendor request {} permanently deleted", id);
    }

    @Transactional
    public void restoreVendorRequest(Long id) {
        Objects.requireNonNull(id, "ID cannot be null");
        
        VendorRequest vendorRequest = vendorRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor request not found with id: " + id));
        
        if (vendorRequest.getDeletedAt() == null) {
            throw new IllegalArgumentException("Vendor request is not deleted");
        }
        
        vendorRequest.setStatus(VendorOnboardingStatus.REQUESTED);
        vendorRequest.setDeletedAt(null);
        vendorRequestRepository.save(vendorRequest);
        
        log.info("Vendor request {} restored", id);
    }

    @Transactional
    public void resendInvitation(Long id) {
        Objects.requireNonNull(id, "ID cannot be null");
        
        VendorRequest vendorRequest = vendorRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor request not found with id: " + id));

        String newToken = UUID.randomUUID().toString();
        vendorRequest.setInvitationToken(newToken);
        vendorRequest.setInvitationSentAt(LocalDateTime.now());
        vendorRequest.setInvitationExpiresAt(LocalDateTime.now().plusDays(7));
        
        vendorRequestRepository.save(vendorRequest);

        String invitationLink = String.format("%s/api/v1/vendor/invite/generate-otp?token=%s", backendUrl, newToken);
        emailService.sendVendorInvitationEmail(
            vendorRequest.getVendorEmail(),
            vendorRequest.getVendorName(),
            invitationLink
        );

        log.info("Invitation resent for vendor request: {}", id);
    }

    private VendorRequestResponse mapToResponse(VendorRequest vendorRequest) {
        return VendorRequestResponse.builder()
                .id(vendorRequest.getId())
                .vendorName(vendorRequest.getVendorName())
                .vendorEmail(vendorRequest.getVendorEmail())
                .contactPerson(vendorRequest.getContactPerson())
                .contactNumber(vendorRequest.getContactNumber())
                .vendorCategory(vendorRequest.getVendorCategory())
                .remarks(vendorRequest.getRemarks())
                .status(vendorRequest.getStatus().name())
                .invitationSentAt(vendorRequest.getInvitationSentAt())
                .createdBy(vendorRequest.getCreatedBy())
                .createdAt(vendorRequest.getCreatedAt())
                .updatedAt(vendorRequest.getUpdatedAt())
                .build();
    }
}
