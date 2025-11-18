package com.evoke.vendor.repository;

import com.evoke.vendor.entity.FollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {
    
    List<FollowUp> findByVendorOnboardingIdOrderByCreatedAtDesc(Long vendorOnboardingId);
    
    List<FollowUp> findByVendorOnboardingIdAndStatus(Long vendorOnboardingId, String status);
    
    List<FollowUp> findByStatus(String status);
    
    // Count unresolved follow-ups for a vendor
    @Query("SELECT COUNT(f) FROM FollowUp f WHERE f.vendorOnboarding.id = :vendorOnboardingId AND f.status IN ('SENT', 'PENDING')")
    Long countUnresolvedFollowUps(@Param("vendorOnboardingId") Long vendorOnboardingId);
    
    // Find vendors with multiple unresolved follow-ups older than specified days
    @Query("SELECT DISTINCT f.vendorOnboarding.id FROM FollowUp f " +
           "WHERE f.status IN ('SENT', 'PENDING') " +
           "AND f.createdAt < :thresholdDate " +
           "GROUP BY f.vendorOnboarding.id " +
           "HAVING COUNT(f.id) >= :minFollowUps")
    List<Long> findVendorOnboardingIdsWithMultipleUnresolvedFollowUps(
            @Param("thresholdDate") LocalDateTime thresholdDate,
            @Param("minFollowUps") Long minFollowUps);
    
    // Get the latest follow-up for a vendor
    @Query("SELECT f FROM FollowUp f WHERE f.vendorOnboarding.id = :vendorOnboardingId " +
           "ORDER BY f.createdAt DESC LIMIT 1")
    FollowUp findLatestFollowUpByVendorOnboardingId(@Param("vendorOnboardingId") Long vendorOnboardingId);
}
