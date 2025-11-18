package com.evoke.vendor.entity;

import com.evoke.vendor.enums.VendorOnboardingStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vendor_onboarding")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorOnboarding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "vendor_request_id", nullable = false)
    @JsonIgnoreProperties({"vendorOnboarding", "hibernateLazyInitializer", "handler"})
    private VendorRequest vendorRequest;

    @OneToOne(mappedBy = "vendorOnboarding", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private VendorBusinessDetails businessDetails;

    @OneToOne(mappedBy = "vendorOnboarding", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private VendorContactDetails contactDetails;

    @OneToOne(mappedBy = "vendorOnboarding", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private VendorBankingDetails bankingDetails;

    @OneToOne(mappedBy = "vendorOnboarding", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private VendorComplianceDetails complianceDetails;

    @Column(nullable = false)
    private Boolean isComplete;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private VendorOnboardingStatus status;

    @Column
    private LocalDateTime submittedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "vendorOnboarding", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<FollowUp> followUps = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isComplete == null) {
            isComplete = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
