package com.evoke.vendor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_message_history", schema = "dbo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIMessageHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follow_up_id")
    private FollowUp followUp;

    @Column(name = "ai_model", length = 50)
    private String aiModel;

    @Column(name = "ai_prompt", nullable = false, columnDefinition = "TEXT")
    private String aiPrompt;

    @Column(name = "context_data", columnDefinition = "TEXT")
    private String contextData;

    @Column(name = "ai_response", columnDefinition = "TEXT")
    private String aiResponse;

    @Column(name = "generated_message", columnDefinition = "TEXT")
    private String generatedMessage;

    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @Column(name = "was_edited")
    private Boolean wasEdited = false;

    @Column(name = "user_rating")
    private Integer userRating;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
