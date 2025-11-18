package com.evoke.vendor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorAnalyticsResponse {
    
    // Daily interaction data for the past 7 days
    private List<DailyMetric> dailyMetrics;
    
    // Overall statistics
    private OverallStats overallStats;
    
    // Status breakdown
    private Map<String, Long> statusBreakdown;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyMetric {
        private String date;  // Format: "Nov 15"
        private Long interactions;  // Number of vendor-related activities
        private Long newVendors;    // New vendors created
        private Long formSubmissions;  // Forms submitted
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverallStats {
        private Long totalVendors;
        private Long activeVendors;
        private Long validatedVendors;
        private Long pendingVendors;
        private Long deniedVendors;
        private Long totalInteractionsLast7Days;
        private Double avgDailyInteractions;
        private Integer activeRate;  // Percentage
        private Long totalFollowUps;
        private Long unresolvedFollowUps;
    }
}
