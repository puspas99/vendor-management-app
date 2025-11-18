package com.evoke.vendor.service;

import com.evoke.vendor.dto.response.VendorAnalyticsResponse;
import com.evoke.vendor.entity.VendorActivityLog;
import com.evoke.vendor.entity.VendorRequest;
import com.evoke.vendor.repository.FollowUpRepository;
import com.evoke.vendor.repository.VendorActivityLogRepository;
import com.evoke.vendor.repository.VendorRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class VendorAnalyticsService {

    private final VendorRequestRepository vendorRequestRepository;
    private final VendorActivityLogRepository activityLogRepository;
    private final FollowUpRepository followUpRepository;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM d");

    /**
     * Get comprehensive vendor analytics for the dashboard
     */
    public VendorAnalyticsResponse getVendorAnalytics() {
        log.info("Generating vendor analytics");
        
        // Get all vendors
        List<VendorRequest> allVendors = vendorRequestRepository.findAll();
        
        // Get last 7 days data
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<VendorActivityLog> recentActivities = activityLogRepository
                .findByPerformedAtAfter(sevenDaysAgo);
        
        // Calculate daily metrics
        List<VendorAnalyticsResponse.DailyMetric> dailyMetrics = calculateDailyMetrics(
                allVendors, 
                recentActivities
        );
        
        // Calculate overall stats
        VendorAnalyticsResponse.OverallStats overallStats = calculateOverallStats(
                allVendors, 
                recentActivities
        );
        
        // Calculate status breakdown
        Map<String, Long> statusBreakdown = allVendors.stream()
                .filter(v -> v.getDeletedAt() == null)
                .collect(Collectors.groupingBy(
                        v -> v.getStatus().name(),
                        Collectors.counting()
                ));
        
        return VendorAnalyticsResponse.builder()
                .dailyMetrics(dailyMetrics)
                .overallStats(overallStats)
                .statusBreakdown(statusBreakdown)
                .build();
    }

    private List<VendorAnalyticsResponse.DailyMetric> calculateDailyMetrics(
            List<VendorRequest> allVendors,
            List<VendorActivityLog> recentActivities) {
        
        List<VendorAnalyticsResponse.DailyMetric> metrics = new ArrayList<>();
        LocalDate today = LocalDate.now();
        
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
            
            // Count activities for this day
            long interactions = recentActivities.stream()
                    .filter(a -> !a.getPerformedAt().isBefore(startOfDay) 
                            && a.getPerformedAt().isBefore(endOfDay))
                    .count();
            
            // Count new vendors created on this day
            long newVendors = allVendors.stream()
                    .filter(v -> v.getCreatedAt() != null 
                            && !v.getCreatedAt().isBefore(startOfDay)
                            && v.getCreatedAt().isBefore(endOfDay))
                    .count();
            
            // Count form submissions (status changed to AWAITING_VALIDATION or VALIDATED)
            long formSubmissions = recentActivities.stream()
                    .filter(a -> !a.getPerformedAt().isBefore(startOfDay) 
                            && a.getPerformedAt().isBefore(endOfDay)
                            && (a.getActivityType().name().contains("FORM_SUBMITTED") 
                                || a.getActivityType().name().contains("STATUS_CHANGED")))
                    .count();
            
            metrics.add(VendorAnalyticsResponse.DailyMetric.builder()
                    .date(date.format(DATE_FORMATTER))
                    .interactions(interactions)
                    .newVendors(newVendors)
                    .formSubmissions(formSubmissions)
                    .build());
        }
        
        return metrics;
    }

    private VendorAnalyticsResponse.OverallStats calculateOverallStats(
            List<VendorRequest> allVendors,
            List<VendorActivityLog> recentActivities) {
        
        // Filter out deleted vendors for active counts
        List<VendorRequest> activeVendorList = allVendors.stream()
                .filter(v -> v.getDeletedAt() == null)
                .toList();
        
        long totalVendors = activeVendorList.size();
        
        // Count by status
        long requestedVendors = activeVendorList.stream()
                .filter(v -> "REQUESTED".equals(v.getStatus()))
                .count();
                
        long validatedVendors = activeVendorList.stream()
                .filter(v -> "VALIDATED".equals(v.getStatus()))
                .count();
        
        long awaitingResponse = activeVendorList.stream()
                .filter(v -> "AWAITING_RESPONSE".equals(v.getStatus()) 
                        || "AWAITING_VALIDATION".equals(v.getStatus())
                        || "MISSING_DATA".equals(v.getStatus()))
                .count();
        
        long deniedVendors = activeVendorList.stream()
                .filter(v -> "DENIED".equals(v.getStatus()))
                .count();
        
        // Total interactions in last 7 days
        long totalInteractions = recentActivities.size();
        
        // Average daily interactions
        double avgDaily = totalInteractions / 7.0;
        
        // Active rate (validated / total)
        int activeRate = totalVendors > 0 
                ? (int) Math.round((validatedVendors * 100.0) / totalVendors)
                : 0;
        
        // Follow-up statistics
        long totalFollowUps = followUpRepository.count();
        long unresolvedFollowUps = followUpRepository.findByStatus("SENT").size() 
                + followUpRepository.findByStatus("PENDING").size();
        
        return VendorAnalyticsResponse.OverallStats.builder()
                .totalVendors(totalVendors)
                .activeVendors(requestedVendors)
                .validatedVendors(validatedVendors)
                .pendingVendors(awaitingResponse)
                .deniedVendors(deniedVendors)
                .totalInteractionsLast7Days(totalInteractions)
                .avgDailyInteractions(Math.round(avgDaily * 10) / 10.0)
                .activeRate(activeRate)
                .totalFollowUps(totalFollowUps)
                .unresolvedFollowUps(unresolvedFollowUps)
                .build();
    }
}
