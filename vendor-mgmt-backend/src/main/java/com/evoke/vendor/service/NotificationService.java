package com.evoke.vendor.service;

import com.evoke.vendor.dto.response.NotificationResponse;
import com.evoke.vendor.entity.Notification;
import com.evoke.vendor.entity.VendorRequest;
import com.evoke.vendor.enums.NotificationType;
import com.evoke.vendor.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    
    @Async
    @Transactional
    public void createNotification(String recipientUsername, 
                                   NotificationType type,
                                   String title,
                                   String message,
                                   VendorRequest vendorRequest,
                                   String actionUrl) {
        try {
            Notification notification = Notification.builder()
                    .recipientUsername(recipientUsername)
                    .type(type)
                    .title(title)
                    .message(message)
                    .vendorRequest(vendorRequest)
                    .actionUrl(actionUrl)
                    .isRead(false)
                    .build();
            
            notificationRepository.save(notification);
            log.info("Notification created for user: {} - {}", recipientUsername, title);
        } catch (Exception e) {
            log.error("Error creating notification for user: {}", recipientUsername, e);
        }
    }
    
    @Transactional
    public void notifyVendorRequestCreated(VendorRequest vendorRequest) {
        String message = String.format("New vendor request from %s (%s)",
                vendorRequest.getVendorName(), vendorRequest.getVendorEmail());
        
        // Notify the creator
        createNotification(
                vendorRequest.getCreatedBy(),
                NotificationType.VENDOR_REQUEST_CREATED,
                "Vendor Request Created",
                message,
                vendorRequest,
                "/vendors/" + vendorRequest.getId()
        );
    }
    
    @Transactional
    public void notifyFormSubmitted(VendorRequest vendorRequest) {
        String message = String.format("Vendor %s has submitted the onboarding form",
                vendorRequest.getVendorName());
        
        // Notify the procurement team member who created the request
        createNotification(
                vendorRequest.getCreatedBy(),
                NotificationType.FORM_SUBMITTED,
                "Form Submitted",
                message,
                vendorRequest,
                "/vendors/" + vendorRequest.getId()
        );
    }
    
    @Transactional
    public void notifyStatusChanged(VendorRequest vendorRequest, String oldStatus, String newStatus) {
        String message = String.format("Vendor %s status changed from %s to %s",
                vendorRequest.getVendorName(), oldStatus, newStatus);
        
        createNotification(
                vendorRequest.getCreatedBy(),
                NotificationType.STATUS_CHANGED,
                "Status Changed",
                message,
                vendorRequest,
                "/vendors/" + vendorRequest.getId()
        );
    }
    
    @Transactional
    public void notifyValidationPending(VendorRequest vendorRequest) {
        String message = String.format("Vendor %s is awaiting validation. Please review.",
                vendorRequest.getVendorName());
        
        createNotification(
                vendorRequest.getCreatedBy(),
                NotificationType.VALIDATION_PENDING,
                "Validation Required",
                message,
                vendorRequest,
                "/vendors/" + vendorRequest.getId()
        );
    }
    
    @Transactional
    public void notifyMissingData(VendorRequest vendorRequest, String fields) {
        String message = String.format("Vendor %s has missing data: %s",
                vendorRequest.getVendorName(), fields);
        
        createNotification(
                vendorRequest.getCreatedBy(),
                NotificationType.MISSING_DATA,
                "Missing Data",
                message,
                vendorRequest,
                "/vendors/" + vendorRequest.getId()
        );
    }
    
    @Transactional
    public void notifyVendorUnresponsive(VendorRequest vendorRequest, int unresolvedFollowUpCount, int daysSinceLastFollowUp) {
        String message = String.format(
                "⚠️ Vendor %s has been unresponsive. %d follow-up(s) sent with no response for %d days. " +
                "Please review and take appropriate action.",
                vendorRequest.getVendorName(), 
                unresolvedFollowUpCount, 
                daysSinceLastFollowUp
        );
        
        createNotification(
                vendorRequest.getCreatedBy(),
                NotificationType.VENDOR_UNRESPONSIVE,
                "Vendor Unresponsive - Action Required",
                message,
                vendorRequest,
                "/vendors/" + vendorRequest.getId()
        );
        
        log.warn("Vendor unresponsive notification sent for vendor: {} with {} unresolved follow-ups", 
                vendorRequest.getVendorName(), unresolvedFollowUpCount);
    }
    
    public List<NotificationResponse> getUserNotifications(String username) {
        List<Notification> notifications = notificationRepository
                .findByRecipientUsernameOrderByCreatedAtDesc(username);
        
        return notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<NotificationResponse> getUnreadNotifications(String username) {
        List<Notification> notifications = notificationRepository
                .findByRecipientUsernameAndIsReadOrderByCreatedAtDesc(username, false);
        
        return notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<NotificationResponse> getRecentNotifications(String username, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<Notification> notifications = notificationRepository
                .findRecentNotifications(username, since);
        
        return notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public Long getUnreadCount(String username) {
        return notificationRepository.countByRecipientUsernameAndIsRead(username, false);
    }
    
    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId, LocalDateTime.now());
        log.debug("Notification {} marked as read", notificationId);
    }
    
    @Transactional
    public void markAllAsRead(String username) {
        notificationRepository.markAllAsRead(username, LocalDateTime.now());
        log.info("All notifications marked as read for user: {}", username);
    }
    
    @Transactional
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
        log.debug("Notification {} deleted", notificationId);
    }
    
    @Transactional
    public void cleanupOldNotifications(int daysOld) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        notificationRepository.deleteOlderThan(cutoffDate);
        log.info("Cleaned up notifications older than {} days", daysOld);
    }
    
    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .vendorRequestId(notification.getVendorRequest() != null ? 
                        notification.getVendorRequest().getId() : null)
                .vendorName(notification.getVendorRequest() != null ? 
                        notification.getVendorRequest().getVendorName() : null)
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .actionUrl(notification.getActionUrl())
                .severity(notification.getType().getSeverity())
                .build();
    }
    
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
}
