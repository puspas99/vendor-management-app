package com.evoke.vendor.service;

import com.evoke.vendor.dto.request.FollowUpRequestDto;
import com.evoke.vendor.dto.response.FollowUpResponse;
import com.evoke.vendor.entity.FollowUp;
import com.evoke.vendor.entity.VendorOnboarding;
import com.evoke.vendor.repository.FollowUpRepository;
import com.evoke.vendor.repository.VendorOnboardingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final VendorOnboardingRepository vendorOnboardingRepository;
    private final EmailService emailService;

    @Transactional
    public FollowUpResponse createFollowUp(Long vendorOnboardingId, FollowUpRequestDto requestDto) {
        Objects.requireNonNull(vendorOnboardingId, "Vendor onboarding ID cannot be null");
        Objects.requireNonNull(requestDto, "Follow-up request cannot be null");

        VendorOnboarding vendorOnboarding = vendorOnboardingRepository.findById(vendorOnboardingId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor onboarding not found with id: " + vendorOnboardingId));

        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();

        FollowUp followUp = FollowUp.builder()
                .vendorOnboarding(vendorOnboarding)
                .followUpType(requestDto.getFollowUpType())
                .message(requestDto.getMessage())
                .fieldsConcerned(requestDto.getFieldsConcerned())
                .initiatedBy(currentUser)
                .isAutomatic(false)
                .status("SENT")
                .build();

        followUp = followUpRepository.save(followUp);

        String vendorEmail = vendorOnboarding.getContactDetails() != null 
                ? vendorOnboarding.getContactDetails().getEmailAddress() 
                : vendorOnboarding.getVendorRequest().getVendorEmail();
        
        String invitationToken = vendorOnboarding.getVendorRequest().getInvitationToken();
        
        emailService.sendFollowUpEmail(
                vendorEmail,
                vendorOnboarding.getVendorRequest().getVendorName(),
                requestDto.getMessage(),
                requestDto.getFollowUpType(),
                invitationToken
        );

        log.info("Manual follow-up created for vendor onboarding: {}", vendorOnboardingId);
        return mapToResponse(followUp);
    }

    @Transactional
    public FollowUpResponse createAutomaticFollowUp(
            VendorOnboarding vendorOnboarding,
            String followUpType,
            String message,
            String fieldsConcerned
    ) {
        Objects.requireNonNull(vendorOnboarding, "Vendor onboarding cannot be null");
        Objects.requireNonNull(followUpType, "Follow-up type cannot be null");
        Objects.requireNonNull(message, "Message cannot be null");

        FollowUp followUp = FollowUp.builder()
                .vendorOnboarding(vendorOnboarding)
                .followUpType(followUpType)
                .message(message)
                .fieldsConcerned(fieldsConcerned)
                .initiatedBy("SYSTEM")
                .isAutomatic(true)
                .status("SENT")
                .build();

        followUp = followUpRepository.save(followUp);

        String vendorEmail = vendorOnboarding.getContactDetails() != null 
                ? vendorOnboarding.getContactDetails().getEmailAddress() 
                : vendorOnboarding.getVendorRequest().getVendorEmail();

        String invitationToken = vendorOnboarding.getVendorRequest().getInvitationToken();

        emailService.sendFollowUpEmail(
                vendorEmail,
                vendorOnboarding.getVendorRequest().getVendorName(),
                message,
                followUpType,
                invitationToken
        );

        log.info("Automatic follow-up created for vendor onboarding: {}", vendorOnboarding.getId());
        return mapToResponse(followUp);
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> getFollowUpsByVendorOnboarding(Long vendorOnboardingId) {
        Objects.requireNonNull(vendorOnboardingId, "Vendor onboarding ID cannot be null");
        
        return followUpRepository.findByVendorOnboardingIdOrderByCreatedAtDesc(vendorOnboardingId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void resolveFollowUp(Long followUpId) {
        Objects.requireNonNull(followUpId, "Follow-up ID cannot be null");
        
        FollowUp followUp = followUpRepository.findById(followUpId)
                .orElseThrow(() -> new IllegalArgumentException("Follow-up not found with id: " + followUpId));

        followUp.setStatus("RESOLVED");
        followUp.setResolvedAt(LocalDateTime.now());
        followUpRepository.save(followUp);

        log.info("Follow-up resolved: {}", followUpId);
    }

    /**
     * Get all follow-ups with optional filters
     */
    @Transactional(readOnly = true)
    public List<FollowUpResponse> getAllFollowUps(String status, String type) {
        log.info("Fetching all follow-ups with filters - status: {}, type: {}", status, type);
        
        List<FollowUp> followUps = followUpRepository.findAll();
        
        // Apply filters if provided
        if (status != null && !status.equals("ALL")) {
            followUps = followUps.stream()
                    .filter(f -> status.equalsIgnoreCase(f.getStatus()))
                    .collect(Collectors.toList());
        }
        
        if (type != null && !type.equals("ALL")) {
            followUps = followUps.stream()
                    .filter(f -> type.equals(f.getFollowUpType()))
                    .collect(Collectors.toList());
        }
        
        return followUps.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private FollowUpResponse mapToResponse(FollowUp followUp) {
        VendorOnboarding onboarding = followUp.getVendorOnboarding();
        String vendorName = onboarding != null && onboarding.getVendorRequest() != null 
                ? onboarding.getVendorRequest().getVendorName() 
                : "Unknown Vendor";
        
        return FollowUpResponse.builder()
                .id(followUp.getId())
                .vendorOnboardingId(onboarding != null ? onboarding.getId() : null)
                .vendorName(vendorName)
                .followUpType(followUp.getFollowUpType())
                .message(followUp.getMessage())
                .fieldsConcerned(followUp.getFieldsConcerned())
                .initiatedBy(followUp.getInitiatedBy())
                .isAutomatic(followUp.getIsAutomatic())
                .status(followUp.getStatus())
                .createdAt(followUp.getCreatedAt())
                .resolvedAt(followUp.getResolvedAt())
                .build();
    }
}
