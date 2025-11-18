package com.evoke.vendor.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_banking_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorBankingDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "vendor_onboarding_id", nullable = false)
    @JsonIgnoreProperties({"businessDetails", "contactDetails", "bankingDetails", "complianceDetails", "vendorRequest", "hibernateLazyInitializer", "handler"})
    private VendorOnboarding vendorOnboarding;

    @Column(nullable = false)
    private String bankName;

    @Column(nullable = false)
    private String accountHolderName;

    @Column(nullable = false)
    private String accountNumber;

    @Column(nullable = false)
    private String accountType;

    @Column
    private String routingSwiftCode;

    @Column
    private String iban;

    @Column
    private String paymentTerms;

    @Column
    private String currency;

    @Column
    private String bankingDetailsFilePath;

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
