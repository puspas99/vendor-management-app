package com.evoke.vendor.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_contact_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorContactDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "vendor_onboarding_id", nullable = false)
    @JsonIgnoreProperties({"businessDetails", "contactDetails", "bankingDetails", "complianceDetails", "vendorRequest", "hibernateLazyInitializer", "handler"})
    private VendorOnboarding vendorOnboarding;

    @Column(nullable = false)
    private String primaryContactName;

    @Column
    private String jobTitle;

    @Column(nullable = false)
    private String emailAddress;

    @Column(nullable = false)
    private String phoneNumber;

    @Column
    private String secondaryContactName;

    @Column
    private String secondaryContactEmail;

    @Column
    private String website;

    @Column
    private String contactDetailsFilePath;

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
