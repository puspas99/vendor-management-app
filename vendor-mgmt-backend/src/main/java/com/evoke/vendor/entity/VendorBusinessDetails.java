package com.evoke.vendor.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_business_details", schema = "dbo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorBusinessDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "vendor_onboarding_id", nullable = false)
    @JsonIgnoreProperties({"businessDetails", "contactDetails", "bankingDetails", "complianceDetails", "vendorRequest", "hibernateLazyInitializer", "handler"})
    private VendorOnboarding vendorOnboarding;

    @Column(nullable = false)
    private String legalBusinessName;

    @Column(nullable = false)
    private String businessRegistrationNumber;

    @Column(nullable = false)
    private String businessType;

    @Column
    private Integer yearEstablished;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String businessAddress;

    @Column
    private String numberOfEmployees;

    @Column
    private String industrySector;

    @Column
    private String businessDetailsFilePath;

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
