package com.evoke.vendor.repository;

import com.evoke.vendor.entity.VendorRequest;
import com.evoke.vendor.enums.VendorOnboardingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorRequestRepository extends JpaRepository<VendorRequest, Long> {
    
    Optional<VendorRequest> findByVendorEmail(String vendorEmail);
    
    Optional<VendorRequest> findByInvitationToken(String invitationToken);
    
    List<VendorRequest> findByStatus(VendorOnboardingStatus status);
    
    List<VendorRequest> findByCreatedBy(String createdBy);
    
    boolean existsByVendorEmail(String vendorEmail);
    
    // Query to find non-deleted vendors
    @Query("SELECT v FROM VendorRequest v WHERE v.deletedAt IS NULL")
    List<VendorRequest> findAllActive();
    
    // Query to find deleted vendors
    @Query("SELECT v FROM VendorRequest v WHERE v.deletedAt IS NOT NULL")
    List<VendorRequest> findAllDeleted();
    
    // Query to find non-deleted vendors by status
    @Query("SELECT v FROM VendorRequest v WHERE v.status = :status AND v.deletedAt IS NULL")
    List<VendorRequest> findActiveByStatus(VendorOnboardingStatus status);
}
