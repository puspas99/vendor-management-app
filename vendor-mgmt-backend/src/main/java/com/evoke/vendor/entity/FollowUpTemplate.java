package com.evoke.vendor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "follow_up_templates", schema = "dbo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowUpTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_name", nullable = false, length = 100)
    private String templateName;

    @Column(name = "follow_up_type", nullable = false, length = 50)
    private String followUpType;

    @Column(name = "escalation_level")
    private Integer escalationLevel = 0;

    @Column(name = "subject_template", nullable = false, columnDefinition = "TEXT")
    private String subjectTemplate;

    @Column(name = "body_template", nullable = false, columnDefinition = "TEXT")
    private String bodyTemplate;

    @Column(name = "use_ai_enhancement")
    private Boolean useAiEnhancement = true;

    @Column(name = "ai_system_prompt", columnDefinition = "TEXT")
    private String aiSystemPrompt;

    @Column(name = "ai_user_prompt_template", columnDefinition = "TEXT")
    private String aiUserPromptTemplate;

    @Column(name = "available_variables", columnDefinition = "TEXT")
    private String availableVariables;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
