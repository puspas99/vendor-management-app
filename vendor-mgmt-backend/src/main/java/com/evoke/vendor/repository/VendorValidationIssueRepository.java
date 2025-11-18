package com.evoke.vendor.repository;

import com.evoke.vendor.entity.VendorValidationIssue;
import com.evoke.vendor.enums.ValidationIssueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorValidationIssueRepository extends JpaRepository<VendorValidationIssue, Long> {
    
    List<VendorValidationIssue> findByVendorOnboardingIdOrderByCreatedAtDesc(Long vendorOnboardingId);
    
    List<VendorValidationIssue> findByVendorOnboardingIdAndStatus(Long vendorOnboardingId, ValidationIssueStatus status);
    
    @Query("SELECT COUNT(v) FROM VendorValidationIssue v WHERE v.vendorOnboarding.id = :vendorOnboardingId AND v.status = :status")
    Long countByVendorOnboardingIdAndStatus(@Param("vendorOnboardingId") Long vendorOnboardingId, 
                                            @Param("status") ValidationIssueStatus status);
    
    @Query("SELECT v FROM VendorValidationIssue v WHERE v.status = 'OPEN' AND v.severity = 'CRITICAL'")
    List<VendorValidationIssue> findCriticalOpenIssues();
}
