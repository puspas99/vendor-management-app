package com.evoke.vendor.repository;

import com.evoke.vendor.entity.VendorActivityLog;
import com.evoke.vendor.enums.ActivityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VendorActivityLogRepository extends JpaRepository<VendorActivityLog, Long> {
    
    List<VendorActivityLog> findByVendorRequestIdOrderByPerformedAtDesc(Long vendorRequestId);
    
    List<VendorActivityLog> findByVendorRequestIdAndActivityTypeOrderByPerformedAtDesc(
            Long vendorRequestId, ActivityType activityType);
    
    @Query("SELECT v FROM VendorActivityLog v WHERE v.vendorRequest.id = :vendorRequestId " +
           "AND v.performedAt BETWEEN :startDate AND :endDate ORDER BY v.performedAt DESC")
    List<VendorActivityLog> findByVendorRequestIdAndDateRange(
            Long vendorRequestId, LocalDateTime startDate, LocalDateTime endDate);
    
    List<VendorActivityLog> findByPerformedByOrderByPerformedAtDesc(String performedBy);
    
    List<VendorActivityLog> findByPerformedAtAfter(LocalDateTime date);
    
    List<VendorActivityLog> findAllByOrderByPerformedAtDesc();
}
