package com.evoke.vendor.controller;

import com.evoke.vendor.dto.response.ApiResponse;
import com.evoke.vendor.dto.response.NotificationResponse;
import com.evoke.vendor.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class NotificationController {
    
    private final NotificationService notificationService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUserNotifications(
            Authentication authentication) {
        try {
            String username = authentication.getName();
            List<NotificationResponse> notifications = 
                    notificationService.getUserNotifications(username);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Notifications retrieved successfully",
                    notifications
            ));
        } catch (Exception e) {
            log.error("Error retrieving notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve notifications"));
        }
    }
    
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUnreadNotifications(
            Authentication authentication) {
        try {
            String username = authentication.getName();
            List<NotificationResponse> notifications = 
                    notificationService.getUnreadNotifications(username);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Unread notifications retrieved successfully",
                    notifications
            ));
        } catch (Exception e) {
            log.error("Error retrieving unread notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve unread notifications"));
        }
    }
    
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getRecentNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "24") int hours) {
        try {
            String username = authentication.getName();
            List<NotificationResponse> notifications = 
                    notificationService.getRecentNotifications(username, hours);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Recent notifications retrieved successfully",
                    notifications
            ));
        } catch (Exception e) {
            log.error("Error retrieving recent notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve recent notifications"));
        }
    }
    
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(Authentication authentication) {
        try {
            String username = authentication.getName();
            Long count = notificationService.getUnreadCount(username);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Unread count retrieved successfully",
                    count
            ));
        } catch (Exception e) {
            log.error("Error retrieving unread count", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve unread count"));
        }
    }
    
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        try {
            notificationService.markAsRead(id);
            return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
        } catch (Exception e) {
            log.error("Error marking notification as read", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to mark notification as read"));
        }
    }
    
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication authentication) {
        try {
            String username = authentication.getName();
            notificationService.markAllAsRead(username);
            return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
        } catch (Exception e) {
            log.error("Error marking all notifications as read", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to mark all notifications as read"));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        try {
            notificationService.deleteNotification(id);
            return ResponseEntity.ok(ApiResponse.success("Notification deleted", null));
        } catch (Exception e) {
            log.error("Error deleting notification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete notification"));
        }
    }
}
