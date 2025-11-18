package com.evoke.vendor.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "follow_ups", schema = "dbo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_onboarding_id", nullable = false)
    @JsonIgnoreProperties({"followUps", "vendorRequest", "hibernateLazyInitializer", "handler"})
    private VendorOnboarding vendorOnboarding;

    @Column(nullable = false)
    private String followUpType; // MISSING_DATA, INCORRECT_DATA, INCORRECT_FILE, DELAYED_RESPONSE, MANUAL

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(columnDefinition = "TEXT")
    private String fieldsConcerned;

    @Column(nullable = false)
    private String initiatedBy;

    @Column(nullable = false)
    private Boolean isAutomatic;

    @Column(nullable = false)
    private String status; // SENT, PENDING, RESOLVED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime resolvedAt;

    // AI Integration fields
    @Column(name = "follow_up_reason", length = 100)
    private String followUpReason;

    @Column(name = "ai_generated")
    private Boolean aiGenerated = false;

    @Column(name = "ai_model", length = 50)
    private String aiModel;

    @Column(name = "ai_prompt_version", length = 20)
    private String aiPromptVersion;

    // Tracking fields
    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    // Escalation fields
    @Column(name = "escalation_level")
    private Integer escalationLevel = 0;

    @Column(name = "escalated_to", length = 100)
    private String escalatedTo;

    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;

    // Email tracking
    @Column(name = "email_sent")
    private Boolean emailSent = false;

    @Column(name = "email_sent_at")
    private LocalDateTime emailSentAt;

    @Column(name = "email_opened")
    private Boolean emailOpened = false;

    @Column(name = "email_opened_at")
    private LocalDateTime emailOpenedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "SENT";
        }
        if (aiGenerated == null) {
            aiGenerated = false;
        }
        if (escalationLevel == null) {
            escalationLevel = 0;
        }
    }
}
