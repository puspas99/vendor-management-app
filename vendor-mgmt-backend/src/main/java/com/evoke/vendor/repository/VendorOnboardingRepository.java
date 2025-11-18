package com.evoke.vendor.repository;

import com.evoke.vendor.entity.VendorOnboarding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorOnboardingRepository extends JpaRepository<VendorOnboarding, Long> {
    
    Optional<VendorOnboarding> findByVendorRequestId(Long vendorRequestId);
    
    Optional<VendorOnboarding> findByVendorRequest_VendorEmail(String vendorEmail);
}
