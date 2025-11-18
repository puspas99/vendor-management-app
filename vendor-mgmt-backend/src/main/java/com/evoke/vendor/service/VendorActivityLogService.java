package com.evoke.vendor.service;

import com.evoke.vendor.dto.response.VendorActivityLogResponse;
import com.evoke.vendor.entity.VendorActivityLog;
import com.evoke.vendor.entity.VendorRequest;
import com.evoke.vendor.enums.ActivityType;
import com.evoke.vendor.repository.VendorActivityLogRepository;
import com.evoke.vendor.repository.VendorRequestRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorActivityLogService {

    private final VendorActivityLogRepository activityLogRepository;
    private final VendorRequestRepository vendorRequestRepository;

    @Transactional
    public void logActivity(Long vendorRequestId, ActivityType activityType, String description, String details) {
        try {
            VendorRequest vendorRequest = vendorRequestRepository.findById(vendorRequestId)
                    .orElseThrow(() -> new IllegalArgumentException("Vendor request not found"));

            String performedBy = getCurrentUser();
            String performedByRole = getCurrentUserRole();
            String ipAddress = getClientIpAddress();

            VendorActivityLog activityLog = VendorActivityLog.builder()
                    .vendorRequest(vendorRequest)
                    .activityType(activityType)
                    .description(description)
                    .details(details)
                    .performedBy(performedBy)
                    .performedByRole(performedByRole)
                    .ipAddress(ipAddress)
                    .build();

            activityLogRepository.save(activityLog);
            log.info("Activity logged for vendor {}: {}", vendorRequestId, activityType);
        } catch (Exception e) {
            log.error("Error logging activity for vendor {}: {}", vendorRequestId, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<VendorActivityLogResponse> getVendorActivityLog(Long vendorRequestId) {
        Objects.requireNonNull(vendorRequestId, "Vendor request ID cannot be null");
        
        return activityLogRepository.findByVendorRequestIdOrderByPerformedAtDesc(vendorRequestId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VendorActivityLogResponse> getVendorActivityLogByType(Long vendorRequestId, ActivityType activityType) {
        Objects.requireNonNull(vendorRequestId, "Vendor request ID cannot be null");
        Objects.requireNonNull(activityType, "Activity type cannot be null");
        
        return activityLogRepository.findByVendorRequestIdAndActivityTypeOrderByPerformedAtDesc(
                        vendorRequestId, activityType)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VendorActivityLogResponse> getVendorActivityLogByDateRange(
            Long vendorRequestId, LocalDateTime startDate, LocalDateTime endDate) {
        Objects.requireNonNull(vendorRequestId, "Vendor request ID cannot be null");
        Objects.requireNonNull(startDate, "Start date cannot be null");
        Objects.requireNonNull(endDate, "End date cannot be null");
        
        return activityLogRepository.findByVendorRequestIdAndDateRange(vendorRequestId, startDate, endDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VendorActivityLogResponse> getAllActivities() {
        return activityLogRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private VendorActivityLogResponse mapToResponse(VendorActivityLog log) {
        return VendorActivityLogResponse.builder()
                .id(log.getId())
                .vendorRequestId(log.getVendorRequest().getId())
                .vendorName(log.getVendorRequest().getVendorName())
                .activityType(log.getActivityType().name())
                .description(log.getDescription())
                .details(log.getDetails())
                .performedBy(log.getPerformedBy())
                .performedByRole(log.getPerformedByRole())
                .performedAt(log.getPerformedAt())
                .ipAddress(log.getIpAddress())
                .build();
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }

    private String getCurrentUserRole() {
        try {
            return SecurityContextHolder.getContext().getAuthentication()
                    .getAuthorities().stream()
                    .findFirst()
                    .map(Object::toString)
                    .orElse("UNKNOWN");
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }

    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            log.debug("Could not get client IP address: {}", e.getMessage());
        }
        return "unknown";
    }
}
