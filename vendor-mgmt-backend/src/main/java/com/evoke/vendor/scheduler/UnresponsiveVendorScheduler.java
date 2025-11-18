package com.evoke.vendor.scheduler;

import com.evoke.vendor.entity.FollowUp;
import com.evoke.vendor.entity.VendorOnboarding;
import com.evoke.vendor.entity.VendorRequest;
import com.evoke.vendor.repository.FollowUpRepository;
import com.evoke.vendor.repository.VendorOnboardingRepository;
import com.evoke.vendor.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled job to detect and notify about vendors who are unresponsive after multiple follow-ups.
 * Runs daily at 9 AM to check for vendors with 2+ unresolved follow-ups older than 3 days.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UnresponsiveVendorScheduler {

    private final FollowUpRepository followUpRepository;
    private final VendorOnboardingRepository vendorOnboardingRepository;
    private final NotificationService notificationService;
    
    // Configuration constants
    private static final int MINIMUM_FOLLOW_UPS = 2;
    private static final int DAYS_THRESHOLD = 3;
    
    /**
     * Runs daily at 9:00 AM to check for unresponsive vendors.
     * Cron expression: second minute hour day month weekday
     */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional(readOnly = true)
    public void checkUnresponsiveVendors() {
        log.info("Starting scheduled check for unresponsive vendors...");
        
        try {
            LocalDateTime thresholdDate = LocalDateTime.now().minusDays(DAYS_THRESHOLD);
            
            // Find vendor onboarding IDs with multiple unresolved follow-ups
            List<Long> vendorOnboardingIds = followUpRepository
                    .findVendorOnboardingIdsWithMultipleUnresolvedFollowUps(
                            thresholdDate, 
                            (long) MINIMUM_FOLLOW_UPS
                    );
            
            log.info("Found {} vendor(s) with multiple unresolved follow-ups", vendorOnboardingIds.size());
            
            for (Long vendorOnboardingId : vendorOnboardingIds) {
                processUnresponsiveVendor(vendorOnboardingId);
            }
            
            log.info("Completed unresponsive vendor check. Processed {} vendor(s)", vendorOnboardingIds.size());
            
        } catch (Exception e) {
            log.error("Error during unresponsive vendor check", e);
        }
    }
    
    /**
     * Process a single unresponsive vendor and send notification.
     */
    private void processUnresponsiveVendor(Long vendorOnboardingId) {
        try {
            VendorOnboarding vendorOnboarding = vendorOnboardingRepository
                    .findById(vendorOnboardingId)
                    .orElse(null);
            
            if (vendorOnboarding == null) {
                log.warn("VendorOnboarding not found for ID: {}", vendorOnboardingId);
                return;
            }
            
            VendorRequest vendorRequest = vendorOnboarding.getVendorRequest();
            if (vendorRequest == null) {
                log.warn("VendorRequest not found for VendorOnboarding ID: {}", vendorOnboardingId);
                return;
            }
            
            // Count unresolved follow-ups
            Long unresolvedCount = followUpRepository.countUnresolvedFollowUps(vendorOnboardingId);
            
            // Get latest follow-up to calculate days since last contact
            FollowUp latestFollowUp = followUpRepository.findLatestFollowUpByVendorOnboardingId(vendorOnboardingId);
            
            if (latestFollowUp == null) {
                log.warn("No follow-ups found for VendorOnboarding ID: {}", vendorOnboardingId);
                return;
            }
            
            int daysSinceLastFollowUp = (int) ChronoUnit.DAYS.between(
                    latestFollowUp.getCreatedAt(), 
                    LocalDateTime.now()
            );
            
            // Send notification to procurement team
            notificationService.notifyVendorUnresponsive(
                    vendorRequest,
                    unresolvedCount.intValue(),
                    daysSinceLastFollowUp
            );
            
            log.info("Sent unresponsive notification for vendor: {} (ID: {}) with {} unresolved follow-ups, {} days since last contact",
                    vendorRequest.getVendorName(),
                    vendorRequest.getId(),
                    unresolvedCount,
                    daysSinceLastFollowUp);
            
        } catch (Exception e) {
            log.error("Error processing unresponsive vendor with ID: {}", vendorOnboardingId, e);
        }
    }
    
    /**
     * Manual trigger for testing purposes (can be called via API endpoint if needed).
     * Not exposed by default - add controller endpoint if manual trigger is required.
     */
    public void checkUnresponsiveVendorsManually() {
        log.info("Manual trigger for unresponsive vendor check");
        checkUnresponsiveVendors();
    }
}
