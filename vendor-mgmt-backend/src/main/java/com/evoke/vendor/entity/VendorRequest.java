package com.evoke.vendor.entity;

import com.evoke.vendor.enums.VendorOnboardingStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String vendorName;

    @Column(nullable = false, unique = true)
    private String vendorEmail;

    @Column(nullable = false)
    private String contactPerson;

    @Column(nullable = false)
    private String contactNumber;

    @Column(nullable = false)
    private String vendorCategory;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private VendorOnboardingStatus status;

    @Column(unique = true)
    private String invitationToken;

    @Column
    private LocalDateTime invitationSentAt;

    @Column
    private LocalDateTime invitationExpiresAt;

    @Column(nullable = false)
    private String createdBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime deletedAt;

    @OneToOne(mappedBy = "vendorRequest", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"vendorRequest", "businessDetails", "contactDetails", "bankingDetails", "complianceDetails", "hibernateLazyInitializer", "handler"})
    private VendorOnboarding vendorOnboarding;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = VendorOnboardingStatus.REQUESTED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
