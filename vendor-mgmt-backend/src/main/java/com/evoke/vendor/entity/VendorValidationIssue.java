package com.evoke.vendor.entity;

import com.evoke.vendor.enums.ValidationIssueSeverity;
import com.evoke.vendor.enums.ValidationIssueStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_validation_issues", schema = "dbo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorValidationIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_onboarding_id", nullable = false)
    private VendorOnboarding vendorOnboarding;

    @Column(name = "issue_type", nullable = false, length = 50)
    private String issueType;

    @Column(name = "field_name", length = 100)
    private String fieldName;

    @Column(name = "field_path", length = 255)
    private String fieldPath;

    @Column(name = "current_value", columnDefinition = "TEXT")
    private String currentValue;

    @Column(name = "expected_value", columnDefinition = "TEXT")
    private String expectedValue;

    @Column(name = "validation_rule", columnDefinition = "TEXT")
    private String validationRule;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ValidationIssueStatus status = ValidationIssueStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ValidationIssueSeverity severity = ValidationIssueSeverity.MEDIUM;

    @Column(name = "resolved_by", length = 100)
    private String resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
