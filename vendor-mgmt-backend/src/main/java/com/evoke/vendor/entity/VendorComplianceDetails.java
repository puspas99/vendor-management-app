package com.evoke.vendor.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_compliance_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorComplianceDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "vendor_onboarding_id", nullable = false)
    @JsonIgnoreProperties({"businessDetails", "contactDetails", "bankingDetails", "complianceDetails", "vendorRequest", "hibernateLazyInitializer", "handler"})
    private VendorOnboarding vendorOnboarding;

    @Column(nullable = false)
    private String taxIdentificationNumber;

    @Column
    private String businessLicenseNumber;

    @Column
    private LocalDate licenseExpiryDate;

    @Column
    private String insuranceProvider;

    @Column
    private String insurancePolicyNumber;

    @Column
    private LocalDate insuranceExpiryDate;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String industryCertifications;

    @Column
    private String complianceFilePath;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
